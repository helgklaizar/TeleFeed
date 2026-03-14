import { useState, useEffect } from 'react';
import { t } from '../app/i18n';

/**
 * AI Chat — заглушка дизайна.
 */
export function AiChatPage() {
    const [messages, setMessages] = useState([
        { id: 1, role: 'ai', text: t('aiChatGreeting') },
    ]);
    const [input, setInput] = useState('');

    const handleSubmit = () => {
        if (!input.trim()) return;
        setMessages((prev) => [...prev, { id: Date.now(), role: 'user', text: input }]);
        setInput('');
        setTimeout(() => {
            setMessages((prev) => [...prev, { id: Date.now() + 1, role: 'ai', text: t('aiChatStubMessage') }]);
        }, 1000);
    };

    // Lock body scroll
    useEffect(() => {
        const scrollY = window.scrollY;
        document.documentElement.style.overflow = 'hidden';
        document.body.style.overflow = 'hidden';
        document.body.style.position = 'fixed';
        document.body.style.top = `-${scrollY}px`;
        document.body.style.width = '100%';
        return () => {
            document.documentElement.style.overflow = '';
            document.body.style.overflow = '';
            document.body.style.position = '';
            document.body.style.top = '';
            document.body.style.width = '';
            window.scrollTo(0, scrollY);
        };
    }, []);

    return (
        <div style={{
            position: 'fixed', top: '46px', bottom: 0, left: 0, right: 0,
            margin: '0 auto', maxWidth: 'var(--app-max-width, 600px)', width: '100%',
            display: 'flex', flexDirection: 'column',
            background: 'var(--bg-color)', zIndex: 40,
        }}>
            {/* Messages */}
            <div style={{
                flex: 1, overflowY: 'auto', padding: '16px',
                display: 'flex', flexDirection: 'column', gap: '12px',
            }}>
                {messages.map((msg) => (
                    <div key={msg.id} style={{
                        alignSelf: msg.role === 'ai' ? 'flex-start' : 'flex-end',
                        maxWidth: '80%',
                        padding: '10px 14px',
                        borderRadius: '14px',
                        borderBottomLeftRadius: msg.role === 'ai' ? '4px' : '14px',
                        borderBottomRightRadius: msg.role === 'user' ? '4px' : '14px',
                        background: msg.role === 'ai' ? 'var(--card-bg)' : 'rgba(99, 102, 241, 0.25)',
                        border: msg.role === 'user' ? '1px solid rgba(99, 102, 241, 0.4)' : 'none',
                        fontSize: '14px',
                        lineHeight: 1.5,
                    }}>
                        {msg.text}
                    </div>
                ))}

                {/* Coming soon hint */}
                <div style={{
                    textAlign: 'center', padding: '40px 20px',
                    color: 'var(--text-muted)', fontSize: '13px',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
                }}>
                    <div style={{ fontSize: '32px', opacity: 0.4 }}>🧠</div>
                    <span>{t('aiFeaturesInProgress')}</span>
                </div>
            </div>

            {/* Input */}
            <div style={{
                padding: '8px 12px', display: 'flex', gap: '8px',
                alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.06)',
                background: 'var(--bg-color)', flexShrink: 0,
            }}>
                <input
                    style={{
                        flex: 1, padding: '10px 14px', borderRadius: '20px',
                        border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)',
                        color: 'var(--text-main)', fontSize: '14px', outline: 'none',
                    }}
                    placeholder={t('askAiPlaceholder')}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                />
                <button
                    onClick={handleSubmit}
                    style={{
                        width: 36, height: 36, borderRadius: '50%', border: 'none',
                        background: '#6366f1', color: 'white', display: 'flex',
                        alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', flexShrink: 0,
                    }}
                >
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                        <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                    </svg>
                </button>
            </div>
        </div>
    );
}
