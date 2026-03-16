import type { User, UserRole } from '../types';
import { api } from '../lib/api';
import { mockUsers } from '../mocks/data';
import { getItem, setItem, removeItem } from '../utils/storage';

const STORAGE_KEY = 'hbs_auth';
const USERS_KEY = 'hbs_users';
const USE_API = !!import.meta.env.VITE_API_URL;

function getAllUsersLocal(): User[] {
  const stored = getItem<User[]>(USERS_KEY) || [];
  return [...mockUsers, ...stored];
}

export interface LoginResult {
  user: User;
  token: string;
  refreshToken?: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  phone?: string;
}

// Map API user to frontend User format
function mapApiUser(apiUser: {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  phoneNumber?: string;
  emailVerified: boolean;
  isActive: boolean;
  createdAt: string;
  roles: string[];
  tenantId?: string;
} | undefined | null): User {
  if (!apiUser) {
    throw new Error('User data not found in response');
  }
  const roleMap: Record<string, UserRole> = {
    'SuperAdmin': 'admin',
    'Admin': 'admin',
    'Host': 'host',
    'PropertyManager': 'host',
    'Guest': 'guest',
  };
  return {
    id: apiUser.id,
    name: apiUser.fullName || `${apiUser.firstName || ''} ${apiUser.lastName || ''}`.trim() || apiUser.email,
    email: apiUser.email,
    role: roleMap[apiUser.roles?.[0]] || 'guest',
    phone: apiUser.phoneNumber,
    createdAt: apiUser.createdAt,
    verified: apiUser.emailVerified,
    tenantId: apiUser.tenantId,
  };
}

export const authService = {
  async login(email: string, password: string): Promise<LoginResult> {
    if (USE_API) {
      try {
        const response = await api.post<{
          user: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
            fullName: string;
            phoneNumber?: string;
            emailVerified: boolean;
            isActive: boolean;
            createdAt: string;
            roles: string[];
            tenantId?: string;
          };
          accessToken: string;
          refreshToken: string;
          expiresAt: string;
        }>('/auth/login', { email, password });
        const user = mapApiUser(response.user);
        setItem(STORAGE_KEY, {
          user,
          token: response.accessToken,
          refreshToken: response.refreshToken,
        });
        return { user, token: response.accessToken, refreshToken: response.refreshToken };
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Erro ao fazer login';
        throw new Error(message);
      }
    }
    // Fallback mock
    const users = getAllUsersLocal();
    const user = users.find((u) => u.email === email);
    if (!user) throw new Error('Usuário não encontrado');
    const token = `mock_token_${user.id}_${Date.now()}`;
    setItem(STORAGE_KEY, { user, token });
    return { user, token };
  },

  async demoLogin(email: string): Promise<LoginResult> {
    if (USE_API) {
      try {
        const response = await api.post<{
          user: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
            fullName: string;
            phoneNumber?: string;
            emailVerified: boolean;
            isActive: boolean;
            createdAt: string;
            roles: string[];
            tenantId?: string;
          };
          accessToken: string;
          refreshToken: string;
          expiresAt: string;
        }>('/auth/demo-login', { email });
        const user = mapApiUser(response.user);
        setItem(STORAGE_KEY, {
          user,
          token: response.accessToken,
          refreshToken: response.refreshToken,
        });
        return { user, token: response.accessToken, refreshToken: response.refreshToken };
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Erro no login demo';
        throw new Error(message);
      }
    }
    // Fallback: use normal mock login
    return this.login(email, 'demo');
  },

  async register(data: RegisterData): Promise<LoginResult> {
    if (USE_API) {
      try {
        const [firstName, ...rest] = data.name.split(' ');
        const lastName = rest.join(' ') || firstName;
        const response = await api.post<{
          user: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
            fullName: string;
            phoneNumber?: string;
            emailVerified: boolean;
            isActive: boolean;
            createdAt: string;
            roles: string[];
            tenantId?: string;
          };
          accessToken: string;
          refreshToken: string;
          expiresAt: string;
        }>('/auth/register', {
          firstName,
          lastName,
          email: data.email,
          password: data.password,
          phoneNumber: data.phone,
        });
        const user = mapApiUser(response.user);
        setItem(STORAGE_KEY, {
          user,
          token: response.accessToken,
          refreshToken: response.refreshToken,
        });
        return { user, token: response.accessToken, refreshToken: response.refreshToken };
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Erro ao registrar';
        throw new Error(message);
      }
    }
    // Fallback mock
    const users = getAllUsersLocal();
    if (users.find((u) => u.email === data.email)) {
      throw new Error('E-mail já cadastrado');
    }
    const newUser: User = {
      id: `u${Date.now()}`,
      name: data.name,
      email: data.email,
      role: data.role,
      phone: data.phone,
      createdAt: new Date().toISOString(),
      verified: false,
    };
    const stored = getItem<User[]>(USERS_KEY) || [];
    setItem(USERS_KEY, [...stored, newUser]);
    const token = `mock_token_${newUser.id}_${Date.now()}`;
    setItem(STORAGE_KEY, { user: newUser, token });
    return { user: newUser, token };
  },

  async logout(): Promise<void> {
    if (USE_API) {
      try {
        await api.post('/auth/logout');
      } catch {
        // ignore
      }
    }
    removeItem(STORAGE_KEY);
  },

  async getProfile(): Promise<User | null> {
    if (USE_API) {
      try {
        const apiUser = await api.get<{
          id: string; email: string; firstName: string; lastName: string;
          fullName: string; phoneNumber?: string; emailVerified: boolean;
          isActive: boolean; createdAt: string; roles: string[]; tenantId?: string;
        }>('/auth/me');
        const user = mapApiUser(apiUser);
        const auth = getItem<{ token: string; refreshToken: string }>(STORAGE_KEY);
        if (auth) setItem(STORAGE_KEY, { ...auth, user });
        return user;
      } catch {
        // fallback to stored
      }
    }
    const auth = getItem<{ user: User; token: string }>(STORAGE_KEY);
    return auth?.user ?? null;
  },

  getToken(): string | null {
    const auth = getItem<{ user: User; token: string }>(STORAGE_KEY);
    return auth?.token ?? null;
  },

  async forgotPassword(email: string): Promise<void> {
    if (USE_API) {
      try {
        await api.post('/auth/forgot-password', { email });
        return;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Erro ao enviar email';
        throw new Error(message);
      }
    }
    // Mock: simulate delay
    await new Promise((r) => setTimeout(r, 1000));
    const users = getAllUsersLocal();
    if (!users.find((u) => u.email === email)) {
      throw new Error('E-mail não encontrado');
    }
  },

  async resetPassword(token: string, newPassword: string): Promise<void> {
    if (USE_API) {
      try {
        await api.post('/auth/reset-password', { token, newPassword });
        return;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Erro ao redefinir senha';
        throw new Error(message);
      }
    }
    // Mock: simulate delay
    await new Promise((r) => setTimeout(r, 1000));
    if (!token || token.length < 5) {
      throw new Error('Token inválido ou expirado');
    }
  },

  async verifyEmail(token: string): Promise<void> {
    if (USE_API) {
      try {
        await api.post('/auth/verify-email', { token });
        return;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Erro ao verificar email';
        throw new Error(message);
      }
    }
    // Mock: simulate delay
    await new Promise((r) => setTimeout(r, 1000));
    if (!token || token.length < 5) {
      throw new Error('Token inválido ou expirado');
    }
  },

  async updateProfile(data: Partial<User>): Promise<User> {
    if (USE_API) {
      try {
        // Map frontend User fields to backend UpdateProfileRequest
        const [firstName, ...rest] = (data.name || '').split(' ');
        const lastName = rest.join(' ') || undefined;
        const apiUser = await api.patch<{
          id: string; email: string; firstName: string; lastName: string;
          fullName: string; phoneNumber?: string; emailVerified: boolean;
          isActive: boolean; createdAt: string; roles: string[]; tenantId?: string;
        }>('/auth/profile', {
          firstName: firstName || undefined,
          lastName,
          phone: data.phone,
          bio: undefined,
          avatar: data.avatar,
        });
        const user = mapApiUser(apiUser);
        const auth = getItem<{ token: string; refreshToken: string }>(STORAGE_KEY);
        if (auth) setItem(STORAGE_KEY, { ...auth, user });
        return user;
      } catch {
        // fallback
      }
    }
    const auth = getItem<{ user: User; token: string }>(STORAGE_KEY);
    if (!auth) throw new Error('Não autenticado');
    const updated = { ...auth.user, ...data };
    setItem(STORAGE_KEY, { ...auth, user: updated });
    return updated;
  },
};
