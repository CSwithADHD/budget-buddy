/**
 * fintrack — Premium Minimal Dark Fintech Theme
 * Single source of truth for all color tokens.
 * Import these instead of hardcoding hex values in components.
 */

export const Colors = {
  // ── Backgrounds ─────────────────────────────────────────────────
  background: "#0A0A0A",      // primary screen background
  surface: "#16161A",         // cards, elevated containers

  // ── Text ────────────────────────────────────────────────────────
  textPrimary: "#F5F5F0",     // headlines, balance figures
  textSecondary: "#C9A876",   // labels, category names — warm tan
  textTertiary: "#A6A6D0",    // dates, metadata — muted lavender

  // ── Accents ─────────────────────────────────────────────────────
  accentPositive: "#0F6E4F",  // under budget, income, positive states
  accentNegative: "#D96C4C",  // over budget, warnings — muted, not alarm-red
  accent: "#6E44FF",          // brand purple — primary CTA

  // ── Borders ─────────────────────────────────────────────────────
  border: "rgba(255,255,255,0.08)",  // hairline borders

  // ── Overlays ────────────────────────────────────────────────────
  overlay: "rgba(0,0,0,0.6)",

  // ── Legacy aliases (for useColors hook compatibility) ───────────
  card: "#16161A",
  foreground: "#F5F5F0",
  mutedForeground: "#A6A6D0",
  primary: "#6E44FF",
  primaryForeground: "#FFFFFF",
  muted: "#1E1E24",
};

export default Colors;
