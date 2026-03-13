import { create } from 'zustand';

let _toastId = 0;
const MAX_TOASTS = 2;

export const useToastStore = create((set, get) => ({
    toasts: [], // [{ id, message, type, undoFn, duration }]

    addToast: (message, { type = 'info', undoFn = null, duration = 2000 } = {}) => {
        const id = ++_toastId;
        set((s) => {
            // Если уже MAX — убираем самый старый
            const trimmed = s.toasts.length >= MAX_TOASTS
                ? s.toasts.slice(s.toasts.length - MAX_TOASTS + 1)
                : s.toasts;
            return { toasts: [...trimmed, { id, message, type, undoFn, duration }] };
        });
        setTimeout(() => {
            get().removeToast(id);
        }, duration);
        return id;
    },

    removeToast: (id) => set((s) => ({
        toasts: s.toasts.filter((t) => t.id !== id),
    })),
}));

/** Shortcut для вызова из любого места */
export function showToast(message, options) {
    return useToastStore.getState().addToast(message, options);
}
