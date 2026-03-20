import { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import { useChatStore } from '../features/chat/stores/chatStore';
import { useUiStore } from '../stores/uiStore';
import { usePostActionsStore } from '../stores/postActionsStore';
import {
    ipcMarkAsRead,
    ipcGetTrendingTexts
} from '../shared/ipc/index';
import { useFeedStore } from '../features/feed/stores/feedStore';
import { FeedCard } from '../features/feed/components/FeedCard';
import { useFeedActions } from '../features/feed/hooks/useFeedActions';
import { buildPostKey } from '../shared/utils/helpers';
import { Virtuoso } from 'react-virtuoso';
import { t } from '../app/i18n';


export function ChannelsPage({ setMediaModal }) {
    const chats = useChatStore((s) => s.chats);
    const folders = useChatStore((s) => s.folders);
    const hiddenPosts = usePostActionsStore((s) => s.hiddenPosts);
    const blacklist = usePostActionsStore((s) => s.blacklist);
    const markAllAsRead = useUiStore((s) => s.markAllAsRead);
    const hiddenWords = usePostActionsStore((s) => s.hiddenWords);
    const addHiddenWord = usePostActionsStore((s) => s.addHiddenWord);
    
    const { groups, isLoading, loadInitial, loadMore } = useFeedStore();
    const { handleMarkAsRead, handleToggleFavorite } = useFeedActions();
    
    const [showAiTrends, setShowAiTrends] = useState(false);
    const [trendingTexts, setTrendingTexts] = useState([]);
    const [trendPeriod, setTrendPeriod] = useState(1);
    const [trendFilter, setTrendFilter] = useState('');

    const [selectedFolder, setSelectedFolder] = useState(() => {
        try {
            return localStorage.getItem('tg_selected_folder') || 'all';
        } catch { return 'all'; }
    });

    // На смену папки или фильтра перезагружаем ленту с бэкенда и тексты для трендов
    useEffect(() => {
        loadInitial(selectedFolder, trendFilter);
        if (!trendFilter) {
            ipcGetTrendingTexts(selectedFolder === 'all' ? null : parseInt(selectedFolder, 10), trendPeriod)
                .then(t => setTrendingTexts(t))
                .catch(() => {});
        }
    }, [selectedFolder, trendPeriod, trendFilter, loadInitial]);

    // Обновляем тексты при подгрузке новых постов, чтобы тренды были свежими
    useEffect(() => {
        if (groups.length > 0) {
           ipcGetTrendingTexts(selectedFolder === 'all' ? null : parseInt(selectedFolder, 10), trendPeriod)
               .then(t => setTrendingTexts(t))
               .catch(() => {});
        }
    }, [groups.length, selectedFolder, trendPeriod]);

    const totalUnreadCount = useMemo(() => {
        return Object.values(chats)
            .filter(c => c._customType === 'channel')
            .reduce((acc, c) => acc + (c.unread_count || 0), 0);
    }, [chats]);

    // Persist folder selection
    const handleSelectFolder = useCallback((folderId) => {
        const id = String(folderId);
        setSelectedFolder(id);
        setTrendFilter(''); // clear filter when folder changes
        try { localStorage.setItem('tg_selected_folder', id); } catch { }
    }, []);

    // Фильтрация ленты:
    const filteredGroupedFeed = useMemo(() => {
        return groups.filter(group => {
            const mainMsg = group.mainPost;
            if (!mainMsg) return false;
            if (blacklist.includes(mainMsg.chat_id.toString())) return false;

            const key = buildPostKey(mainMsg.chat_id, mainMsg.id);
            if (selectedFolder === 'all' && !trendFilter && hiddenPosts.has(key)) return false;

            if (mainMsg.media_album_id && mainMsg.media_album_id !== "0") {
                const albumKey = `album_${mainMsg.chat_id}_${mainMsg.media_album_id}`;
                if (selectedFolder === 'all' && !trendFilter && hiddenPosts.has(albumKey)) return false;
            }

            // Авто-хайд для новостей со шлак-словами
            const hasJunk = hiddenWords.some(hw => {
               return group.posts.some(p => {
                    const txt = (p.content?.text?.text || p.content?.caption?.text || "").toLowerCase();
                    return txt.includes(hw.toLowerCase());
               });
            });
            if (hasJunk) return false;
            return true;
        });
    }, [groups, blacklist, selectedFolder, hiddenPosts, hiddenWords, trendFilter]);


    const trendingWords = useMemo(() => {
        const stems = {};
        const reprs = {};
        const stop = new Set([
            'что', 'как', 'это', 'так', 'или', 'если', 'они', 'его', 'ему', 'этом', 'этого', 'чтобы', 'все', 
            'было', 'была', 'были', 'меня', 'тебя', 'себя', 'подпишись', 'канал', 'когда', 'только', 'есть', 
            'еще', 'уже', 'даже', 'нет', 'мне', 'вас', 'нас', 'чем', 'там', 'просто', 'можно', 'будет', 'будут',
            'потом', 'очень', 'здесь', 'сейчас', 'этих', 'эти', 'эту', 'этой', 'после', 'потому', 'поэтому',
            'свой', 'свои', 'какой', 'какие', 'какая', 'через', 'более', 'менее', 'всегда', 'тогда', 'ничего',
            'никого', 'нужно', 'надо', 'сегодня', 'вчера', 'завтра', 'может', 'могут', 'без', 'кто', 'где',
            'почему', 'зачем', 'сразу', 'совсем', 'ведь', 'раз', 'кто-то', 'что-то', 'также', 'того', 'тоже',
            'кажется', 'вообще', 'тот', 'всю', 'всей', 'всем', 'всё', 'быть', 'важно', 'значит', 'хотя', 'кроме',
            'среди', 'между', 'перед', 'один', 'одна', 'одно', 'одни', 'самом', 'дел', 'деле', 'нам', 'ним', 
            'ней', 'них', 'своих', 'собой', 'каждого', 'каждому', 'всех', 'каждый', 'эта', 'этими', 'этим', 'весь',
            'the', 'and', 'for', 'that', 'this', 'with', 'from', 'have', 'are', 'not', 'but', 'can', 'will',
            'для', 'который', 'которые', 'которая', 'которого', 'котором', 'которых', 'работе', 'работа', 'работы',
            'задача', 'задачи', 'задач', 'задачу', 'code', 'новый', 'новые', 'новая', 'новых', 'новому',
            'https', 'http', 'www', 'com', 'org', 'ru', 'данные', 'данных', 'данным', 'под', 'над', 'такой',
            'такие', 'такая', 'такого', 'опыте', 'опыт', 'опыта', 'пользователей', 'пользователь', 'пользователя',
            'время', 'времени', 'про', 'наш', 'наши', 'наша', 'наших', 'сделать', 'сделал', 'сделали', 'чтоб',
            'день', 'дней', 'дня', 'пока', 'лишь', 'что-то', 'никто', 'какое', 'какую', 'другие', 'другой',
            'сделать', 'сделано', 'часть', 'части', 'статьи', 'статья', 'пост', 'этом', 'этих',
            'вот', 'сами', 'интересно', 'неделю', 'человек', 'люди', 'кода', 'токенов', 'кстати', 'более',
            'быстрее', 'сессию', 'самое', 'ответ', 'человека', 'теперь', 'реально', 'вместо', 'лучше', 'конечно',
            'хорошо', 'снова', 'давно', 'всего', 'назад', 'вместе', 'почти', 'однако', 'около', 'через',
            'основном', 'каком', 'каких', 'какими', 'особенно', 'часто', 'обычно', 'только', 'также', 'свое'
        ]);

        const stopStems = new Set([
            'дл', 'котор', 'задач', 'работ', 'code', 'нов', 'https', 'http', 'com', 'org', 'данн', 'под', 
            'так', 'опыт', 'пользовател', 'част', 'стать', 'мног', 'сдел', 'могл', 'будет', 'будут', 'хотя',
            'человек', 'модел', 'недел', 'команд', 'сесси'
        ]);

        trendingTexts.forEach(t => {
            const txt = t.toLowerCase();
            const words = txt.match(/[а-яёa-z][а-яёa-z0-9-]{2,}/gi) || [];
            words.forEach(w => {
                 if (stop.has(w) || w.length < 3) return;

                 let rvIdx = w.search(/[аеиоуыэюяё]/);
                 let stem = w;
                 if (rvIdx !== -1 && rvIdx < w.length - 1) {
                     rvIdx++;
                     let pref = w.slice(0, rvIdx);
                     let rv = w.slice(rvIdx);
                     rv = rv.replace(/(ее|ие|ые|ое|ими|ыми|ей|ий|ый|ой|ем|им|ым|ом|его|ого|ему|ому|их|ых|ую|юю|ая|яя|ою|ею)$/, '');
                     rv = rv.replace(/(иями|ями|ами|ие|ию|ия|иям|иях|ой|ий|й|и|ы|ь|а|е|о|у|я|ям|ях|ом|ем)$/, '');
                     stem = pref + rv;
                 }

                 if (stopStems.has(stem)) return;
                 
                 stems[stem] = (stems[stem] || 0) + 1;
                 if (!reprs[stem]) reprs[stem] = {};
                 reprs[stem][w] = (reprs[stem][w] || 0) + 1;
            });
        });

        const allTrends = Object.entries(stems).map(([stem, count]) => {
             const rList = Object.entries(reprs[stem]);
             rList.sort((a, b) => b[1] - a[1]);
             return { word: rList[0][0], count, stem }; 
        }).filter(item => item.count > 1).sort((a, b) => b.count - a.count);

        return allTrends.slice(0, 30).map(i => [i.word, i.count]);
    }, [trendingTexts]);

    const handleTrendClick = useCallback((word) => {
        usePostActionsStore.getState().addHiddenWord(word);
    }, []);

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
        <div style={{ display: 'flex', width: '100%', height: '100vh', overflow: 'hidden' }}>
            {/* Left Panel - Trending Words */}
            <div style={{ width: '250px', background: 'var(--bg-secondary)', borderRight: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', height: '100%' }}>

                <div style={{ padding: '20px 20px 12px 20px' }}>
                    <button
                        onClick={() => handleSelectFolder('all')}
                        style={{
                            width: '100%',
                            padding: '12px',
                            background: selectedFolder === 'all' ? '#4287f5' : 'var(--bg-primary)',
                            color: selectedFolder === 'all' ? '#fff' : 'var(--text-main)',
                            border: '1px solid var(--border-color)',
                            borderRadius: '8px',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            fontSize: '15px',
                            transition: 'all 0.2s',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '8px'
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                               <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
                            </svg>
                            Новые новости
                        </div>
                        {totalUnreadCount > 0 && (
                            <div style={{ background: '#ff4757', color: 'white', borderRadius: '10px', padding: '1px 6px', fontSize: '11px', fontWeight: 'bold' }}>
                                {totalUnreadCount > 999 ? '999+' : totalUnreadCount}
                            </div>
                        )}
                    </button>
                </div>

                {channelFolders.length > 0 && (
                    <div style={{ padding: '0 20px 12px 20px' }}>
                        <select
                            value={selectedFolder}
                            onChange={(e) => handleSelectFolder(e.target.value)}
                            style={{ 
                                width: '100%', 
                                padding: '10px 12px', 
                                background: 'var(--bg-primary)', 
                                color: 'var(--text-main)', 
                                border: '1px solid var(--border-color)', 
                                borderRadius: '8px', 
                                outline: 'none',
                                fontSize: '14px',
                                cursor: 'pointer',
                                appearance: 'auto'
                            }}
                        >
                            <option value="all">Все папки</option>
                            {channelFolders.map((f) => (
                                <option key={f.id} value={String(f.id)}>
                                    {f.title}
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', padding: '0 20px 20px' }}>
                    

                    {/* Топ 30 Динамика */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '12px' }}>
                        <div style={{ fontSize: '15px', fontWeight: 'bold' }}>Trends</div>
                        <div style={{ display: 'flex', gap: '4px' }}>
                             {[1, 3, 7].map(d => (
                                 <button
                                     key={d}
                                     onClick={() => setTrendPeriod(d)}
                                     style={{
                                         background: trendPeriod === d ? '#4287f5' : 'rgba(255,255,255,0.05)',
                                         color: trendPeriod === d ? '#fff' : 'var(--text-muted)',
                                         border: 'none',
                                         borderRadius: '4px',
                                         fontSize: '11px',
                                         padding: '4px 6px',
                                         cursor: 'pointer',
                                         fontWeight: 'bold',
                                         transition: '0.2s'
                                     }}
                                 >{d}d</button>
                             ))}
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {trendingWords.slice(0, 30).map(([w, c]) => (
                            <div key={w} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px', background: 'rgba(255,255,255,0.02)', borderRadius: '6px' }}>
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'baseline' }}>
                                    <span 
                                        style={{ color: trendFilter === w ? '#4287f5' : 'var(--text-main)', fontSize: '14px', fontWeight: '500', cursor: 'pointer', transition: '0.2s' }}
                                        onClick={() => setTrendFilter(trendFilter === w ? '' : w)}
                                    >#{w}</span>
                                    <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{c}</span>
                                </div>
                                <div style={{ display: 'flex', gap: '4px' }}>
                                    <button
                                        onClick={() => addHiddenWord(w)}
                                        style={{ background: 'none', border: 'none', color: '#ff4757', cursor: 'pointer', padding: '4px', opacity: 0.8 }}
                                        title="В чёрный список"
                                    >
                                        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                                            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        ))}
                        {trendingWords.length === 0 && (
                            <div style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center', padding: '20px' }}>Нет трендов</div>
                        )}
                    </div>
                </div>
            </div>

            {/* Main Feed */}
            <div className="page channels-page" style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>

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
