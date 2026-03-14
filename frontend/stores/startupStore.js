import { create } from 'zustand';

/** Фаза запуска приложения */
export const useStartupStore = create((set) => ({
    // 'idle' → 'syncing_chats' → 'loading_feed' → 'ready'
    startupPhase: 'idle',
    setStartupPhase: (phase) => set({ startupPhase: phase }),
}));
