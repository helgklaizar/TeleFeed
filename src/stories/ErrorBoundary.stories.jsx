import { ErrorBoundary } from '../shared/ui/ErrorBoundary';
import '../shared/styles/tokens.css';

function ThrowingComponent() {
    throw new Error('Test error for Storybook');
}

function WorkingComponent() {
    return <div style={{ color: '#e0e0e0', padding: 16 }}>Этот компонент работает нормально.</div>;
}

export default {
    title: 'Components/ErrorBoundary',
    component: ErrorBoundary,
    parameters: {
        backgrounds: { default: 'dark', values: [{ name: 'dark', value: '#1a1a2e' }] },
    },
};

export const WithError = {
    render: () => (
        <ErrorBoundary>
            <ThrowingComponent />
        </ErrorBoundary>
    ),
};

export const WithoutError = {
    render: () => (
        <ErrorBoundary>
            <WorkingComponent />
        </ErrorBoundary>
    ),
};
