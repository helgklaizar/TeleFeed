import { useEffect } from 'react';
import { ipcGetUser, ipcGetChatInfo } from '../../../shared/ipc/index';
import { useUserStore } from '../stores/userStore';
import { useChatStore } from '../stores/chatStore';

export function useSenderInfo(senderIdObj) {
    const isUser = senderIdObj?.['@type'] === 'messageSenderUser';
    const isChat = senderIdObj?.['@type'] === 'messageSenderChat';

    // We get the user or chat from their respective stores
    const user = useUserStore(s => isUser ? s.users[senderIdObj.user_id] : null);
    const chat = useChatStore(s => isChat ? s.chats[senderIdObj.chat_id] : null);

    useEffect(() => {
        if (isUser && senderIdObj.user_id && !user) {
            ipcGetUser(senderIdObj.user_id).catch(() => { });
        }
        if (isChat && senderIdObj.chat_id && !chat) {
            ipcGetChatInfo(senderIdObj.chat_id).catch(() => { });
        }
    }, [isUser, isChat, senderIdObj, user, chat]);

    if (isUser) {
        return {
            name: user ? [user.first_name, user.last_name].filter(Boolean).join(' ') : '...',
            avatarFile: user?.profile_photo?.small || null,
            id: senderIdObj.user_id,
        };
    }
    if (isChat) {
        return {
            name: chat ? chat.title : '...',
            avatarFile: chat?.photo?.small || null,
            id: senderIdObj.chat_id,
        };
    }

    return { name: '', avatarFile: null, id: 0 };
}
