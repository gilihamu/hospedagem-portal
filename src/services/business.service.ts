import type { Business } from '../types';
import { api } from '../lib/api';
import { mockBusinesses } from '../mocks/data';
import { getItem, setItem } from '../utils/storage';

const STORAGE_KEY = 'hbs_businesses';
const USE_API = !!import.meta.env.VITE_API_URL;

function getAllBusinessesLocal(): Business[] {
  const stored = getItem<Business[]>(STORAGE_KEY) || [];
  const storedIds = new Set(stored.map((b) => b.id));
  const mockFiltered = mockBusinesses.filter((b) => !storedIds.has(b.id));
  return [...mockFiltered, ...stored];
}

export const businessService = {
  async getAll(): Promise<Business[]> {
    return getAllBusinessesLocal();
  },

  async getByOwner(ownerId: string): Promise<Business | null> {
    if (USE_API) {
      try {
        return await api.get<Business>('/business');
      } catch { /* fallback */ }
    }
    return getAllBusinessesLocal().find((b) => b.ownerId === ownerId) ?? null;
  },

  async getById(id: string): Promise<Business | null> {
    return getAllBusinessesLocal().find((b) => b.id === id) ?? null;
  },

  async create(data: Omit<Business, 'id' | 'createdAt'>): Promise<Business> {
    if (USE_API) {
      try {
        return await api.post<Business>('/business', data);
      } catch { /* fallback */ }
    }
    const newBusiness: Business = {
      ...data,
      id: `biz${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    const stored = getItem<Business[]>(STORAGE_KEY) || [];
    setItem(STORAGE_KEY, [...stored, newBusiness]);
    return newBusiness;
  },

  async update(id: string, data: Partial<Business>): Promise<Business> {
    if (USE_API) {
      try {
        return await api.put<Business>('/business', data);
      } catch { /* fallback */ }
    }
    const all = getAllBusinessesLocal();
    const idx = all.findIndex((b) => b.id === id);
    if (idx < 0) throw new Error('Empresa não encontrada');
    const updated = { ...all[idx], ...data };
    const stored = getItem<Business[]>(STORAGE_KEY) || [];
    const sIdx = stored.findIndex((b) => b.id === id);
    if (sIdx >= 0) stored[sIdx] = updated;
    else stored.push(updated);
    setItem(STORAGE_KEY, stored);
    return updated;
  },

  async updateOnboardingStep(step: number): Promise<void> {
    if (USE_API) {
      try {
        await api.put('/business/onboarding/step', { step });
        return;
      } catch { /* fallback */ }
    }
  },

  async completeOnboarding(): Promise<void> {
    if (USE_API) {
      try {
        await api.post('/business/onboarding/complete');
        return;
      } catch { /* fallback */ }
    }
  },

  async uploadLogo(file: File): Promise<string> {
    if (USE_API) {
      try {
        const formData = new FormData();
        formData.append('file', file);
        const res = await fetch(`${import.meta.env.VITE_API_URL}/business/logo`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${localStorage.getItem('hbs_auth') ? JSON.parse(localStorage.getItem('hbs_auth')!).token : ''}` },
          body: formData,
        });
        if (!res.ok) throw new Error('Upload falhou');
        const data = await res.json();
        return data.url;
      } catch { /* fallback */ }
    }
    // Mock: return object URL
    return URL.createObjectURL(file);
  },
};
