import { create } from 'zustand';
import { invoke } from '@tauri-apps/api/core';
import { useUiStore } from '../../../stores/uiStore';

/** Переводит selectedFolder ('all' | string) в folderId для invoke */
const parseFolderId = (id) => (id === 'all' ? null : parseInt(id, 10));

export const useFeedStore = create((set, get) => ({
    groups: [],
    isLoading: false,
    hasMore: true,
    currentFolder: 'all',

    loadInitial: async (folderId, _retryCount = 0) => {
        set({ currentFolder: folderId, isLoading: true });
        // Переходим в фазу loading_feed если ещё не там
        const uiPhase = useUiStore.getState().startupPhase;
        if (uiPhase === 'syncing_chats' || uiPhase === 'idle') {
            useUiStore.getState().setStartupPhase('loading_feed');
        }
        try {
            const feed = await invoke('get_channel_feed', {
                folderId: parseFolderId(folderId),
                limit: 30,
                beforeDate: null,
                beforeMsgId: null
            });
            if (feed.length === 0 && _retryCount < 3) {
                // TDLib ещё не загрузил историю — ретраим с экспоненциальной задержкой
                const delays = [1500, 4000, 10000];
                set({ isLoading: false });
                setTimeout(() => {
                    get().loadInitial(folderId, _retryCount + 1);
                }, delays[_retryCount]);
                return;
            }
            set({ groups: feed, isLoading: false, hasMore: feed.length === 30 });
            // Сигнализируем: старт завершён
            useUiStore.getState().setStartupPhase('ready');
        } catch (e) {
            console.error(e);
            set({ isLoading: false });
            useUiStore.getState().setStartupPhase('ready');
        }
    },

    loadMore: async () => {
        const { groups, currentFolder, isLoading, hasMore } = get();
        if (isLoading || !hasMore || groups.length === 0) return;

        set({ isLoading: true });
        try {
            const lastGroup = groups[groups.length - 1];
            const lastMsg = lastGroup.mainPost;

            const newFeed = await invoke('get_channel_feed', {
                folderId: parseFolderId(currentFolder),
                limit: 50,
                beforeDate: lastMsg.date,
                beforeMsgId: lastMsg.id
            });

            if (newFeed.length === 0) {
                // Кэш исчерпан — запрашиваем историю с TDLib (только локальная БД)
                invoke('fetch_more_feed_history', { beforeDate: lastMsg.date }).catch(() => { });
                // hasMore оставляем true — через 600ms придёт feed_updated и обновит ленту
                set({ isLoading: false });
                return;
            }

            // Ограничиваем память: не держим больше 300 групп
            const combined = [...groups, ...newFeed].slice(0, 300);
            set({
                groups: combined,
                isLoading: false,
                hasMore: newFeed.length === 50
            });
        } catch (e) {
            console.error(e);
            set({ isLoading: false });
        }
    },

    // Инкрементальное обновление: запрашиваем только НОВЕЕ самого свежего поста
    handleFeedUpdated: async () => {
        const { groups, currentFolder } = get();

        // Если лента пуста — делаем полную загрузку вместо инкрементальной
        if (groups.length === 0) {
            get().loadInitial(currentFolder);
            return;
        }

        try {
            const newestDate = groups[0]?.mainPost?.date || 0;
            const newFeed = await invoke('get_new_feed_since', {
                folderId: parseFolderId(currentFolder),
                sinceDate: newestDate
            });

            if (newFeed.length > 0) {
                // Дедупликация по ключу
                const existingKeys = new Set(groups.map(g =>
                    g.isAlbum && g.mainPost.media_album_id && g.mainPost.media_album_id !== '0'
                        ? `album_${g.mainPost.chat_id}_${g.mainPost.media_album_id}`
                        : `${g.mainPost.chat_id}_${g.mainPost.id}`
                ));
                const toAdd = newFeed.filter(g => {
                    const k = g.isAlbum && g.mainPost.media_album_id && g.mainPost.media_album_id !== '0'
                        ? `album_${g.mainPost.chat_id}_${g.mainPost.media_album_id}`
                        : `${g.mainPost.chat_id}_${g.mainPost.id}`;
                    return !existingKeys.has(k);
                });
                if (toAdd.length > 0) {
                    set({ groups: [...toAdd, ...groups] });
                }
            }
        } catch (e) {
            console.error(e);
        }
    },

    // Убрать посты конкретного канала из ленты (при отписке с другого клиента)
    removeChannel: (chatId) => set((s) => ({
        groups: s.groups.filter(g => g.mainPost?.chat_id !== chatId)
    })),
}));
