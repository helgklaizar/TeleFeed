import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useChatStore } from '../features/chat/stores/chatStore';
import { ChatAvatar } from '../shared/ui/ChatAvatar';
import { ipcLeaveChat } from '../shared/ipc/index';
import { t } from '../app/i18n';

export function ChannelListPage() {
    const navigate = useNavigate();
    const chats = useChatStore((s) => s.chats);
    const [leaving, setLeaving] = useState(new Set());

    const channels = useMemo(() => {
        return Object.values(chats)
            .filter((c) => c._customType === 'channel')
            .sort((a, b) => (a.title || '').localeCompare(b.title || ''));
    }, [chats]);

    const handleLeave = async (chatId) => {
        if (!confirm(t('unsubscribeConfirm'))) return;
        setLeaving((prev) => new Set(prev).add(chatId));
        try {
            await ipcLeaveChat(chatId);
        } catch (e) {
            console.error('Leave error:', e);
            alert(t('errorPrefix') + e);
        }
        setLeaving((prev) => { const s = new Set(prev); s.delete(chatId); return s; });
    };

    return (
        <div className="page">
            {/* Header */}
            <div style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)',
            }}>
                <button onClick={() => navigate(-1)} style={{
                    background: 'none', border: 'none', color: 'var(--text-main)',
                    display: 'flex', alignItems: 'center', cursor: 'pointer', padding: 0,
                }}>
                    <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                        <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
                    </svg>
                </button>
                <span style={{ fontSize: '17px', fontWeight: 600 }}>{t('channelsLabel')} ({channels.length})</span>
            </div>

            {/* Channel list */}
            <div>
                {channels.map((ch) => (
                    <div key={ch.id} style={{
                        display: 'flex', alignItems: 'center', gap: '12px',
                        padding: '10px 16px',
                        borderBottom: '1px solid rgba(255,255,255,0.04)',
                    }}>
                        <ChatAvatar chat={ch} size={40} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: '15px', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {ch.title}
                            </div>
                            {ch.username && <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>@{ch.username}</div>}
                        </div>
                        <button
                            onClick={() => handleLeave(ch.id)}
                            disabled={leaving.has(ch.id)}
                            style={{
                                padding: '6px 14px', borderRadius: '6px',
                                border: '1px solid rgba(255, 71, 87, 0.4)',
                                background: 'rgba(255, 71, 87, 0.1)', color: '#ff4757',
                                fontSize: '13px', fontWeight: 500, cursor: 'pointer',
                                opacity: leaving.has(ch.id) ? 0.4 : 1,
                                transition: 'opacity 0.2s',
                            }}
                        >
                            {leaving.has(ch.id) ? '...' : t('unsubscribeButton')}
                        </button>
                    </div>
                ))}
                {channels.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)', fontSize: '14px' }}>
                        {t('noSubscriptions')}
                    </div>
                )}
            </div>
        </div>
    );
}
