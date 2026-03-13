import { useToastStore } from '../../stores/toastStore';
import '../styles/toast.css';

/**
 * Toast-контейнер. Рендерить один раз в App.jsx.
 */
export function ToastContainer() {
    const toasts = useToastStore((s) => s.toasts);

    if (toasts.length === 0) return null;

    // Показываем только последний тост
    const latest = toasts[toasts.length - 1];

    return (
        <div className="toast-container">
            <div key={latest.id} className={`toast-content ${latest.type}`}>
                <div className="toast-check-icon">
                    {latest.type === 'error' ? (
                        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    ) : (
                        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                        </svg>
                    )}
                </div>
                {latest.message && <span className="toast-message">{latest.message}</span>}
            </div>
        </div>
    );
}
