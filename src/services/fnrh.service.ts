import type { FnrhRecord, SaveFnrhData } from '../types';
import { api } from '../lib/api';

export const fnrhService = {
  async getAll(params?: Record<string, string>): Promise<FnrhRecord[]> {
    return api.get<FnrhRecord[]>('/fnrh', params);
  },

  async getById(id: string): Promise<FnrhRecord> {
    return api.get<FnrhRecord>(`/fnrh/${id}`);
  },

  async getByBookingAndGuest(bookingId: string, guestId: string): Promise<FnrhRecord | null> {
    try {
      return await api.get<FnrhRecord>(`/fnrh/booking/${bookingId}/guest/${guestId}`);
    } catch {
      return null;
    }
  },

  async getByGuest(guestId: string): Promise<FnrhRecord[]> {
    return api.get<FnrhRecord[]>(`/fnrh/guest/${guestId}`);
  },

  async prefill(bookingId: string): Promise<SaveFnrhData> {
    return api.get<SaveFnrhData>(`/fnrh/prefill/${bookingId}`);
  },

  async save(data: SaveFnrhData): Promise<FnrhRecord> {
    return api.post<FnrhRecord>('/fnrh', data);
  },

  async sign(id: string, signatureData: string): Promise<FnrhRecord> {
    return api.patch<FnrhRecord>(`/fnrh/${id}/sign`, { signatureData });
  },

  getExportUrl(from?: string, to?: string): string {
    const baseUrl = import.meta.env.VITE_API_URL || '/api';
    const params = new URLSearchParams();
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    const qs = params.toString() ? `?${params.toString()}` : '';
    return `${baseUrl}/fnrh/export${qs}`;
  },

  async exportCsv(from?: string, to?: string): Promise<void> {
    const baseUrl = import.meta.env.VITE_API_URL || '/api';
    const auth = localStorage.getItem('hbs_auth');
    const token = auth ? JSON.parse(auth)?.token : '';
    const params = new URLSearchParams();
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    const qs = params.toString() ? `?${params.toString()}` : '';
    const res = await fetch(`${baseUrl}/fnrh/export${qs}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Falha ao exportar FNRH');
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fnrh_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  },
};
