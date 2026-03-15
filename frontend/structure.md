# Frontend Structure

Архитектура: Feature-Sliced Design (разбиение по фичам: chat, feed, media) + Zustand (сторы) + Tauri IPC.

## 📁 `app/` — Ядро приложения
- **`App.jsx`** — Главный компонент. Содержит роутинг (`react-router-dom`), ленивую загрузку страниц (`React.lazy`), обертку `useTdlibListener` и глобальные UI-элементы (Header, Toast, Loader, Boundary).
- **`AppHeader.jsx`** — Верхнее меню (header). Переключатель тем, кнопка профиля (меню), кнопка "В чаты" / "В ленту", проверка апдейтов мобильного сервера.
- **`App.css`** — Точка входа для CSS. Импортирует все глобальные стили (`tokens.css`, `layout.css`, стили авторизации, ленты, чатов).
- **`i18n.js`** — Локальная i18n библиотека. Хранит переводы словаря (ru/en), экспортирует функцию `t()` и стор `useI18nStore`.
- **`main.jsx`** — Корневой файл React-домена. Оборачивает `App` в `<BrowserRouter>`, монтирует приложение в `#root`.

## 📁 `pages/` — Экраны маршрутизации (Слой Pages)
- **`AiChatPage.jsx`** — Экран-заглушка чата с AI-агентом.
- **`AuthPage.jsx`** — Страница авторизации TDLib. Ведёт по шагам: телефон → код → пароль.
- **`ChannelListPage.jsx`** — Раздел "Подписки". Список всех каналов с возможностью отписаться.
- **`ChannelsPage.jsx`** — Классическая лента (папки сверху, скролл ленты через `Virtuoso`). Отображает посты в виде обычного списка.
- **`ChatViewPage.jsx`** — Экран общения (сообщения чата). Включает список `BubbleMessage`, инпут `textarea` и логику подгрузки истории при скролле вверх.
- **`FeedPage.jsx`** — Главная страница-лента ("Tiktok/Snap" режим). Каждая карточка (`FeedCard`) скроллится полноэкранно, снапинг скролла.
- **`FeedPage.css`** — CSS для Snap-скроллинга и выравнивания карточек в `FeedPage`.
- **`HiddenChatsPage.jsx`** — Управление черным списком чатов и каналов, от которых пользователь скрыл посты.
- **`InstructionsPage.jsx`** — Настройки промптов и инструкций для AI (Daily/OnDemand).
- **`MenuPage.jsx`** — Главное меню профиля: выбор темы, размера текста (textScale), очистка памяти, логаут, переход в поднастройки.
- **`MessagesPage.jsx`** — Раздел "Сообщения". Список только личных чатов и обычных групп без каналов (через `ChatListContainer`).

## 📁 `features/` — Бизнес-логика и фичи (Слой Features)

### 💬 `chat/` — Чаты и Сообщения
* **`components/`**
  - **`BubbleMessage.jsx`** — Монструозный компонент для рендера всех типов сообщений (Текст, Стикер, Войс, Кружочек, Файл, Опрос, Реплай и тд).
  - **`ChatListContainer.jsx`** — HOC/Контейнер для рендеринга списков чатов (Channels, Messages).
  - **`ChatListItem.jsx`** — Строка в списке чатов (аватарка, название, последнее сообщение, бейджи).
  - **`chat.css`** — Стили списка чатов, инпута и пупырей сообщений (`BubbleMessage`).
* **`hooks/`**
  - **`useSenderInfo.js`** — Хук: по `sender_id` (чат/юзер) вытягивает актуальное имя и аватар из сторов пользователя/чатов.
* **`stores/`**
  - **`chatStore.js`** — Zustand-стор списка чатов и папок. Фильтрует мусор от TDLib через `trimChat`, хранит `chats` по ID.
  - **`messageStore.js`** — Zustand-стор истории сообщений (сортировка DESC). Лимитирует память (50 сообщений на 20 чатов).
  - **`userStore.js`** — Zustand-стор профилей контактов и пользователей Telegram.

### 📰 `feed/` — Лента
* **`actions.js`** — Разделяемая логика действий с постами в ленте: отметить прочитанным (`markPostAsRead`) и лайк (`toggleFavoritePost`).
* **`components/`**
  - **`AlbumGrid.jsx`** — Вывод сгруппированных альбомом фото и видео (карусель/грид).
  - **`FeedCard.jsx`** — Карточка поста для "tiktok"-ленты. Отображает `PostContent`, UI кнопок (Скрыть, Лайк), AI Summary.
  - **`PostContent.jsx`** — Внутрянка поста: текст (через `ExpandableText`) и медиафайлы. 
  - **`feed.css`** — Стили для карточек классической ленты, рамок, отступов.
* **`hooks/`**
  - **`useFeedActions.js`** — React-хук обертка над логикой из `actions.js`, привязанная к `Toast` и сторам.
* **`stores/`**
  - **`feedStore.js`** — Zustand-стор постов ленты (пагинация, добавление батчами, группировка альбомов на лету).

### 🎬 `media/` — Медиа (Фото/Видео)
* **`components/`**
  - **`Lightbox.jsx`** — Полноэкранная модалка с зумом для просмотра медиа.
  - **`MediaFile.jsx`** — Главный загрузчик. Вызывает `ipcDownloadFile`, если файл еще не загружен локально, и рендерит `img`, `video` или анимацию.
  - **`VideoPlayer.jsx`** — Кастомный видеоплеер поверх стандартного HTML5 Video, со своим ползунком громкости, автовоспроизведением и скрытием контролов.
  - **`lightbox.css`** — Стили Лайтбокса (модалки с медиа).
  - **`video-player.css`** — Стили плеера, ползунков прогресса и кнопок.
* **`stores/`**
  - **`fileStore.js`** — Zustand LRU-кэш файловой системы (хранит `localPath` по `file_id`, чтобы не грузить одно фото дважды). Лимит: 150 файлов.

## 📁 `shared/` — Общие/Глобальные инструменты (Слой Shared)

### ⚡ `events/` & `hooks/` — TDLib Listener 
* **`events/useAuthEvents.js`** — Слушает `auth_update`, синхронизирует состояние `authStore`.
* **`events/useChatEvents.js`** — Главный обработчик событий TDLib (`tdlib_event`: newChat, message, positions, user). Раскидывает данные по соответствующим сторам.
* **`events/useFeedEvents.js`** — Слушает эмит `feed_updated` и делает дебаунс-запрос к бэкенду на получение новых постов (`loadMore`).
* **`hooks/useTdlibListener.js`** — Обертка-агрегатор, запускает три хука выше.

### 🔌 `ipc/`
* **`index.js`** — Единый фасад для `tauri.invoke`. Все вызовы Rust-команд должны происходить через эти типизированные функции (`ipcMarkAsRead`, `ipcSyncChats` и тд).

### 🎨 `styles/` — Дизайн система
* **`animations.css`** — Глобальные `@keyframes` (loading spinner, pulse).
* **`auth.css`** — Стили для флоу авторизации (пин-код, телефон).
* **`layout.css`** — Основная структура: `.app-container`, `.page`, сбросы margin/padding.
* **`overlays.css`** — Стили модальных окон, блюр-задников (`backdrop-filter`).
* **`settings.css`** — Стили Меню-настроек, списков подписок, свитчеров.
* **`toast.css`** — Стили плашек-алертов и ConnectionStatus снизу/сверху.
* **`tokens.css`** — Цветовая палитра `var(--bg-color)`, шрифты, брейкпоинты. Дизайн система проекта.

### 🧩 `ui/` — Компоненты-примитивы
* **`ChatAvatar.jsx`** — Универсальная аватарка чата/канала.
* **`ConnectionStatus.jsx`** — Бар с сообщением, когда отвалился интернет/TDLib коннектится.
* **`ContactPickerModal.jsx`** — Попап со списком контактов (из `userStore`) для создания приватного чата.
* **`ErrorBoundary.jsx`** — Ловит исключения рендера в дочках (React Class Component).
* **`ExpandableText.jsx`** — Текстовый блок со ссылкой "Читать дальше" и парсингом Telegram-сущностей из массива entities.
* **`ProfileAvatar.jsx`** — Аватар текущего пользователя (me).
* **`SenderAvatar.jsx`** — Аватар отправителя конкретного сообщения.
* **`StartupLoader.jsx`** — Полноэкранный спиннер загрузки при `startupPhase !== 'ready'`.
* **`Toast.jsx`** — Рендер уведомления из `toastStore` с автоматическим закрытием.

### 🛠 `utils/`
* **`helpers.js`** — Набор чистых утилит: 
  - `renderEntities`: парсинг `messageText` и его `entities` (жирный текст, ссылки, спойлеры) в HTML.
  - `formatTime`, `formatTimeShort`, `formatDatePrefix`: форматирование времени.
  - `getTextFromContent`: извлечение сырого текста из поста для preview.
  - `buildPostKey`: генератор уникальных ключей для маппинга постов.

## 📁 `stores/` — Глобальные стейтовые менеджеры
- **`authStore.js`** — Статусы TDLib: `init` → `wait_phone` → ... → `ready`.
- **`postActionsStore.js`** — Синхронизируется с `localStorage`. Хранит лайки (`favoritePosts`), блеклист чатов (`blacklist`), скрытые посты (`hiddenPosts`).
- **`startupStore.js`** — Фазы загрузки приложения: `idle` → `syncing_chats` → `loading_feed` → `ready`.
- **`toastStore.js`** — Массив текущих тостов + метод `showToast`.
- **`uiStore.js`** — Настройки фронтенда: тема (`theme`), промпты AI (`aiInstruction`), размер шрифта (`textScale`), состояние открытых модалок (`folderBarOpen`), профиль me.

## 📁 `tests/` — Unit-тесты
- **`README.md`** — Инструкции по запуску тестов внутри папки tests.
- **`helpers.test.js`** — Проверка парсинга энтити, дат и извлечения ключей (Vitest).
- **`i18n.test.js`** — Проверка переключателя локализаций и фолбеков.
- **`messageStore.test.js`** — Проверка сортировки, лимитов вставки и дедупликации сообщений.

## 📁 Корень `/frontend/`
- **`index.html`** — HTML-шаблон (точка входа Vite), внутри которого подключается `main.jsx`.
- **`eslint.config.js`** — Правила линтера ESLint в новом Flat-формате (React/Vite).
- **`package.json`** — Скрипты (`dev`, `build`, `test`) и зависимости (React, Zustand, Virtuoso, Tauri).
- **`package-lock.json`** — Зафиксированные версии всех npm-пакетов проекта.
- **`.prettierrc`** — Конфигурация Prettier для форматирования кода фронтенда.
- **`README.md`** — Краткая справка по фронтенду, структура (устаревшая) и правила работы (не вызывать ipc напрямую).
- **`update_ruby.rb`** — Ruby-скрипт или утилита (вероятно, вспомогательный служебный файл проекта).
- **`vite.config.js`** — Конфиг бандлера Vite с плагином Tauri (HMR на порт 1420).
- **`assets/react.svg`** — Стандартная иконка React.
