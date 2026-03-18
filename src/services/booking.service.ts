import type { Booking, BookingStatus, BookingCalendarEntry } from '../types';
import { api } from '../lib/api';
import { mockBookings } from '../mocks/data';
import { getItem, setItem } from '../utils/storage';
import { differenceInDays } from '../utils/dates';

const STORAGE_KEY = 'hbs_bookings';
const USE_API = !!import.meta.env.VITE_API_URL;

function getAllBookingsLocal(): Booking[] {
  const stored = getItem<Booking[]>(STORAGE_KEY) || [];
  const storedIds = new Set(stored.map((b) => b.id));
  const mockFiltered = mockBookings.filter((b) => !storedIds.has(b.id));
  return [...mockFiltered, ...stored];
}

function generateConfirmationCode(): string {
  const year = new Date().getFullYear();
  const num = Math.floor(Math.random() * 9000) + 1000;
  return `HBS-${year}-${num}`;
}

export interface CreateBookingData {
  propertyId: string;
  guestId: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  specialRequests?: string;
  customPricePerNight?: number;
}

export interface PriceBreakdown {
  nights: number;
  pricePerNight: number;
  subtotal: number;
  taxes: number;
  totalPrice: number;
}

// Store mock property data inline to avoid circular async dependency
import { mockProperties } from '../mocks/data';

function getPropertySync(id: string) {
  const stored = getItem<import('../types').Property[]>('hbs_properties') || [];
  return [...mockProperties, ...stored].find((p) => p.id === id);
}

export const bookingService = {
  async getAll(filters?: { status?: BookingStatus }): Promise<Booking[]> {
    if (USE_API) {
      try {
        const params: Record<string, string> = {};
        if (filters?.status) params.status = filters.status;
        const res = await api.get<{ items: Booking[]; totalCount: number }>('/bookings', params);
        return res.items;
      } catch { /* fallback */ }
    }
    let bookings = getAllBookingsLocal();
    if (filters?.status) bookings = bookings.filter((b) => b.status === filters.status);
    return bookings.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  async getById(id: string): Promise<Booking | undefined> {
    if (USE_API) {
      try {
        return await api.get<Booking>(`/bookings/${id}`);
      } catch { /* fallback */ }
    }
    return getAllBookingsLocal().find((b) => b.id === id);
  },

  async getByGuest(guestId: string): Promise<Booking[]> {
    if (USE_API) {
      try {
        return await api.get<Booking[]>(`/bookings/guest/${guestId}`);
      } catch { /* fallback */ }
    }
    return getAllBookingsLocal()
      .filter((b) => b.guestId === guestId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  async getByHost(hostId: string): Promise<Booking[]> {
    if (USE_API) {
      try {
        return await api.get<Booking[]>(`/bookings/host/${hostId}`);
      } catch { /* fallback */ }
    }
    return getAllBookingsLocal()
      .filter((b) => b.hostId === hostId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  async create(data: CreateBookingData): Promise<Booking> {
    if (USE_API) {
      try {
        return await api.post<Booking>('/bookings', data);
      } catch { /* fallback */ }
    }
    const property = getPropertySync(data.propertyId);
    if (!property) throw new Error('Propriedade não encontrada');

    const nights = differenceInDays(data.checkOut, data.checkIn);
    if (nights <= 0) throw new Error('Datas inválidas');

    const breakdown = bookingService.calculatePriceSync(data.propertyId, data.checkIn, data.checkOut, data.guests);

    const newBooking: Booking = {
      id: `bk${Date.now()}`,
      propertyId: data.propertyId,
      propertyName: property.name,
      propertyImage: property.images.find((i) => i.isPrimary)?.url,
      propertyCity: property.address.city,
      guestId: data.guestId,
      guestName: data.guestName,
      guestEmail: data.guestEmail,
      guestPhone: data.guestPhone,
      hostId: property.ownerId,
      checkIn: data.checkIn,
      checkOut: data.checkOut,
      guests: data.guests,
      nights: breakdown.nights,
      pricePerNight: breakdown.pricePerNight,
      subtotal: breakdown.subtotal,
      taxes: breakdown.taxes,
      totalPrice: breakdown.totalPrice,
      status: 'pending',
      specialRequests: data.specialRequests,
      createdAt: new Date().toISOString(),
      confirmationCode: generateConfirmationCode(),
    };

    const stored = getItem<Booking[]>(STORAGE_KEY) || [];
    setItem(STORAGE_KEY, [...stored, newBooking]);
    return newBooking;
  },

  async updateStatus(id: string, status: BookingStatus): Promise<Booking> {
    if (USE_API) {
      try {
        return await api.patch<Booking>(`/bookings/${id}/status`, { status });
      } catch { /* fallback */ }
    }
    const stored = getItem<Booking[]>(STORAGE_KEY) || [];
    const isMock = mockBookings.find((b) => b.id === id);
    if (isMock) {
      const updated = { ...isMock, status };
      const existingIdx = stored.findIndex((b) => b.id === id);
      if (existingIdx >= 0) stored[existingIdx] = updated;
      else stored.push(updated);
      setItem(STORAGE_KEY, stored);
      return updated;
    }
    const idx = stored.findIndex((b) => b.id === id);
    if (idx < 0) throw new Error('Reserva não encontrada');
    stored[idx] = { ...stored[idx], status };
    setItem(STORAGE_KEY, stored);
    return stored[idx];
  },

  calculatePriceSync(propertyId: string, checkIn: string, checkOut: string, _guests: number): PriceBreakdown {
    const property = getPropertySync(propertyId);
    if (!property) throw new Error('Propriedade não encontrada');
    const nights = Math.max(1, differenceInDays(checkOut, checkIn));
    const pricePerNight = property.pricePerNight;
    const subtotal = pricePerNight * nights;
    const taxes = Math.round(subtotal * 0.1);
    return { nights, pricePerNight, subtotal, taxes, totalPrice: subtotal + taxes };
  },

  async cancel(id: string, reason = 'Cancelado pelo usuário'): Promise<Booking> {
    if (USE_API) {
      try {
        return await api.post<Booking>(`/bookings/${id}/cancel`, { reason });
      } catch { /* fallback */ }
    }
    return bookingService.updateStatus(id, 'cancelled');
  },

  async getByCode(code: string): Promise<Booking | undefined> {
    if (USE_API) {
      try {
        return await api.get<Booking>(`/bookings/code/${code}`);
      } catch { /* fallback */ }
    }
    return getAllBookingsLocal().find((b) => b.confirmationCode === code);
  },

  async getCalendar(propertyId: string): Promise<BookingCalendarEntry[]> {
    if (USE_API) {
      try {
        return await api.get<BookingCalendarEntry[]>(`/bookings/calendar/${propertyId}`);
      } catch { /* fallback */ }
    }
    return getAllBookingsLocal()
      .filter((b) => b.propertyId === propertyId && b.status !== 'cancelled')
      .map((b) => ({
        id: b.id,
        guestName: b.guestName,
        checkIn: b.checkIn,
        checkOut: b.checkOut,
        status: b.status,
      }));
  },

  async calculatePrice(propertyId: string, checkIn: string, checkOut: string, guests: number): Promise<PriceBreakdown> {
    if (USE_API) {
      try {
        return await api.post<PriceBreakdown>('/bookings/calculate-price', {
          propertyId, checkIn, checkOut, guests,
        });
      } catch { /* fallback */ }
    }
    return this.calculatePriceSync(propertyId, checkIn, checkOut, guests);
  },
};
