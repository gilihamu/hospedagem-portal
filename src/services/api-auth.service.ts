import { api } from '../lib/api';
import type { User, UserRole } from '../types';
import { getItem, setItem, removeItem } from '../utils/storage';

const STORAGE_KEY = 'hbs_auth';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
}

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: UserRole;
  phone?: string;
}

export interface RegisterResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
}

export const apiAuthService = {
  async login(email: string, password: string): Promise<LoginResponse> {
    const response = await api.post<LoginResponse>('/auth/login', {
      email,
      password,
    });
    setItem(STORAGE_KEY, {
      user: response.user,
      token: response.accessToken,
      refreshToken: response.refreshToken,
    });
    return response;
  },

  async register(data: RegisterRequest): Promise<RegisterResponse> {
    const response = await api.post<RegisterResponse>('/auth/register', data);
    setItem(STORAGE_KEY, {
      user: response.user,
      token: response.accessToken,
      refreshToken: response.refreshToken,
    });
    return response;
  },

  async logout(): Promise<void> {
    try {
      await api.post('/auth/logout');
    } catch {
      // ignore logout errors
    }
    removeItem(STORAGE_KEY);
  },

  async getProfile(): Promise<User | null> {
    try {
      const user = await api.get<User>('/auth/me');
      const auth = getItem<{ user: User; token: string; refreshToken: string }>(
        STORAGE_KEY
      );
      if (auth) {
        setItem(STORAGE_KEY, { ...auth, user });
      }
      return user;
    } catch {
      return null;
    }
  },

  getToken(): string | null {
    const auth = getItem<{ token: string }>(STORAGE_KEY);
    return auth?.token ?? null;
  },

  getStoredUser(): User | null {
    const auth = getItem<{ user: User }>(STORAGE_KEY);
    return auth?.user ?? null;
  },

  async refreshToken(): Promise<string | null> {
    const auth = getItem<{ refreshToken: string }>(STORAGE_KEY);
    if (!auth?.refreshToken) return null;

    try {
      const response = await api.post<{ token: string; expiresAt: string }>(
        '/auth/refresh',
        { refreshToken: auth.refreshToken }
      );
      const current = getItem<{ user: User; refreshToken: string }>(STORAGE_KEY);
      if (current) {
        setItem(STORAGE_KEY, { ...current, token: response.token });
      }
      return response.token;
    } catch {
      removeItem(STORAGE_KEY);
      return null;
    }
  },

  async updateProfile(data: Partial<User>): Promise<User> {
    const user = await api.patch<User>('/auth/profile', data);
    const auth = getItem<{ token: string; refreshToken: string }>(STORAGE_KEY);
    if (auth) {
      setItem(STORAGE_KEY, { ...auth, user });
    }
    return user;
  },
};
