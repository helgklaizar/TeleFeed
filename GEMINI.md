# Tele News — оперативная память проекта

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

## Известные ограничения / Tech Debt
- handlers.rs — монолитная handle_update (446 строк), разбивка на tdlib/handlers/* не сделана
- Нет TypeScript — начинать с IPC-слоя при введении

## Что делали последним (2026-03-20 / 2026-03-21)
- **Полный аудит**: исправлены все `ESLint` и `clippy` (упёрся в 0 warning-ов).
- **Git**: ветка `main` зафиксирована, создана саб-ветка `feature/next-version` для новой версии.
- **Новый Layout и Тренды**: 
  - Главное окно превращено в ленту: `AppHeader` удален, добавлена левая панель с папками и переключателем.
  - Полностью вырезана система ручных AI-категорий и настроек-группировок слов (убрана модалка настроек, `tempCategories`, `groupedAiWords`). Оставлен только единый прямой список **Топ 30 Динамических трендов** с переключателем за 1/3/7 дней.
  - По клику на трендовое слово в левой панели, теперь бэкенд на Rust фильтрует кеш 5000+ постов и возвращает только актуальные 100% совпадающие новости без двойной фильтрации на фронтенде (баг с отображением 32 постов исправлен).
  - Скрытие прочитанных постов (`hiddenPosts`) применяется **только** при просмотре вкладки "Новые новости" (когда не выбран ни конкретный тренд, ни специфическая папка); в остальных случаях посты отображаются, но с UI-меткой прочтения/глазика.
- **Удалены**: `FeedPage.jsx`, Меню приложения из трея (`TrayPage`), страницы настроек (`MenuPage`, `ChannelListPage` и т.д). Иконка Mac Menu Bar пока отключена.
- **Исправлен баг зависания при релоаде**: Если вызывать `init_tdlib`, когда TDLib уже крутится, раньше фронт зависал в статусе `init`. Теперь Rust-бекенд триггерит `getAuthorizationState` и пересылает клиенту ответ для моментального восстановления стейта.
## Следующие задачи (приоритет)
1. Разбить handlers.rs → tdlib/handlers/{auth,feed,chats}.rs
2. Graceful TDLib shutdown (CancellationToken)
3. Тесты для feed_cache.rs
4. Интеграция TypeScript (начиная с IPC)
