import { create } from 'zustand';
import { UserProfile } from '../types';

interface AuthState {
    user: UserProfile | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: () => Promise<void>;
    logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    isAuthenticated: false,
    isLoading: false,

    login: async () => {
        set({ isLoading: true });
        await new Promise(resolve => setTimeout(resolve, 500));
        set({
            isLoading: false,
            isAuthenticated: true,
            user: {
                uid: 'user_' + Date.now(),
                email: 'demo@example.com',
                displayName: 'Demo User',
                biometricEnabled: false
            }
        });
    },

    logout: async () => {
        set({
            user: null,
            isAuthenticated: false
        });
    },
}));
