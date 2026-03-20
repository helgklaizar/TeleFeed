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

/** Стор пользовательских действий: скрытые посты, избранное, чёрный список */
export const usePostActionsStore = create((set) => ({
    hiddenPosts: loadSet('tg_hidden'),
    favoritePosts: loadSet('tg_favorites'),
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
}));
