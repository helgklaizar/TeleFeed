# Changelog

## [Unreleased]

### Added
- **Telegram Saved Messages**: Sync heartbeat/favorite actions directly with Telegram's Saved Messages.
- **Jina AI**: Parse and read full articles for "Read more" links directly in the app.
- **Rust Backend**: New `get_user` command to fetch user information.
- **UI**: "Clear media cache" button, "Sync channels" button, folder bar toggle.
- **UX**: Flashing visual feedback when clicking eye (read) and heart (save) icons.

### Fixed
- **Chat**: Restored rendering of user names and avatars in group chats.
- **AI**: Restored input and context for AI Chat.

### Changed
- **Optimization**: Wrapped `FeedCard` in `React.memo` with a custom comparator to prevent O(N) re-renders across the feed.
- **Optimization**: Refactored Zustand selectors in `FeedCard` (`useUiStore`) to return specific boolean values instead of pulling entire collections, drastically reducing unnecessary component updates.
- **Optimization**: Resolved ESLint warning in `PostContent.jsx` by removing unused imports and props.

## [0.1.0-beta.1] — 2026-02-25

### First Public Release (beta)

#### Added
- **Onboarding** — step-by-step API credentials setup + Telegram authorization
- **Channel Feed** — media cards, Telegram folder filtering
- **Groups & Private** — Telegram-style chat view with bubble messages
- **Mark as Read** — with slide-out animation
- **Favorites** — forward to "Wall" chat
- **Media** — photo/video/GIF + fullscreen viewer
- **i18n** — EN/RU support
- **Themes** — blue/green/bordeaux
- **Zoom** — Cmd+/-/0
- **AI Agents** — CRUD for AI providers (OpenAI, Anthropic, Ollama, etc.)
- **Storybook** — UI component catalog
- **Unit Tests** — 37 tests (Vitest)
- **CI** — GitHub Actions (lint + test + storybook)
- **Documentation** — README, SRS, HLD, AGENTS.md

#### Security
- API keys entered via UI at runtime (not hardcoded)
- CSP configured in tauri.conf.json
- SAFETY comments on all unsafe blocks

#### Architecture
- Tauri v2 + React 19 + Zustand 5 + React Router 7
- Single TDLib client (no multi-account)
- Code splitting via React.lazy()
- ErrorBoundary per route
- Message eviction (MAX 100/chat)
