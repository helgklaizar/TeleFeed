import { useMemo, useEffect, useRef } from 'react';
import { useChatStore } from '../stores/chatStore';
import { useUiStore } from '../../../stores/uiStore';
import { usePostActionsStore } from '../../../stores/postActionsStore';
import { ipcMarkAsRead } from '../../../shared/ipc/index';
import { ChatListItem } from './ChatListItem';
import { t } from '../../../app/i18n';

/**
 * Переиспользуемый контейнер для списков чатов (Groups, Private, Messages).
 *
 * @param {string[]} chatTypes   — массив _customType для фильтрации ('group', 'private')
 * @param {string}   markType    — тип для markAllAsRead ('group' | 'private' | 'messages')
 * @param {string}   routePrefix — префикс роута для ChatListItem ('/groups', '/private', '/messages')
 * @param {ReactNode} emptyIcon  — SVG-иконка для пустого состояния
 * @param {string}   emptyKey   — ключ i18n для текста пустого состояния
 * @param {Function} [chatFilter] — дополнительный фильтр (необязательно)
 * @param {Function} [markAction] — callback для invoke при markAllAsRead (необязательно)
 */
export function ChatListContainer({
    chatTypes,
    markType,
    routePrefix,
    emptyIcon,
    emptyKey,
    chatFilter,
    markAction,
}) {
    const chats = useChatStore((s) => s.chats);
    const markAllAsRead = useUiStore((s) => s.markAllAsRead);
    const blacklist = usePostActionsStore((s) => s.blacklist);
    const addToBlacklist = usePostActionsStore((s) => s.addToBlacklist);

    const filteredChats = useMemo(() => {
        const wallName = t('wall');
        return Object.values(chats)
            .filter((c) => {
                if (!chatTypes.includes(c._customType)) return false;
                if (c.title === wallName) return false;
                if (blacklist.includes(c.id.toString())) return false;
                return chatFilter ? chatFilter(c) : true;
            })
            .sort((a, b) => {
                if (a._order && b._order) return b._order.localeCompare(a._order);
                return (b.last_message?.date || 0) - (a.last_message?.date || 0);
            });
    }, [chats, chatTypes, chatFilter, blacklist]);

    const lastMarkCount = useRef(markAllAsRead.count);
    useEffect(() => {
        if (markAllAsRead.count === lastMarkCount.current) return;
        lastMarkCount.current = markAllAsRead.count;
        if (markAllAsRead.type !== markType) return;
        filteredChats.forEach((chat) => {
            if (chat.unread_count > 0) {
                if (markAction) {
                    markAction(chat);
                } else {
                    ipcMarkAsRead(chat.id, []).catch(() => { });
                }
            }
        });
    }, [markAllAsRead, filteredChats, markType, markAction]);

    return (
        <div className="page chat-list-page">
            {filteredChats.length === 0 ? (
                <div className="empty-state">
                    {emptyIcon}
                    <span>{t(emptyKey)}</span>
                </div>
            ) : (
                filteredChats.map((chat) => (
                    <ChatListItem
                        key={chat.id}
                        chat={chat}
                        routePrefix={routePrefix}
                        onHide={() => addToBlacklist(chat.id)}
                    />
                ))
            )}
        </div>
    );
}
