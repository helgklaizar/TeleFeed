# Backend (Rust / Tauri)

Rust-бэкенд приложения telefeed. Выступает мостом между TDLib и React-фронтендом через Tauri IPC.

## Структура

```
src/
├── lib.rs               # AppState + setup + регистрация IPC-команд
├── ipc/
│   ├── mod.rs
│   ├── auth.rs          # init_tdlib, submit_phone, submit_code, submit_password
│   ├── feed.rs          # get_channel_feed, get_new_feed_since, fetch_more_feed_history
│   ├── chat.rs          # mark_as_read, send_reply, load_more_history, get_chat_info,
│   │                    # forward_to_stena, get_chat_folder, sync_chats,
│   │                    # get_contacts, get_user, create_private_chat, leave_chat
│   ├── files.rs         # download_file, delete_local_file
│   └── system.rs        # optimize_storage, check_local_update, apply_local_update
├── tdlib.rs (manager)   # TDLib FFI: клиент, send-loop, receive-loop
├── handlers.rs          # handle_update() → dispatch по типу события → Tauri emit
├── feed_cache.rs        # In-process кэш ленты (BTreeMap, pending-буфер, LRU)
└── mobile_server.rs     # HTTP-сервер для мобильной точки входа
```

## AppState

```rust
pub struct AppState {
    pub client: Mutex<Option<TdlibManager>>,  // TDLib клиент
    pub feed_cache: Arc<FeedCache>,            // кэш ленты (shared)
    pub feed_dirty: Arc<AtomicBool>,           // флаг батчинга feed_updated
}
```

## Батчинг событий

Вместо emit на каждое новое сообщение:
- `handlers.rs` ставит `feed_dirty = true`
- `lib.rs` setup-loop раз в 500ms проверяет флаг и шлёт `feed_updated` фронтенду

## IPC-команды (краткий справочник)

| Команда | Модуль | Описание |
|---|---|---|
| `init_tdlib` | auth | Инициализация TDLib с api_id/api_hash |
| `submit_phone` | auth | Отправить номер телефона |
| `submit_code` | auth | Отправить SMS-код |
| `submit_password` | auth | Отправить 2FA пароль |
| `get_channel_feed` | feed | Получить порцию ленты (с пагинацией) |
| `get_new_feed_since` | feed | Получить только новые посты (инкремент) |
| `fetch_more_feed_history` | feed | Запросить историю у TDLib |
| `mark_as_read` | chat | Пометить сообщения прочитанными |
| `send_reply` | chat | Отправить сообщение (с reply) |
| `load_more_history` | chat | Загрузить историю чата |
| `leave_chat` | chat | Отписаться от канала |
| `sync_chats` | chat | Запросить список чатов |
| `download_file` | files | Скачать медиафайл TDLib |
| `optimize_storage` | system | Очистить кэш TDLib |

## Сборка

```bash
# Dev
npm run tauri dev

# Production
npm run tauri build
# → backend/target/release/bundle/macos/TeleFeed.app
```

## FeedCache

- Хранит до 1500 сообщений в `BTreeMap<(date, msg_id), Value>`
- Пагинация O(log N) через `.range(..upper).rev()`
- Pending-буфер для race condition при старте (сообщения до регистрации чата)
- Группировка альбомов при `get_feed()`
