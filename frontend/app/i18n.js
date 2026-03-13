import { create } from 'zustand';

const translations = {
    en: {
        // Header
        feed: 'Wall',
        groups: 'Groups',
        private: 'Private',
        messagesTitle: 'Messages',
        aiAgent: 'AI Agent',
        confirm: 'Yes',
        settings: 'Settings',

        // Feed
        all: 'All',
        noNewPosts: 'No new posts',
        read: 'Read',
        favorite: 'Favorite',
        unfavorite: 'Remove from favorites',
        favoritesOnly: 'Favorites only',
        markAllAsRead: 'Mark all as read',

        // Chat
        loading: 'Loading...',
        chat: 'Chat',
        messages: 'messages',
        noMessages: 'No messages',
        messagePlaceholder: 'Message...',
        noName: 'No name',
        noChats: 'No chats',
        noGroups: 'No groups',

        // Auth & Onboarding
        startingApp: 'Starting TG-Feed…',
        enterPhone: 'Enter phone number',
        enterCode: 'Enter code from Telegram',
        enterPassword: 'Cloud password (2FA)',
        continue: 'Continue',
        onboardingTitle: 'Welcome to TG-Feed',
        onboardingDesc: 'To get started, enter your Telegram API credentials.',
        onboardingHelp: 'Get them at my.telegram.org → API development tools',
        apiIdLabel: 'API ID',
        apiHashLabel: 'API Hash',
        step: 'Step',
        of: 'of',

        // Menu
        profile: 'Profile',
        channels: 'Channels',
        instructions: 'Instructions',
        logOut: 'Log out',
        logOutConfirm: 'Log out from account?',
        user: 'User',

        // AI Agents
        aiAgents: 'AI Agents',
        newAgent: 'New agent',
        provider: 'Provider',
        name: 'Name',
        apiKey: 'API Key',
        apiKeyOptional: 'API Key (optional)',
        endpointUrl: 'Endpoint URL',
        leaveEmptyOllama: 'Leave empty for Ollama',
        save: 'Save',
        cancel: 'Cancel',
        delete: 'Delete',
        deleteAgentConfirm: 'Delete agent?',
        noAgents: 'No agents. Click + to add.',

        // Instructions
        dailyInstructions: 'Daily',
        onDemandInstructions: 'On demand',

        // Time
        justNow: 'just now',
        minAgo: 'min',
        hoursAgo: 'h',

        // Chat actions
        sticker: '🎨 Sticker',
        reply: 'Reply',
        replyTo: 'Reply...',
        cancelReply: 'Cancel',
        wall: 'Wall',
        markAsRead: 'Read',
        addToFavorites: 'Add to favorites',
        removeFromFavorites: 'Remove from favorites',

        // Connection & errors
        connectionLost: 'Connection lost',
        reconnecting: 'Reconnecting...',
        connected: 'Connected',
        sendError: 'Failed to send message',
        actionFailed: 'Action failed',
        markedAsRead: 'Marked as read',
        addedToFavorites: 'Added to favorites',
        removedFromFavorites: 'Removed from favorites',
        allMarkedAsRead: 'All marked as read',

        // History
        beginningOfChat: 'Beginning of chat',
        historyTruncated: 'History truncated (max 500)',
        loadingMore: 'Loading more...',

        // Search
        searchPlaceholder: 'Search...',

        // Undo
        undoAction: 'Undo',

        // Content type placeholders
        contentSticker: '🎨 Sticker',
        contentDocument: '📎 Document',
        contentVoice: '🎤 Voice message',
        contentVideoNote: '📹 Video message',
        // Additional newly extracted strings
        unsubscribeConfirm: 'Unsubscribe from this channel?',
        errorPrefix: 'Error: ',
        unsubscribeButton: 'Unsubscribe',
        noSubscriptions: 'No channel subscriptions',
        channelsLabel: 'Channels',
        groupsLabel: 'Groups',
        privateLabel: 'Chats',
        backLabel: 'Back',
        noHiddenChats: 'No hidden chats',
        aiChatGreeting: 'Hi! I am the TG-Feed AI assistant. How can I help?',
        aiChatStubMessage: 'I am just a stub for now, but soon I will be able to answer your requests!',
        aiFeaturesInProgress: 'AI features in development',
        askAiPlaceholder: 'Ask AI...',
        hiddenTitle: 'Hidden',
        textSizeLabel: 'Text size',
        clearMediaCache: 'Clear media cache',
        mediaCacheCleared: 'Media cache cleared',
        openPostInTelegram: 'Open post in Telegram',
        expandText: 'Expand / Collapse Text',
        markAsReadOrHide: 'Mark as read / Hide',
        saveToSavedMessages: 'Save to Saved Messages',
        initializing: 'Initializing...',
        syncingChannels: 'Syncing channels...',
        loadingFeed: 'Loading feed...',
        readyStatus: 'Ready',
        loadingStatus: 'Loading...',
        somethingWentWrong: 'Something went wrong',
        unknownError: 'Unknown error',
        newChatTitle: 'New chat',
        updateSuccess: 'Update successful!',
        toggleFeedDesign: 'Toggle feed design',
        updatingStatus: 'Updating...',
        dailyInstructionsDesc: 'Run automatically every day',
        dailyInstructionsPlaceholder: 'Example: Summarize daily news from channels...',
        onDemandInstructionsDesc: 'Run manually on demand',
        onDemandInstructionsPlaceholder: 'Example: Find mentions of keywords...',

        reload: 'Reload',
        contentAudio: '🎵 Audio',
        back: 'Back',
    },
    ru: {
        feed: 'Wall',
        groups: 'Группы',
        private: 'Личка',
        messagesTitle: 'Сообщения',
        aiAgent: 'ИИ Агент',
        confirm: 'Подтвердить',
        settings: 'Настройки',

        all: 'Все',
        noNewPosts: 'Нет новых постов',
        read: 'Прочитано',
        favorite: 'В избранное',
        unfavorite: 'Убрать из избранного',
        favoritesOnly: 'Только избранные',
        markAllAsRead: 'Пометить всё как прочитанное',

        loading: 'Загрузка...',
        chat: 'Чат',
        messages: 'сообщений',
        noMessages: 'Нет сообщений',
        messagePlaceholder: 'Сообщение...',
        noName: 'Без имени',
        noChats: 'Нет чатов',
        noGroups: 'Нет групп',

        startingApp: 'Запуск TG-Feed…',
        enterPhone: 'Введите номер телефона',
        enterCode: 'Введите код из Telegram',
        enterPassword: 'Облачный пароль (2FA)',
        continue: 'Продолжить',
        onboardingTitle: 'Добро пожаловать в TG-Feed',
        onboardingDesc: 'Для начала введите API-ключи Telegram.',
        onboardingHelp: 'Получить можно на my.telegram.org → API development tools',
        apiIdLabel: 'API ID',
        apiHashLabel: 'API Hash',
        step: 'Шаг',
        of: 'из',

        profile: 'Профиль',
        channels: 'Каналы',
        instructions: 'Инструкции',
        logOut: 'Выйти',
        logOutConfirm: 'Выйти из аккаунта?',
        user: 'Пользователь',

        aiAgents: 'ИИ Агенты',
        newAgent: 'Новый агент',
        provider: 'Провайдер',
        name: 'Имя',
        apiKey: 'API Ключ',
        apiKeyOptional: 'API Ключ (необязательно)',
        endpointUrl: 'Endpoint URL',
        leaveEmptyOllama: 'Оставьте пустым для Ollama',
        save: 'Сохранить',
        cancel: 'Отмена',
        delete: 'Удалить',
        deleteAgentConfirm: 'Удалить агента?',
        noAgents: 'Нет агентов. Нажмите + чтобы добавить.',

        dailyInstructions: 'Ежедневные',
        onDemandInstructions: 'По запросу',

        justNow: 'только что',
        minAgo: 'мин',
        hoursAgo: 'ч',

        sticker: '🎨 Стикер',
        reply: 'Ответить',
        replyTo: 'Ответить...',
        cancelReply: 'Отмена',
        wall: 'Стена',
        markAsRead: 'Прочитано',
        addToFavorites: 'В избранное',
        removeFromFavorites: 'Убрать из избранного',

        connectionLost: 'Нет соединения',
        reconnecting: 'Переподключение...',
        connected: 'Подключено',
        sendError: 'Не удалось отправить сообщение',
        actionFailed: 'Действие не выполнено',
        markedAsRead: 'Отмечено как прочитанное',
        addedToFavorites: 'Добавлено в избранное',
        removedFromFavorites: 'Убрано из избранного',
        allMarkedAsRead: 'Все отмечено как прочитанное',

        beginningOfChat: 'Начало переписки',
        historyTruncated: 'История обрезана (макс. 500)',
        loadingMore: 'Загрузка...',

        searchPlaceholder: 'Поиск...',

        undoAction: 'Отменить',

        contentSticker: '🎨 Стикер',
        contentDocument: '📎 Документ',
        contentVoice: '🎤 Голосовое',
        contentVideoNote: '📹 Видеосообщение',
        // Additional newly extracted strings
        unsubscribeConfirm: 'Отписаться от этого канала?',
        errorPrefix: 'Ошибка: ',
        unsubscribeButton: 'Отписаться',
        noSubscriptions: 'Нет подписок на каналы',
        channelsLabel: 'Каналы',
        groupsLabel: 'Группы',
        privateLabel: 'Чаты',
        backLabel: 'Назад',
        noHiddenChats: 'Нет скрытых чатов',
        aiChatGreeting: 'Привет! Я AI-ассистент TG-Feed. Чем могу помочь?',
        aiChatStubMessage: 'Пока я просто заглушка, но скоро смогу отвечать на твои запросы!',
        aiFeaturesInProgress: 'AI-функции в разработке',
        askAiPlaceholder: 'Спросить AI...',
        hiddenTitle: 'Скрытые',
        textSizeLabel: 'Размер текста',
        clearMediaCache: 'Очистить кэш медиа',
        mediaCacheCleared: 'Кэш медиа очищен',
        openPostInTelegram: 'Открыть пост в Telegram',
        expandText: 'Раскрыть / скрыть текст',
        markAsReadOrHide: 'Переключить статус "прочитано" / Скрыть',
        saveToSavedMessages: 'Сохранить в Избранное',
        initializing: 'Инициализация...',
        syncingChannels: 'Синхронизация каналов...',
        loadingFeed: 'Загрузка ленты...',
        readyStatus: 'Готово',
        loadingStatus: 'Загрузка...',
        somethingWentWrong: 'Что-то пошло не так',
        unknownError: 'Неизвестная ошибка',
        newChatTitle: 'Новый чат',
        noNameUser: 'Без имени',
        updateSuccess: 'Апдейт прошел удачно!',
        toggleFeedDesign: 'Переключить дизайн ленты',
        updatingStatus: 'Обновляем...',

        dailyInstructionsDesc: 'Выполняются автоматически каждый день',
        dailyInstructionsPlaceholder: 'Например: Суммаризируй новости за день по каналам...',
        onDemandInstructionsDesc: 'Выполняются при ручном запуске',
        onDemandInstructionsPlaceholder: 'Например: Найди упоминания ключевых слов...',

        reload: 'Перезагрузить',
        contentAudio: '🎵 Аудио',
        back: 'Назад',
    },
};

const safeGetItem = (key, fallback) => {
    try { return (typeof localStorage !== 'undefined' && localStorage.getItem(key)) || fallback; }
    catch { return fallback; }
};

const safeSetItem = (key, value) => {
    try { if (typeof localStorage !== 'undefined') localStorage.setItem(key, value); }
    catch { /* noop */ }
};

/**
 * Zustand store для i18n.
 * Реактивный — при смене языка все подписчики ре-рендерятся.
 */
export const useI18nStore = create((set, get) => ({
    lang: safeGetItem('tg_lang', 'en'),

    setLang: (lang) => {
        safeSetItem('tg_lang', lang);
        set({ lang });
    },

    t: (key) => {
        const lang = get().lang;
        return translations[lang]?.[key] || translations.en[key] || key;
    },
}));

/** Shortcut — non-reactive version for one-off calls */
export function t(key) {
    return useI18nStore.getState().t(key);
}
