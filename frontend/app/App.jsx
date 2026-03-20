import { useState, useEffect, useCallback, Suspense, lazy } from 'react';
import { HashRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { openUrl } from '@tauri-apps/plugin-opener';
import './App.css';

import { useAuthStore } from '../stores/authStore';
import { useTdlibListener } from '../shared/hooks/useTdlibListener';
import { MediaFile } from '../features/media/components/MediaFile';
import { ErrorBoundary } from '../shared/ui/ErrorBoundary';
import { ToastContainer } from '../shared/ui/Toast';
import { ConnectionStatus } from '../shared/ui/ConnectionStatus';
import { StartupLoader } from '../shared/ui/StartupLoader';

import { AuthPage } from '../pages/AuthPage';

// Lazy-loaded pages (code splitting)
const ChannelsPage = lazy(() => import('../pages/ChannelsPage').then(m => ({ default: m.ChannelsPage })));
const MessagesPage = lazy(() => import('../pages/MessagesPage').then(m => ({ default: m.MessagesPage })));
const AiChatPage = lazy(() => import('../pages/AiChatPage').then(m => ({ default: m.AiChatPage })));
/** MediaModal — фуллскрин просмотр фото/видео */
function MediaModal({ mediaModal, setMediaModal }) {
    if (!mediaModal) return null;
    const hasItems = mediaModal.items && mediaModal.items.length > 1;
    const currentItem = mediaModal.items ? mediaModal.items[mediaModal.currentIndex] : mediaModal;
    const onClose = () => setMediaModal(null);
    const goTo = (delta) => setMediaModal((p) => ({ ...p, currentIndex: p.currentIndex + delta }));

    return (
        <div className="media-modal-overlay" onClick={onClose}>
            <button className="media-modal-close" onClick={onClose}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                </svg>
            </button>
            {hasItems && mediaModal.currentIndex > 0 && (
                <button className="icon-button media-modal-nav media-modal-nav--prev" onClick={(e) => { e.stopPropagation(); goTo(-1); }}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor"><path d="M15.41 16.59L10.83 12l4.58-4.59L14 6l-6 6 6 6 1.41-1.41z" /></svg>
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
                <button className="icon-button media-modal-nav media-modal-nav--next" onClick={(e) => { e.stopPropagation(); goTo(+1); }}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor"><path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z" /></svg>
                </button>
            )}
        </div>
    );
}

function AppShell() {
    const authState = useAuthStore((s) => s.state);
    const navigate = useNavigate();
    const location = useLocation();
    const [mediaModal, setMediaModal] = useState(null);

    const path = location.pathname;
    const isInChat = !!path.match(/\/messages\/\-?\d/);

    // TDLib events (auth + feed + chat)
    useTdlibListener();

    // Global link interceptor — открываем https-ссылки в системном браузере
    useEffect(() => {
        const handleLinkClick = (e) => {
            try {
                const target = e.target.nodeType === 3 ? e.target.parentNode : e.target;
                if (!target?.closest) return;
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

    // Keyboard shortcuts
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

    const handleMediaModal = useCallback((data) => setMediaModal(data), []);

    if (authState !== 'ready') return <AuthPage />;

    return (
        <div className="app-container">
            <div className="app-content">
                <ErrorBoundary>
                    <Suspense fallback={<div className="suspense-fallback"><div className="media-spinner" /></div>}>
                        <Routes>
                            <Route path="/" element={<ChannelsPage setMediaModal={handleMediaModal} />} />
                            <Route path="/channels" element={<ChannelsPage setMediaModal={handleMediaModal} />} />
                            <Route path="/messages" element={<MessagesPage />} />
                            <Route path="/ai" element={<AiChatPage />} />
                        </Routes>
                    </Suspense>
                </ErrorBoundary>
            </div>

            <MediaModal mediaModal={mediaModal} setMediaModal={setMediaModal} />
            <ToastContainer />
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
