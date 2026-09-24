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
  isInitialized: boolean;
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
  isInitialized: false,

  loadFromStorage: () => {
    if (typeof window === 'undefined') return;
    // Clean up any lingering cross-tab localStorage auth tokens
    localStorage.removeItem('cf_token');
    localStorage.removeItem('cf_user');

    const token = sessionStorage.getItem('cf_token');
    const userStr = sessionStorage.getItem('cf_user');
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        set({ token, user, isInitialized: true });
        return;
      } catch {
        sessionStorage.removeItem('cf_token');
        sessionStorage.removeItem('cf_user');
      }
    }
    set({ isInitialized: true, token: null, user: null });
  },

  login: async (email, password) => {
    set({ isLoading: true });
    try {
      const { data } = await api.post('/auth/login', { email, password });
      // Store session token only in sessionStorage so new tabs start logged out
      sessionStorage.setItem('cf_token', data.token);
      sessionStorage.setItem('cf_user', JSON.stringify(data.user));
      localStorage.removeItem('cf_token');
      localStorage.removeItem('cf_user');
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
      // Store session token only in sessionStorage so new tabs start logged out
      sessionStorage.setItem('cf_token', data.token);
      sessionStorage.setItem('cf_user', JSON.stringify(data.user));
      localStorage.removeItem('cf_token');
      localStorage.removeItem('cf_user');
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
    localStorage.removeItem('cf_user');
    if (token) {
      sessionStorage.setItem('cf_token', token);
      localStorage.removeItem('cf_token');
    }
    set((state) => ({ user, token: token || state.token }));
  },
}));
