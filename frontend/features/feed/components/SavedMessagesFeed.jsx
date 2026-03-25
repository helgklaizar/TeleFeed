import { useMemo, useEffect, useCallback, useState } from 'react';
import { listen } from '@tauri-apps/api/event';
import { ipcMarkAsRead, ipcLoadMoreHistory } from '../../../shared/ipc/index';
import { useChatStore } from '../../chat/stores/chatStore';
import { useMessageStore } from '../../chat/stores/messageStore';
import { useUiStore } from '../../../stores/uiStore';
import { FeedCard } from './FeedCard';
import { useFeedActions } from '../hooks/useFeedActions';
import { t } from '../../../app/i18n';
import { Virtuoso } from 'react-virtuoso';

const MIN_MESSAGES_THRESHOLD = 10;

export function SavedMessagesFeed() {
    const profile = useUiStore((s) => s.profile);
    const chatIdNum = profile?.userId ? Number(profile.userId) : null;
    
    const chat = useChatStore((s) => s.chats[chatIdNum]);
    const rawMessages = useMessageStore((s) => s.messages[chatIdNum] || []);
    const [loadingMore, setLoadingMore] = useState(false);
    const [reachedStart, setReachedStart] = useState(false);
    
    const { handleMarkAsRead, handleToggleFavorite } = useFeedActions();

    // Messages sorted descending initially, but we want them newest first (like the feed) or oldest first?
    // Feed is newest first. ChatView was oldest first (reverse). If we display it as a feed, we want newest first!
    const messages = useMemo(() => rawMessages, [rawMessages]);

    // Grouping for FeedCard
    const groupedFeed = useMemo(() => {
        const groupsMap = new Map();
        const result = [];
        
        for (let i = 0; i < messages.length; i++) {
            const msg = messages[i];
            const albumId = msg.media_album_id && msg.media_album_id !== '0' ? msg.media_album_id : null;
            
            if (albumId) {
                if (groupsMap.has(albumId)) {
                    groupsMap.get(albumId).posts.push(msg);
                } else {
                    const group = { mainPost: msg, posts: [msg], isAlbum: true, order: i };
                    groupsMap.set(albumId, group);
                    result.push(group);
                }
            } else {
                result.push({ mainPost: msg, posts: [msg], isAlbum: false, order: i });
            }
        }
        
        result.sort((a, b) => a.order - b.order); // Keep newest first order
        return result;
    }, [messages]);



    useEffect(() => {
        if (!chatIdNum) return;
        const msgs = useMessageStore.getState().messages[chatIdNum] || [];
        const latestMsg = msgs[0];
        if (latestMsg?.id) {
            ipcMarkAsRead(chatIdNum, [latestMsg.id]).catch(() => {});
        }
        useChatStore.getState().addChat({ id: chatIdNum, unread_count: 0 });
    }, [chatIdNum]);

    useEffect(() => {
        if (!chatIdNum) return;
        const unlisten = listen('tdlib_event', (event) => {
            const data = event.payload;
            if (data?.['@type'] === 'messages' && data?.['@extra'] === `history_${chatIdNum}`) {
                setLoadingMore(false);
                if (!data.messages || data.messages.length === 0) {
                    setReachedStart(true);
                }
            }
        });
        return () => unlisten.then(f => f());
    }, [chatIdNum]);

    useEffect(() => {
        if (!chatIdNum) return;
        if (rawMessages.length < MIN_MESSAGES_THRESHOLD) {
            setLoadingMore(true);
            ipcLoadMoreHistory(chatIdNum, 0).catch(() => setLoadingMore(false));
        }
    }, [chatIdNum, rawMessages.length]);

    const loadMoreHistory = useCallback(() => {
        if (rawMessages.length === 0 || loadingMore || reachedStart) return;
        const oldestMsg = rawMessages[rawMessages.length - 1]; // because rawMessages is newest first
        if (!oldestMsg) return;
        setLoadingMore(true);
        ipcLoadMoreHistory(chatIdNum, oldestMsg.id).catch(() => setLoadingMore(false));
    }, [chatIdNum, rawMessages, loadingMore, reachedStart]);

    if (!chat) {
        return (
            <div className="page chat-view-page" style={{ paddingTop: '50px' }}>
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                    <span>{t('loading')}</span>
                </div>
            </div>
        );
    }

    return (
        <div className="feed-list-container" style={{ flex: 1, minHeight: 0, position: 'relative' }}>
            {groupedFeed.length === 0 ? (
                <div className="empty-state">
                    <span>Сохраненных постов пока нет...</span>
                </div>
            ) : (
                <Virtuoso
                    style={{ height: '100%' }}
                    data={groupedFeed}
                    endReached={loadMoreHistory}
                    itemContent={(index, group) => (
                        <FeedCard
                            key={group.isAlbum ? `album_${group.mainPost.chat_id}_${group.mainPost.media_album_id}` : `${group.mainPost.chat_id}_${group.mainPost.id}`}
                            group={group}
                            onMarkAsRead={handleMarkAsRead}
                            onToggleFavorite={handleToggleFavorite}
                            onMediaClick={() => {}}
                        />
                    )}
                />
            )}
        </div>
    );
}
