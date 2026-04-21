# AGENTS.md - TeleFeed

Welcome to the TeleFeed repository. This document serves as the entry point for all AI coding agents working on this project.

## 🛠 Tech Stack & Environment
- **Platform**: Web Dashboard 
- **Style System**: Dark-First, Glassmorphic interface. Refer strictly to `DESIGN.md`.

## 🏗 Development Rules
- **UI Components**: Use Vanilla CSS / components with HSL variables strictly mapped in `DESIGN.md`.
- **Transitions**: Keep the interface feeling "snappy". No slow animations, no oversized heavy shadows. Use subtle `rgba` border overlays instead of drop shadows.
- **Build/Run**: Use the standard workspace dev command (e.g., `pnpm dev` or `npm run dev`) for local iteration.

## 🧪 Testing & Code Quality
- Ensure contrast passes WCAG standards per the `DESIGN.md` spec.
- No default scrollbars (`scrollbar-width: none`).
- PRs should maintain a clean, organized commit history.
