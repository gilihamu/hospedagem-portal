import type { Branch } from '../types';
import { api } from '../lib/api';
import { mockBranches } from '../mocks/data';
import { getItem, setItem } from '../utils/storage';

const STORAGE_KEY = 'hbs_branches';
const USE_API = !!import.meta.env.VITE_API_URL;

interface ApiBranchResponse {
  id: string;
  businessId: string;
  name: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  phone?: string;
  email?: string;
  isMain: boolean;
  isActive: boolean;
  createdAt: string;
}

function mapApiBranch(b: ApiBranchResponse): Branch {
  return {
    id: b.id,
    propertyId: b.businessId,
    name: b.name,
    address: { street: b.street, number: b.number, complement: b.complement, neighborhood: b.neighborhood, city: b.city, state: b.state, zipCode: b.zipCode },
    phone: b.phone || '',
    email: b.email || '',
    manager: '',
    active: b.isActive,
    createdAt: b.createdAt,
  };
}

function getAllBranchesLocal(): Branch[] {
  const stored = getItem<Branch[]>(STORAGE_KEY) || [];
  const storedIds = new Set(stored.map((b) => b.id));
  const mockFiltered = mockBranches.filter((b) => !storedIds.has(b.id));
  return [...mockFiltered, ...stored];
}

function getBusinessId(): string | null {
  try {
    const auth = getItem<{ user: { tenantId?: string } }>('hbs_auth');
    return auth?.user?.tenantId || null;
  } catch { return null; }
}

export const branchService = {
  async getAll(businessId?: string): Promise<Branch[]> {
    const bId = businessId || getBusinessId();
    if (USE_API && bId) {
      try {
        const r = await api.get<ApiBranchResponse[]>(`/businesses/${bId}/branches`);
        return r.map(mapApiBranch);
      } catch { }
    }
    return getAllBranchesLocal();
  },
  async getByProperty(propertyId: string): Promise<Branch[]> { return branchService.getAll(propertyId); },
  async getById(id: string, businessId?: string): Promise<Branch | undefined> {
    const bId = businessId || getBusinessId();
    if (USE_API && bId) {
      try { return mapApiBranch(await api.get<ApiBranchResponse>(`/businesses/${bId}/branches/${id}`)); } catch { }
    }
    return getAllBranchesLocal().find((b) => b.id === id);
  },
  async create(data: Omit<Branch, 'id' | 'createdAt'>, businessId?: string): Promise<Branch> {
    const bId = businessId || getBusinessId();
    if (USE_API && bId) {
      try {
        const req = { name: data.name, street: data.address.street, number: data.address.number, complement: data.address.complement, neighborhood: data.address.neighborhood, city: data.address.city, state: data.address.state, zipCode: data.address.zipCode, phone: data.phone || undefined, email: data.email || undefined, isMain: false };
        return mapApiBranch(await api.post<ApiBranchResponse>(`/businesses/${bId}/branches`, req));
      } catch (err) { console.error(err); throw err; }
    }
    const newBranch: Branch = { ...data, id: `b${Date.now()}`, createdAt: new Date().toISOString() };
    const stored = getItem<Branch[]>(STORAGE_KEY) || [];
    setItem(STORAGE_KEY, [...stored, newBranch]);
    return newBranch;
  },
  async update(id: string, data: Partial<Branch>, businessId?: string): Promise<Branch> {
    const bId = businessId || getBusinessId();
    if (USE_API && bId && data.address && data.name) {
      try {
        const req = { name: data.name, street: data.address.street, number: data.address.number, complement: data.address.complement, neighborhood: data.address.neighborhood, city: data.address.city, state: data.address.state, zipCode: data.address.zipCode, phone: data.phone || undefined, email: data.email || undefined, isMain: false };
        return mapApiBranch(await api.put<ApiBranchResponse>(`/businesses/${bId}/branches/${id}`, req));
      } catch { }
    }
    const stored = getItem<Branch[]>(STORAGE_KEY) || [];
    const idx = stored.findIndex((b) => b.id === id);
    if (idx < 0) throw new Error('Filial não encontrada');
    stored[idx] = { ...stored[idx], ...data };
    setItem(STORAGE_KEY, stored);
    return stored[idx];
  },
  async delete(id: string, businessId?: string): Promise<void> {
    const bId = businessId || getBusinessId();
    if (USE_API && bId) {
      try { await api.delete(`/businesses/${bId}/branches/${id}`); return; } catch { }
    }
    const stored = getItem<Branch[]>(STORAGE_KEY) || [];
    setItem(STORAGE_KEY, stored.filter((b) => b.id !== id));
  },
  async toggleActive(id: string, businessId?: string): Promise<Branch> {
    const branch = await branchService.getById(id, businessId);
    if (!branch) throw new Error('Filial não encontrada');
    return await branchService.update(id, { active: !branch.active }, businessId);
  },
};
