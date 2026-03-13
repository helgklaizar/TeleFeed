import js from '@eslint/js';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';

export default [{ ignores: ['dist/**', 'node_modules/**'] }, {
    files: ['**/*.{js,jsx}'],
    ...js.configs.recommended,
    plugins: {
        'react-hooks': reactHooks,
        'react-refresh': reactRefresh,
    },
    languageOptions: {
        ecmaVersion: 2024,
        sourceType: 'module',
        parserOptions: { ecmaFeatures: { jsx: true } },
        globals: {
            window: 'readonly',
            document: 'readonly',
            localStorage: 'readonly',
            console: 'readonly',
            setTimeout: 'readonly',
            clearTimeout: 'readonly',
            Set: 'readonly',
            Map: 'readonly',
            Array: 'readonly',
            Object: 'readonly',
            String: 'readonly',
            Math: 'readonly',
            Number: 'readonly',
            JSON: 'readonly',
        },
    },
    rules: {
        ...reactHooks.configs.recommended.rules,
        'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
        'no-unused-vars': ['warn', {
            argsIgnorePattern: '^_',
            varsIgnorePattern: '^_|^React$|^[A-Z]',
        }],
        'no-console': 'off',
    },
}];
