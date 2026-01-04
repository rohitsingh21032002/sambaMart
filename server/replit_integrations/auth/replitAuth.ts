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
    // Google-only configuration
    const rawClientId = process.env.AUTH_CLIENT_ID;
    const clientSecret = process.env.AUTH_CLIENT_SECRET;

    // Trim and validate client id to avoid whitespace-only values
    const clientId = typeof rawClientId === "string" ? rawClientId.trim() : rawClientId;

    // In production we require both client id and secret to be present
    if (process.env.NODE_ENV === 'production') {
      if (!clientId) {
        throw new Error('AUTH_CLIENT_ID must be set in production to enable Google auth');
      }
      if (!clientSecret) {
        throw new Error('AUTH_CLIENT_SECRET must be set in production to enable Google auth');
      }
    }

    // If no client id is configured (non-production), skip auth silently
    if (!clientId) {
      console.warn('AUTH_CLIENT_ID not set; Google auth disabled in non-production');
      return null;
    }

    console.log(`Auth client id present (length=${clientId.length})`);

    const provider = 'google';
    const issuerUrl = new URL(process.env.ISSUER_URL ?? 'https://accounts.google.com');

    console.log(`OIDC discovery using issuer: ${issuerUrl.href}`);

    // Discover issuer metadata (pass clientId as some providers expect it)
    let issuer: any;
    try {
      issuer = await client.discovery(issuerUrl, clientId);
    } catch (err: any) {
      console.error('OIDC discovery failed:', err?.message ?? err, err?.stack ?? 'no stack');
      // Return null to indicate auth setup can't proceed
      return null;
    }

    // Create a client instance for use with passport strategy
    let oidcClient: any;
    try {
      oidcClient = new issuer.Client({
        client_id: clientId,
        client_secret: clientSecret,
      } as any);
    } catch (err: any) {
      console.error('Failed to construct OIDC client:', err?.message ?? err, err?.stack ?? 'no stack');
      return null;
    }

    return { provider, issuer, client: oidcClient } as const;
  },
  { maxAge: 3600 * 1000 }
);

// Helper to check if auth is enabled (Google-only)
export const isAuthEnabled = () => Boolean(process.env.AUTH_CLIENT_ID && process.env.AUTH_CLIENT_ID.trim());

// Returns a small auth status object for logging/health checks
export const getAuthStatus = () => {
  const authEnabled = isAuthEnabled();
  const provider = authEnabled ? 'google' : null;
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

  // In production require Google credentials
  if (process.env.NODE_ENV === 'production' && !isAuthEnabled()) {
    throw new Error('AUTH_CLIENT_ID must be set in production to enable Google auth');
  }

  // If not configured, skip setup (non-production)
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
    console.warn('Failed to initialize OIDC client; skipping auth setup');
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
    // Google-specific auth params
    const extra: any = { access_type: "offline", prompt: "consent", scope: ["openid", "email", "profile", "offline_access"] };
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
      // For Google, just redirect home (revocation can be implemented separately)
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
