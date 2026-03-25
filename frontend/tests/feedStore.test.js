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
});
