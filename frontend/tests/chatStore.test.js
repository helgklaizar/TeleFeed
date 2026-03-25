import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useChatStore } from '../features/chat/stores/chatStore';

// Mock i18n
vi.mock('../app/i18n', () => ({
    t: (key) => key === 'wall' ? 'My Wall' : key
}));

describe('chatStore', () => {
    beforeEach(() => {
        useChatStore.setState({ chats: {}, folders: [] });
    });

    it('addChat adds and trims chat Object', () => {
        const chatStore = useChatStore.getState();
        
        chatStore.addChat({
            id: 123,
            title: 'Test Channel',
            _customType: 'channel',
            unnecessary_field: 'should be removed'
        });

        const state = useChatStore.getState();
        expect(state.chats[123]).toBeDefined();
        expect(state.chats[123].title).toBe('Test Channel');
        expect(state.chats[123].unnecessary_field).toBeUndefined(); // Trimmed!
    });

    it('getChannels filters correctly', () => {
        const chatStore = useChatStore.getState();
        
        chatStore.addChat({ id: 1, title: 'C1', _customType: 'channel' });
        chatStore.addChat({ id: 2, title: 'My Wall', _customType: 'channel' }); // Omitted
        chatStore.addChat({ id: 3, title: 'G1', _customType: 'group' });

        const channels = useChatStore.getState().getChannels();
        expect(channels.length).toBe(1);
        expect(channels[0].title).toBe('C1');
    });

    it('getStena returns the wall chat', () => {
        const chatStore = useChatStore.getState();
        chatStore.addChat({ id: 10, title: 'My Wall', _customType: 'channel' });
        
        const stena = useChatStore.getState().getStena();
        expect(stena).not.toBeNull();
        expect(stena.id).toBe(10);
    });
});
