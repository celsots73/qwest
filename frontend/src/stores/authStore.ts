import { create } from 'zustand';
import { User } from '@/types';
import { authApi } from '@/lib/api';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  hydrate: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isLoading: false,

  login: async (email, password) => {
    set({ isLoading: true });
    try {
      const { token, user } = await authApi.login({ email, password });
      localStorage.setItem('qwest_token', token);
      set({ user, token, isLoading: false });
    } catch (e) {
      set({ isLoading: false });
      throw e;
    }
  },

  register: async (name, email, password) => {
    set({ isLoading: true });
    try {
      const { token, user } = await authApi.register({ name, email, password });
      localStorage.setItem('qwest_token', token);
      set({ user, token, isLoading: false });
    } catch (e) {
      set({ isLoading: false });
      throw e;
    }
  },

  logout: () => {
    localStorage.removeItem('qwest_token');
    set({ user: null, token: null });
  },

  hydrate: async () => {
    const token = localStorage.getItem('qwest_token');
    if (!token) return;
    try {
      const user = await authApi.me();
      set({ user, token });
    } catch {
      localStorage.removeItem('qwest_token');
    }
  },
}));
