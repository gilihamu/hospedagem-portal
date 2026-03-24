import type { Property, SearchFilters, PropertyStatus, PropertyReview, PropertyAvailability } from '../types';
import { api } from '../lib/api';
import { mockProperties } from '../mocks/data';
import { getItem, setItem } from '../utils/storage';

const STORAGE_KEY = 'hbs_properties';
const USE_API = !!import.meta.env.VITE_API_URL;

function getAllPropertiesLocal(): Property[] {
  const stored = getItem<Property[]>(STORAGE_KEY) || [];
  return [...mockProperties, ...stored];
}

function filtersToParams(filters?: SearchFilters): Record<string, string> {
  const p: Record<string, string> = {};
  if (!filters) return p;
  if (filters.city) p.city = filters.city;
  if (filters.type) p.type = filters.type;
  if (filters.minPrice !== undefined) p.minPrice = String(filters.minPrice);
  if (filters.maxPrice !== undefined) p.maxPrice = String(filters.maxPrice);
  if (filters.minRating !== undefined) p.minRating = String(filters.minRating);
  if (filters.guests !== undefined) p.guests = String(filters.guests);
  if (filters.amenities?.length) p.amenities = filters.amenities.join(',');
  if (filters.sortBy) p.sortBy = filters.sortBy;
  if (filters.checkIn) p.checkIn = filters.checkIn;
  if (filters.checkOut) p.checkOut = filters.checkOut;
  return p;
}

export const propertyService = {
  async getAll(filters?: SearchFilters): Promise<Property[]> {
    if (USE_API) {
      try {
        const res = await api.get<{ items: Property[]; totalCount: number }>(
          '/properties',
          filtersToParams(filters)
        );
        return res.items;
      } catch { /* fallback */ }
    }
    let properties = getAllPropertiesLocal().filter((p) => p.status === 'active');
    if (filters?.city) {
      const city = filters.city.toLowerCase();
      properties = properties.filter(
        (p) =>
          p.address.city.toLowerCase().includes(city) ||
          p.address.state.toLowerCase().includes(city) ||
          p.name.toLowerCase().includes(city)
      );
    }
    if (filters?.type) properties = properties.filter((p) => p.type === filters.type);
    if (filters?.minPrice !== undefined) properties = properties.filter((p) => p.pricePerNight >= filters.minPrice!);
    if (filters?.maxPrice !== undefined) properties = properties.filter((p) => p.pricePerNight <= filters.maxPrice!);
    if (filters?.minRating !== undefined) properties = properties.filter((p) => p.rating >= filters.minRating!);
    if (filters?.amenities?.length) properties = properties.filter((p) => filters.amenities!.every((a) => p.amenities.includes(a)));
    if (filters?.guests !== undefined) properties = properties.filter((p) => p.maxGuests >= filters.guests!);
    if (filters?.sortBy === 'price_asc') properties.sort((a, b) => a.pricePerNight - b.pricePerNight);
    else if (filters?.sortBy === 'price_desc') properties.sort((a, b) => b.pricePerNight - a.pricePerNight);
    else if (filters?.sortBy === 'rating') properties.sort((a, b) => b.rating - a.rating);
    return properties;
  },

  async getById(id: string): Promise<Property | undefined> {
    if (USE_API) {
      try {
        return await api.get<Property>(`/properties/${id}`);
      } catch { /* fallback */ }
    }
    return getAllPropertiesLocal().find((p) => p.id === id);
  },

  async getFeatured(): Promise<Property[]> {
    if (USE_API) {
      try {
        return await api.get<Property[]>('/properties/featured');
      } catch { /* fallback */ }
    }
    return getAllPropertiesLocal()
      .filter((p) => p.status === 'active')
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 6);
  },

  async getByOwner(ownerId: string): Promise<Property[]> {
    if (USE_API) {
      try {
        return await api.get<Property[]>(`/properties/owner/${ownerId}`);
      } catch { /* fallback */ }
    }
    return getAllPropertiesLocal().filter((p) => p.ownerId === ownerId);
  },

  async create(data: Omit<Property, 'id' | 'createdAt' | 'rating' | 'totalReviews'>): Promise<Property> {
    if (USE_API) {
      try {
        return await api.post<Property>('/properties', data);
      } catch { /* fallback */ }
    }
    const newProperty: Property = {
      ...data,
      id: `p${Date.now()}`,
      rating: 0,
      totalReviews: 0,
      createdAt: new Date().toISOString(),
    };
    const stored = getItem<Property[]>(STORAGE_KEY) || [];
    setItem(STORAGE_KEY, [...stored, newProperty]);
    return newProperty;
  },

  async update(id: string, data: Partial<Property>): Promise<Property> {
    if (USE_API) {
      try {
        return await api.put<Property>(`/properties/${id}`, data);
      } catch { /* fallback */ }
    }
    const all = getAllPropertiesLocal();
    const idx = all.findIndex((p) => p.id === id);
    if (idx < 0) throw new Error('Propriedade não encontrada');
    const updated = { ...all[idx], ...data };
    const stored = getItem<Property[]>(STORAGE_KEY) || [];
    const storedIdx = stored.findIndex((p) => p.id === id);
    if (storedIdx >= 0) stored[storedIdx] = updated;
    else stored.push(updated);
    setItem(STORAGE_KEY, stored);
    return updated;
  },

  async updateStatus(id: string, status: PropertyStatus): Promise<Property> {
    if (USE_API) {
      try {
        return await api.patch<Property>(`/properties/${id}/status`, { status });
      } catch { /* fallback */ }
    }
    return propertyService.update(id, { status });
  },

  async delete(id: string): Promise<void> {
    if (USE_API) {
      try {
        await api.delete(`/properties/${id}`);
        return;
      } catch { /* fallback */ }
    }
    const stored = getItem<Property[]>(STORAGE_KEY) || [];
    const isMock = mockProperties.find((p) => p.id === id);
    if (isMock) {
      await propertyService.update(id, { status: 'inactive' });
      return;
    }
    setItem(STORAGE_KEY, stored.filter((p) => p.id !== id));
  },

  async getAllForAdmin(): Promise<Property[]> {
    return getAllPropertiesLocal();
  },

  async uploadImages(propertyId: string, files: File[]): Promise<PropertyImage[]> {
    if (USE_API) {
      try {
        const formData = new FormData();
        // Backend accepts single file per request (IFormFile file)
        files.forEach((f) => formData.append('file', f));
        const res = await fetch(`${import.meta.env.VITE_API_URL}/properties/${propertyId}/images`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${localStorage.getItem('hbs_auth') ? JSON.parse(localStorage.getItem('hbs_auth')!).token : ''}` },
          body: formData,
        });
        if (!res.ok) throw new Error('Upload falhou');
        return await res.json();
      } catch { /* fallback */ }
    }
    // Mock: create fake image URLs from file names
    return files.map((f, i) => ({
      id: `img-${Date.now()}-${i}`,
      url: URL.createObjectURL(f),
      alt: f.name,
      isPrimary: i === 0,
    }));
  },

  async getReviews(propertyId: string): Promise<PropertyReview[]> {
    if (USE_API) {
      try {
        return await api.get<PropertyReview[]>(`/properties/${propertyId}/reviews`);
      } catch { /* fallback */ }
    }
    // Mock reviews
    const prop = getAllPropertiesLocal().find((p) => p.id === propertyId);
    if (!prop || prop.totalReviews === 0) return [];
    const names = ['Ana Clara', 'Pedro Henrique', 'Juliana Costa', 'Rafael Souza', 'Camila Lima'];
    return Array.from({ length: Math.min(prop.totalReviews, 5) }, (_, i) => ({
      id: `rev-${propertyId}-${i}`,
      propertyId,
      userId: `guest-${i}`,
      userName: names[i % names.length],
      rating: +(3.5 + Math.random() * 1.5).toFixed(1),
      comment: ['Ótima localização e atendimento!', 'Muito limpo e confortável.', 'Superou as expectativas. Voltarei com certeza!', 'Bom custo-benefício. Recomendo.', 'Excelente estadia, tudo perfeito.'][i % 5],
      createdAt: new Date(Date.now() - i * 7 * 24 * 60 * 60 * 1000).toISOString(),
    }));
  },

  async createReview(propertyId: string, data: { rating: number; comment: string; userId: string; userName: string }): Promise<PropertyReview> {
    if (USE_API) {
      try {
        return await api.post<PropertyReview>(`/properties/${propertyId}/reviews`, data);
      } catch { /* fallback */ }
    }
    return {
      id: `rev-${Date.now()}`,
      propertyId,
      userId: data.userId,
      userName: data.userName,
      rating: data.rating,
      comment: data.comment,
      createdAt: new Date().toISOString(),
    };
  },

  async getAvailability(propertyId: string, startDate?: string, endDate?: string): Promise<PropertyAvailability[]> {
    if (USE_API) {
      try {
        const params: Record<string, string> = {};
        if (startDate) params.from = startDate;
        if (endDate) params.to = endDate;
        return await api.get<PropertyAvailability[]>(`/properties/${propertyId}/availability`, params);
      } catch { /* fallback */ }
    }
    // Mock: generate 30 days of availability
    const start = startDate ? new Date(startDate) : new Date();
    const days = 30;
    const prop = getAllPropertiesLocal().find((p) => p.id === propertyId);
    return Array.from({ length: days }, (_, i) => {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      return {
        date: d.toISOString().split('T')[0],
        available: Math.random() > 0.3,
        price: prop ? prop.pricePerNight + Math.floor((Math.random() - 0.5) * 50) : 200,
      };
    });
  },
};

import type { PropertyImage } from '../types';
