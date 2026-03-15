import type { User, UserRole } from '../types';
import { api } from '../lib/api';
import { mockUsers } from '../mocks/data';
import { getItem, setItem } from '../utils/storage';

const STORAGE_KEY = 'hbs_users';
const USE_API = !!import.meta.env.VITE_API_URL;

// Map frontend roles to backend role names
const ROLE_TO_BACKEND: Record<UserRole, string> = {
  admin: 'Admin',
  host: 'Host',
  guest: 'Guest',
};

// Map backend UserAdminDto to frontend User
function mapAdminUser(apiUser: {
  id: string; email: string; name: string; tenantId?: string;
  isActive: boolean; isBanned: boolean; createdAt: string; lastLoginAt?: string;
}): User {
  return {
    id: apiUser.id,
    name: apiUser.name || apiUser.email,
    email: apiUser.email,
    role: 'guest', // role not returned by admin endpoint
    createdAt: apiUser.createdAt,
    verified: apiUser.isActive,
    tenantId: apiUser.tenantId,
  };
}

function getAllUsers(): User[] {
  const stored = getItem<User[]>(STORAGE_KEY) || [];
  const storedIds = new Set(stored.map((u) => u.id));
  const mockFiltered = mockUsers.filter((u) => !storedIds.has(u.id));
  return [...mockFiltered, ...stored];
}

export const userService = {
  async getAll(): Promise<User[]> {
    if (USE_API) {
      try {
        // Backend returns flat array of UserAdminDto (not wrapped in { items })
        const apiData = await api.get<Array<{
          id: string; email: string; name: string; tenantId?: string;
          isActive: boolean; isBanned: boolean; createdAt: string; lastLoginAt?: string;
        }>>('/admin/users');
        const list = Array.isArray(apiData) ? apiData : (apiData as { items: typeof apiData }).items ?? [];
        return list.map(mapAdminUser);
      } catch { /* fallback */ }
    }
    return getAllUsers();
  },

  async getById(id: string): Promise<User | undefined> {
    if (USE_API) {
      try {
        return await api.get<User>(`/admin/users/${id}`);
      } catch { /* fallback */ }
    }
    return getAllUsers().find((u) => u.id === id);
  },

  async updateRole(id: string, role: UserRole): Promise<User> {
    if (USE_API) {
      try {
        return await api.patch<User>(`/admin/users/${id}/role`, { role: ROLE_TO_BACKEND[role] || role });
      } catch { /* fallback */ }
    }
    const stored = getItem<User[]>(STORAGE_KEY) || [];
    const mockUser = mockUsers.find((u) => u.id === id);

    if (mockUser) {
      const updated = { ...mockUser, role };
      const existingIdx = stored.findIndex((u) => u.id === id);
      if (existingIdx >= 0) {
        stored[existingIdx] = updated;
      } else {
        stored.push(updated);
      }
      setItem(STORAGE_KEY, stored);
      return updated;
    }

    const idx = stored.findIndex((u) => u.id === id);
    if (idx < 0) throw new Error('Usuário não encontrado');
    stored[idx] = { ...stored[idx], role };
    setItem(STORAGE_KEY, stored);
    return stored[idx];
  },

  async deactivate(id: string, reason = 'Desativado pelo administrador'): Promise<User> {
    if (USE_API) {
      try {
        return await api.post<User>(`/admin/users/${id}/ban`, { reason });
      } catch { /* fallback */ }
    }
    return userService.updateRole(id, 'guest'); // Simplified deactivation
  },

  async update(id: string, data: Partial<User>): Promise<User> {
    if (USE_API) {
      try {
        return await api.put<User>(`/admin/users/${id}`, data);
      } catch { /* fallback */ }
    }
    const stored = getItem<User[]>(STORAGE_KEY) || [];
    const mockUser = mockUsers.find((u) => u.id === id);

    if (mockUser) {
      const updated = { ...mockUser, ...data };
      const existingIdx = stored.findIndex((u) => u.id === id);
      if (existingIdx >= 0) {
        stored[existingIdx] = updated;
      } else {
        stored.push(updated);
      }
      setItem(STORAGE_KEY, stored);
      return updated;
    }

    const idx = stored.findIndex((u) => u.id === id);
    if (idx < 0) throw new Error('Usuário não encontrado');
    stored[idx] = { ...stored[idx], ...data };
    setItem(STORAGE_KEY, stored);
    return stored[idx];
  },

  async unban(id: string): Promise<User> {
    if (USE_API) {
      try {
        return await api.post<User>(`/admin/users/${id}/unban`);
      } catch { /* fallback */ }
    }
    return userService.updateRole(id, 'guest');
  },
};
