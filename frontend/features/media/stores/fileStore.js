import { create } from 'zustand';

const MAX_FILES = 150;

export const useFileStore = create((set, get) => ({
    files: {},      // fileId -> file object
    _order: [],     // LRU order: newest last

    updateFile: (file) => set((s) => {
        const id = file.id;
        const existing = s.files[id];

        // Обновляем порядок LRU
        const order = existing
            ? s._order.filter((k) => k !== id)  // убираем старую позицию
            : s._order.slice(-(MAX_FILES - 1));  // при новом — обрезаем если переполнение

        return {
            files: { ...s.files, [id]: file },
            _order: [...order, id],
        };
    }),

    getFile: (fileId) => get().files[fileId] || null,

    // Явная очистка файлов которые уже не нужны (выгруженные посты)
    evictFiles: (fileIds) => set((s) => {
        if (!fileIds?.length) return s;
        const next = { ...s.files };
        fileIds.forEach((id) => delete next[id]);
        return {
            files: next,
            _order: s._order.filter((id) => !fileIds.includes(id)),
        };
    }),
}));
