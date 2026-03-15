import { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import { useChatStore } from '../features/chat/stores/chatStore';
import { useUiStore } from '../stores/uiStore';
import { usePostActionsStore } from '../stores/postActionsStore';
import { ipcMarkAsRead, ipcDeleteLocalFile } from '../shared/ipc/index';
import { useFeedStore } from '../features/feed/stores/feedStore';
import { FeedCard } from '../features/feed/components/FeedCard';
import { FeedPage } from './FeedPage';
import { useFeedActions } from '../features/feed/hooks/useFeedActions';
import { buildPostKey } from '../shared/utils/helpers';
import { Virtuoso } from 'react-virtuoso';
import { t } from '../app/i18n';
import { showToast } from '../stores/toastStore';

export function ChannelsPage({ setMediaModal }) {
    const chats = useChatStore((s) => s.chats);
    const folders = useChatStore((s) => s.folders);
    const hiddenPosts = usePostActionsStore((s) => s.hiddenPosts);
    const blacklist = usePostActionsStore((s) => s.blacklist);
    const markAllAsRead = useUiStore((s) => s.markAllAsRead);
    const folderBarVisible = useUiStore((s) => s.folderBarVisible);
    const feedViewMode = useUiStore((s) => s.feedViewMode);

    const { groups, isLoading, loadInitial, loadMore } = useFeedStore();
    const { handleMarkAsRead, handleToggleFavorite } = useFeedActions();

    const [selectedFolder, setSelectedFolder] = useState(() => {
        try {
            return localStorage.getItem('tg_selected_folder') || 'all';
        } catch { return 'all'; }
    });

    // На смену папки перезагружаем ленту с бэкенда
    useEffect(() => {
        loadInitial(selectedFolder);
    }, [selectedFolder, loadInitial]);

    // Persist folder selection
    const handleSelectFolder = useCallback((folderId) => {
        const id = String(folderId);
        setSelectedFolder(id);
        try { localStorage.setItem('tg_selected_folder', id); } catch { }
    }, []);

    // Фильтрация ленты:
    // "all" — посты которые пользователь ещё не скрыл глазиком (= не прочитал в этом приложении)
    // папки — все посты (история), без фильтра
    const filteredGroupedFeed = useMemo(() => {
        return groups.filter(group => {
            const mainMsg = group.mainPost;
            if (!mainMsg) return false;
            if (blacklist.includes(mainMsg.chat_id.toString())) return false;

            if (selectedFolder === 'all') {
                const key = buildPostKey(mainMsg.chat_id, mainMsg.id);
                if (hiddenPosts.has(key)) return false;
            }

            return true;
        });
    }, [groups, blacklist, selectedFolder, hiddenPosts]);

    // React to "mark all as read" trigger from store
    const lastMarkCount = useRef(markAllAsRead.count);
    useEffect(() => {
        if (markAllAsRead.count === lastMarkCount.current) return;
        lastMarkCount.current = markAllAsRead.count;
        if (markAllAsRead.type && markAllAsRead.type !== 'channel') return;
        const store = usePostActionsStore.getState();
        filteredGroupedFeed.forEach((group) => {
            group.posts.forEach((p) => {
                const key = buildPostKey(p.chat_id, p.id);
                store.addHidden(key);
            });
            ipcMarkAsRead(group.mainPost.chat_id, group.posts.map((p) => p.id)).catch((e) => {
                console.error('mark_as_read error:', e);
            });
        });
    }, [markAllAsRead, filteredGroupedFeed]);



    // Only show folders that contain channels
    const channelFolders = useMemo(() => {
        return folders.filter((f) => {
            if (!f.included_chat_ids?.length) return false;
            return f.included_chat_ids.some((id) => {
                const chat = chats[id];
                return chat && chat._customType === 'channel';
            });
        });
    }, [folders, chats]);

    return (
        <div className="page channels-page" style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
            {/* Folder filter */}
            {channelFolders.length > 0 && folderBarVisible && (
                <div className="filter-bar" style={{ display: 'flex', alignItems: 'center' }}>
                    <div style={{ display: 'flex', overflowX: 'auto', flex: 1, paddingBottom: '4px' }}>
                        <button
                            className={`filter-chip ${selectedFolder === 'all' ? 'active' : ''}`}
                            onClick={() => handleSelectFolder('all')}
                        >
                            {t('all')}
                        </button>
                        {channelFolders.map((f) => (
                            <button
                                key={f.id}
                                className={`filter-chip ${selectedFolder === String(f.id) ? 'active' : ''}`}
                                onClick={() => handleSelectFolder(f.id)}
                            >
                                {f.title}
                            </button>
                        ))}
                    </div>
                    {/* Hide Button */}
                    <button
                        onClick={() => useUiStore.getState().toggleFolderBar()}
                        className="hide-folder-btn"
                        style={{
                            marginLeft: '8px',
                            background: 'none', border: 'none',
                            padding: '0 12px', cursor: 'pointer',
                            color: '#5ab847', flexShrink: 0
                        }}
                        title={t('backLabel')}
                    >
                    </button>
                </div>
            )}

            {feedViewMode === 'tiktok' ? (
                <div style={{ position: 'relative', flex: 1, minHeight: 0, overflow: 'hidden' }}>
                    <FeedPage 
                        feedItems={filteredGroupedFeed} 
                        onMarkAsRead={handleMarkAsRead}
                        onToggleFavorite={handleToggleFavorite}
                    />
                </div>
            ) : (
                <div className="feed-list-container">
                    {isLoading && groups.length === 0 ? (
                        <div className="feed-initial-loader">
                            <div className="feed-initial-spinner" />
                        </div>
                    ) : filteredGroupedFeed.length === 0 && !isLoading ? (
                        <div className="empty-state">
                            <svg viewBox="0 0 24 24" width="64" height="64" fill="currentColor" opacity="0.3">
                                <path d="M20 6h-8l-2-2H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2z" />
                            </svg>
                            <span>{t('noNewPosts')}</span>
                        </div>
                    ) : (
                        <VirtuosoList
                            groupedFeed={filteredGroupedFeed}
                            handleMarkAsRead={handleMarkAsRead}
                            handleToggleFavorite={handleToggleFavorite}
                            setMediaModal={setMediaModal}
                            loadMore={loadMore}
                        />
                    )}
                </div>
            )}
        </div>
    );
}

/**
 * Virtualized feed — рендерит только видимые карточки.
 *
 * КЛЮЧЕВОЙ ФИКС для прыжка скролла при появлении нового поста:
 * firstItemIndex вычисляется СИНХРОННО во время рендера через ref,
 * чтобы Virtuoso получал и новые данные и скомпенсированный index
 * в ОДНОМ рендере — иначе useEffect запаздывал на 1 цикл и лента прыгала.
 */
const START_INDEX = 100000;

function VirtuosoList({ groupedFeed, handleMarkAsRead, handleToggleFavorite, setMediaModal, loadMore }) {
    const firstItemIndexRef = useRef(START_INDEX);
    const prevFeedRef = useRef(groupedFeed);

    const prevFeed = prevFeedRef.current;
    if (groupedFeed !== prevFeed) {
        let firstSurvivingItemIndexOld = -1;
        let firstSurvivingItemIndexNew = -1;

        for (let i = 0; i < prevFeed.length; i++) {
            const oldItem = prevFeed[i];
            const oldKey = oldItem.isAlbum ? `album_${oldItem.mainPost.chat_id}_${oldItem.mainPost.media_album_id}` : `${oldItem.mainPost.chat_id}_${oldItem.mainPost.id}`;

            const newIdx = groupedFeed.findIndex(newItem => {
                const newKey = newItem.isAlbum ? `album_${newItem.mainPost.chat_id}_${newItem.mainPost.media_album_id}` : `${newItem.mainPost.chat_id}_${newItem.mainPost.id}`;
                return newKey === oldKey;
            });

            if (newIdx !== -1) {
                firstSurvivingItemIndexOld = i;
                firstSurvivingItemIndexNew = newIdx;
                break;
            }
        }

        if (firstSurvivingItemIndexOld !== -1) {
            const shift = firstSurvivingItemIndexNew - firstSurvivingItemIndexOld;
            firstItemIndexRef.current -= shift;
        }

        prevFeedRef.current = groupedFeed;
    }

    return (
        <Virtuoso
            style={{ height: '100%' }}
            firstItemIndex={firstItemIndexRef.current}
            initialTopMostItemIndex={0}
            data={groupedFeed}
            overscan={100}
            endReached={loadMore}
            itemContent={(_index, group) => (
                <FeedCard
                    key={group.isAlbum ? `album_${group.mainPost.chat_id}_${group.mainPost.media_album_id}` : `${group.mainPost.chat_id}_${group.mainPost.id}`}
                    group={group}
                    onMarkAsRead={handleMarkAsRead}
                    onToggleFavorite={handleToggleFavorite}
                    onMediaClick={setMediaModal}
                />
            )}
        />
    );
}
