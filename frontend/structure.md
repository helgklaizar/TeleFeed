# Frontend Structure

Архитектура: Feature-Sliced Design (разбиение по фичам: chat, feed, media) + Zustand (сторы) + Tauri IPC.

## 📁 `app/` — Ядро приложения
- **`App.jsx`** — Главный компонент. Содержит роутинг (`react-router-dom`), ленивую загрузку страниц (`React.lazy`), глобальный перехватчик ссылок, keyboard shortcuts, медиа-модалку и компоновку AppShell.
- **`AppHeader.jsx`** — Верхнее меню. Фильтры папок (filter-chip), кнопки +/- шрифта, сердечко (Избранное/Saved), глазик (mark all as read), кнопка обновления PWA.
- **`App.css`** — Точка входа для CSS. Импортирует все глобальные стили (`tokens.css`, `layout.css`, стили авторизации, ленты, чатов).
- **`i18n.js`** — Локальная i18n библиотека. Хранит переводы словаря (ru/en), экспортирует функцию `t()` и стор `useI18nStore`.
- **`main.jsx`** — Корневой файл React-домена. Оборачивает `App` в `<HashRouter>`, монтирует приложение в `#root`.

## 📁 `pages/` — Экраны маршрутизации (Слой Pages)
- **`AuthPage.jsx`** — Страница авторизации TDLib. Ведёт по шагам: телефон → код → пароль → 2FA.
- **`ChannelListPage.jsx`** — Раздел «Подписки». Список всех каналов с возможностью добавить в чёрный список.
- **`ChannelsPage.jsx`** — Главная лента. Посты каналов через `Virtuoso` + SavedMessagesFeed (избранное). Фильтрует по черному списку и скрытым постам. Слушает глазик (mark all as read).

## 📁 `features/` — Бизнес-логика и фичи (Слой Features)

### 💬 `chat/` — Чаты и Сообщения
* **`components/`**
  - **`BubbleMessage.jsx`** — Рендер всех типов сообщений (текст, стикер, войс, кружочек, файл, опрос, реплай и т.д.).
  - **`bubbles/BaseBubbleLayout.jsx`** — Базовая обёртка пузыря (аватар, имя, хвостик).
  - **`bubbles/InfoBubbles.jsx`** — Информационные пузыри (сервисные сообщения, опросы).
  - **`bubbles/MediaBubbles.jsx`** — Медиа-пузыри (фото, видео, документ, анимация).
  - **`bubbles/VoiceBubble.jsx`** — Войсовое сообщение с прогресс-баром.
  - **`chat.css`** — Стили списка чатов, пузырей, инпута.
* **`hooks/`**
  - **`useSenderInfo.js`** — По `sender_id` достаёт актуальное имя и аватар из сторов.
* **`stores/`**
  - **`chatStore.js`** — Zustand-стор списка чатов и папок. Фильтрует через `trimChat`, хранит `chats` по ID.
  - **`messageStore.js`** — Zustand-стор истории сообщений (сортировка DESC). Лимит: 50 сообщений, 20 чатов.
  - **`userStore.js`** — Zustand-стор профилей контактов и пользователей Telegram.

### 📰 `feed/` — Лента
* **`actions.js`** — Единая логика действий: `markPostAsRead`, `toggleFavoritePost`.
* **`components/`**
  - **`AlbumGrid.jsx`** — Грид альбомов (несколько фото/видео в одном посте).
  - **`FeedCard.jsx`** — Карточка поста ленты. `PostContent` + кнопки (скрыть, лайк). Memo с кастомным comparator.
  - **`PostContent.jsx`** — Текст (через `ExpandableText`) + медиафайлы поста.
  - **`SavedMessagesFeed.jsx`** — Лента «Избранного» (Saved Messages) — отдельный режим `feedMode === 'saved'`.
  - **`feed.css`** — Стили карточек классической ленты.
* **`hooks/`**
  - **`useFeedActions.js`** — React-хук над `actions.js`, привязан к `Toast` и сторам.
* **`stores/`**
  - **`feedStore.js`** — Zustand-стор постов ленты (пагинация, батчи, группировка альбомов).

### 🎬 `media/` — Медиа (Фото/Видео)
* **`components/`**
  - **`Lightbox.jsx`** — Полноэкранная модалка с зумом для медиа.
  - **`MediaFile.jsx`** — Загрузчик файлов: `ipcDownloadFile`, если не скачан → рендерит `img`/`video`/анимацию.
  - **`VideoPlayer.jsx`** — Кастомный видеоплеер: ползунок, авто-воспроизведение, скрытие контролов.
  - **`lightbox.css`** — Стили лайтбокса.
  - **`video-player.css`** — Стили плеера и ползунков.
* **`stores/`**
  - **`fileStore.js`** — Zustand LRU-кэш файлов (хранит `localPath` по `file_id`). Лимит: 150 файлов.

## 📁 `shared/` — Общие инструменты (Слой Shared)

### ⚡ `events/` & `hooks/` — TDLib Listener
* **`events/useAuthEvents.js`** — Слушает `auth_update`, синхронизирует `authStore`.
* **`events/useChatEvents.js`** — Главный обработчик событий TDLib: raскидывает `newChat`, `message`, `positions`, `user` по сторам.
* **`events/useFeedEvents.js`** — Слушает эмит `feed_updated`, дебаунс-запрос на `loadMore`.
* **`hooks/useTdlibListener.js`** — Агрегатор: запускает три хука выше.

### 🔌 `ipc/`
* **`index.js`** — **Единственное место для `tauri.invoke()`**. Все вызовы Rust-команд через типизированные функции (`ipcMarkAsRead`, `ipcSyncChats` и т.д.).

### 🎨 `styles/` — Дизайн-система
* **`animations.css`** — `@keyframes` (loading spinner, pulse, flash).
* **`auth.css`** — Стили флоу авторизации.
* **`layout.css`** — Основная структура: `.app-container`, `.page`, сбросы.
* **`overlays.css`** — Модальные окна, `backdrop-filter`.
* **`settings.css`** — Стили меню, списков подписок, свитчеров.
* **`toast.css`** — Плашки-алерты и ConnectionStatus.
* **`tokens.css`** — Цветовая палитра `var(--bg-color)`, шрифты. Дизайн-система проекта.

### 🧩 `ui/` — Компоненты-примитивы
* **`ChatAvatar.jsx`** — Универсальная аватарка чата/канала.
* **`ConnectionStatus.jsx`** — Бар при потере соединения/реконнекте TDLib.
* **`ErrorBoundary.jsx`** — React Class Component, ловит исключения при рендере.
* **`ExpandableText.jsx`** — «Читать дальше» + парсинг Telegram entities в HTML.
* **`ProfileAvatar.jsx`** — Аватар текущего пользователя (me).
* **`SenderAvatar.jsx`** — Аватар отправителя сообщения.
* **`StartupLoader.jsx`** — Полноэкранный спиннер при `startupPhase !== 'ready'`.
* **`Toast.jsx`** — Рендер уведомления из `toastStore` с автозакрытием.

### 🛠 `utils/`
* **`helpers.js`** — Чистые утилиты:
  - `renderEntities` — парсинг `entities` Telegram в HTML (bold, ссылки, спойлеры).
  - `formatTime`, `formatTimeShort`, `formatDatePrefix` — форматирование времени.
  - `getTextFromContent` — извлечение текста из поста для preview.
  - `buildPostKey` — уникальный ключ `chatId_msgId` для маппинга постов.

## 📁 `stores/` — Глобальные стейты
- **`authStore.js`** — Статусы TDLib: `init` → `wait_phone` → ... → `ready`.
- **`postActionsStore.js`** — `localStorage`-персистент. `favoritePosts`, `blacklist`, `hiddenPosts`.
- **`startupStore.js`** — Фазы загрузки: `idle` → `syncing_chats` → `loading_feed` → `ready`.
- **`toastStore.js`** — Массив тостов + метод `showToast`.
- **`uiStore.js`** — Тема, `textScale`, `feedMode` (feed/saved), `markAllAsRead`, профиль me.

## 📁 `tests/` — Unit-тесты (vitest)
- **`README.md`** — Инструкция по запуску.
- **`helpers.test.js`** — 21 тест: парсинг entities, даты, ключи постов.
- **`i18n.test.js`** — 6 тестов: переключатель локализаций, фолбеки.
- **`messageStore.test.js`** — 6 тестов: сортировка, лимиты, дедупликация.

## 📁 Корень `/frontend/`
- **`index.html`** — HTML-шаблон Vite, точка входа `main.jsx`.
- **`eslint.config.js`** — ESLint Flat-конфиг (React/Vite).
- **`package.json`** — Скрипты (`dev`, `build`, `test`) и зависимости.
- **`package-lock.json`** — Зафиксированные версии npm-пакетов.
- **`.prettierrc`** — Настройки Prettier.
- **`README.md`** — Справка по фронтенду.
- **`vite.config.js`** — Конфиг Vite с плагином Tauri (HMR на порту 1420).
