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
    it('extracts folder titles correctly in setFolderList', () => {
        const chatStore = useChatStore.getState();
        // Cover different parsing paths in extractFolderTitle
        chatStore.setFolderList([
            { id: 1, title: 'String Title' },
            { id: 2, title: { text: 'Text Object' } },
            { id: 3, title: { text: { text: 'Nested Text' } } },
            { id: 4, title: { name: 'Name Field' } },
            { id: 5, name: 'Fallback Name' },
            { id: 6, name: { text: 'Fallback Text' } },
            { id: 7, name: { text: { text: 'Fallback Nested Text' } } },
            { id: 8, no_title_at_all: true }
        ]);

        const state = useChatStore.getState();
        expect(state.folders).toHaveLength(8);
        expect(state.folders[0].title).toBe('String Title');
        expect(state.folders[1].title).toBe('Text Object');
        expect(state.folders[2].title).toBe('Nested Text');
        expect(state.folders[3].title).toBe('Name Field');
        expect(state.folders[4].title).toBe('Fallback Name');
        expect(state.folders[5].title).toBe('Fallback Text');
        expect(state.folders[6].title).toBe('Fallback Nested Text');
        expect(state.folders[7].title).toBe('Folder 8'); // Generated ID title
    });

    it('updateFolder modifies included_chat_ids', () => {
        const chatStore = useChatStore.getState();
        chatStore.setFolderList([{ id: 1, title: 'F1' }]);
        
        chatStore.updateFolder(1, { included_chat_ids: [100, 200] });
        chatStore.updateFolder(99, { included_chat_ids: [300] }); // should not modify if id doesn't exist

        const state = useChatStore.getState();
        expect(state.folders[0].included_chat_ids).toEqual([100, 200]);
        
        // Edge case: empty data object
        chatStore.updateFolder(1, { });
        expect(useChatStore.getState().folders[0].included_chat_ids).toEqual([]);
    });

    it('getGroups filters properly', () => {
        const chatStore = useChatStore.getState();
        chatStore.addChat({ id: 1, title: 'C1', _customType: 'channel' });
        chatStore.addChat({ id: 2, title: 'My Wall', _customType: 'group' }); // Omitted
        chatStore.addChat({ id: 3, title: 'G1', _customType: 'group' });

        const groups = useChatStore.getState().getGroups();
        expect(groups.length).toBe(1);
        expect(groups[0].title).toBe('G1');
    });

    it('getPrivateChats filters properly', () => {
        const chatStore = useChatStore.getState();
        chatStore.addChat({ id: 1, title: 'P1', _customType: 'private' });
        chatStore.addChat({ id: 2, title: 'My Wall', _customType: 'private' }); // Omitted
        chatStore.addChat({ id: 3, title: 'C1', _customType: 'channel' });

        const privates = useChatStore.getState().getPrivateChats();
        expect(privates.length).toBe(1);
        expect(privates[0].title).toBe('P1');
    });

    it('getChat returns specific chat or null', () => {
        const chatStore = useChatStore.getState();
        chatStore.addChat({ id: 10, title: 'Test Chat', _customType: 'group' });
        
        expect(useChatStore.getState().getChat(10).title).toBe('Test Chat');
        expect(useChatStore.getState().getChat(999)).toBeNull();
    });
});
