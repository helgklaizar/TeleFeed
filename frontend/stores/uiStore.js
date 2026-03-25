import { create } from 'zustand';

/**
 * uiStore — только UI-состояние оболочки:
 * - Тема и масштаб текста (preferences)
 * - Профиль пользователя
 * - Триггер "прочитать всё"
 * - Инструкции для AI
 * - Flash-анимации хедера
 * - Видимость панели папок
 * - Режим отображения ленты
 *
 * Прочее:
 *   - hiddenPosts / favoritePosts / blacklist → postActionsStore
 *   - startupPhase → startupStore
 */
export const useUiStore = create((set, get) => ({
    // ── Feed Mode ──
    feedMode: 'feed', // 'feed' | 'saved'
    setFeedMode: (mode) => set({ feedMode: mode }),
    // ── Theme ──
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

    // ── Text Scale ──
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

    // ── Profile ──
    profile: (() => {
        try { return JSON.parse(localStorage.getItem('tg_profile') || 'null'); }
        catch { return null; }
    })(),
    setProfile: (p) => {
        try { localStorage.setItem('tg_profile', JSON.stringify(p)); } catch { }
        set({ profile: p });
    },

    // ── Mark-all-as-read trigger ──
    markAllAsRead: { type: null, count: 0 },
    triggerMarkAllAsRead: (type) => set((s) => ({
        markAllAsRead: { type, count: s.markAllAsRead.count + 1 },
    })),

    // ── Instructions (AI feature) ──
    instructions: (() => {
        try { return JSON.parse(localStorage.getItem('tg_instructions') || '{"daily":"","onDemand":""}'); }
        catch { return { daily: '', onDemand: '' }; }
    })(),
    setInstructions: (inst) => {
        try { localStorage.setItem('tg_instructions', JSON.stringify(inst)); } catch { }
        set({ instructions: inst });
    },

    // ── Header flash-animations ──
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


    // ── Startup phase (backward compat: делегируем в startupStore) ──
    // Оставляем здесь реэкспорт для обратной совместимости пока не обновлены все импорты
    startupPhase: 'idle',
    setStartupPhase: (phase) => set({ startupPhase: phase }),
}));
