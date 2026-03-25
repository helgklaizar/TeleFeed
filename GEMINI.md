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
- **Snap-scroll layout**: `html/body/#root/.app-container { height: 100% }`. FeedPage — `position: absolute; inset: 0` внутри `position: relative; flex: 1` обёртки. Virtuoso (standard mode) — `style={{ height: '100%' }}` без `useWindowScroll`

## Что делали последним (2026-03-25)
- Мастер-аудит проекта: выявлены и исправлены lint warnings (9 → 0), удалены мёртвые переменные из App.jsx, AppHeader.jsx, ChannelsPage.jsx.
- Переписана `frontend/structure.md` — убраны 11 несуществующих файлов, актуализирована под текущую структуру.
- Чистка .tasks/: удалены завершённые задачи (audit, ui-refinement, v3-rebuild).
- ESLint: 0 errors, 0 warnings. Тесты: 33/33 зелёных.

## Следующие задачи (приоритет)
1. Разбить `handlers.rs` → `tdlib/handlers/{auth,feed,chats}.rs`
2. Оптимизация памяти (Graceful TDLib shutdown + CancellationToken)
3. Интеграция TypeScript (начиная с IPC-слоя `shared/ipc/index.js`)
