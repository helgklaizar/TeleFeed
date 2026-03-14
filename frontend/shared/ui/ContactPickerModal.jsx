import { useState, useEffect } from 'react';
import { ipcGetContacts } from '../../shared/ipc/index';
import { useUserStore } from '../../features/chat/stores/userStore';
import { ChatAvatar } from './ChatAvatar';

/**
 * Модальное окно выбора контакта для начала нового личного чата.
 */
export function ContactPickerModal({ onClose, onSelect }) {
    const contacts = useUserStore((s) => s.contacts);
    const users = useUserStore((s) => s.users);
    const [loading, setLoading] = useState(false);

    // При первом открытии запросить контакты
    useEffect(() => {
        setLoading(true);
        ipcGetContacts().catch(() => { }).finally(() => setLoading(false));
    }, []);

    // Close on Escape
    useEffect(() => {
        const onKey = (e) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onClose]);

    // Список контактов по алфавиту
    const contactUsers = contacts
        .map((id) => users[id])
        .filter(Boolean)
        .sort((a, b) => {
            const nameA = [a.first_name, a.last_name].filter(Boolean).join(' ').toLowerCase();
            const nameB = [b.first_name, b.last_name].filter(Boolean).join(' ').toLowerCase();
            return nameA.localeCompare(nameB);
        });

    return (
        <div
            style={{
                position: 'fixed', inset: 0, zIndex: 9999,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'rgba(0,0,0,0.65)',
                padding: '20px',
            }}
            onClick={onClose}
        >
            <div
                style={{
                    background: '#1c2733',
                    borderRadius: '16px',
                    width: '100%',
                    maxWidth: '380px',
                    maxHeight: '70vh',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: '16px', position: 'relative',
                    borderBottom: '1px solid rgba(255,255,255,0.08)',
                }}>
                    <button
                        onClick={onClose}
                        style={{
                            position: 'absolute', left: '16px',
                            background: 'rgba(255,255,255,0.1)',
                            border: 'none',
                            cursor: 'pointer', color: 'rgba(255,255,255,0.7)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            width: '28px', height: '28px', borderRadius: '50%', padding: '0',
                        }}
                    >
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                        </svg>
                    </button>
                    <span style={{ fontWeight: 600, fontSize: '15px', color: '#fff' }}>Новый чат</span>
                </div>

                {/* Contact list */}
                <div style={{ overflowY: 'auto', flex: 1 }}>
                    {loading && contactUsers.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '32px', color: 'rgba(255,255,255,0.5)' }}>
                            <div className="media-spinner" style={{ margin: '0 auto 8px' }} />
                            <span>Загрузка...</span>
                        </div>
                    ) : contactUsers.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '32px', color: 'rgba(255,255,255,0.5)' }}>
                            Нет контактов
                        </div>
                    ) : (
                        contactUsers.map((user) => (
                            <ContactRow
                                key={user.id}
                                user={user}
                                onClick={() => onSelect(user.id)}
                            />
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}

function ContactRow({ user, onClick }) {
    const name = [user.first_name, user.last_name].filter(Boolean).join(' ') || 'Без имени';
    const sub = user.username ? `@${user.username}` : (user.phone_number || '');

    const fakeChat = {
        id: user.id,
        title: name,
        photo: user.profile_photo?.small || null,
        _customType: 'private',
    };

    return (
        <button
            onClick={onClick}
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                width: '100%',
                padding: '10px 16px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'background 0.15s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; }}
        >
            <ChatAvatar chat={fakeChat} size={42} />
            <div style={{ flex: 1, overflow: 'hidden' }}>
                <div style={{ fontWeight: 500, fontSize: '14px', color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</div>
                {sub && <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.45)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sub}</div>}
            </div>
        </button>
    );
}
