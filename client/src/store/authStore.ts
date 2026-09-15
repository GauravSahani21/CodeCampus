'use client';
import { create } from 'zustand';
import api from '@/lib/api';

interface User {
  id: string;
  username: string;
  email: string;
  role: 'user' | 'instructor' | 'admin';
  avatar?: string;
  stats: { solved: number; attempted: number; streak: number };
  badges?: string[];
  earnedBadges?: Array<{ id: string; name: string; icon: string; description: string; earnedAt: string }>;
  longestStreak?: number;
  streakMilestones?: number[];
  solvedProblems?: any[];
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User>;
  signup: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  setUser: (user: User, token?: string) => void;
  loadFromStorage: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isLoading: false,

  loadFromStorage: () => {
    if (typeof window === 'undefined') return;
    const token = sessionStorage.getItem('cf_token') || localStorage.getItem('cf_token');
    const userStr = sessionStorage.getItem('cf_user') || localStorage.getItem('cf_user');
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        const state = useAuthStore.getState();
        if (state.token !== token || JSON.stringify(state.user) !== JSON.stringify(user)) {
          set({ token, user });
        }
      } catch {
        sessionStorage.removeItem('cf_token');
        sessionStorage.removeItem('cf_user');
        localStorage.removeItem('cf_token');
        localStorage.removeItem('cf_user');
      }
    }
  },

  login: async (email, password) => {
    set({ isLoading: true });
    try {
      const { data } = await api.post('/auth/login', { email, password });
      sessionStorage.setItem('cf_token', data.token);
      sessionStorage.setItem('cf_user', JSON.stringify(data.user));
      localStorage.setItem('cf_token', data.token);
      localStorage.setItem('cf_user', JSON.stringify(data.user));
      set({ token: data.token, user: data.user, isLoading: false });
      return data.user;
    } catch (err: unknown) {
      set({ isLoading: false });
      const errorObj = err as any;
      const msg = errorObj.response?.data?.error || errorObj.message || 'Login failed';
      throw new Error(msg);
    }
  },

  signup: async (username, email, password) => {
    set({ isLoading: true });
    try {
      const { data } = await api.post('/auth/signup', { username, email, password });
      sessionStorage.setItem('cf_token', data.token);
      sessionStorage.setItem('cf_user', JSON.stringify(data.user));
      localStorage.setItem('cf_token', data.token);
      localStorage.setItem('cf_user', JSON.stringify(data.user));
      set({ token: data.token, user: data.user, isLoading: false });
    } catch (err: unknown) {
      set({ isLoading: false });
      const errorObj = err as any;
      const msg = errorObj.response?.data?.error || errorObj.message || 'Signup failed';
      throw new Error(msg);
    }
  },

  logout: () => {
    sessionStorage.removeItem('cf_token');
    sessionStorage.removeItem('cf_user');
    localStorage.removeItem('cf_token');
    localStorage.removeItem('cf_user');
    set({ user: null, token: null });
  },

  setUser: (user: User, token?: string) => {
    sessionStorage.setItem('cf_user', JSON.stringify(user));
    localStorage.setItem('cf_user', JSON.stringify(user));
    if (token) {
      sessionStorage.setItem('cf_token', token);
      localStorage.setItem('cf_token', token);
    }
    set((state) => ({ user, token: token || state.token }));
  },
}));
