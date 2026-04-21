import { create } from 'zustand';
import { ipcGetChannelFeed, ipcGetNewFeedSince, ipcFetchMoreFeedHistory } from '../../../shared/ipc/index';

/** Переводит selectedFolder ('all' | string) в folderId для invoke */
const parseFolderId = (id) => (id === 'all' ? null : parseInt(id, 10));

const MAX_GROUPS = 200;

export const useFeedStore = create((set, get) => ({
    groups: [],
    isLoading: false,
    hasMore: true,
    currentFolder: 'all',

    loadInitial: async (folderId, _retryCount = 0) => {
        set({ currentFolder: folderId, isLoading: true });
        try {
            const feed = await ipcGetChannelFeed(parseFolderId(folderId), 30, null, null);
            if (feed.length === 0 && _retryCount < 3) {
                const delays = [1500, 4000, 10000];
                set({ isLoading: false });
                setTimeout(() => get().loadInitial(folderId, _retryCount + 1), delays[_retryCount]);
                return;
            }
            set({ groups: feed, isLoading: false, hasMore: feed.length === 30 });
        } catch (e) {
            console.error('[feedStore.loadInitial]', e);
            set({ isLoading: false });
        }
    },

    loadMore: async () => {
        const { groups, currentFolder, isLoading, hasMore } = get();
        if (isLoading || !hasMore || groups.length === 0) return;

        set({ isLoading: true });
        try {
            const lastGroup = groups[groups.length - 1];
            const oldestPost = lastGroup.posts[lastGroup.posts.length - 1] || lastGroup.mainPost;

            const newFeed = await ipcGetChannelFeed(
                parseFolderId(currentFolder),
                50,
                oldestPost.date,
                oldestPost.id
            );

            if (newFeed.length === 0) {
                ipcFetchMoreFeedHistory(oldestPost.date).catch(() => { });
                setTimeout(() => set({ isLoading: false }), 2000);
                return;
            }

            const existingKeys = new Set(groups.map(g =>
                g.isAlbum && g.mainPost.media_album_id && g.mainPost.media_album_id !== '0'
                    ? `album_${g.mainPost.chat_id}_${g.mainPost.media_album_id}`
                    : `${g.mainPost.chat_id}_${g.mainPost.id}`
            ));

            const uniqueNewFeed = newFeed.filter(g => {
                const k = g.isAlbum && g.mainPost.media_album_id && g.mainPost.media_album_id !== '0'
                    ? `album_${g.mainPost.chat_id}_${g.mainPost.media_album_id}`
                    : `${g.mainPost.chat_id}_${g.mainPost.id}`;
                return !existingKeys.has(k);
            });

            let combined = [...groups, ...uniqueNewFeed];
            // Truncate to save memory
            if (combined.length > MAX_GROUPS) {
                combined = combined.slice(combined.length - MAX_GROUPS);
            }
            set({ groups: combined, isLoading: false, hasMore: newFeed.length === 50 });
        } catch (e) {
            console.error('[feedStore.loadMore]', e);
            set({ isLoading: false });
        }
    },

    handleFeedUpdated: async () => {
        const { groups, currentFolder } = get();

        if (groups.length === 0) {
            get().loadInitial(currentFolder);
            return;
        }

        try {
            const newestDate = groups[0]?.posts?.[0]?.date || groups[0]?.mainPost?.date || 0;
            const newFeed = await ipcGetNewFeedSince(parseFolderId(currentFolder), newestDate);

            if (newFeed.length > 0) {
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
                    let combined = [...toAdd, ...groups];
                    if (combined.length > MAX_GROUPS) {
                        combined = combined.slice(0, MAX_GROUPS);
                    }
                    set({ groups: combined });
                }
            }
        } catch (e) {
            console.error('[feedStore.handleFeedUpdated]', e);
        }
    },


    removeChannel: (chatId) => set((s) => ({
        groups: s.groups.filter(g => g.mainPost?.chat_id !== chatId)
    })),
}));
