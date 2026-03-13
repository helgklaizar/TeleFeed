# HLD — High-Level Design

**Project:** TG-Feed v3  
**Version:** 0.1.0-beta.1  
**Date:** 2026-02-25

---

## 1. Architecture Overview

```
┌─────────────────────────────────────────┐
│              Tauri WebView              │
│  ┌───────────────────────────────────┐  │
│  │         React (Vite + HMR)       │  │
│  │  ┌─────────┐  ┌──────────────┐   │  │
│  │  │  Pages  │  │  Components  │   │  │
│  │  └────┬────┘  └──────┬───────┘   │  │
│  │       │              │           │  │
│  │  ┌────▼──────────────▼───────┐   │  │
│  │  │     Zustand Stores        │   │  │
│  │  │  auth│chat│msg│file│ui    │   │  │
│  │  └────────────┬──────────────┘   │  │
│  │               │ listen()         │  │
│  │  ┌────────────▼──────────────┐   │  │
│  │  │   useTdlibListener hook   │   │  │
│  │  └────────────┬──────────────┘   │  │
│  └───────────────┼──────────────────┘  │
│                  │ invoke() / emit()   │
│  ┌───────────────▼──────────────────┐  │
│  │         Rust (Tauri IPC)         │  │
│  │  ┌───────┐  ┌────────────────┐   │  │
│  │  │lib.rs │  │  handlers.rs   │   │  │
│  │  └───┬───┘  └────────┬───────┘   │  │
│  │      │               │           │  │
│  │  ┌───▼───────────────▼───────┐   │  │
│  │  │     TdlibManager          │   │  │
│  │  │     (tdlib.rs)            │   │  │
│  │  └───────────┬───────────────┘   │  │
│  └──────────────┼───────────────────┘  │
│                 │ FFI (libloading)      │
│  ┌──────────────▼───────────────────┐  │
│  │     libtdjson.dylib (TDLib)      │  │
│  └──────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

---

## 2. Layers

### 2.1 Frontend (React)

| Layer | Responsibility | Files |
|---|---|---|
| **Pages** | Routing, layout, business logic | `src/pages/*.jsx` |
| **Components** | Reusable UI | `src/components/*.jsx` |
| **Stores** | Global state (Zustand) | `src/stores/*.js` |
| **Hooks** | TDLib event listeners | `src/hooks/*.js` |
| **Utils** | Helpers (text, entities, formatting) | `src/utils/*.js` |
| **Styles** | CSS Design System (tokens + modules) | `src/styles/*.css` |
| **i18n** | Localization | `src/i18n.js` |

### 2.2 Backend (Rust / Tauri)

| Module | Responsibility |
|---|---|
| `lib.rs` | IPC commands (13 total), Tauri initialization |
| `tdlib.rs` | TdlibManager — FFI wrapper for TDLib (create/send/receive) |
| `handlers.rs` | TDLib event processing → emit to frontend |

### 2.3 TDLib

- Dynamically loaded via `libloading` (darwin-arm64)
- JSON API: `td_json_client_create`, `_send`, `_receive`
- Single client per application
- Persistent DB in `~/Library/Application Support/TG-Feed-v3/`

---

## 3. Data Flow

### 3.1 Initialization & Onboarding
```
App mount → AuthPage checks localStorage for api credentials
  → If missing: show credentials form (api_id + api_hash)
  → User enters credentials → save to localStorage
  → invoke("init_tdlib", { apiId, apiHash })
    → Rust: TdlibManager::new(api_id, api_hash)
      → FFI: td_json_client_create()
      → spawn read thread (client_receive loop)
      → spawn write thread (rx.recv → client_send)
    → TDLib: authorizationStateWaitTdlibParameters
      → Rust: send setTdlibParameters (api_id/hash from params)
      → TDLib: authorizationStateReady (or wait_phone/code/password)
      → Rust: emit("auth_update") → Frontend: authStore.setState()
```

### 3.2 Chat Loading
```
authorizationStateReady
  → Rust: send getMe + getChats(limit=500)
  → TDLib: chats → Rust: subscribed_ids + getChat for each
  → TDLib: chat → Rust: determine_custom_type + emit("tdlib_event")
  → Frontend: useTdlibListener → chatStore.addChat()
  → Rust: getChatHistory(limit=20) for each subscribed chat
  → TDLib: messages → Frontend: messageStore.addMessages()
```

### 3.3 Mark as Read
```
User clicks eye icon
  → FeedCard: animation slide-out-left (350ms)
  → invoke("mark_as_read", { chatId, messageIds })
  → Rust: send viewMessages to TDLib
  → Frontend: uiStore.addHidden() + addRead()
  → invoke("delete_local_file") for media
```

### 3.4 Favorites
```
User clicks heart icon
  → animation slide-out-right (200ms)
  → chatStore.getStena() → find "Wall" chat
  → invoke("forward_to_stena", { stenaChatId, fromChatId, messageIds })
  → Rust: send forwardMessages to TDLib
  → uiStore.addFavorite() + addHidden()
```

---

## 4. Data Storage

| Where | What | Lifetime |
|---|---|---|
| TDLib DB | Session, chats, messages, files | Permanent |
| localStorage | UI state (hidden/read/favorites/blacklist/theme/profile/agents/api_credentials) | Permanent |
| Zustand (RAM) | Current chats, messages, files | App session |
| Asset protocol | Media files (downloaded by TDLib) | Until deleted |

---

## 5. Security

| Measure | Implementation |
|---|---|
| API keys | Runtime input via UI (stored in localStorage) |
| CSP | Configured in tauri.conf.json |
| Asset scope | `$HOME/**`, `/tmp/**` |
| Passwords | Not stored (TDLib session) |

---

## 6. Navigation (routes)

```
HashRouter
├── /               → ChannelsPage (feed)
├── /channels       → ChannelsPage
├── /groups         → GroupsPage (list)
│   └── /:chatId   → ChatViewPage (conversation)
├── /private        → PrivatePage (list)
│   └── /:chatId   → ChatViewPage (conversation)
├── /ai             → AiChatPage
├── /menu           → MenuPage
├── /settings/
│   ├── channels    → ChannelListPage
│   ├── ai-agents   → AiAgentsPage
│   └── instructions → InstructionsPage
```

---

## 7. Design Constraints

- **Single TDLib client** — no multi-account, simplifies Rust layer
- **localStorage** — not SQL, no migrations, but ~5MB limit
- **messageStore eviction** — MAX 100 messages/chat for memory control
- **CSS transform zoom** — cross-browser (replaces non-standard `document.body.style.zoom`)
