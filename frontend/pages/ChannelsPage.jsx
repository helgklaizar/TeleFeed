import { useMemo, useEffect, useRef } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useUiStore } from '../stores/uiStore';
import { usePostActionsStore } from '../stores/postActionsStore';
import { ipcMarkAsRead } from '../shared/ipc/index';
import { useFeedStore } from '../features/feed/stores/feedStore';
import { FeedCard } from '../features/feed/components/FeedCard';
import { useFeedActions } from '../features/feed/hooks/useFeedActions';
import { SavedMessagesFeed } from '../features/feed/components/SavedMessagesFeed';
import { buildPostKey } from '../shared/utils/helpers';
import { Virtuoso } from 'react-virtuoso';
import { t } from '../app/i18n';

export function ChannelsPage({ setMediaModal }) {
    const { hiddenPosts, blacklist } = usePostActionsStore(useShallow((s) => ({
        hiddenPosts: s.hiddenPosts,
        blacklist: s.blacklist
    })));
    const { markAllAsRead, feedMode, scrollToTopSignal } = useUiStore(useShallow((s) => ({
        markAllAsRead: s.markAllAsRead,
        feedMode: s.feedMode,
        scrollToTopSignal: s.scrollToTopSignal
    })));

    const { groups, isLoading, loadInitial, loadMore, currentFolder } = useFeedStore(useShallow((s) => ({
        groups: s.groups,
        isLoading: s.isLoading,
        loadInitial: s.loadInitial,
        loadMore: s.loadMore,
        currentFolder: s.currentFolder
    })));

    const { handleMarkAsRead, handleToggleFavorite } = useFeedActions();

    // На первоначальную загрузку ленты (из локального стора)
    useEffect(() => {
        const _id = currentFolder;
        // Уже загружено в useTdlibListener или feedStore.loadInitial, но для страховки.
    }, [currentFolder, loadInitial]);

    // Фильтрация ленты:
    // "all" — посты которые пользователь ещё не скрыл глазиком (= не прочитал в этом приложении)
    // папки — все посты (история), без фильтра
    const filteredGroupedFeed = useMemo(() => {
        return groups.filter(group => {
            const mainMsg = group.mainPost;
            if (!mainMsg) return false;
            if (blacklist.includes(mainMsg.chat_id.toString())) return false;

            if (currentFolder === 'all') {
                const key = buildPostKey(mainMsg.chat_id, mainMsg.id);
                if (hiddenPosts.has(key)) return false;
            }

            return true;
        });
    }, [groups, blacklist, currentFolder, hiddenPosts]);

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



    return (
        <div className="page channels-page" style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
            <div className="feed-list-container" style={{ flex: 1, minHeight: 0, position: 'relative' }}>
                {feedMode === 'saved' ? (
                    <SavedMessagesFeed />
                ) : isLoading && groups.length === 0 ? (
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
                        scrollToTopSignal={scrollToTopSignal}
                    />
                )}
            </div>
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

function VirtuosoList({ groupedFeed, handleMarkAsRead, handleToggleFavorite, setMediaModal, loadMore, scrollToTopSignal }) {
    const virtuosoRef = useRef(null);
    const firstItemIndexRef = useRef(START_INDEX);
    const prevFeedRef = useRef(groupedFeed);

    const prevFeed = prevFeedRef.current;
    if (groupedFeed !== prevFeed) {
        // Оптимизированный поиск через Map (O(N) вместо O(N^2))
        const newKeysMap = new Map();
        groupedFeed.forEach((item, index) => {
            const key = item.isAlbum 
                ? `album_${item.mainPost.chat_id}_${item.mainPost.media_album_id}` 
                : `${item.mainPost.chat_id}_${item.mainPost.id}`;
            newKeysMap.set(key, index);
        });

        let firstSurvivingItemIndexOld = -1;
        let firstSurvivingItemIndexNew = -1;

        for (let i = 0; i < prevFeed.length; i++) {
            const oldItem = prevFeed[i];
            const oldKey = oldItem.isAlbum 
                ? `album_${oldItem.mainPost.chat_id}_${oldItem.mainPost.media_album_id}` 
                : `${oldItem.mainPost.chat_id}_${oldItem.mainPost.id}`;

            const newIdx = newKeysMap.get(oldKey);

            if (newIdx !== undefined) {
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

    useEffect(() => {
        if (scrollToTopSignal > 0 && virtuosoRef.current) {
            virtuosoRef.current.scrollToIndex({ index: 0, behavior: 'smooth' });
        }
    }, [scrollToTopSignal]);

    return (
        <Virtuoso
            ref={virtuosoRef}
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
