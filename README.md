# TG-Feed v3

Desktop Telegram client for reading channels, groups, and private chats. Built on Tauri v2 + React + Rust.

## Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite 7, Zustand 5, React Router 7 |
| Backend | Rust (Tauri v2), TDLib (via FFI / libloading) |
| Platform | macOS (darwin-arm64) |
| Tests | Vitest |
| UI Catalog | Storybook 10 |
| Linting | ESLint 9, Prettier 3 |

## Quick Start

```bash
# 1. Clone and navigate to project
cd v3/Dev/ui

# 2. Install dependencies
npm install

# 3. Run in dev mode
npm run tauri dev
```

On first launch, the app will ask for your **Telegram API credentials** (api_id + api_hash).  
Get them at [my.telegram.org/apps](https://my.telegram.org/apps).

## Scripts

| Command | Description |
|---|---|
| `npm run tauri dev` | Launch Tauri + Vite (dev) |
| `npm run dev` | Vite only (frontend) |
| `npm test` | Run tests (vitest) |
| `npm run lint` | ESLint check |
| `npm run lint:fix` | ESLint with auto-fix |
| `npm run format` | Prettier formatting |
| `npm run storybook` | Storybook on localhost:6006 |
| `npm run build-storybook` | Build Storybook |

## Project Structure

```
v3/Dev/ui/
├── src/
│   ├── components/     # UI components (FeedCard, MediaFile, BubbleMessage...)
│   ├── pages/          # Pages (Channels, Groups, Private, Chat, Menu...)
│   ├── stores/         # Zustand stores (auth, chat, message, file, ui)
│   ├── hooks/          # useTdlibListener
│   ├── utils/          # helpers (text, entities, formatting)
│   ├── styles/         # CSS (tokens, feed, chat, layout, overlays, animations)
│   ├── i18n.js         # Localization (en/ru)
│   ├── App.jsx         # Root + Router + Header
│   └── main.jsx        # Entry point
├── src-tauri/
│   └── src/
│       ├── lib.rs      # IPC commands (Tauri)
│       ├── tdlib.rs    # TDLib FFI manager
│       ├── handlers.rs # TDLib event handlers
│       └── main.rs     # Entry point
├── tests/              # Unit tests (vitest)
└── .tasks/             # SKSK tasks and artifacts
```

## Authorization

The app works with a single Telegram account. On first launch:
1. Enter your Telegram API credentials (api_id + api_hash)
2. Enter phone number
3. Enter code from Telegram
4. (Optional) Enter 2FA cloud password

## Keyboard Shortcuts

| Key | Action |
|---|---|
| `Cmd+1` | Channels |
| `Cmd+2` | Groups |
| `Cmd+3` | Private |
| `Cmd+=` / `Cmd+-` | Zoom |
| `Cmd+0` | Reset zoom |
| `Esc` | Back / Close modal |

## License

MIT
