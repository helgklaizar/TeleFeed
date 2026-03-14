# TG-Feed — оперативная память проекта

## Стек
- Tauri v2 + React 19 + Rust + TDLib (FFI)
- Zustand 5, React Router 7, Vite 7
- macOS only (darwin-arm64)

## Запуск
```bash
npm install && npm run tauri dev
```

## Архитектура (актуальная, после рефакторинга 2026-03-14)

### Backend
- `lib.rs` — AppState + setup (~90 строк)
- `ipc/` — команды по доменам: auth, feed, chat, files, system
- `tdlib.rs` — TDLib FFI (send/receive loops)
- `handlers.rs` — handle_update → Tauri emit
- `feed_cache.rs` — кэш ленты (BTreeMap, LRU, album grouping)

### Frontend
- `shared/ipc/index.js` — **единственное место для invoke()**. Не вызывать напрямую.
- `shared/events/` — useAuthEvents, useFeedEvents, useChatEvents (разбитый useTdlibListener)
- `features/feed/actions.js` — **единственная реализация** markPostAsRead / toggleFavoritePost
- `stores/postActionsStore.js` — hiddenPosts, favoritePosts, blacklist (выделены из uiStore)
- `stores/startupStore.js` — фаза запуска (выделена из uiStore)

## Ключевые решения
- feedStore НЕ зависит от uiStore (было — убрали)
- IPC-слой для всех invoke — меняем в одном месте при переименовании команды
- Батчинг feed_updated: AtomicBool + 500ms loop (Rust), не emit на каждое сообщение
- FeedCard: memo с кастомным comparator для избежания лишних рендеров

## Известные ограничения / Tech Debt
- BubbleMessage.jsx ~624 строки — нужно разбить на bubbles/ (Phase 4.2, не сделано)
- handlers.rs — монолитная handle_update (446 строк), разбивка на tdlib/handlers/* не сделана
- Нет TypeScript — начинать с IPC-слоя при введении
- ChatViewPage: setTimeout(1500ms) для детекции загрузки истории — race condition

## Что делали последним (2026-03-14)
- Аудит архитектуры (полный, 35+ файлов)
- Phase 0: Fix 3 runtime crashes (missing t imports) + XSS в renderEntities
- Phase 1: Backend split lib.rs → ipc/*
- Phase 2: Store split uiStore → postActionsStore + startupStore
- Phase 3: IPC layer + events split + feedStore decoupling + feed/actions.js
- Phase 4: AppHeader.jsx выделен из App.jsx (384→~140 строк)

## Следующие задачи (приоритет)
1. Разбить handlers.rs → tdlib/handlers/{auth,feed,chats}.rs
2. Разбить BubbleMessage.jsx → bubbles/
3. Graceful TDLib shutdown (CancellationToken)
4. Тесты для feed_cache.rs
