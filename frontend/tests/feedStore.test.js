import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useFeedStore } from '../features/feed/stores/feedStore';
import * as ipc from '../shared/ipc/index';

// Мокаем IPC
vi.mock('../shared/ipc/index', () => ({
    ipcGetChannelFeed: vi.fn(),
    ipcGetNewFeedSince: vi.fn(),
    ipcFetchMoreFeedHistory: vi.fn(),
}));

describe('feedStore', () => {
    beforeEach(() => {
        useFeedStore.setState({ groups: [], isLoading: false, hasMore: true, currentFolder: 'all' });
        vi.clearAllMocks();
    });

    it('loadInitial устанавливает группы', async () => {
        const mockFeed = [{ mainPost: { id: 1, chat_id: 10, date: 100 } }];
        ipc.ipcGetChannelFeed.mockResolvedValueOnce(mockFeed);

        await useFeedStore.getState().loadInitial('all');

        expect(ipc.ipcGetChannelFeed).toHaveBeenCalledWith(null, 30, null, null);
        
        const state = useFeedStore.getState();
        expect(state.groups).toEqual(mockFeed);
        expect(state.isLoading).toBe(false);
        expect(state.hasMore).toBe(false); // < 30 elements
    });

    it('removeChannel удаляет посты из ленты', () => {
        useFeedStore.setState({
            groups: [
                { mainPost: { chat_id: 10 } },
                { mainPost: { chat_id: 20 } },
                { mainPost: { chat_id: 10 } },
            ]
        });

        useFeedStore.getState().removeChannel(10);

        expect(useFeedStore.getState().groups).toEqual([{ mainPost: { chat_id: 20 } }]);
    });

    it('loadMore загружает старые посты и обновляет список', async () => {
        const initialGroups = [
            { mainPost: { id: 2, chat_id: 10, date: 200 }, posts: [] },
            { mainPost: { id: 1, chat_id: 10, date: 100 }, posts: [{ id: 1, chat_id: 10, date: 100 }] }
        ];
        useFeedStore.setState({ groups: initialGroups, hasMore: true });

        const mockOlderFeed = [{ mainPost: { id: 0, chat_id: 10, date: 50 }, posts: [] }];
        ipc.ipcGetChannelFeed.mockResolvedValueOnce(mockOlderFeed);

        await useFeedStore.getState().loadMore();

        expect(ipc.ipcGetChannelFeed).toHaveBeenCalledWith(null, 50, 100, 1);
        const state = useFeedStore.getState();
        expect(state.groups).toHaveLength(3);
        expect(state.isLoading).toBe(false);
    });

    it('loadMore не добавляет дубликаты', async () => {
        const initialGroups = [{ mainPost: { id: 1, chat_id: 10, date: 100 }, posts: [] }];
        useFeedStore.setState({ groups: initialGroups, hasMore: true });

        const mockDuplicateFeed = [{ mainPost: { id: 1, chat_id: 10, date: 100 }, posts: [] }];
        ipc.ipcGetChannelFeed.mockResolvedValueOnce(mockDuplicateFeed);

        await useFeedStore.getState().loadMore();
        expect(useFeedStore.getState().groups).toHaveLength(1);
    });

    it('loadMore запрашивает TDLib при пустом кэше', async () => {
        vi.useFakeTimers();
        const initialGroups = [{ mainPost: { id: 1, chat_id: 10, date: 100 }, posts: [] }];
        useFeedStore.setState({ groups: initialGroups, hasMore: true });

        ipc.ipcGetChannelFeed.mockResolvedValueOnce([]); // Пустой ответ
        ipc.ipcFetchMoreFeedHistory.mockResolvedValueOnce();

        const loadPromise = useFeedStore.getState().loadMore();
        await loadPromise;
        // В loadMore установлен timeout 2000
        vi.runAllTimers();

        expect(ipc.ipcFetchMoreFeedHistory).toHaveBeenCalledWith(100);
        expect(useFeedStore.getState().isLoading).toBe(false);
        vi.useRealTimers();
    });

    it('handleFeedUpdated запрашивает новые посты', async () => {
        const initialGroups = [{ mainPost: { id: 1, chat_id: 10, date: 100 }, posts: [] }];
        useFeedStore.setState({ groups: initialGroups });

        const mockNewFeed = [{ mainPost: { id: 2, chat_id: 10, date: 200 }, posts: [] }];
        ipc.ipcGetNewFeedSince.mockResolvedValueOnce(mockNewFeed);

        await useFeedStore.getState().handleFeedUpdated();

        expect(ipc.ipcGetNewFeedSince).toHaveBeenCalledWith(null, 100);
        expect(useFeedStore.getState().groups).toHaveLength(2);
        // Новый пост должен быть в начале списка
        expect(useFeedStore.getState().groups[0].mainPost.id).toBe(2);
    });

    it('handleFeedUpdated вызывает loadInitial если групп нет', async () => {
        useFeedStore.setState({ groups: [] });
        const loadInitialSpy = vi.spyOn(useFeedStore.getState(), 'loadInitial').mockResolvedValueOnce();
        
        await useFeedStore.getState().handleFeedUpdated();
        expect(loadInitialSpy).toHaveBeenCalledWith('all');
    });
});
