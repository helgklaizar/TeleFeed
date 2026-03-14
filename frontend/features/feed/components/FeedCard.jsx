import { useState, useMemo, useRef, memo } from 'react';
import { openUrl } from '@tauri-apps/plugin-opener';
import { ChatAvatar } from '../../../shared/ui/ChatAvatar';
import { PostContent } from './PostContent';
import { AlbumGrid } from './AlbumGrid';
import { getTextFromContent, buildPostKey, formatDatePrefix } from '../../../shared/utils/helpers';
import { useUiStore } from '../../../stores/uiStore';
import { useChatStore } from '../../chat/stores/chatStore';
import { t } from '../../../app/i18n';

/** Строит URL поста в Telegram */
function getChannelUrl(channel, chatId, msgId) {
    if (!chatId || !msgId) return null;
    const username = channel?.username
        || channel?.usernames?.find(u => u.is_active)?.username
        || channel?.usernames?.[0]?.username;
    const realMsgId = Math.floor(Number(msgId) / 1048576);
    return username
        ? `https://t.me/${username}/${realMsgId}`
        : `https://t.me/c/${String(chatId).replace('-100', '')}/${realMsgId}`;
}

/** Открывает пост в Telegram (стоппропагация нажатия) */
function handleOpenInTelegram(e, channel, chatId, msgId) {
    e.stopPropagation();
    const url = getChannelUrl(channel, chatId, msgId);
    if (url) openUrl(url).catch(() => { });
}


/** Строит данные форварда: { label, url } или null */
function getForwardInfo(mainPost) {
    const fi = mainPost?.forward_info;
    if (!fi) return null;
    const origin = fi.origin;
    if (!origin) return null;

    if (origin['@type'] === 'messageOriginChannel') {
        const srcChatId = origin.chat_id;
        const srcMsgId = origin.message_id;
        const realMsgId = Math.floor(Number(srcMsgId) / 1048576);

        // Берём чат из стора (если подписаны)
        const srcChat = useChatStore.getState().chats[srcChatId];
        const username = srcChat?.username
            || srcChat?.usernames?.find(u => u.is_active)?.username
            || srcChat?.usernames?.[0]?.username;
        const title = srcChat?.title || origin.author_signature || null;
        const url = username
            ? `https://t.me/${username}/${realMsgId}`
            : srcChatId
                ? `https://t.me/c/${String(srcChatId).replace('-100', '')}/${realMsgId}`
                : null;
        return { label: username ? `@${username}` : (title || 'Channel'), url };
    }

    if (origin['@type'] === 'messageOriginChat') {
        const srcChatId = origin.sender_chat_id;
        const srcChat = useChatStore.getState().chats[srcChatId];
        const username = srcChat?.username
            || srcChat?.usernames?.find(u => u.is_active)?.username
            || srcChat?.usernames?.[0]?.username;
        const title = srcChat?.title || origin.author_signature || null;
        const url = username
            ? `https://t.me/${username}`
            : srcChatId
                ? `https://t.me/c/${String(srcChatId).replace('-100', '')}`
                : null;
        return { label: username ? `@${username}` : (title || 'Chat'), url };
    }

    if (origin['@type'] === 'messageOriginUser') {
        return { label: origin.sender_name || 'user', url: null };
    }

    if (origin['@type'] === 'messageOriginHiddenUser') {
        return { label: origin.sender_name || 'Hidden user', url: null };
    }

    return null;
}

/**
 * Карточка поста для ленты каналов.
 * Шапка: единый блок [аватар | название канала / дата-время] + [глаз | сердце]
 */
export const FeedCard = memo(function FeedCard({ group, onMarkAsRead, onToggleFavorite, onMediaClick }) {
    const { mainPost, posts, channel, isAlbum } = group;
    const mainKey = buildPostKey(mainPost?.chat_id, mainPost?.id);
    // Выбираем конкретное булево значение, чтобы Zustand не ререндерил ВСЕ карточки при каждом клике по одной
    const isFavorite = useUiStore((s) => s.favoritePosts.has(mainKey));

    const [animOut, setAnimOut] = useState(null); // 'left' | 'right' | null
    // isPending блокирует кнопки немедленно (до setState-рендера)
    const isPending = useRef(false);

    // Collect media file IDs for cleanup
    const mediaFileIds = useMemo(() => {
        const ids = [];
        posts.forEach((p) => {
            const c = p.content;
            if (c?.photo?.sizes) c.photo.sizes.forEach((s) => s?.photo?.id && ids.push(s.photo.id));
            if (c?.video?.video?.id) ids.push(c.video.video.id);
            if (c?.animation?.animation?.id) ids.push(c.animation.animation.id);
        });
        return ids;
    }, [posts]);

    const allMessageIds = posts.map((p) => p.id);
    const chatTitle = channel?.title || `Chat ${mainPost?.chat_id}`;
    const dateStr = formatDatePrefix(mainPost?.date);

    // Album text
    const albumText = isAlbum ? getTextFromContent(posts.find(p => getTextFromContent(p.content))?.content) : '';

    const handleMarkAsRead = (e) => {
        e.stopPropagation();
        if (isPending.current || animOut) return;
        isPending.current = true;
        setAnimOut('left');
        setTimeout(() => {
            onMarkAsRead?.(mainPost.chat_id, allMessageIds, mediaFileIds);
        }, 280);
    };

    const handleToggleFavorite = (e) => {
        e.stopPropagation();
        if (isFavorite) {
            onToggleFavorite?.(mainPost.chat_id, allMessageIds);
            return;
        }
        if (isPending.current || animOut) return;
        isPending.current = true;
        setAnimOut('right');
        setTimeout(() => {
            onToggleFavorite?.(mainPost.chat_id, allMessageIds);
        }, 280);
    };

    return (
        <div
            className={`post-card${animOut === 'left' ? ' slide-out-left' : animOut === 'right' ? ' slide-out-right' : ''}`}
        >
            {/* HEADER BAR — название + дата вверху с собственным фоном */}
            <div className="post-card-header-bar">
                <div className="post-header">
                    {/* Левая часть: аватар + инфо */}
                    <div className="post-header-left">
                        <div
                            onClick={(e) => handleOpenInTelegram(e, channel, mainPost?.chat_id, mainPost?.id)}
                            style={{ cursor: 'pointer', display: 'block', lineHeight: 0 }}
                            title={t('openInTelegram')}
                        >
                            <ChatAvatar chat={channel} size={36} />
                        </div>

                        <div className="post-channel-info">
                            <span
                                className="post-channel-name"
                                onClick={(e) => handleOpenInTelegram(e, channel, mainPost?.chat_id, mainPost?.id)}
                                style={{ cursor: 'pointer' }}
                                title={t('openInTelegram')}
                            >
                                {chatTitle}
                            </span>
                            {dateStr && <span className="post-channel-date">{dateStr}</span>}
                        </div>
                    </div>

                    {/* Правая часть: действия */}
                    <div className="post-actions">
                        <button
                            onClick={handleMarkAsRead}
                            className="icon-button icon-eye"
                            title={t('markAsRead')}
                            aria-label={t('markAsRead')}
                            disabled={!!animOut}
                        >
                            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                                <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
                            </svg>
                        </button>
                        <button
                            onClick={handleToggleFavorite}
                            className={`icon-button icon-heart ${isFavorite ? 'active favorited' : ''}`}
                            title={isFavorite ? t('removeFromFavorites') : t('addToFavorites')}
                            aria-label={isFavorite ? t('removeFromFavorites') : t('addToFavorites')}
                            disabled={!!animOut && !isFavorite}
                        >
                            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            {/* POST BODY — forward + контент */}
            <div className="post-card-body">
                {/* FORWARD BADGE */}
                {(() => {
                    const fwd = getForwardInfo(mainPost);
                    if (!fwd) return null;
                    return (
                        <div className="forward-badge">
                            <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor" style={{ flexShrink: 0, marginTop: '1px' }}>
                                <path d="M12 8V4l8 8-8 8v-4H4V8z" />
                            </svg>
                            <span>Forwarded from&nbsp;</span>
                            {fwd.url ? (
                                <a
                                    className="forward-badge-link"
                                    onClick={(e) => { e.stopPropagation(); openUrl(fwd.url).catch(() => { }); }}
                                >
                                    {fwd.label}
                                </a>
                            ) : (
                                <span className="forward-badge-name">{fwd.label}</span>
                            )}
                        </div>
                    );
                })()}

                {isAlbum && posts.length > 1 ? (
                    <AlbumGrid
                        posts={posts}
                        text={albumText}
                        entities={[]}
                        onMediaClick={onMediaClick}
                    />
                ) : (
                    <PostContent message={mainPost} onMediaClick={onMediaClick} />
                )}
            </div>
        </div>
    );
}, (prev, next) => {
    return (
        prev.group.mainPost.id === next.group.mainPost.id &&
        prev.group.posts.length === next.group.posts.length &&
        prev.group.channel === next.group.channel &&
        prev.onMarkAsRead === next.onMarkAsRead &&
        prev.onToggleFavorite === next.onToggleFavorite &&
        prev.onMediaClick === next.onMediaClick
    );
});
