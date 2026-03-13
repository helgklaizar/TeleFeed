import { useEffect, useState } from 'react';
import { useUiStore } from '../../stores/uiStore';
import { t } from '../../app/i18n';

const getPhaseLabels = () => ({
    idle: t('initializing'),
    syncing_chats: t('syncingChannels'),
    loading_feed: t('loadingFeed'),
    ready: t('readyStatus'),
});

const PHASE_ORDER = ['idle', 'syncing_chats', 'loading_feed', 'ready'];

const PHASE_PROGRESS = {
    idle: 10,
    syncing_chats: 35,
    loading_feed: 70,
    ready: 100,
};

/**
 * Показывается поверх контента пока startupPhase !== 'ready'.
 * Плавно уходит при переходе в ready.
 */
export function StartupLoader() {
    const startupPhase = useUiStore((s) => s.startupPhase);
    const [visible, setVisible] = useState(true);
    const [fadeOut, setFadeOut] = useState(false);

    // Максимальное время ожидания — 20 секунд, потом скрываем принудительно
    useEffect(() => {
        const timeout = setTimeout(() => {
            useUiStore.getState().setStartupPhase('ready');
        }, 20000);
        return () => clearTimeout(timeout);
    }, []);

    useEffect(() => {
        if (startupPhase === 'ready') {
            setFadeOut(true);
            const t = setTimeout(() => setVisible(false), 600);
            return () => clearTimeout(t);
        }
    }, [startupPhase]);

    if (!visible) return null;

    const progress = PHASE_PROGRESS[startupPhase] ?? 10;
    const label = getPhaseLabels()[startupPhase] ?? t('loadingStatus');
    const phaseIdx = PHASE_ORDER.indexOf(startupPhase);

    return (
        <div
            style={{
                position: 'fixed',
                inset: 0,
                zIndex: 9999,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'var(--bg-main, #0d1117)',
                opacity: fadeOut ? 0 : 1,
                transition: 'opacity 0.6s ease',
                pointerEvents: fadeOut ? 'none' : 'all',
            }}
        >
            {/* Logo / Icon */}
            <div style={{
                width: 72, height: 72,
                borderRadius: '20px',
                background: 'linear-gradient(135deg, #5ab847 0%, #2d8a1e 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: 32,
                boxShadow: '0 8px 32px rgba(90,184,71,0.35)',
                animation: 'startup-pulse 2s ease-in-out infinite',
            }}>
                <svg viewBox="0 0 24 24" width="38" height="38" fill="white">
                    <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
                </svg>
            </div>

            {/* App name */}
            <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-main, #e8eaf0)', marginBottom: 8, letterSpacing: '-0.5px' }}>
                TG Feed
            </div>

            {/* Phase label */}
            <div style={{ fontSize: 13, color: 'var(--text-muted, #6b7280)', marginBottom: 32, minHeight: 20, transition: 'all 0.3s' }}>
                {label}
            </div>

            {/* Progress bar */}
            <div style={{ width: 220, height: 3, background: 'rgba(255,255,255,0.08)', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{
                    height: '100%',
                    width: `${progress}%`,
                    background: 'linear-gradient(90deg, #5ab847, #8de87a)',
                    borderRadius: 2,
                    transition: 'width 0.8s cubic-bezier(0.4,0,0.2,1)',
                }} />
            </div>

            {/* Step dots */}
            <div style={{ display: 'flex', gap: 8, marginTop: 24 }}>
                {PHASE_ORDER.filter(p => p !== 'idle').map((phase, i) => (
                    <div key={phase} style={{
                        width: i <= phaseIdx - 1 ? 8 : 6,
                        height: i <= phaseIdx - 1 ? 8 : 6,
                        borderRadius: '50%',
                        background: i < phaseIdx
                            ? '#5ab847'
                            : i === phaseIdx - 1
                                ? 'rgba(90,184,71,0.5)'
                                : 'rgba(255,255,255,0.12)',
                        transition: 'all 0.4s ease',
                    }} />
                ))}
            </div>

            <style>{`
                @keyframes startup-pulse {
                    0%, 100% { transform: scale(1); box-shadow: 0 8px 32px rgba(90,184,71,0.35); }
                    50% { transform: scale(1.05); box-shadow: 0 12px 40px rgba(90,184,71,0.5); }
                }
            `}</style>
        </div>
    );
}
