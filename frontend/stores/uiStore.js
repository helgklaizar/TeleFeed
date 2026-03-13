import { create } from 'zustand';

const loadSet = (key) => {
    try { return new Set(JSON.parse(localStorage.getItem(key) || '[]')); }
    catch { return new Set(); }
};
const saveSet = (key, s) => {
    try { localStorage.setItem(key, JSON.stringify([...s])); } catch { }
};
const loadArr = (key) => {
    try { return JSON.parse(localStorage.getItem(key) || '[]'); }
    catch { return []; }
};

export const useUiStore = create((set, get) => ({
    // Theme
    theme: localStorage.getItem('tg_theme') || 'blue',
    setTheme: (t) => {
        localStorage.setItem('tg_theme', t);
        set({ theme: t });
    },
    cycleTheme: () => {
        const t = get().theme;
        const next = t === 'blue' ? 'green' : t === 'green' ? 'bordeaux' : 'blue';
        get().setTheme(next);
    },

    // Text Scale
    textScale: Number(localStorage.getItem('tg_text_scale')) || 1.0,
    setTextScale: (scale) => {
        localStorage.setItem('tg_text_scale', scale);
        document.documentElement.style.setProperty('--text-scale', scale);
        set({ textScale: scale });
    },
    increaseTextScale: () => {
        const next = Math.min(get().textScale + 0.05, 1.8);
        get().setTextScale(parseFloat(next.toFixed(2)));
    },
    decreaseTextScale: () => {
        const next = Math.max(get().textScale - 0.05, 0.8);
        get().setTextScale(parseFloat(next.toFixed(2)));
    },

    // Hidden / Favorite posts
    hiddenPosts: loadSet('tg_hidden'),
    favoritePosts: loadSet('tg_favorites'),

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

    // Blacklist
    blacklist: loadArr('tg_blacklist'),
    addToBlacklist: (chatId) => set((s) => {
        const n = [...s.blacklist, chatId.toString()];
        localStorage.setItem('tg_blacklist', JSON.stringify(n));
        return { blacklist: n };
    }),
    setBlacklist: (list) => {
        localStorage.setItem('tg_blacklist', JSON.stringify(list));
        set({ blacklist: list });
    },

    // Profile
    profile: (() => {
        try { return JSON.parse(localStorage.getItem('tg_profile') || 'null'); }
        catch { return null; }
    })(),
    setProfile: (p) => {
        try { localStorage.setItem('tg_profile', JSON.stringify(p)); } catch { }
        set({ profile: p });
    },

    // Mark-all-as-read trigger: components watch `count` changes
    markAllAsRead: { type: null, count: 0 },
    triggerMarkAllAsRead: (type) => set((s) => ({
        markAllAsRead: { type, count: s.markAllAsRead.count + 1 },
    })),


    // Instructions
    instructions: (() => {
        try { return JSON.parse(localStorage.getItem('tg_instructions') || '{"daily":"","onDemand":""}'); }
        catch { return { daily: '', onDemand: '' }; }
    })(),
    setInstructions: (inst) => {
        try { localStorage.setItem('tg_instructions', JSON.stringify(inst)); } catch { }
        set({ instructions: inst });
    },

    // UI Animations for Header
    flashEye: false,
    flashHeart: false,
    triggerFlashEye: () => {
        set({ flashEye: true });
        setTimeout(() => set({ flashEye: false }), 800);
    },
    triggerFlashHeart: () => {
        set({ flashHeart: true });
        setTimeout(() => set({ flashHeart: false }), 800);
    },

    folderBarVisible: false,
    toggleFolderBar: () => set((s) => ({ folderBarVisible: !s.folderBarVisible })),

    // Startup sequence tracking
    // 'idle' → 'syncing_chats' → 'loading_feed' → 'ready'
    startupPhase: 'idle',
    setStartupPhase: (phase) => set({ startupPhase: phase }),

    // Switch between standard and tiktok-style feed
    feedViewMode: localStorage.getItem('tg_feed_mode') || 'standard',
    setFeedViewMode: (mode) => {
        localStorage.setItem('tg_feed_mode', mode);
        set({ feedViewMode: mode });
    },

}));

