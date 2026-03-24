import type { Guest, GuestListResponse, GuestStats, GuestAnalytics, SaveGuestData } from '../types';
import { api } from '../lib/api';

export interface GuestFilters {
  search?: string;
  vip?: boolean;
  blacklisted?: boolean;
  tag?: string;
  sortBy?: string;
  sortDesc?: boolean;
  page?: number;
  pageSize?: number;
}

export const guestService = {
  async getAll(filters?: GuestFilters): Promise<GuestListResponse> {
    const params: Record<string, string> = {};
    if (filters?.search) params.search = filters.search;
    if (filters?.vip !== undefined) params.vip = String(filters.vip);
    if (filters?.blacklisted !== undefined) params.blacklisted = String(filters.blacklisted);
    if (filters?.tag) params.tag = filters.tag;
    if (filters?.sortBy) params.sortBy = filters.sortBy;
    if (filters?.sortDesc !== undefined) params.sortDesc = String(filters.sortDesc);
    if (filters?.page) params.page = String(filters.page);
    if (filters?.pageSize) params.pageSize = String(filters.pageSize);
    return api.get<GuestListResponse>('/guests', params);
  },

  async getById(id: string): Promise<Guest> {
    return api.get<Guest>(`/guests/${id}`);
  },

  async getStats(): Promise<GuestStats> {
    return api.get<GuestStats>('/guests/stats');
  },

  async getAnalytics(): Promise<GuestAnalytics> {
    return api.get<GuestAnalytics>('/guests/analytics');
  },

  async getBookings(guestId: string) {
    return api.get<unknown[]>(`/guests/${guestId}/bookings`);
  },

  async search(q: string): Promise<Guest[]> {
    return api.get<Guest[]>('/guests/search', { q });
  },

  async create(data: SaveGuestData): Promise<Guest> {
    return api.post<Guest>('/guests', data);
  },

  async update(id: string, data: SaveGuestData): Promise<Guest> {
    return api.put<Guest>(`/guests/${id}`, data);
  },

  async toggleVip(id: string, isVip: boolean): Promise<Guest> {
    return api.patch<Guest>(`/guests/${id}/vip`, { isVip });
  },

  async toggleBlacklist(id: string, isBlacklisted: boolean, reason?: string): Promise<Guest> {
    return api.patch<Guest>(`/guests/${id}/blacklist`, { isBlacklisted, reason });
  },

  async updateTags(id: string, tags: string[]): Promise<Guest> {
    return api.patch<Guest>(`/guests/${id}/tags`, { tags });
  },

  getExportUrl(): string {
    const baseUrl = import.meta.env.VITE_API_URL || '/api';
    return `${baseUrl}/guests/export`;
  },

  async exportCsv(): Promise<void> {
    const baseUrl = import.meta.env.VITE_API_URL || '/api';
    const auth = localStorage.getItem('hbs_auth');
    const token = auth ? JSON.parse(auth)?.token : '';
    const res = await fetch(`${baseUrl}/guests/export`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Falha ao exportar');
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hospedes_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  },
};
