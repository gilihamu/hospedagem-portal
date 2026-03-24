import { create } from 'zustand';
import type { User } from '../types';
import { getItem, setItem, removeItem } from '../utils/storage';

const AUTH_KEY = 'hbs_auth';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}

interface AuthActions {
  login: (user: User, token: string) => void;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
  hydrateFromStorage: () => void;
}

export const useAuthStore = create<AuthState & AuthActions>((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,

  login: (user, token) => {
    setItem(AUTH_KEY, { user, token });
    set({ user, token, isAuthenticated: true });
  },

  logout: () => {
    removeItem(AUTH_KEY);
    set({ user: null, token: null, isAuthenticated: false });
  },

  updateUser: (data) => {
    const current = get().user;
    if (!current) return;
    const updated = { ...current, ...data };
    const auth = getItem<{ user: User; token: string }>(AUTH_KEY);
    if (auth) {
      setItem(AUTH_KEY, { ...auth, user: updated });
    }
    set({ user: updated });
  },

  hydrateFromStorage: () => {
    const auth = getItem<{ user: User; token: string }>(AUTH_KEY);
    // Validate user has required fields (name), otherwise clear corrupted data
    if (auth?.user && auth?.token && auth.user.name) {
      set({ user: auth.user, token: auth.token, isAuthenticated: true });
    } else if (auth) {
      // Clear corrupted/outdated auth data
      removeItem(AUTH_KEY);
      set({ user: null, token: null, isAuthenticated: false });
    }
  },
}));
