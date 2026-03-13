import { Component } from 'react';
import { t } from '../../app/i18n';

/**
 * Error Boundary — ловит ошибки рендера и показывает fallback вместо белого экрана.
 */
export class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error('[ErrorBoundary]', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '100vh',
                    padding: '24px',
                    color: '#f5f5f5',
                    fontFamily: 'Inter, sans-serif',
                    textAlign: 'center',
                    gap: '16px',
                }}>
                    <div style={{ fontSize: '48px' }}>⚠️</div>
                    <h2 style={{ fontSize: '18px', fontWeight: 600 }}>{t('somethingWentWrong')}</h2>
                    <p style={{ fontSize: '14px', color: '#7f91a4', maxWidth: '300px' }}>
                        {this.state.error?.message || t('unknownError')}
                    </p>
                    <button
                        onClick={() => window.location.reload()}
                        style={{
                            padding: '10px 24px',
                            background: '#5288c1',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '15px',
                            cursor: 'pointer',
                        }}
                    >
                        {t('reload')}
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}
