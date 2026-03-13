import { useState, useEffect } from 'react';
import { t } from '../../app/i18n';

/**
 * Индикатор соединения в верху экрана.
 * Показывает плашку при оффлайне / переподключении.
 */
export function ConnectionStatus() {
    const [isOnline, setIsOnline] = useState(navigator.onLine);

    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    if (isOnline) return null;

    return (
        <div className="connection-bar connection-bar-offline">
            {t('connectionLost')}
        </div>
    );
}
