import { create } from 'zustand';
import { t } from '../../../app/i18n';

/** Extract folder title from any TDLib chatFolderInfo format */
function extractFolderTitle(f) {
    if (f.title) {
        if (typeof f.title === 'string') return f.title;
        if (f.title.text) {
            if (typeof f.title.text === 'string') return f.title.text;
            if (f.title.text.text) return f.title.text.text;
        }
        if (f.title.name) {
            if (typeof f.title.name === 'string') return f.title.name;
        }
    }
    if (f.name) {
        if (typeof f.name === 'string') return f.name;
        if (f.name.text) {
            if (typeof f.name.text === 'string') return f.name.text;
            if (f.name.text.text) return f.name.text.text;
        }
    }
    return null;
}

// Поля которые реально нужны в UI — лишние данные от TDLib выбрасываем
const CHAT_FIELDS = new Set([
    'id', 'title', 'type', '_customType',
    'photo', '_avatarLocalPath',
    'unread_count', 'last_message',
    'last_read_inbox_message_id', 'last_read_outbox_message_id',
    'positions', '_order',
    'is_channel', 'is_group',
    'username', 'usernames',
]);

/** Оставляем только нужные поля чата, отбрасываем балласт TDLib */
function trimChat(raw) {
    const result = {};
    for (const key of CHAT_FIELDS) {
        if (raw[key] !== undefined) result[key] = raw[key];
    }
    return result;
}

export const useChatStore = create((set, get) => ({
    chats: {},   // chatId -> chat object (только нужные поля)
    folders: [], // [{ id, title, included_chat_ids }]

    addChat: (chat) => set((s) => {
        const prev = s.chats[chat.id] || {};
        const merged = trimChat({ ...prev, ...chat });
        return { chats: { ...s.chats, [chat.id]: merged } };
    }),

    setFolderList: (folderInfos) => set({
        folders: folderInfos.map((f) => {
            const title = extractFolderTitle(f);
            return { id: f.id, title: title || `Folder ${f.id}`, included_chat_ids: [] };
        })
    }),

    updateFolder: (folderId, data) => set((s) => ({
        folders: s.folders.map((f) =>
            f.id === folderId
                ? { ...f, included_chat_ids: data.included_chat_ids || [] }
                : f
        ),
    })),

    getChannels: () => {
        const wallName = t('wall');
        return Object.values(get().chats).filter(
            (c) => c._customType === 'channel' && c.title !== wallName
        );
    },

    getGroups: () => {
        const wallName = t('wall');
        return Object.values(get().chats).filter(
            (c) => c._customType === 'group' && c.title !== wallName
        );
    },

    getPrivateChats: () => {
        const wallName = t('wall');
        return Object.values(get().chats).filter(
            (c) => c._customType === 'private' && c.title !== wallName
        );
    },

    getStena: () => {
        const wallName = t('wall');
        return Object.values(get().chats).find((c) => c.title === wallName) || null;
    },

    getChat: (chatId) => get().chats[chatId] || null,
}));
