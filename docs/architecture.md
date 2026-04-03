# Архитектура TeleFeed

### Backend
- `lib.rs` — AppState + setup
- `ipc/` — команды по доменам: auth, feed, chat, files, system
- `tdlib.rs` — TDLib FFI (send/receive loops)
- `handlers.rs` — разбиты на `auth.rs`, `chats.rs`, `feed.rs`, `common.rs`
- `feed_cache.rs` — кэш ленты (BTreeMap, LRU, album grouping)

### Frontend
- `shared/ipc/index.ts` — **единственное место для invoke()**. Не вызывать напрямую. Обернуто в TypeScript.
- `shared/events/` — useAuthEvents, useFeedEvents, useChatEvents
- `features/feed/actions.js` — единственная реализация markPostAsRead
- `stores` — разбиты на feed, chat, postActions, startup.

### Особенности UI
- **Snap-scroll layout**: `html/body/#root/.app-container { height: 100% }`. FeedPage — `position: absolute; inset: 0`. Virtuoso — `style={{ height: '100%' }}`.
