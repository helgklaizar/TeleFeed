import { useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { ChatListContainer } from '../features/chat/components/ChatListContainer';

const EMPTY_ICON = (
    <svg viewBox="0 0 24 24" width="64" height="64" fill="currentColor" opacity="0.3">
        <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 9h12v2H6V9zm8 5H6v-2h8v2zm4-6H6V6h12v2z" />
    </svg>
);

/**
 * Объединённая страница сообщений — группы + личные чаты.
 * Сортировка по последнему сообщению (как в Telegram).
 */
export function MessagesPage() {
    // markAction для messages требует передачи last_message.id (в отличие от groups/private)
    const markAction = useCallback((chat) => {
        if (chat.last_message?.id) {
            invoke('mark_as_read', { chatId: chat.id, messageIds: [chat.last_message.id] }).catch(() => { });
        }
    }, []);

    return (
        <ChatListContainer
            chatTypes={['group', 'private']}
            markType="messages"
            routePrefix="/messages"
            emptyIcon={EMPTY_ICON}
            emptyKey="noChats"
            markAction={markAction}
        />
    );
}
