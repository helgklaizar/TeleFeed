# HLD — High-Level Design

**Проект:** TG-Feed v3  
**Версия:** 0.1.0  
**Дата:** 2026-02-25

---

## 1. Обзор архитектуры

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

## 2. Слои

### 2.1 Frontend (React)

| Слой | Ответственность | Файлы |
|---|---|---|
| **Pages** | Роутинг, layout, бизнес-логика | `src/pages/*.jsx` |
| **Components** | Переиспользуемый UI | `src/components/*.jsx` |
| **Stores** | Глобальное состояние (Zustand) | `src/stores/*.js` |
| **Hooks** | Слушатели событий TDLib | `src/hooks/*.js` |
| **Utils** | Хелперы (text, entities, formatting) | `src/utils/*.js` |
| **Styles** | CSS Design System (токены + модули) | `src/styles/*.css` |
| **i18n** | Локализация | `src/i18n.js` |

### 2.2 Backend (Rust / Tauri)

| Модуль | Ответственность |
|---|---|
| `lib.rs` | IPC-команды (13 штук), инициализация Tauri |
| `tdlib.rs` | TdlibManager — FFI-обвязка TDLib (create/send/receive) |
| `handlers.rs` | Обработка TDLib-событий → emit в frontend |

### 2.3 TDLib

- Загружается динамически через `libloading` (darwin-arm64)
- JSON API: `td_json_client_create`, `_send`, `_receive`
- Один клиент на приложение
- Персистентная БД в `~/Library/Application Support/TG-Feed-v3/`

---

## 3. Data Flow

### 3.1 Инициализация
```
App mount → invoke("init_tdlib")
  → Rust: TdlibManager::new()
    → FFI: td_json_client_create()
    → spawn read thread (client_receive loop)
    → spawn write thread (rx.recv → client_send)
  → TDLib: authorizationStateWaitTdlibParameters
    → Rust: send setTdlibParameters (api_id/hash из env!())
    → TDLib: authorizationStateReady (или wait_phone/code/password)
    → Rust: emit("auth_update") → Frontend: authStore.setState()
```

### 3.2 Загрузка чатов
```
authorizationStateReady
  → Rust: send getMe + getChats(limit=500)
  → TDLib: chats → Rust: subscribed_ids + getChat для каждого
  → TDLib: chat → Rust: determine_custom_type + emit("tdlib_event")
  → Frontend: useTdlibListener → chatStore.addChat()
  → Rust: getChatHistory(limit=20) для каждого подписанного
  → TDLib: messages → Frontend: messageStore.addMessages()
```

### 3.3 Mark as Read
```
User clicks eye icon
  → FeedCard: animation slide-out-left (350ms)
  → invoke("mark_as_read", { chatId, messageIds })
  → Rust: send viewMessages to TDLib
  → Frontend: uiStore.addHidden() + addRead()
  → invoke("delete_local_file") для медиа
```

### 3.4 Избранное
```
User clicks heart icon
  → animation slide-out-right (200ms)
  → chatStore.getStena() → найти чат "Стена"
  → invoke("forward_to_stena", { stenaChatId, fromChatId, messageIds })
  → Rust: send forwardMessages to TDLib
  → uiStore.addFavorite() + addHidden()
```

---

## 4. Хранение данных

| Где | Что | Время жизни |
|---|---|---|
| TDLib DB | Сессия, чаты, сообщения, файлы | Перманентно |
| localStorage | UI-состояние (hidden/read/favorites/blacklist/theme/profile/agents) | Перманентно |
| Zustand (RAM) | Текущие chats, messages, files | Сессия приложения |
| Asset protocol | Медиафайлы (скаченные TDLib) | До удаления |

---

## 5. Безопасность

| Мера | Реализация |
|---|---|
| API-ключи | build.rs → env!() (не в исходном коде) |
| CSP | Настроен в tauri.conf.json |
| Asset scope | `$HOME/**`, `/tmp/**` |
| Пароли | Не хранятся (TDLib session) |

---

## 6. Навигация (роуты)

```
HashRouter
├── /               → ChannelsPage (лента)
├── /channels       → ChannelsPage
├── /groups         → GroupsPage (список)
│   └── /:chatId   → ChatViewPage (переписка)
├── /private        → PrivatePage (список)
│   └── /:chatId   → ChatViewPage (переписка)
├── /ai             → AiChatPage
├── /menu           → MenuPage
├── /settings/
│   ├── channels    → ChannelListPage
│   ├── ai-agents   → AiAgentsPage
│   └── instructions → InstructionsPage
```

---

## 7. Ограничения дизайна

- **Один TDLib-клиент** — без мульти-аккаунта, упрощает Rust-слой
- **localStorage** — не SQL, нет миграций, но ограничение ~5MB
- **messageStore eviction** — MAX 100 сообщений/чат для контроля памяти
- **Синхронный zoom** — `document.body.style.zoom` (WebKit only)
