import * as client from "openid-client";
import { Strategy, type VerifyFunction } from "openid-client/passport";

import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import memoize from "memoizee";
import connectPg from "connect-pg-simple";
import { authStorage } from "./storage";

const getOidcClient = memoize(
  async () => {
    // Support either old REPL_ID env var or new provider-agnostic vars
    const clientId = process.env.AUTH_CLIENT_ID ?? process.env.REPL_ID;
    const clientSecret = process.env.AUTH_CLIENT_SECRET ?? process.env.REPL_SECRET;

    // If no client id is configured, don't run discovery — return null to indicate auth is disabled.
    if (!clientId) {
      return null;
    }

    // Determine provider, prefer explicit AUTH_PROVIDER, otherwise infer
    const provider = process.env.AUTH_PROVIDER ?? (process.env.REPL_ID ? "replit" : process.env.AUTH_CLIENT_ID ? "google" : "none");

    const defaultIssuer = provider === "google" ? "https://accounts.google.com" : "https://replit.com/oidc";
    const issuerUrl = new URL(process.env.ISSUER_URL ?? defaultIssuer);

    // Discover issuer metadata
    const issuer = await client.discovery(issuerUrl);

    // Create a client instance for use with passport strategy
    const oidcClient = new issuer.Client({
      client_id: clientId,
      client_secret: clientSecret,
    } as any);

    return { provider, issuer, client: oidcClient } as const;
  },
  { maxAge: 3600 * 1000 }
);

// Helper to check if auth is enabled (supports REPL_ID legacy var)
export const isAuthEnabled = () => Boolean(process.env.AUTH_CLIENT_ID ?? process.env.REPL_ID);

// Returns a small auth status object for logging/health checks
export const getAuthStatus = () => {
  const authEnabled = isAuthEnabled();
  const provider = authEnabled ? (process.env.AUTH_PROVIDER ?? (process.env.REPL_ID ? 'replit' : 'google')) : null;
  return { authEnabled, provider } as const;
};

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  if (process.env.NODE_ENV === 'production' && !process.env.SESSION_SECRET) {
    throw new Error('SESSION_SECRET must be set in production');
  }

  const pgStore = connectPg(session);
  const createTableIfMissing = process.env.CREATE_SESSION_TABLE !== 'false';
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  const sessionSecret = process.env.SESSION_SECRET ?? 'dev-secret';

  return session({
    secret: sessionSecret,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: sessionTtl,
    },
  });
}

function updateUserSession(
  user: any,
  tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers
) {
  user.claims = tokens.claims();
  user.access_token = tokens.access_token;
  user.refresh_token = tokens.refresh_token;
  user.expires_at = user.claims?.exp;
}

async function upsertUser(claims: any) {
  await authStorage.upsertUser({
    id: claims["sub"],
    email: claims["email"],
    firstName: claims["first_name"],
    lastName: claims["last_name"],
    profileImageUrl: claims["profile_image_url"],
  });
}

export async function setupAuth(app: Express) {
  // Log auth status at startup for easier deploy diagnostics
  const authStatus = getAuthStatus();
  console.log(`Auth: ${authStatus.authEnabled ? 'enabled' : 'disabled'}${authStatus.authEnabled ? ` (provider=${authStatus.provider})` : ''}`);

  // If auth is not configured, skip setup
  if (!isAuthEnabled()) {
    console.warn('Auth client id not set; skipping auth setup');
    return;
  }

  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  const oidc = await getOidcClient();
  if (!oidc) {
    console.warn('Auth client id not set; skipping auth setup');
    return;
  }
  const { provider, client: oidcClient } = oidc;

  const verify: VerifyFunction = async (
    tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers,
    verified: passport.AuthenticateCallback
  ) => {
    const user: any = {};
    updateUserSession(user, tokens);
    await upsertUser(tokens.claims());
    verified(null, user);
  };

  // Keep track of registered strategies
  const registeredStrategies = new Set<string>();

  // Helper function to ensure strategy exists for a domain
  const ensureStrategy = (domain: string) => {
    const strategyName = `auth:${domain}`;
    if (!registeredStrategies.has(strategyName)) {
      const strategy = new Strategy(
        {
          name: strategyName,
          config: oidcClient as any,
          scope: "openid email profile offline_access",
          callbackURL: `https://${domain}/api/callback`,
        },
        verify
      );
      passport.use(strategy);
      registeredStrategies.add(strategyName);
    }
  };

  passport.serializeUser((user: Express.User, cb) => cb(null, user));
  passport.deserializeUser((user: Express.User, cb) => cb(null, user));

  app.get("/api/login", (req, res, next) => {
    ensureStrategy(req.hostname);
    // Add provider-specific auth params (Google needs access_type=offline to get refresh token)
    const extra: any = { prompt: "login consent", scope: ["openid", "email", "profile", "offline_access"] };
    if (process.env.AUTH_PROVIDER === "google") {
      extra.access_type = "offline";
      // Google recommends `prompt: consent` to ensure refresh token issuance for returning users
      extra.prompt = "consent";
    }
    passport.authenticate(`auth:${req.hostname}`, extra)(req, res, next);
  });

  app.get("/api/callback", (req, res, next) => {
    ensureStrategy(req.hostname);
    passport.authenticate(`auth:${req.hostname}`, {
      successReturnToOrRedirect: "/",
      failureRedirect: "/api/login",
    })(req, res, next);
  });

  app.get("/api/logout", (req, res) => {
    req.logout(() => {
      // For providers that support end-session URL (Replit), attempt to call it.
      // For Google, just redirect home (revocation could be added later).
      try {
        if (process.env.AUTH_PROVIDER === "replit" && (client as any).buildEndSessionUrl) {
          const url = (client as any).buildEndSessionUrl(oidcClient as any, {
            client_id: process.env.REPL_ID ?? process.env.AUTH_CLIENT_ID,
            post_logout_redirect_uri: `${req.protocol}://${req.hostname}`,
          });
          if (!res.headersSent) res.redirect(url.href);
          return;
        }
      } catch (e) {
        // ignore and fallback to redirect home
      }

      if (!res.headersSent) res.redirect(`${req.protocol}://${req.hostname}`);
    });
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  // If auth is disabled, allow all requests (MVP mode)
  if (!isAuthEnabled()) {
    return next();
  }

  const user = req.user as any;

  if (!req.isAuthenticated() || !user?.expires_at) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const now = Math.floor(Date.now() / 1000);
  if (now <= user.expires_at) {
    return next();
  }

  if (!user.refresh_token) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const oidc = await getOidcClient();
    if (!oidc) {
      // Auth became disabled; allow through in fallback mode
      return next();
    }

    const tokenResponse = await client.refreshTokenGrant(
      oidc.client as any,
      user.refresh_token
    );

    updateUserSession(user, tokenResponse as any);
    return next();
  } catch (error) {
    return res.status(401).json({ message: "Unauthorized" });
  }
};
