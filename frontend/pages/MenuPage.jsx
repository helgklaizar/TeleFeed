import { useUiStore } from '../stores/uiStore';
import { usePostActionsStore } from '../stores/postActionsStore';
import { useNavigate } from 'react-router-dom';
import { ProfileAvatar } from '../shared/ui/ProfileAvatar';
import { t } from '../app/i18n';
import { ipcOptimizeStorage } from '../shared/ipc/index';
import { showToast } from '../stores/toastStore';
import '../shared/styles/settings.css';

export function MenuPage() {
    const profile = useUiStore((s) => s.profile);
    const textScale = useUiStore((s) => s.textScale);
    const blacklist = usePostActionsStore((s) => s.blacklist);
    const navigate = useNavigate();

    return (
        <div className="page" style={{ paddingBottom: '20px' }}>
            {/* Profile card */}
            <div className="profile-card">
                <ProfileAvatar size={54} />
                <div style={{ flex: 1 }}>
                    <div className="profile-name">{profile?.name || t('user')}</div>
                    {profile?.phone && <div className="profile-detail">+{profile.phone}</div>}
                    {profile?.username && <div className="profile-detail">@{profile.username}</div>}
                </div>
            </div>

            {/* Menu items */}
            <div className="menu-section">
                <button className="menu-item menu-item--disabled" disabled>
                    <div className="menu-icon" style={{ background: 'rgba(94, 181, 247, 0.15)' }}>
                        <svg width="18" height="18" fill="var(--accent)" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" /></svg>
                    </div>
                    <span className="menu-item-label">{t('profile')}</span>
                    <svg className="menu-chevron" width="18" height="18" fill="var(--text-muted)" viewBox="0 0 24 24"><path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z" /></svg>
                </button>

                <button className="menu-item" onClick={() => navigate('/settings/channels')}>
                    <div className="menu-icon" style={{ background: 'rgba(90, 184, 71, 0.15)' }}>
                        <svg width="18" height="18" fill="#5ab847" viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" /></svg>
                    </div>
                    <span className="menu-item-label">{t('channels')}</span>
                    <svg className="menu-chevron" width="18" height="18" fill="var(--text-muted)" viewBox="0 0 24 24"><path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z" /></svg>
                </button>

                <button className="menu-item" onClick={() => navigate('/settings/hidden')}>
                    <div className="menu-icon" style={{ background: 'rgba(255, 165, 0, 0.12)' }}>
                        <svg width="18" height="18" fill="#ffa500" viewBox="0 0 24 24"><path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46A11.804 11.804 0 0 0 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z" /></svg>
                    </div>
                    <span className="menu-item-label">{t('hiddenTitle')}</span>
                    {blacklist.length > 0 && (
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{blacklist.length}</span>
                    )}
                    <svg className="menu-chevron" width="18" height="18" fill="var(--text-muted)" viewBox="0 0 24 24"><path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z" /></svg>
                </button>



                <button className="menu-item" onClick={() => navigate('/settings/instructions')}>
                    <div className="menu-icon" style={{ background: 'rgba(255, 165, 0, 0.15)' }}>
                        <svg width="18" height="18" fill="#ffa500" viewBox="0 0 24 24"><path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" /></svg>
                    </div>
                    <span className="menu-item-label">{t('instructions')}</span>
                    <svg className="menu-chevron" width="18" height="18" fill="var(--text-muted)" viewBox="0 0 24 24"><path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z" /></svg>
                </button>

                <div className="menu-item" style={{ cursor: 'default' }}>
                    <div className="menu-icon" style={{ background: 'rgba(150, 150, 150, 0.15)' }}>
                        <svg width="18" height="18" fill="var(--text-muted)" viewBox="0 0 24 24"><path d="M9 4v3h5v12h3V7h5V4H9zm-6 8h3v7h3v-7h3V9H3v3z" /></svg>
                    </div>
                    <span className="menu-item-label" style={{ flex: 1 }}>{t('textSizeLabel')}</span>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <button
                            style={{ padding: '4px 12px', background: 'var(--card-bg-glass)', borderRadius: '6px', fontSize: '14px', border: '1px solid rgba(255,255,255,0.1)' }}
                            onClick={() => useUiStore.getState().decreaseTextScale()}
                        >A-</button>
                        <span style={{ fontSize: '13px', color: 'var(--text-muted)', minWidth: '32px', textAlign: 'center' }}>
                            {Math.round(textScale * 100)}%
                        </span>
                        <button
                            style={{ padding: '4px 12px', background: 'var(--card-bg-glass)', borderRadius: '6px', fontSize: '14px', border: '1px solid rgba(255,255,255,0.1)' }}
                            onClick={() => useUiStore.getState().increaseTextScale()}
                        >A+</button>
                    </div>
                </div>
            </div>

            {/* Logout and Cache */}
            <div style={{ marginTop: '16px' }}>
                <button
                    className="menu-item"
                    onClick={async () => {
                        try {
                            await ipcOptimizeStorage();
                            showToast(t('mediaCacheCleared'), { type: 'success' });
                        } catch (e) {
                            showToast('Ошибка: ' + e, { type: 'error' });
                        }
                    }}
                >
                    <div className="menu-icon" style={{ background: 'rgba(255, 165, 0, 0.15)' }}>
                        <svg width="18" height="18" fill="#ffa500" viewBox="0 0 24 24"><path d="M15 2H9c-1.1 0-2 .9-2 2v2H3v2h2v12c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V8h2V6h-4V4c0-1.1-.9-2-2-2zm0 4H9V4h6v2z" /></svg>
                    </div>
                    <span className="menu-item-label">{t('clearMediaCache')}</span>
                </button>

                <button
                    className="menu-item menu-item--danger"
                    onClick={() => {
                        if (confirm(t('logOutConfirm'))) {
                            localStorage.clear();
                            window.location.reload();
                        }
                    }}
                >
                    <div className="menu-icon" style={{ background: 'rgba(255, 71, 87, 0.15)' }}>
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="#ff4757">
                            <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z" />
                        </svg>
                    </div>
                    <span>{t('logOut')}</span>
                </button>
            </div>

            <div className="menu-version">TG-Feed v{import.meta.env.VITE_APP_VERSION || '0.1.0-beta.1'}</div>
        </div>
    );
}
