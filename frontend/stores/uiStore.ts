import { create } from 'zustand';
import { useViewerStore } from '../entities/viewer/model';
import { useAiStore } from '../entities/ai/model';

/**
 * uiStore (Facade) — слой совместимости в рамках миграции на FSD.
 * Делегирует часть состояний в соответствующие сущности (entities).
 */
export const useUiStore = create((set, get) => ({
    // ── Feed Mode (Пока оставляем тут, потом уедет в feed/model) ──
    feedMode: 'feed', // 'feed' | 'saved'
    setFeedMode: (mode: string) => set({ feedMode: mode }),

    // ── Theme (Delegated to Viewer Entity) ──
    get theme() { return useViewerStore.getState().theme; },
    setTheme: (t: string) => useViewerStore.getState().setTheme(t),
    cycleTheme: () => useViewerStore.getState().cycleTheme(),

    // ── Text Scale (Delegated to Viewer Entity) ──
    get textScale() { return useViewerStore.getState().textScale; },
    setTextScale: (scale: number) => useViewerStore.getState().setTextScale(scale),
    increaseTextScale: () => useViewerStore.getState().increaseTextScale(),
    decreaseTextScale: () => useViewerStore.getState().decreaseTextScale(),

    // ── Profile (Delegated to Viewer Entity) ──
    get profile() { return useViewerStore.getState().profile; },
    setProfile: (p: any) => useViewerStore.getState().setProfile(p),

    // ── AI Instructions (Delegated to AI Entity) ──
    get instructions() { return useAiStore.getState().instructions; },
    setInstructions: (inst: any) => useAiStore.getState().setInstructions(inst),

    // ── Mark-all-as-read trigger (Остаётся здесь временно) ──
    markAllAsRead: { type: null, count: 0 },
    triggerMarkAllAsRead: (type: string | null) => set((s: any) => ({
        markAllAsRead: { type, count: s.markAllAsRead.count + 1 },
    })),

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
    startupPhase: 'idle',
    setStartupPhase: (phase: string) => set({ startupPhase: phase }),
}));

// Важно для реактивности, чтобы компоненты через Zustand селекторы 
// получали обновления из вложенных сторов. Для полной совместимости
// рекомендуется использовать напрямую useViewerStore() в компонентах.
useViewerStore.subscribe(() => useUiStore.setState({}));
useAiStore.subscribe(() => useUiStore.setState({}));
