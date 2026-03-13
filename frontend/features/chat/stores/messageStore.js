import { create } from 'zustand';

const MAX_MESSAGES_PER_CHAT = 200;
const MAX_CHATS_IN_STORE = 100;

/** Вставляем msg в sorted-desc массив без полного пересорта */
function insertSorted(arr, msg) {
    let lo = 0, hi = arr.length;
    while (lo < hi) {
        const mid = (lo + hi) >> 1;
        if (arr[mid].date > msg.date) lo = mid + 1;
        else hi = mid;
    }
    const next = arr.slice();
    next.splice(lo, 0, msg);
    return next.length > MAX_MESSAGES_PER_CHAT ? next.slice(0, MAX_MESSAGES_PER_CHAT) : next;
}

export const useMessageStore = create((set, get) => ({
    messages: {},            // chatId -> Message[] sorted desc by date

    addMessages: (chatId, newMessages) => set((s) => {
        const existing = s.messages[chatId] || [];
        const seen = new Set(existing.map((m) => m.id));
        const toAdd = newMessages.filter((m) => m && m.id && !seen.has(m.id));
        if (toAdd.length === 0) return s;

        const merged = [...existing, ...toAdd]
            .sort((a, b) => b.date - a.date)
            .slice(0, MAX_MESSAGES_PER_CHAT);

        const nextMessages = { ...s.messages, [chatId]: merged };
        const keys = Object.keys(nextMessages);
        if (keys.length > MAX_CHATS_IN_STORE) {
            delete nextMessages[keys[0]];
        }

        return { messages: nextMessages };
    }),

    addMessage: (msg) => set((s) => {
        if (!msg || !msg.chat_id || !msg.id) return s;
        const chatId = msg.chat_id;
        const existing = s.messages[chatId] || [];
        if (existing.some((m) => m.id === msg.id)) return s;
        const merged = insertSorted(existing, msg);
        return { messages: { ...s.messages, [chatId]: merged } };
    }),

    replaceMessage: (oldId, newMsg) => set((s) => {
        if (!newMsg || !newMsg.chat_id || !newMsg.id) return s;
        const chatId = newMsg.chat_id;
        const existing = s.messages[chatId] || [];
        const filtered = existing.filter((m) => m.id !== oldId && m.id !== newMsg.id);
        const merged = insertSorted(filtered, newMsg);
        return { messages: { ...s.messages, [chatId]: merged } };
    }),

    getMessages: (chatId) => get().messages[chatId] || [],
}));
