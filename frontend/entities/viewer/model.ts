import { create } from 'zustand';

export interface ViewerProfile {
    id: number;
    first_name: string;
    last_name?: string;
    username?: string;
    phone_number?: string;
    [key: string]: any;
}

export interface ViewerState {
    theme: string;
    setTheme: (t: string) => void;
    cycleTheme: () => void;

    textScale: number;
    setTextScale: (scale: number) => void;
    increaseTextScale: () => void;
    decreaseTextScale: () => void;

    profile: ViewerProfile | null;
    setProfile: (p: ViewerProfile | null) => void;
}

export const useViewerStore = create<ViewerState>((set, get) => ({
    // ── Theme ──
    theme: localStorage.getItem('tg_theme') || 'blue',
    setTheme: (t) => {
        localStorage.setItem('tg_theme', t);
        set({ theme: t });
    },
    cycleTheme: () => {
        const t = get().theme;
        const next = t === 'blue' ? 'green' : t === 'green' ? 'bordeaux' : 'blue';
        get().setTheme(next);
    },

    // ── Text Scale ──
    textScale: Number(localStorage.getItem('tg_text_scale')) || 1.0,
    setTextScale: (scale) => {
        localStorage.setItem('tg_text_scale', scale.toString());
        document.documentElement.style.setProperty('--text-scale', scale.toString());
        set({ textScale: scale });
    },
    increaseTextScale: () => {
        const next = Math.min(get().textScale + 0.05, 1.8);
        get().setTextScale(parseFloat(next.toFixed(2)));
    },
    decreaseTextScale: () => {
        const next = Math.max(get().textScale - 0.05, 0.8);
        get().setTextScale(parseFloat(next.toFixed(2)));
    },

    // ── Profile ──
    profile: (() => {
        try { return JSON.parse(localStorage.getItem('tg_profile') || 'null'); }
        catch { return null; }
    })(),
    setProfile: (p) => {
        try { localStorage.setItem('tg_profile', JSON.stringify(p)); } catch { }
        set({ profile: p });
    },
}));
