import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUiStore } from '../stores/uiStore';
import { useChatStore } from '../features/chat/stores/chatStore';
import { t } from '../app/i18n';
import '../shared/styles/settings.css';

export function HiddenChatsPage() {
    const navigate = useNavigate();
    const blacklist = useUiStore((s) => s.blacklist);
    const setBlacklist = useUiStore((s) => s.setBlacklist);
    const chats = useChatStore((s) => s.chats);

    const CATEGORIES = [
        { key: 'channel', label: t('channelsLabel'), color: '#5ab847' },
        { key: 'group', label: t('groupsLabel'), color: 'var(--accent)' },
        { key: 'private', label: t('privateLabel'), color: '#ffa500' },
    ];

    const byCategory = useMemo(() => {
        const result = { channel: [], group: [], private: [] };
        blacklist.forEach((id) => {
            const chat = chats[id] || chats[parseInt(id)];
            if (!chat) return;
            const type = chat._customType || 'private';
            if (result[type]) result[type].push({ id, title: chat.title || id });
        });
        return result;
    }, [blacklist, chats]);

    const handleUnhide = (id) => {
        setBlacklist(blacklist.filter((x) => x !== id && x !== String(id)));
    };

    const handleClearAll = () => {
        setBlacklist([]);
    };

    const total = blacklist.length;

    return (
        <div className="page" style={{ paddingBottom: '20px' }}>
            {/* Header */}
            <div className="settings-header">
                <div className="settings-header-left">
                    <button className="settings-back-btn" onClick={() => navigate(-1)} aria-label={t('backLabel')}>
                        <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                            <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
                        </svg>
                    </button>
                    <span className="settings-header-title">
                        Скрытые {total > 0 && <span style={{ color: 'var(--text-muted)', fontWeight: 400, fontSize: '14px' }}>({total})</span>}
                    </span>
                </div>
                {total > 0 && (
                    <button
                        onClick={handleClearAll}
                        style={{
                            padding: '4px 12px',
                            borderRadius: '6px',
                            border: '1px solid rgba(255,71,87,0.4)',
                            background: 'rgba(255,71,87,0.08)',
                            color: '#ff4757',
                            fontSize: '12px',
                            fontWeight: 500,
                            cursor: 'pointer',
                        }}
                    >
                        Сбросить всё
                    </button>
                )}
            </div>

            {/* Empty state */}
            {total === 0 && (
                <div className="empty-state" style={{ paddingTop: '30vh' }}>
                    <svg viewBox="0 0 24 24" width="64" height="64" fill="currentColor" opacity="0.25">
                        <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
                    </svg>
                    <span>{t('noHiddenChats')}</span>
                </div>
            )}

            {/* Categories */}
            {CATEGORIES.map(({ key, label, color }) => {
                const items = byCategory[key];
                if (!items || items.length === 0) return null;
                return (
                    <div key={key} style={{ marginTop: '16px' }}>
                        <div style={{
                            padding: '6px 16px 4px',
                            fontSize: '11px',
                            color,
                            fontWeight: 600,
                            textTransform: 'uppercase',
                            letterSpacing: '0.06em',
                        }}>
                            {label} ({items.length})
                        </div>
                        <div className="menu-section">
                            {items.map((item) => (
                                <div key={item.id} className="hidden-chat-row">
                                    <span className="hidden-chat-title">{item.title}</span>
                                    <button
                                        className="hidden-chat-unhide-btn"
                                        onClick={() => handleUnhide(item.id)}
                                    >
                                        Показать
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
