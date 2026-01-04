## Packages
framer-motion | For complex page transitions, cart drawer animations, and micro-interactions
lucide-react | Icon system (already in base, but ensuring it's noted)
clsx | Utility for constructing className strings conditionally
tailwind-merge | Utility to merge tailwind classes efficiently

## Notes
Tailwind Config - extend fontFamily:
fontFamily: {
  display: ["var(--font-display)"],
  body: ["var(--font-body)"],
}
Tailwind Config - extend colors:
colors: {
  brand: {
    yellow: "hsl(var(--brand-yellow))",
    green: "hsl(var(--brand-green))",
    dark: "hsl(var(--brand-dark))",
  }
}
