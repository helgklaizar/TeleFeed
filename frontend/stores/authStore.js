import { create } from 'zustand';

export const useAuthStore = create((set) => ({
    state: 'init', // init | wait_params | wait_phone | wait_code | wait_password | ready | logged_out
    error: null,
    setState: (s) => set({ state: s }),
    setError: (e) => set({ error: e }),
}));
