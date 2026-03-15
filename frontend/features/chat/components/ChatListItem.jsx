import { useState, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChatAvatar } from '../../../shared/ui/ChatAvatar';
import { getTextFromContent, formatTime } from '../../../shared/utils/helpers';
import { t } from '../../../app/i18n';

export const ChatListItem = memo(function ChatListItem({ chat, routePrefix, onHide }) {
    const navigate = useNavigate();
    const [hovered, setHovered] = useState(false);

    const lastMessage = chat.last_message || null;
    const lastText = lastMessage ? getTextFromContent(lastMessage.content) : '';
    const preview = lastText || '';
    const lastTime = lastMessage ? formatTime(lastMessage.date) : '';
    const unreadCount = chat.unread_count || 0;
    const isPrivate = chat._customType === 'private';

    return (
        <div
            className={`chat-list-item ${unreadCount > 0 ? 'chat-list-item-unread' : ''} ${isPrivate ? 'chat-list-item-private' : ''}`}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            onClick={() => navigate(`${routePrefix}/${chat.id}`)}
        >
            {/* Аватар — немного левее при hover чтобы дать место кнопке */}
            <ChatAvatar chat={chat} size={52} />

            {/* Основное тело */}
            <div className="chat-list-item-body">
                <div className="chat-list-item-top">
                    <span className="chat-list-item-name">{chat.title || t('noName')}</span>
                    <span className={`chat-list-item-time ${unreadCount > 0 ? 'chat-list-item-time-unread' : ''}`}>
                        {lastTime}
                    </span>
                </div>
                <div className="chat-list-item-bottom">
                    <span className="chat-list-item-preview">{preview || t('noMessages')}</span>

                    {/* При hover — кнопка Скрыть вместо бейджа */}
                    {hovered && onHide ? (
                        <button
                            onClick={(e) => { e.stopPropagation(); onHide(chat); }}
                            style={{
                                flexShrink: 0,
                                background: 'rgba(255,71,87,0.15)',
                                border: '1px solid rgba(255,71,87,0.35)',
                                color: '#ff4757',
                                borderRadius: '6px',
                                padding: '2px 10px',
                                fontSize: '12px',
                                cursor: 'pointer',
                                whiteSpace: 'nowrap',
                            }}
                        >
                            Скрыть
                        </button>
                    ) : unreadCount > 0 ? (
                        <span className={`chat-list-item-badge ${isPrivate ? 'chat-list-item-badge-private' : ''}`}>
                            {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                    ) : null}
                </div>
            </div>
        </div>
    );
});
