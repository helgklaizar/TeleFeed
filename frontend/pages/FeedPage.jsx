import { useState, useRef, useEffect, useLayoutEffect, memo, useMemo } from 'react';
import { useFeedStore } from '../features/feed/stores/feedStore';
import { useUiStore } from '../stores/uiStore';
import { useFeedActions } from '../features/feed/hooks/useFeedActions';
import { getTextFromContent, formatDatePrefix, buildPostKey } from '../shared/utils/helpers';
import { ExpandableText } from '../shared/ui/ExpandableText';
import { MediaFile } from '../features/media/components/MediaFile';
import { openUrl } from '@tauri-apps/plugin-opener';
import { t } from '../app/i18n';
import './FeedPage.css';

// Помощник для поиска медиа в посте
function getPostMedia(post) {
  if (!post?.content) return null;
  const c = post.content;
  const t = c['@type'];

  if (t === 'messagePhoto' && c.photo?.sizes?.length) {
    const best = c.photo.sizes[c.photo.sizes.length - 1];
    return { fileId: best.photo.id, initialFile: best.photo, type: 'image' };
  }
  if (t === 'messageVideo' && c.video?.video) {
    return { fileId: c.video.video.id, initialFile: c.video.video, type: 'video' };
  }
  if (t === 'messageAnimation' && c.animation?.animation) {
    return { fileId: c.animation.animation.id, initialFile: c.animation.animation, type: 'animation' };
  }
  return null;
}

const FeedItem = memo(({ group, index, isActive, textScale, animDir }) => {
  const mPost = group.mainPost;

  // Collect all media from the group instead of just the mainPost
  const mediaList = useMemo(() => {
    return group.posts.map(p => getPostMedia(p)).filter(Boolean);
  }, [group.posts]);

  // Find the post with text (usually only one post in an album has the caption)
  const postWithText = useMemo(() => {
    return group.posts.find(p => getTextFromContent(p.content)) || mPost;
  }, [group.posts, mPost]);

  const [currentSlide, setCurrentSlide] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Collapse when jumping away from this slide (if not active anymore)
  useEffect(() => {
    if (!isActive) setIsExpanded(false);
  }, [isActive]);

  const hasMultipleMedia = mediaList.length > 1;
  const activeMedia = mediaList[currentSlide] || mediaList[0];

  const channel = group.channel;
  const title = channel?.title || 'Channel';
  const date = formatDatePrefix(postWithText.date || mPost.date) || '';
  
  const text = getTextFromContent(postWithText.content) || '';
  const entities = postWithText.content?.text?.entities || postWithText.content?.caption?.entities || [];

  // URL для открытия канала
  const channelUsername = channel?.username
    || channel?.usernames?.find(u => u.is_active)?.username
    || channel?.usernames?.[0]?.username;
  
  const realMsgId = mPost?.id ? Math.floor(Number(mPost.id) / 1048576) : 0;
  
  const postUrl = channelUsername && realMsgId 
    ? `https://t.me/${channelUsername}/${realMsgId}`
    : `https://t.me/c/${String(mPost?.chat_id).replace('-100', '')}/${realMsgId}`;

  return (
    <div className="feed-card-wrapper" data-index={index}>
      <div className={`feed-card ${animDir ? `slide-out-${animDir}` : ''}`}>

        {/* Заголовок + дата — вверху с bg */}
        <div className="feed-card-header">
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px' }}>
            <h1
              className="feed-title"
              style={{ cursor: 'pointer', fontSize: `${1.4 * textScale}rem`, margin: 0, flex: 1 }}
              onClick={() => openUrl(postUrl).catch(() => {})}
              title={t('openPostInTelegram')}
            >
              {title}
            </h1>
            {hasMultipleMedia && (
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexShrink: 0, marginTop: '2px' }}>
                <button
                  className="feed-slider-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentSlide(prev => (prev > 0 ? prev - 1 : mediaList.length - 1));
                  }}
                  title="Previous media"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
                </button>
                <span style={{ fontSize: '0.9rem', color: '#cbd5e1', fontVariantNumeric: 'tabular-nums' }}>
                  {currentSlide + 1} / {mediaList.length}
                </span>
                <button
                  className="feed-slider-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentSlide(prev => (prev < mediaList.length - 1 ? prev + 1 : 0));
                  }}
                  title="Next media"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                </button>
              </div>
            )}
          </div>
          <span className="feed-date">{date}</span>
        </div>

        {/* Область медиа и контента поверх него */}
        <div className="feed-card-body">
          {/* Медиа фон */}
          <div className="feed-bg-preview">
            {activeMedia ? (
              <MediaFile
                key={activeMedia.fileId} // Принудительный ререндер компонента медиа при смене слайда
                fileId={activeMedia.fileId}
                initialFile={activeMedia.initialFile}
                type={activeMedia.type}
              />
            ) : (
              <div style={{ width: '100%', height: '100%', background: '#0c1218' }} />
            )}
          </div>

          {/* Текст поверх медиа (внизу) */}
          <div className="feed-card-overlay">
            <div className={`feed-card-flex-spacer ${isExpanded ? 'hidden' : ''}`} />
            {text && (
              <div className={`feed-ai-summary ${isExpanded ? 'expanded' : ''}`}>
                <ExpandableText
                  text={text}
                  entities={entities}
                  style={{ fontSize: `${1.05 * textScale}rem`, lineHeight: 1.5, color: '#f1f5f9' }}
                  onToggle={setIsExpanded}
                />
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
});

export function FeedPage({ feedItems }) {
  const { isLoading, loadMore } = useFeedStore();
  const textScale = useUiStore((s) => s.textScale);
  const { handleMarkAsRead, handleToggleFavorite, favoritePosts } = useFeedActions();

  const [activeIndex, setActiveIndex] = useState(0);
  const [animOut, setAnimOut] = useState(null); // { id: '...', dir: 'left' | 'right' }
  const containerRef = useRef(null);
  const prevFeedItemsRef = useRef(feedItems);
  const activeKeyRef = useRef(null);

  // Синхронизируем activeKey с текущим постом (на который мы смотрим)
  useEffect(() => {
    const activeGroup = feedItems[activeIndex];
    if (activeGroup) {
        activeKeyRef.current = buildPostKey(activeGroup.mainPost.chat_id, activeGroup.mainPost.id);
    }
  }, [activeIndex, feedItems]);

  // Сохраняем позицию фокуса на текущей карточке при загрузке новых сверху
  useLayoutEffect(() => {
    const prevFeedItems = prevFeedItemsRef.current;
    if (feedItems !== prevFeedItems) {
        if (feedItems.length > 0 && prevFeedItems.length > 0 && containerRef.current && activeKeyRef.current) {
            
            const newIndex = feedItems.findIndex(g => buildPostKey(g.mainPost.chat_id, g.mainPost.id) === activeKeyRef.current);
            const oldIndex = prevFeedItems.findIndex(g => buildPostKey(g.mainPost.chat_id, g.mainPost.id) === activeKeyRef.current);
            
            // Если мы читаем пост, и он съехал (например, загрузили новые), жестко фиксируем его позицию
            if (newIndex !== -1 && oldIndex !== -1 && newIndex !== oldIndex) {
                const container = containerRef.current;
                const originalScrollBehavior = container.style.scrollBehavior;
                container.style.scrollBehavior = 'auto'; // Отключаем плавную анимацию
                
                // Моментально сдвигаем скролл ровно на новую высоту карточки
                container.scrollTop = newIndex * container.clientHeight;
                setActiveIndex(newIndex);
                
                // Возвращаем настройки скролла
                requestAnimationFrame(() => {
                    container.style.scrollBehavior = originalScrollBehavior || '';
                });
            }
        }
        prevFeedItemsRef.current = feedItems;
    }
  }, [feedItems]);

  // Когда feedItems обновляются (например, удалился пост), нужно убедиться что activeIndex не вылетает за границы
  useEffect(() => {
    if (activeIndex >= feedItems.length && feedItems.length > 0) {
        setActiveIndex(Math.max(0, feedItems.length - 1));
    }
  }, [activeIndex, feedItems.length]);

  // Логика скролла и подгрузки
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const index = Number(entry.target.getAttribute('data-index'));
          setActiveIndex(index);

          // Если дошли почти до конца, грузим еще
          if (index >= feedItems.length - 3) {
            loadMore();
          }
        }
      });
    }, {
      threshold: 0.6
    });

    const items = containerRef.current?.querySelectorAll('.feed-card-wrapper');
    items?.forEach(item => observer.observe(item));

    return () => observer.disconnect();
  }, [feedItems.length, loadMore]);

  const scrollToNext = () => {
    if (activeIndex < feedItems.length - 1 && containerRef.current) {
      const nextEl = containerRef.current.children[activeIndex + 1];
      nextEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const scrollToPrev = () => {
    if (activeIndex > 0 && containerRef.current) {
      const prevEl = containerRef.current.children[activeIndex - 1];
      prevEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Выбираем активный пост для правых контролов
  const activeGroup = feedItems[activeIndex] || null;
  const mPost = activeGroup?.mainPost;
  const isFavorite = mPost ? favoritePosts.has(buildPostKey(mPost.chat_id, mPost.id)) : false;

  const onMarkAsRead = async () => {
    if (!mPost || animOut) return;
    const key = buildPostKey(mPost.chat_id, mPost.id);
    setAnimOut({ id: key, dir: 'left' });
    await handleMarkAsRead(mPost.chat_id, [mPost.id]);
    setTimeout(() => setAnimOut(null), 280);
  };

  const onToggleFavorite = async () => {
    if (!mPost || (animOut && !isFavorite)) return;
    const key = buildPostKey(mPost.chat_id, mPost.id);
    if (!isFavorite) setAnimOut({ id: key, dir: 'right' });
    await handleToggleFavorite(mPost.chat_id, [mPost.id]);
    setTimeout(() => setAnimOut(null), 280);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Игнорируем S, если фокус в инпуте или текстареа
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) return;
      if (e.key === 's' || e.key === 'S') {
        e.preventDefault();
        onMarkAsRead();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onMarkAsRead]);

  return (
    <div className="feed-page">

      {/* Контейнер карточек */}
      <div className="feed-snap-container" ref={containerRef}>
        {isLoading && feedItems.length === 0 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', width: '100%' }}>
             <div className="media-spinner" style={{ width: 40, height: 40, border: '3px solid rgba(255,255,255,0.2)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
          </div>
        )}

        {!isLoading && feedItems.length === 0 && (
          <div className="empty-state" style={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <svg viewBox="0 0 24 24" width="64" height="64" fill="currentColor" opacity="0.3">
              <path d="M20 6h-8l-2-2H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2z" />
            </svg>
            <span>{t('noNewPosts')}</span>
          </div>
        )}

        {feedItems.map((group, index) => {
          const key = buildPostKey(group.mainPost.chat_id, group.mainPost.id);
          const animDir = animOut?.id === key ? animOut.dir : null;

          return (
            <FeedItem 
              key={key} 
              group={group} 
              index={index} 
              isActive={index === activeIndex}
              textScale={textScale || 1}
              animDir={animDir}
            />
          );
        })}
      </div>

      {/* Правые контролы */}
      <div className="feed-right-controls">
        {/* Сердечко - в Saved Messages */}
        <button 
          className={`feed-control-btn action-btn icon-heart ${isFavorite ? 'active favorited' : ''}`} 
          title={t('saveToSavedMessages')} 
          onClick={onToggleFavorite}
          style={{ marginBottom: '15px' }}
        >
          <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
          </svg>
        </button>

        <button className="feed-control-btn nav-btn" onClick={scrollToPrev} disabled={activeIndex === 0}>
          <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor"><path d="M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6z"/></svg>
        </button>

        <button className="feed-control-btn nav-btn" onClick={scrollToNext} disabled={activeIndex === feedItems.length - 1}>
          <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor"><path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6z"/></svg>
        </button>

        {/* Глазик - скрыть / прочитано */}
        <button 
          className="feed-control-btn action-btn icon-eye" 
          title={t('markAsReadOrHide')} 
          onClick={onMarkAsRead}
          style={{ marginTop: '15px' }}
        >
          <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
             <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
          </svg>
        </button>
      </div>

    </div>
  );
}
