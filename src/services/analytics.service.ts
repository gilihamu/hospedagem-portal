import type { AnalyticsSummary, RevenueData, OccupancyData, ChannelAnalyticsData, Property, Booking, ChannelSlug } from '../types';
import { api } from '../lib/api';
import { mockBookings } from '../mocks/data';
import { mockProperties } from '../mocks/data';
import { getItem } from '../utils/storage';
import { subMonths, format, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const USE_API = !!import.meta.env.VITE_API_URL;

// Local fallback helpers
function getBookingsSync(hostId?: string): Booking[] {
  const stored = getItem<Booking[]>('hbs_bookings') || [];
  const storedIds = new Set(stored.map((b) => b.id));
  const all = [...mockBookings.filter((b) => !storedIds.has(b.id)), ...stored];
  return hostId ? all.filter((b) => b.hostId === hostId) : all;
}

function getPropertiesSync(hostId?: string): Property[] {
  const stored = getItem<Property[]>('hbs_properties') || [];
  const storedIds = new Set(stored.map((p) => p.id));
  const all = [...mockProperties.filter((p) => !storedIds.has(p.id)), ...stored];
  return hostId ? all.filter((p) => p.ownerId === hostId) : all;
}

export const analyticsService = {
  async getSummary(hostId?: string): Promise<AnalyticsSummary> {
    if (USE_API) {
      try {
        const params: Record<string, string> = {};
        if (hostId) params.hostId = hostId;
        return await api.get<AnalyticsSummary>('/analytics/summary', params);
      } catch { /* fallback */ }
    }
    const allBookings = getBookingsSync(hostId);
    const completedAndConfirmed = allBookings.filter(
      (b) => b.status === 'completed' || b.status === 'confirmed'
    );

    const now = new Date();
    const thisMonth = completedAndConfirmed.filter((b) => {
      const d = new Date(b.createdAt);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
    const lastMonth = completedAndConfirmed.filter((b) => {
      const d = new Date(b.createdAt);
      const lm = subMonths(now, 1);
      return d.getMonth() === lm.getMonth() && d.getFullYear() === lm.getFullYear();
    });

    const totalRevenue = completedAndConfirmed.reduce((sum, b) => sum + b.totalPrice, 0);
    const thisMonthRevenue = thisMonth.reduce((sum, b) => sum + b.totalPrice, 0);
    const lastMonthRevenue = lastMonth.reduce((sum, b) => sum + b.totalPrice, 0);
    const revenueGrowth = lastMonthRevenue > 0
      ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100
      : 0;

    const totalBookings = allBookings.length;
    const thisMonthBookings = allBookings.filter((b) => {
      const d = new Date(b.createdAt);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;
    const lastMonthBookings = allBookings.filter((b) => {
      const d = new Date(b.createdAt);
      const lm = subMonths(now, 1);
      return d.getMonth() === lm.getMonth() && d.getFullYear() === lm.getFullYear();
    }).length;
    const bookingsGrowth = lastMonthBookings > 0
      ? ((thisMonthBookings - lastMonthBookings) / lastMonthBookings) * 100
      : 0;

    const properties = getPropertiesSync(hostId);
    const activeProperties = properties.filter((p) => p.status === 'active').length;
    const propertiesWithRating = properties.filter((p) => p.totalReviews > 0);
    const averageRating = propertiesWithRating.length > 0
      ? propertiesWithRating.reduce((sum, p) => sum + p.rating, 0) / propertiesWithRating.length
      : 0;

    return {
      totalRevenue,
      revenueGrowth: Math.round(revenueGrowth),
      totalBookings,
      bookingsGrowth: Math.round(bookingsGrowth),
      activeProperties,
      averageRating: Math.round(averageRating * 10) / 10,
      occupancyRate: 68,
    };
  },

  async getRevenueData(hostId?: string, months = 6): Promise<RevenueData[]> {
    if (USE_API) {
      try {
        const params: Record<string, string> = { months: String(months) };
        if (hostId) params.hostId = hostId;
        return await api.get<RevenueData[]>('/analytics/revenue', params);
      } catch { /* fallback */ }
    }
    const allBookings = getBookingsSync(hostId);
    const now = new Date();
    const data: RevenueData[] = [];

    for (let i = months - 1; i >= 0; i--) {
      const monthDate = subMonths(now, i);
      const start = startOfMonth(monthDate);
      const end = endOfMonth(monthDate);
      const monthBookings = allBookings.filter((b) => {
        const d = new Date(b.createdAt);
        return isWithinInterval(d, { start, end }) &&
          (b.status === 'completed' || b.status === 'confirmed');
      });
      data.push({
        month: format(monthDate, 'MMM/yy', { locale: ptBR }),
        revenue: monthBookings.reduce((sum, b) => sum + b.totalPrice, 0),
        bookings: monthBookings.length,
      });
    }
    return data;
  },

  async getOccupancyData(hostId?: string): Promise<OccupancyData[]> {
    if (USE_API) {
      try {
        const params: Record<string, string> = {};
        if (hostId) params.hostId = hostId;
        return await api.get<OccupancyData[]>('/analytics/occupancy', params);
      } catch { /* fallback */ }
    }
    const properties = getPropertiesSync(hostId);
    const allBookings = getBookingsSync(hostId);

    return properties
      .filter((p) => p.status === 'active')
      .map((p) => {
        const propBookings = allBookings.filter(
          (b) => b.propertyId === p.id && (b.status === 'completed' || b.status === 'confirmed')
        );
        const totalNights = propBookings.reduce((sum, b) => sum + b.nights, 0);
        const occupancy = Math.min(100, Math.round((totalNights / 90) * 100));
        return {
          property: p.name.length > 20 ? p.name.slice(0, 20) + '...' : p.name,
          occupancy,
        };
      });
  },

  async getTopProperties(hostId?: string): Promise<Array<Property & { revenue: number; bookingCount: number }>> {
    if (USE_API) {
      try {
        const params: Record<string, string> = { count: '5' };
        if (hostId) params.hostId = hostId;
        // Backend returns TopPropertyDto[] with { propertyId, propertyName, revenue, bookings, averageRating }
        const apiData = await api.get<Array<{
          propertyId: string; propertyName: string; revenue: number;
          bookings: number; averageRating: number;
        }>>('/analytics/top-properties', params);
        // Map to frontend format (partial Property + revenue/bookingCount)
        return apiData.map((tp) => ({
          id: tp.propertyId,
          name: tp.propertyName,
          revenue: tp.revenue,
          bookingCount: tp.bookings,
          rating: tp.averageRating,
        } as Property & { revenue: number; bookingCount: number }));
      } catch { /* fallback */ }
    }
    const properties = getPropertiesSync(hostId);
    const allBookings = getBookingsSync(hostId);

    return properties
      .map((p) => {
        const propBookings = allBookings.filter(
          (b) => b.propertyId === p.id && (b.status === 'completed' || b.status === 'confirmed')
        );
        const revenue = propBookings.reduce((sum, b) => sum + b.totalPrice, 0);
        return { ...p, revenue, bookingCount: propBookings.length };
      })
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  },

  async getBookingsByChannel(hostId?: string): Promise<ChannelAnalyticsData[]> {
    if (USE_API) {
      try {
        const params: Record<string, string> = {};
        if (hostId) params.hostId = hostId;
        // Backend returns ChannelPerformanceDto[] with { channel, bookings, revenue, percentage }
        const channelColors: Record<string, string> = {
          booking_com: '#003580', airbnb: '#FF5A5F', vrbo: '#3F51B5',
          expedia: '#FFCC00', tripadvisor: '#00AF87', decolar: '#FF6600',
        };
        const apiData = await api.get<Array<{
          channel: string; bookings: number; revenue: number; percentage: number;
        }>>('/analytics/bookings-by-channel', params);
        return apiData.map((d) => {
          const slug = d.channel.toLowerCase().replace(/[.\s]/g, '_') as ChannelSlug;
          return {
            channel: d.channel,
            slug,
            count: d.bookings,
            revenue: d.revenue,
            color: channelColors[slug] || '#1E3A5F',
          };
        });
      } catch { /* fallback */ }
    }
    const allBookings = getBookingsSync(hostId);
    const channelColors: Record<string, string> = {
      booking_com: '#003580', airbnb: '#FF5A5F', vrbo: '#3F51B5',
      expedia: '#FFCC00', tripadvisor: '#00AF87', decolar: '#FF6600',
    };
    const channelNames: Record<string, string> = {
      booking_com: 'Booking.com', airbnb: 'Airbnb', vrbo: 'Vrbo',
      expedia: 'Expedia', tripadvisor: 'TripAdvisor', decolar: 'Decolar',
    };
    const grouped: Record<string, { count: number; revenue: number }> = {};
    for (const b of allBookings) {
      const key = b.channelSource || 'direct';
      if (!grouped[key]) grouped[key] = { count: 0, revenue: 0 };
      grouped[key].count++;
      if (b.status === 'completed' || b.status === 'confirmed') {
        grouped[key].revenue += b.totalPrice;
      }
    }
    return Object.entries(grouped).map(([slug, data]) => ({
      channel: channelNames[slug] || 'Direto',
      slug: slug as ChannelSlug,
      count: data.count,
      revenue: data.revenue,
      color: channelColors[slug] || '#1E3A5F',
    }));
  },

  async exportReport(format: 'csv' | 'pdf' = 'csv', _hostId?: string): Promise<Blob> {
    if (USE_API) {
      try {
        const now = new Date();
        const from = new Date(now.getFullYear(), now.getMonth() - 6, 1).toISOString();
        const to = now.toISOString();
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/analytics/reports/export`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${localStorage.getItem('hbs_auth') ? JSON.parse(localStorage.getItem('hbs_auth')!).token : ''}`,
            },
            body: JSON.stringify({ format, from, to }),
          }
        );
        return await response.blob();
      } catch { /* fallback */ }
    }
    // Mock CSV export
    const bookings = getBookingsSync(_hostId);
    const header = 'Código,Propriedade,Hóspede,Check-in,Check-out,Noites,Valor,Status\n';
    const rows = bookings.map(b =>
      `${b.confirmationCode},${b.propertyName},${b.guestName},${b.checkIn},${b.checkOut},${b.nights},${b.totalPrice},${b.status}`
    ).join('\n');
    return new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
  },
};
