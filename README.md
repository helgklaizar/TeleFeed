# TG-Feed

Desktop Telegram client for reading channels and chats. Built on Tauri v2 + React + Rust/TDLib.

## Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite 7, Zustand 5, React Router 7 |
| Backend | Rust (Tauri v2), TDLib (via FFI / libloading) |
| Platform | macOS (darwin-arm64) |
| Tests | Vitest |
| Linting | ESLint 9 |

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Run in dev mode
npm run tauri dev
```

On first launch enter your **Telegram API credentials** (api_id + api_hash).  
Get them at [my.telegram.org/apps](https://my.telegram.org/apps).

## Scripts

| Command | Description |
|---|---|
| `npm run tauri dev` | Launch Tauri + Vite (dev) |
| `npm run dev` | Vite only (frontend preview) |
| `npm run tauri build` | Production build → `backend/target/release/bundle/` |
| `npm test` | Vitest |
| `npm run lint` | ESLint check |
| `npm run lint:fix` | ESLint auto-fix |

## Architecture

```
tg-feed/
├── frontend/
│   ├── app/
│   │   ├── App.jsx          # Router + shell + keyboard shortcuts
│   │   ├── AppHeader.jsx    # Navigation bar + update check
│   │   └── i18n.js          # Localization (en/ru)
│   ├── features/
│   │   ├── feed/
│   │   │   ├── components/  # FeedCard, PostContent, AlbumGrid
│   │   │   ├── stores/      # feedStore (no uiStore dependency)
│   │   │   └── actions.js   # markPostAsRead, toggleFavoritePost
│   │   ├── chat/
│   │   │   ├── components/  # BubbleMessage, ChatList
│   │   │   ├── hooks/       # useSenderInfo
│   │   │   └── stores/      # chatStore, messageStore, userStore
│   │   └── media/
│   │       ├── components/  # MediaFile, VideoPlayer, Lightbox
│   │       └── stores/      # fileStore (LRU 150 files)
│   ├── pages/               # Thin route components
│   ├── shared/
│   │   ├── ipc/             # Typed invoke wrappers (use instead of raw invoke)
│   │   ├── events/          # useAuthEvents, useFeedEvents, useChatEvents
│   │   ├── hooks/           # useTdlibListener (aggregator)
│   │   └── ui/              # ChatAvatar, ExpandableText, Toast, etc.
│   └── stores/
│       ├── authStore.js     # Auth state machine
│       ├── uiStore.js       # Theme, textScale, profile, animations
│       ├── postActionsStore.js # hiddenPosts, favoritePosts, blacklist
│       ├── startupStore.js  # Startup lifecycle phase
│       └── toastStore.js    # Notifications
├── backend/src/
│   ├── lib.rs               # AppState + Tauri setup + handler registration
│   ├── ipc/
│   │   ├── auth.rs          # init_tdlib, submit_phone/code/password
│   │   ├── feed.rs          # get_channel_feed, get_new_feed_since, fetch_more_feed_history
│   │   ├── chat.rs          # mark_as_read, send_reply, load_more_history, leave_chat, ...
│   │   ├── files.rs         # download_file, delete_local_file
│   │   └── system.rs        # optimize_storage, check/apply_local_update
│   ├── tdlib/
│   │   ├── manager.rs (tdlib.rs) # TDLib FFI manager (send/receive loops)
│   │   └── handlers.rs      # handle_update → TDLib events → Tauri emit
│   └── feed_cache.rs        # In-process feed cache (BTreeMap, LRU, album grouping)
└── api/
    └── swagger.yaml         # IPC command reference (OpenAPI format)
```

## IPC Layer

All frontend → backend calls go through `shared/ipc/index.js`:

```js
import { ipcMarkAsRead, ipcGetChannelFeed } from '../shared/ipc/index';
```

Never call `invoke()` directly — use the typed wrappers.

## TDLib Events

Backend emits events via Tauri. Frontend listens through three domain hooks:

| Hook | Events |
|---|---|
| `useAuthEvents` | `auth_update` → auth state machine |
| `useFeedEvents` | `feed_updated` → feed store refresh |
| `useChatEvents` | `tdlib_event` → chat/message/file/user stores |

## Authorization Flow

1. Enter API credentials (api_id + api_hash) — stored in localStorage
2. Enter phone number
3. Enter SMS code
4. (Optional) Enter 2FA password

## Keyboard Shortcuts

| Key | Action |
|---|---|
| `Cmd+1` | Channels |
| `Cmd+2` | Messages |
| `Cmd+3` | AI Chat |
| `Esc` | Back / Close modal |

## License

MIT
