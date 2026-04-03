import { useState, useEffect, useMemo, useCallback } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUiStore } from '../stores/uiStore';
import { useFeedStore } from '../features/feed/stores/feedStore';
import { useChatStore } from '../features/chat/stores/chatStore';
import { ipcCheckLocalUpdate, ipcApplyLocalUpdate } from '../shared/ipc/index';
import { showToast } from '../stores/toastStore';
import { t } from './i18n';

/**
 * AppHeader — шапка приложения (навигация, кнопки действий, аватар).
 * Вынесен из AppShell для разделения ответственности.
 */
export function AppHeader() {
    const navigate = useNavigate();
    const location = useLocation();

    const [updateAvailable, setUpdateAvailable] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);

    const { triggerMarkAllAsRead, flashEye, feedMode, setFeedMode } = useUiStore(useShallow((s) => ({
        triggerMarkAllAsRead: s.triggerMarkAllAsRead,
        flashEye: s.flashEye,
        feedMode: s.feedMode,
        setFeedMode: s.setFeedMode
    })));

    const path = location.pathname;
    const isChannels = path === '/' || path.startsWith('/channels');

    const { folders, chats } = useChatStore(useShallow((s) => ({
        folders: s.folders,
        chats: s.chats
    })));
    
    const { currentFolder, loadInitial } = useFeedStore(useShallow((s) => ({
        currentFolder: s.currentFolder,
        loadInitial: s.loadInitial
    })));

    const channelFolders = useMemo(() => {
        return folders.filter((f) => {
            if (!f.included_chat_ids?.length) return false;
            return f.included_chat_ids.some((id) => {
                const chat = chats[id];
                return chat && chat._customType === 'channel';
            });
        });
    }, [folders, chats]);

    const handleSelectFolder = useCallback((folderId) => {
        const id = String(folderId);
        setFeedMode('feed');
        loadInitial(id);
        try { localStorage.setItem('tg_selected_folder', id); } catch { }
    }, [loadInitial, setFeedMode]);

    // Проверка обновлений каждые 30s
    useEffect(() => {
        const check = () => ipcCheckLocalUpdate()
            .then(setUpdateAvailable)
            .catch(() => { });
        check();
        const interval = setInterval(check, 30000);
        return () => clearInterval(interval);
    }, []);

    // Toast после успешного апдейта
    useEffect(() => {
        if (localStorage.getItem('tgfeed_awaiting_update') === 'true') {
            localStorage.removeItem('tgfeed_awaiting_update');
            setTimeout(() => showToast('Апдейт прошел удачно!', { type: 'success', duration: 3000 }), 500);
        }
    }, []);

    const handleApplyUpdate = async (e) => {
        e.stopPropagation();
        setIsUpdating(true);
        try {
            localStorage.setItem('tgfeed_awaiting_update', 'true');
            await ipcApplyLocalUpdate();
        } catch (err) {
            localStorage.removeItem('tgfeed_awaiting_update');
            console.error(err);
            setIsUpdating(false);
        }
    };


    return (
        <div className="top-bar-container">
            <div className="header" style={{ position: 'relative' }}>
                <div className="header-left" style={{ overflowX: 'auto', display: 'flex', flex: 1, paddingBottom: 0 }}>
                    {isChannels ? (
                        channelFolders.length > 0 ? (
                            <div style={{ display: 'flex', gap: '8px', paddingRight: '12px' }}>
                                <button
                                    className={`filter-chip ${currentFolder === 'all' && feedMode === 'feed' ? 'active' : ''}`}
                                    onClick={() => handleSelectFolder('all')}
                                >
                                    {t('all')}
                                </button>
                                {channelFolders.map((f) => (
                                    <button
                                        key={f.id}
                                        className={`filter-chip ${currentFolder === String(f.id) && feedMode === 'feed' ? 'active' : ''}`}
                                        onClick={() => handleSelectFolder(f.id)}
                                    >
                                        {f.title}
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <span className="header-title-text">{t('channelsLabel')}</span>
                        )
                    ) : (
                        <button
                            className="header-nav-btn"
                            onClick={() => navigate('/channels')}
                            title="Назад"
                            style={{ display: 'flex', alignItems: 'center', gap: '4px', paddingLeft: 0, background: 'transparent', border: 'none', color: 'var(--text-muted)' }}
                        >
                            <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24"><path d="M15.41 16.59L10.83 12l4.58-4.59L14 6l-6 6 6 6 1.41-1.41z" /></svg>
                            <span style={{ fontSize: '15px' }}>Назад</span>
                        </button>
                    )}
                </div>

                {/* Center: update button if any */}
                <div className="header-title-center">
                    {updateAvailable && (
                        <button className="topbar-update-btn" onClick={handleApplyUpdate}>
                            {isUpdating ? 'Обновляем...' : 'Update'}
                        </button>
                    )}
                </div>

                <div className="header-right">
                    <button
                        className="header-nav-btn"
                        onClick={() => useUiStore.getState().decreaseTextScale()}
                        title="Уменьшить шрифт"
                        style={{ fontSize: '18px', fontWeight: 'bold' }}
                    >
                        -
                    </button>
                    <button
                        className="header-nav-btn"
                        onClick={() => useUiStore.getState().increaseTextScale()}
                        title="Увеличить шрифт"
                        style={{ fontSize: '18px', fontWeight: 'bold' }}
                    >
                        +
                    </button>

                    <button
                        className={`header-nav-btn ${feedMode === 'saved' ? 'active' : ''}`}
                        style={{ color: feedMode === 'saved' ? 'var(--accent)' : 'inherit' }}
                        onClick={() => {
                            if (feedMode === 'saved') {
                                setFeedMode('feed');
                            } else {
                                setFeedMode('saved');
                                useUiStore.getState().triggerFlashHeart();
                            }
                        }}
                        title="Избранное"
                        data-flash={useUiStore.getState().flashHeart ? 'true' : undefined}
                    >
                        <svg className="header-flash-icon" viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
                            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                        </svg>
                    </button>

                    <button
                        className="header-nav-btn"
                        onClick={() => {
                            triggerMarkAllAsRead('channel');
                            useUiStore.getState().triggerFlashEye();
                        }}
                        title={t('markAllAsRead')}
                        data-flash={flashEye ? 'true' : undefined}
                    >
                        <svg className="header-flash-icon" viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
                            <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
}
