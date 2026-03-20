import { create } from 'zustand';

const loadSet = (key) => {
    try {
        const v = JSON.parse(localStorage.getItem(key) || '[]');
        return new Set(Array.isArray(v) ? v : []);
    }
    catch { return new Set(); }
};
const saveSet = (key, s) => {
    try { localStorage.setItem(key, JSON.stringify([...s])); } catch { }
};
const loadArr = (key) => {
    try {
        const v = JSON.parse(localStorage.getItem(key) || '[]');
        return Array.isArray(v) ? v : [];
    } catch { return []; }
};
const loadObj = (key, defaultObj) => {
    try {
        const v = JSON.parse(localStorage.getItem(key));
        return v && typeof v === 'object' ? v : defaultObj;
    } catch { return defaultObj; }
};

export const defaultCategories = {
    'Гугл новости': ['google', 'гугл', 'gemini', 'android', 'pixel', 'youtube', 'alphabet', 'deepmind', 'chrome', 'alphacode', 'gemma'],
    'Компании и люди': ['apple', 'microsoft', 'meta', 'openai', 'anthropic', 'xai', 'tesla', 'amazon', 'yandex', 'sber', 'vk', 'мтс', 'tinkoff', 'альфа', 'сбер', 'яндекс', 'илон', 'маск', 'альтман', 'цукерберг', 'дуров'],
    'Модели': ['gpt', 'claude', 'llama', 'mistral', 'qwen', 'gemini', 'grok', 'deepseek', 'midjourney', 'dalle', 'sora', 'runway', 'kling', 'flux', 'гигачат', 'gigachat', 'yandexgpt', 'alice', 'алиса'],
    'Инструменты': ['cursor', 'copilot', 'windsurf', 'langchain', 'llamaindex', 'vercel', 'docker', 'api', 'react', 'node', 'github', 'vscode', 'ide', 'python', 'rust', 'typescript', 'figma', 'cline', 'roo', 'mcp'],
    'Агенты, скилы, воркфлоу': ['агент', 'скил', 'воркфлоу', 'prompt', 'промпт', 'автономн', 'оркестратор', 'rag', 'agent', 'skill', 'workflow', 'многоагент'],
    'Хардкод/Тех новости': ['токен', 'контекс', 'квантизац', 'gpu', 'nvidia', 'чип', 'h100', 'тензор', 'веса', 'датасет', 'обучен', 'train', 'fine-tun', 'файн-тюн', 'open-source', 'открыт', 'релиз', 'генерац', 'llm', 'алгоритм', 'нейросеть', 'мл', 'ml']
};

/** Стор пользовательских действий: скрытые посты, избранное, чёрный список */
export const usePostActionsStore = create((set) => ({
    hiddenPosts: loadSet('tg_hidden'),
    favoritePosts: loadSet('tg_favorites'),
    hiddenWords: loadArr('tg_hidden_words'),

    addHiddenWord: (word) => set((s) => {
        if (s.hiddenWords.includes(word)) return s;
        const n = [...s.hiddenWords, word];
        localStorage.setItem('tg_hidden_words', JSON.stringify(n));
        return { hiddenWords: n };
    }),

    removeHiddenWord: (word) => set((s) => {
        const n = s.hiddenWords.filter((w) => w !== word);
        localStorage.setItem('tg_hidden_words', JSON.stringify(n));
        return { hiddenWords: n };
    }),

    blacklist: loadArr('tg_blacklist'),

    addHidden: (key) => set((s) => {
        const n = new Set(s.hiddenPosts);
        n.add(key);
        saveSet('tg_hidden', n);
        return { hiddenPosts: n };
    }),

    addFavorite: (key) => set((s) => {
        const n = new Set(s.favoritePosts);
        n.add(key);
        saveSet('tg_favorites', n);
        return { favoritePosts: n };
    }),

    removeFavorite: (key) => set((s) => {
        const n = new Set(s.favoritePosts);
        n.delete(key);
        saveSet('tg_favorites', n);
        return { favoritePosts: n };
    }),

    addToBlacklist: (chatId) => set((s) => {
        const n = [...s.blacklist, chatId.toString()];
        localStorage.setItem('tg_blacklist', JSON.stringify(n));
        return { blacklist: n };
    }),

    setBlacklist: (list) => {
        localStorage.setItem('tg_blacklist', JSON.stringify(list));
        set({ blacklist: list });
    },

    categoriesByFolder: loadObj('tg_categories_by_folder', {}),
    setCategoriesForFolder: (folderId, mapObj) => set((s) => {
        const newMap = { ...s.categoriesByFolder, [folderId]: mapObj };
        localStorage.setItem('tg_categories_by_folder', JSON.stringify(newMap));
        return { categoriesByFolder: newMap };
    })
}));
