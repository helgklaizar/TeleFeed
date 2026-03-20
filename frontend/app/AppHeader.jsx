import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUiStore } from '../stores/uiStore';
import { ProfileAvatar } from '../shared/ui/ProfileAvatar';
import { ContactPickerModal } from '../shared/ui/ContactPickerModal';
import { ipcGetContacts, ipcCreatePrivateChat, ipcCheckLocalUpdate, ipcApplyLocalUpdate } from '../shared/ipc/index';
import { showToast } from '../stores/toastStore';
import { t } from './i18n';
import { useEffect } from 'react';

/**
 * AppHeader — шапка приложения (навигация, кнопки действий, аватар).
 * Вынесен из AppShell для разделения ответственности.
 */
export function AppHeader() {
    const navigate = useNavigate();
    const location = useLocation();
    const [showContactPicker, setShowContactPicker] = useState(false);
    const [updateAvailable, setUpdateAvailable] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);

    const triggerMarkAllAsRead = useUiStore((s) => s.triggerMarkAllAsRead);
    const flashEye = useUiStore((s) => s.flashEye);
    const flashHeart = useUiStore((s) => s.flashHeart);
    const profile = useUiStore((s) => s.profile);
    const feedViewMode = useUiStore((s) => s.feedViewMode);
    const toggleFolderBar = useUiStore((s) => s.toggleFolderBar);

    const path = location.pathname;
    const isChannels = path === '/' || path.startsWith('/channels');
    const isMessages = path.startsWith('/messages');
    const isAiChat = path.startsWith('/ai');
    const isInChat = !!path.match(/\/messages\/\-?\d/);

    let headerTitle = t('channelsLabel');
    if (isMessages) headerTitle = t('messagesTitle');
    if (isAiChat) headerTitle = t('aiAgent');

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

    if (isInChat) return null;

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

    const handleNewChat = () => {
        ipcGetContacts().catch(() => { });
        setShowContactPicker(true);
    };

    const handleSelectContact = (userId) => {
        setShowContactPicker(false);
        ipcCreatePrivateChat(userId)
            .then(() => navigate(`/messages/${userId}`))
            .catch(() => { });
    };

    const handleToggleFeedMode = () => {
        const currentMode = useUiStore.getState().feedViewMode;
        useUiStore.getState().setFeedViewMode(currentMode === 'standard' ? 'tiktok' : 'standard');
    };

    return (
        <div className="top-bar-container">
            <div className="header" style={{ position: 'relative' }}>
                {/* Left: navigation */}
                <div className="header-left">
                    <button
                        className={`header-nav-btn ${isChannels ? 'active' : ''}`}
                        onClick={() => isChannels ? toggleFolderBar() : navigate('/channels')}
                        title={t('channelsLabel')}
                        aria-label={t('channelsLabel')}
                        style={{ width: 'auto', fontSize: '14px', padding: '6px 16px', border: isChannels ? '1px solid #4287f5' : '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', background: isChannels ? 'rgba(66, 135, 245, 0.1)' : 'transparent', color: isChannels ? '#fff' : 'var(--text-muted)' }}
                    >
                        {t('channelsLabel')}
                    </button>
                    <button
                        className={`header-nav-btn ${isMessages ? 'active' : ''}`}
                        onClick={() => navigate('/messages')}
                        title={t('privateLabel')}
                        aria-label={t('privateLabel')}
                        style={{ marginLeft: '6px', width: 'auto', fontSize: '14px', padding: '6px 16px', border: isMessages ? '1px solid #4287f5' : '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', background: isMessages ? 'rgba(66, 135, 245, 0.1)' : 'transparent', color: isMessages ? '#fff' : 'var(--text-muted)' }}
                    >
                        {t('privateLabel')}
                    </button>
                </div>

                {/* Center: title + update button */}
                <div className="header-title-center" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                    <span className="header-title-text">{headerTitle}</span>
                    {updateAvailable && (
                        <button className="topbar-update-btn" onClick={handleApplyUpdate}>
                            {isUpdating ? 'Обновляем...' : 'Update'}
                        </button>
                    )}
                </div>

                {/* Right: actions + avatar */}
                <div className="header-right">
                    {isChannels && (
                        <button
                            className="header-nav-btn"
                            onClick={handleToggleFeedMode}
                            title={t('toggleFeedDesign')}
                            aria-label={t('toggleFeedDesign')}
                        >
                            {feedViewMode === 'tiktok' ? (
                                <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z" /></svg>
                            ) : (
                                <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14z" /></svg>
                            )}
                        </button>
                    )}

                    <button
                        className="header-nav-btn"
                        onClick={() => profile?.userId && navigate(`/messages/${profile.userId}`)}
                        title={t('favorite')}
                        aria-label={t('favorite')}
                        data-flash={flashHeart ? 'true' : undefined}
                    >
                        <svg className="header-flash-icon" viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" /></svg>
                    </button>

                    {isMessages && (
                        <button
                            className="header-nav-btn"
                            onClick={handleNewChat}
                            title="Новый чат"
                            aria-label="Новый чат"
                        >
                            <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M19 3H5c-1.1 0-2 .9-2 2v14l4-4h12c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-2 10H7v-2h10v2zm0-3H7V8h10v2z" /></svg>
                        </button>
                    )}

                    <button
                        className="header-nav-btn"
                        onClick={() => {
                            const type = isMessages ? 'messages' : 'channel';
                            triggerMarkAllAsRead(type);
                            useUiStore.getState().triggerFlashEye();
                        }}
                        title={t('markAllAsRead')}
                        data-flash={flashEye ? 'true' : undefined}
                    >
                        <svg className="header-flash-icon" viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
                            <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
                        </svg>
                    </button>

                    <button
                        className="header-avatar-btn"
                        onClick={() => navigate('/menu')}
                        title={t('settings')}
                    >
                        <ProfileAvatar size={30} />
                    </button>
                </div>
            </div>

            {showContactPicker && (
                <ContactPickerModal
                    onClose={() => setShowContactPicker(false)}
                    onSelect={handleSelectContact}
                />
            )}
        </div>
    );
}
