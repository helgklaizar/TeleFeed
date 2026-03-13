import { create } from 'zustand';

export const useAuthStore = create((set) => ({
    state: 'init', // init | wait_params | wait_phone | wait_code | wait_password | ready | logged_out
    setState: (s) => set({ state: s }),
}));
