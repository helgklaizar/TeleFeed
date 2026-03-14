import { useState, useEffect } from 'react';
import { ipcInitTdlib, ipcSubmitPhone, ipcSubmitCode, ipcSubmitPassword } from '../shared/ipc/index';
import { useAuthStore } from '../stores/authStore';
import { t } from '../app/i18n';

/**
 * AuthPage — unified onboarding + auth flow.
 * Step 1: API credentials (api_id + api_hash) — only on first launch
 * Step 2: Phone number
 * Step 3: Code from Telegram
 * Step 4: 2FA password (optional)
 */
export function AuthPage() {
    const authState = useAuthStore((s) => s.state);

    // Check if credentials exist
    const hasCredentials = () => {
        return localStorage.getItem('tg_api_id') && localStorage.getItem('tg_api_hash');
    };

    const [needsSetup, setNeedsSetup] = useState(!hasCredentials());
    const [apiId, setApiId] = useState('');
    const [apiHash, setApiHash] = useState('');
    const [input, setInput] = useState('');
    const [error, setError] = useState('');

    // When credentials are saved, init TDLib
    useEffect(() => {
        if (!needsSetup && hasCredentials()) {
            const id = parseInt(localStorage.getItem('tg_api_id'), 10);
            const hash = localStorage.getItem('tg_api_hash');
            ipcInitTdlib(id, hash).catch((e) => {
                console.error('Init error:', e);
                setError(String(e));
            });
        }
    }, [needsSetup]);

    // ── Step 1: API Credentials ──
    if (needsSetup) {
        const handleSetup = () => {
            const id = apiId.trim();
            const hash = apiHash.trim();
            if (!id || !hash) return;
            if (!/^\d+$/.test(id)) {
                setError('API ID должен быть числом');
                return;
            }
            if (hash.length < 20) {
                setError('API Hash слишком короткий');
                return;
            }
            localStorage.setItem('tg_api_id', id);
            localStorage.setItem('tg_api_hash', hash);
            setError('');
            setNeedsSetup(false);
        };

        return (
            <div className="auth-page">
                <div className="auth-card" style={{ maxWidth: 380 }}>
                    <div className="auth-logo">
                        <svg viewBox="0 0 24 24" width="48" height="48" fill="var(--accent)">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 0 0-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" />
                        </svg>
                    </div>
                    <h2 className="auth-title">{t('onboardingTitle')}</h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '13px', textAlign: 'center', marginBottom: '8px', lineHeight: 1.5 }}>
                        {t('onboardingDesc')}
                    </p>
                    <a
                        href="https://my.telegram.org/apps"
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: 'var(--accent)', fontSize: '12px', textAlign: 'center', marginBottom: '16px', display: 'block', textDecoration: 'none' }}
                    >
                        {t('onboardingHelp')} ↗
                    </a>

                    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <div>
                            <label style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>
                                {t('apiIdLabel')}
                            </label>
                            <input
                                className="auth-input"
                                type="text"
                                value={apiId}
                                onChange={(e) => { setApiId(e.target.value); setError(''); }}
                                placeholder="12345678"
                                autoFocus
                            />
                        </div>
                        <div>
                            <label style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>
                                {t('apiHashLabel')}
                            </label>
                            <input
                                className="auth-input"
                                type="text"
                                value={apiHash}
                                onChange={(e) => { setApiHash(e.target.value); setError(''); }}
                                onKeyDown={(e) => e.key === 'Enter' && handleSetup()}
                                placeholder="0123456789abcdef0123456789abcdef"
                            />
                        </div>
                    </div>

                    {error && (
                        <div style={{ color: '#ff4757', fontSize: '13px', marginTop: '8px', textAlign: 'center' }}>{error}</div>
                    )}

                    <button
                        className="auth-submit"
                        disabled={!apiId.trim() || !apiHash.trim()}
                        onClick={handleSetup}
                        style={{ marginTop: '12px' }}
                    >
                        {t('continue')}
                    </button>

                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center', marginTop: '12px', lineHeight: 1.5 }}>
                        {t('step')} 1 {t('of')} 2
                    </div>
                </div>
            </div>
        );
    }

    // ── Loading / connecting ──
    if (authState === 'init' || authState === 'wait_params') {
        return (
            <div className="auth-page">
                <div className="auth-spinner-container">
                    <div className="auth-spinner" />
                    <div className="auth-spinner-text">{t('startingApp')}</div>
                </div>
            </div>
        );
    }

    // ── Steps 2-4: Phone / Code / Password ──
    let title = '';
    let inputType = 'text';
    let placeholder = '';
    let stepNum = 2;

    if (authState === 'wait_phone') {
        title = t('enterPhone');
        placeholder = '+7...';
        stepNum = 2;
    } else if (authState === 'wait_code') {
        title = t('enterCode');
        placeholder = '12345';
        stepNum = 2;
    } else if (authState === 'wait_password') {
        title = t('enterPassword');
        inputType = 'password';
        placeholder = '••••••';
        stepNum = 2;
    }

    const handleSubmit = async () => {
        if (!input.trim()) return;
        try {
            if (authState === 'wait_phone') await ipcSubmitPhone(input);
            else if (authState === 'wait_code') await ipcSubmitCode(input);
            else if (authState === 'wait_password') await ipcSubmitPassword(input);
            setInput('');
        } catch (e) {
            console.error('Auth error:', e);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-card">
                <div className="auth-logo">
                    <svg viewBox="0 0 24 24" width="48" height="48" fill="var(--accent)">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 0 0-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" />
                    </svg>
                </div>
                <h2 className="auth-title">{title}</h2>
                <input
                    className="auth-input"
                    type={inputType}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                    autoFocus
                    placeholder={placeholder}
                />
                <button
                    className="auth-submit"
                    disabled={!input.trim()}
                    onClick={handleSubmit}
                >
                    {t('continue')}
                </button>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center', marginTop: '12px' }}>
                    {t('step')} {stepNum} {t('of')} 2
                </div>
            </div>
        </div>
    );
}
