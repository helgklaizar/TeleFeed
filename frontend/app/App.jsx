import { useState, useEffect, useCallback, Suspense, lazy } from 'react';
import { HashRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { openUrl } from '@tauri-apps/plugin-opener';
import { invoke } from '@tauri-apps/api/core';
import './App.css';
import { t } from './i18n';

import { useAuthStore } from '../stores/authStore';
import { useUiStore } from '../stores/uiStore';
import { useTdlibListener } from '../shared/hooks/useTdlibListener';
import { MediaFile } from '../features/media/components/MediaFile';
import { ProfileAvatar } from '../shared/ui/ProfileAvatar';
import { ErrorBoundary } from '../shared/ui/ErrorBoundary';
import { ToastContainer } from '../shared/ui/Toast';
import { ConnectionStatus } from '../shared/ui/ConnectionStatus';
import { ContactPickerModal } from '../shared/ui/ContactPickerModal';
import { StartupLoader } from '../shared/ui/StartupLoader';
import { showToast } from '../stores/toastStore';

import { AuthPage } from '../pages/AuthPage';

// Lazy-loaded pages (code splitting)
const ChannelsPage = lazy(() => import('../pages/ChannelsPage').then(m => ({ default: m.ChannelsPage })));
const MessagesPage = lazy(() => import('../pages/MessagesPage').then(m => ({ default: m.MessagesPage })));
const ChatViewPage = lazy(() => import('../pages/ChatViewPage').then(m => ({ default: m.ChatViewPage })));
const MenuPage = lazy(() => import('../pages/MenuPage').then(m => ({ default: m.MenuPage })));
const AiChatPage = lazy(() => import('../pages/AiChatPage').then(m => ({ default: m.AiChatPage })));
const ChannelListPage = lazy(() => import('../pages/ChannelListPage').then(m => ({ default: m.ChannelListPage })));

const InstructionsPage = lazy(() => import('../pages/InstructionsPage').then(m => ({ default: m.InstructionsPage })));
const HiddenChatsPage = lazy(() => import('../pages/HiddenChatsPage').then(m => ({ default: m.HiddenChatsPage })));

/**
 * Модальный (фуллскрин) вьювер медиа. mediaModal: { fileId, type } | { items, currentIndex }
 */
function MediaModal({ mediaModal, setMediaModal }) {
  if (!mediaModal) return null;
  const hasItems = mediaModal.items && mediaModal.items.length > 1;
  const currentItem = mediaModal.items
    ? mediaModal.items[mediaModal.currentIndex]
    : mediaModal;
  const onClose = () => setMediaModal(null);
  const navigate = (delta) =>
    setMediaModal((p) => ({ ...p, currentIndex: p.currentIndex + delta }));
  return (
    <div className="media-modal-overlay" onClick={onClose}>
      <button className="media-modal-close" onClick={onClose}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
        </svg>
      </button>
      {hasItems && mediaModal.currentIndex > 0 && (
        <button
          className="icon-button media-modal-nav media-modal-nav--prev"
          onClick={(e) => { e.stopPropagation(); navigate(-1); }}
        >
          <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
            <path d="M15.41 16.59L10.83 12l4.58-4.59L14 6l-6 6 6 6 1.41-1.41z" />
          </svg>
        </button>
      )}
      <div className="media-modal-body" onClick={(e) => e.stopPropagation()}>
        <MediaFile
          fileId={currentItem.fileId}
          initialFile={currentItem.initialFile}
          type={currentItem.type}
          style={{ maxWidth: '100%', maxHeight: '90vh', borderRadius: '8px', objectFit: 'contain' }}
        />
      </div>
      {hasItems && mediaModal.currentIndex < mediaModal.items.length - 1 && (
        <button
          className="icon-button media-modal-nav media-modal-nav--next"
          onClick={(e) => { e.stopPropagation(); navigate(+1); }}
        >
          <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z" />
          </svg>
        </button>
      )}
    </div>
  );
}

function AppShell() {
  const authState = useAuthStore((s) => s.state);
  const navigate = useNavigate();
  const location = useLocation();
  const [showArchive, setShowArchive] = useState(false);
  const [mediaModal, setMediaModal] = useState(null);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);



  const triggerMarkAllAsRead = useUiStore((s) => s.triggerMarkAllAsRead);
  const profile = useUiStore((s) => s.profile);
  const flashEye = useUiStore((s) => s.flashEye);
  const flashHeart = useUiStore((s) => s.flashHeart);
  const toggleFolderBar = useUiStore((s) => s.toggleFolderBar);



  const [showContactPicker, setShowContactPicker] = useState(false);

  // Current path info
  const path = location.pathname;
  const isChannels = path === '/' || path.startsWith('/channels');
  const isFeed = path === '/feed';
  const isMessages = path.startsWith('/messages');
  const isAiChat = path.startsWith('/ai');
  const isInChat = !!path.match(/\/messages\/\-?\d/);

  let headerTitle = 'Каналы';
  if (isMessages) headerTitle = t('messagesTitle');
  if (isAiChat) headerTitle = t('aiAgent');



  // Init TDLib
  // Init TDLib is now handled by AuthPage with runtime API credentials

  // Listen to TDLib events
  useTdlibListener();

  // Check for local builder updates periodically
  useEffect(() => {
    const checkUpdate = async () => {
      try {
        const hasUpdate = await invoke('check_local_update');
        setUpdateAvailable(hasUpdate);
      } catch {
        // Silently ignore if not in tauri
      }
    };
    checkUpdate();
    const interval = setInterval(checkUpdate, 30000); // Check every 30s
    return () => clearInterval(interval);
  }, []);

  // Check for successful local update
  useEffect(() => {
    if (localStorage.getItem('tgfeed_awaiting_update') === 'true') {
      localStorage.removeItem('tgfeed_awaiting_update');
      // Timeout is needed so toast appears right after UI draws
      setTimeout(() => {
        showToast('Апдейт прошел удачно!', { type: 'success', duration: 3000 });
      }, 500);
    }
  }, []);

  // Global handler: open external links in system browser (Tauri webview doesn't handle target="_blank")
  useEffect(() => {
    const handleLinkClick = (e) => {
      try {
        const target = e.target.nodeType === 3 ? e.target.parentNode : e.target;
        if (!target || !target.closest) return;
        const anchor = target.closest('a[href]');
        if (!anchor) return;
        const href = anchor.getAttribute('href');
        if (href && /^https?:\/\//i.test(href)) {
          e.preventDefault();
          e.stopPropagation();
          openUrl(href).catch(() => { });
        }
      } catch (err) {
        console.error('Link click error:', err);
      }
    };
    document.addEventListener('click', handleLinkClick, true);
    return () => document.removeEventListener('click', handleLinkClick, true);
  }, []);

  // Keyboard shortcuts (zoom + nav + esc)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.metaKey || e.ctrlKey) {

        if (e.key === '1') { e.preventDefault(); navigate('/channels'); }
        if (e.key === '2') { e.preventDefault(); navigate('/messages'); }
        if (e.key === '3') { e.preventDefault(); navigate('/ai'); }
      }
      if (e.key === 'Escape') {
        if (mediaModal) setMediaModal(null);
        else if (isInChat) navigate(-1);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isInChat, navigate, mediaModal]);

  // Expose setMediaModal globally for children
  const handleMediaModal = useCallback((data) => setMediaModal(data), []);

  // Auth gate
  if (authState !== 'ready') return <AuthPage />;

  return (
    <div className="app-container">
      {/* Startup loading overlay */}
      <StartupLoader />
      {/* TOP BAR */}
      {!isInChat && (
        <div className="top-bar-container">
          <div className="header" style={{ position: 'relative' }}>
            <div className="header-left">
              <button
                className={`header-nav-btn ${isChannels ? 'active' : ''}`}
                onClick={() => {
                  if (isChannels) toggleFolderBar();
                  else navigate('/channels');
                }}
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
            <div
              className="header-title-center"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            >
              <span className="header-title-text">{headerTitle}</span>
              {updateAvailable && (
                <button
                  className="topbar-update-btn"
                  onClick={async (e) => {
                    e.stopPropagation();
                    setIsUpdating(true);
                    try {
                      localStorage.setItem('tgfeed_awaiting_update', 'true');
                      await invoke('apply_local_update');
                    } catch (err) {
                      localStorage.removeItem('tgfeed_awaiting_update');
                      console.error(err);
                      setIsUpdating(false);
                    }
                  }}
                >
                  {isUpdating ? 'Обновляем...' : 'Update'}
                </button>
              )}
            </div>
            {/* Right: toggle + heart + eye + avatar */}
            <div className="header-right">
              {isChannels && (
                <button
                  className={`header-nav-btn`}
                  onClick={() => {
                    if (isChannels) {
                      const currentMode = useUiStore.getState().feedViewMode;
                      useUiStore.getState().setFeedViewMode(currentMode === 'standard' ? 'tiktok' : 'standard');
                    } else {
                      useUiStore.getState().setFeedViewMode('tiktok');
                      navigate('/channels');
                    }
                  }}
                  title={t('toggleFeedDesign')}
                  aria-label={t('toggleFeedDesign')}
                >
                  <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z" /></svg>
                </button>
              )}
              <button
                className="header-nav-btn"
                onClick={() => {
                  if (profile?.userId) {
                    navigate(`/messages/${profile.userId}`);
                  }
                }}
                title={t('favorite')}
                aria-label={t('favorite')}
                data-flash={flashHeart ? 'true' : undefined}
              >
                <svg className="header-flash-icon" viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" /></svg>
              </button>

              {/* New chat button — only on Messages page */}
              {isMessages && !isInChat && (
                <button
                  className="header-nav-btn"
                  onClick={() => {
                    invoke('get_contacts').catch(() => { });
                    setShowContactPicker(true);
                  }}
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
                  triggerFlashEye();
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
        </div>
      )}

      {/* Contact Picker Modal */}
      {showContactPicker && (
        <ContactPickerModal
          onClose={() => setShowContactPicker(false)}
          onSelect={(userId) => {
            setShowContactPicker(false);
            invoke('create_private_chat', { userId })
              .then(() => { navigate(`/messages/${userId}`); })
              .catch(() => { });
          }}
        />
      )}

      {/* CONTENT */}
      <div className="app-content">
        <ErrorBoundary>
          <Suspense fallback={<div className="suspense-fallback"><div className="media-spinner" /></div>}>
            <Routes>
              <Route path="/" element={<ChannelsPage setMediaModal={handleMediaModal} />} />
              <Route path="/channels" element={<ChannelsPage setMediaModal={handleMediaModal} />} />
              <Route path="/messages" element={<MessagesPage />} />
              <Route path="/messages/:chatId" element={<ChatViewPage />} />
              <Route path="/menu" element={<MenuPage />} />
              <Route path="/settings/channels" element={<ChannelListPage />} />
              <Route path="/settings/instructions" element={<InstructionsPage />} />
              <Route path="/settings/hidden" element={<HiddenChatsPage />} />
              <Route path="/ai" element={<AiChatPage />} />
            </Routes>
          </Suspense>
        </ErrorBoundary>
      </div>

      {/* MEDIA MODAL */}
      <MediaModal mediaModal={mediaModal} setMediaModal={setMediaModal} />

      {/* Toast notifications */}
      <ToastContainer />
      {/* Connection status */}
      <ConnectionStatus />

    </div>
  );
}

export default function App() {
  return (
    <HashRouter>
      <AppShell />
    </HashRouter>
  );
}
