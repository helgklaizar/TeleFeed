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
- **Graceful TDLib Shutdown**: Добавлен `AtomicBool` CancellationToken. Теперь при `tauri::WindowEvent::CloseRequested` приложение шлет `{"@type": "close"}`, дожидается ответа `authorizationStateClosed` (убивая внутренние потоки `tokio`) и только после этого закрывается. Нет утечек памяти и повреждений БД sqlite.
- **Интеграция TypeScript**: Слой `shared/ipc` переведён на `.ts` (создан 100% типизированный контракт), установлен TypeScript для Vite.
- **Unit-тесты (Vitest)**: Написаны тесты для всех оставшихся Zustand сторов (`feedStore`, `chatStore`, `postActionsStore`, `fileStore`). Покрытие ключевых хранилищ — 100% (44 успешных теста).
- **Рефакторинг Backend**: Монолитный `handlers.rs` (444 строки) разбит на функциональные подмодули в `src/tdlib/handlers/`. Теперь логика разделена на `auth.rs`, `chats.rs`, `feed.rs` и общие утилиты `common.rs`. Паттерн роутинга событий сохранён, но читаемость и изоляция значительно улучшены.
- Мастер-аудит проекта: выявлены и исправлены lint warnings (9 → 0), удалены мёртвые переменные.
- Переписана `frontend/structure.md` под текущую архитектуру (минус 11 устаревших файлов).

## Следующие задачи
*Бэклог пуст! Проект причёсан и полностью стабилен. Все задачи из мастер-аудита успешно закрыты.*
