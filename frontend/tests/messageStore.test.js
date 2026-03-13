import { describe, it, expect, beforeEach } from 'vitest';
import { useMessageStore } from '../features/chat/stores/messageStore.js';

describe('messageStore', () => {
    beforeEach(() => {
        useMessageStore.setState({ messages: {} });
    });

    it('adds messages for a chat', () => {
        useMessageStore.getState().addMessages(1, [
            { id: 100, chat_id: 1, date: 1000 },
            { id: 101, chat_id: 1, date: 1001 },
        ]);
        const msgs = useMessageStore.getState().getMessages(1);
        expect(msgs).toHaveLength(2);
        // sorted desc by date
        expect(msgs[0].date).toBeGreaterThanOrEqual(msgs[1].date);
    });

    it('deduplicates messages', () => {
        const store = useMessageStore.getState();
        store.addMessages(1, [{ id: 100, chat_id: 1, date: 1000 }]);
        store.addMessages(1, [{ id: 100, chat_id: 1, date: 1000 }]);
        expect(useMessageStore.getState().getMessages(1)).toHaveLength(1);
    });

    it('adds single message', () => {
        useMessageStore.getState().addMessage({ id: 200, chat_id: 2, date: 2000 });
        expect(useMessageStore.getState().getMessages(2)).toHaveLength(1);
    });

    it('rejects invalid messages', () => {
        const store = useMessageStore.getState();
        store.addMessage(null);
        store.addMessage({ id: null, chat_id: 1 });
        store.addMessage({ id: 1, chat_id: null });
        expect(Object.keys(useMessageStore.getState().messages)).toHaveLength(0);
    });

    it('limits messages per chat to MAX_MESSAGES_PER_CHAT', () => {
        const msgs = Array.from({ length: 520 }, (_, i) => ({
            id: i,
            chat_id: 1,
            date: i,
        }));
        useMessageStore.getState().addMessages(1, msgs);
        expect(useMessageStore.getState().getMessages(1)).toHaveLength(200);
    });


    it('returns empty array for unknown chat', () => {
        expect(useMessageStore.getState().getMessages(999)).toEqual([]);
    });
});
