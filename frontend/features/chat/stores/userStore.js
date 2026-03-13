import { create } from 'zustand';

export const useUserStore = create((set, get) => ({
    users: {},
    contacts: [],

    addUser: (user) => set((s) => {
        if (!user || !user.id) return s;
        return {
            users: {
                ...s.users,
                [user.id]: user,
            }
        };
    }),

    setContacts: (ids) => set({ contacts: ids }),

    getUser: (userId) => get().users[userId] || null,
}));
