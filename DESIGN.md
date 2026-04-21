---
name: "TeleFeed Visual Standard"
version: "1.0.0"
colors:
  background: "#17212b"
  surface: "#242f3d"
  accent: "#5288c1"
  text-primary: "#f5f5f5"
  text-muted: "#7f91a4"
  danger: "#ff4757"
  glass-effect: "rgba(36, 47, 61, 0.9)"
typography:
  main:
    fontFamily: "Inter, -apple-system, sans-serif"
    fontSize: "15px"
    fontWeight: "400"
  header:
    fontFamily: "Inter, -apple-system, sans-serif"
    fontSize: "17px"
    fontWeight: "600"
  detail:
    fontFamily: "Inter, -apple-system, sans-serif"
    fontSize: "12px"
    fontWeight: "400"
spacing:
  base: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
rounded:
  md: "8px"
  lg: "10px"
  xl: "12px"
  full: "50%"
components:
  btn-primary:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.md}"
  btn-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.md}"
  card:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.xl}"
    padding: "{spacing.lg}"
---

## 🏛 Overview
The UI follows a **Minimalist, Dark-First, Premium** aesthetic. It is inspired by the modern Telegram Desktop but with a more refined, "glassmorphic" and compact feel. 

## 📏 Layout & Spacing
- **Base Scale**: 4px / 8px.
- **Standard Padding**: 16px (sides), 12px (vertical).
- **Rounding**: Buttons and inputs are generally 8px - 10px, cards use 12px.

## ✨ Components Style & Transitions
- **Inputs**:
  - Subtle dark background (`rgba(255, 255, 255, 0.05)`), 1px border.
  - On focus: `border-color: var(--accent)`.
- **Transitions**:
  - Hover: `background 0.15s ease`.
  - Buttons: `scale 0.98` on click.

## ✅ Do's
- Use `rgba` for subtle borders and backgrounds.
- Keep the interface dense but readable (SaaS dashboard style).
- Maintain high contrast between text and background.

## ❌ Don'ts
- **No Heavy Shadows**: Use subtle borders instead.
- **No Oversized Radii**: Keep rounding professional (8-12px), don't go "bubbly".
- **No Plain White**: Use `--text-main` off-white.
- **No Default Scrollbars**: Use `scrollbar-width: none` or hidden scrollbars for a cleaner look.
