# Frontend (React / Vite)

React-фронтенд приложения tg-feed. Feature Sliced Design + Zustand + Tauri IPC.

## Структура

```
frontend/
├── app/
│   ├── App.jsx           # Корень: роутинг, keyboard shortcuts, link interceptor
│   ├── AppHeader.jsx     # Навигация, update-кнопка, contact picker
│   └── i18n.js           # Локализация (en/ru), useI18nStore
│
├── features/
│   ├── feed/
│   │   ├── components/
│   │   │   ├── FeedCard.jsx     # Карточка поста (memo + кастомный comparator)
│   │   │   ├── PostContent.jsx  # Контент сообщения по типу
│   │   │   └── AlbumGrid.jsx    # Альбом (горизонтальная карусель)
│   │   ├── stores/
│   │   │   └── feedStore.js     # loadInitial, loadMore, handleFeedUpdated, removeChannel
│   │   └── actions.js           # markPostAsRead, toggleFavoritePost — единственная реализация
│   │
│   ├── chat/
│   │   ├── components/
│   │   │   └── BubbleMessage.jsx  # Все типы сообщений (12+)
│   │   ├── hooks/
│   │   │   └── useSenderInfo.js   # Lazy-fetch имени/аватара отправителя
│   │   └── stores/
│   │       ├── chatStore.js       # Чаты + папки (trimChat, CHAT_FIELDS)
│   │       ├── messageStore.js    # Сообщения (sorted desc, LRU 50/chat, 20 chats)
│   │       └── userStore.js       # Пользователи + контакты
│   │
│   └── media/
│       ├── components/
│       │   ├── MediaFile.jsx      # Скачивание + отображение (photo/video/gif)
│       │   ├── VideoPlayer.jsx
│       │   └── Lightbox.jsx
│       └── stores/
│           └── fileStore.js       # fileId → file, LRU 150 файлов
│
├── pages/                         # Тонкие страницы — только layout и композиция
│   ├── ChannelsPage.jsx           # Лента + FolderBar + FeedCard/VirtuosoList
│   ├── ChatViewPage.jsx           # Просмотр чата + scroll + reply
│   ├── MessagesPage.jsx           # Список личных чатов
│   ├── MenuPage.jsx               # Настройки профиля
│   ├── AuthPage.jsx               # Онбординг + авторизация
│   ├── AiChatPage.jsx             # AI-stub
│   ├── ChannelListPage.jsx        # Список каналов + отписка
│   ├── HiddenChatsPage.jsx        # Управление скрытыми чатами
│   └── InstructionsPage.jsx       # AI инструкции
│
├── shared/
│   ├── ipc/
│   │   └── index.js        # ⚡ Типизированные invoke-обёртки — использовать везде
│   ├── events/
│   │   ├── useAuthEvents.js    # auth_update → authStore + startupPhase
│   │   ├── useFeedEvents.js    # feed_updated → feedStore.handleFeedUpdated
│   │   └── useChatEvents.js    # tdlib_event → chatStore, messageStore, fileStore, uiStore
│   ├── hooks/
│   │   └── useTdlibListener.js  # Агрегатор трёх event-хуков (backward compat)
│   ├── ui/                    # Переиспользуемые компоненты: ChatAvatar, Toast, ExpandableText...
│   ├── utils/
│   │   └── helpers.js         # renderEntities, formatDate, buildPostKey
│   └── styles/                # Global CSS токены и layout
│
└── stores/
    ├── authStore.js           # state: init | wait_phone | wait_code | wait_password | ready
    ├── uiStore.js             # theme, textScale, profile, animations, folderBar, feedViewMode
    ├── postActionsStore.js    # hiddenPosts, favoritePosts, blacklist (localStorage)
    ├── startupStore.js        # startupPhase: idle → syncing_chats → loading_feed → ready
    └── toastStore.js          # Тосты (max 2, auto-dismiss)
```

## Ключевые правила

### IPC — только через shared/ipc
```js
// ✅ Правильно
import { ipcMarkAsRead } from '../shared/ipc/index';
await ipcMarkAsRead(chatId, messageIds);

// ❌ Неправильно
import { invoke } from '@tauri-apps/api/core';
await invoke('mark_as_read', { chatId, messageIds });
```

### Post-actions — только через actions.js
```js
// ✅ Правильно
import { markPostAsRead, toggleFavoritePost } from '../features/feed/actions';

// ❌ Неправильно — дублировать логику в страницах
```

### Сторы — нет межсторовых зависимостей
- Stores не импортируют друг друга
- Координация через `useChatEvents.js` / `useAuthEvents.js`

## Stores — что где хранить

| Что | Стор |
|---|---|
| Авторизация | `authStore` |
| Тема, масштаб текста | `uiStore` |
| Профиль пользователя | `uiStore` |
| Скрытые посты, избранное, блэклист | `postActionsStore` |
| Фаза запуска (idle/syncing/ready) | `startupStore` / `uiStore.startupPhase` |
| Чаты и папки | `chatStore` |
| Сообщения чата | `messageStore` |
| Медиафайлы | `fileStore` |
| Посты ленты | `feedStore` |
| Тосты | `toastStore` |
