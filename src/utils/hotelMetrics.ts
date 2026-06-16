import { parseISO, isSameDay, startOfDay, subMonths, subDays, startOfMonth, endOfMonth, getDaysInMonth } from 'date-fns';
import type { Booking, RevenueData, ChannelAnalyticsData } from '../types';

const DAY_MS = 86_400_000;

const ACTIVE: Booking['status'][] = ['confirmed', 'completed'];
const isLive = (b: Booking) => b.status !== 'cancelled' && b.status !== 'no_show';

export interface TodayOps {
  checkInsToday: number;
  checkOutsToday: number;
  inHouse: number;
  pending: number;
  arrivals: Booking[];
  departures: Booking[];
}

/** Operações do dia (chegadas, saídas, hóspedes no local, pendências). */
export function getTodayOps(bookings: Booking[] = [], now: Date = new Date()): TodayOps {
  const today = startOfDay(now).getTime();

  const arrivals = bookings.filter((b) => isLive(b) && isSameDay(parseISO(b.checkIn), now));
  const departures = bookings.filter((b) => isLive(b) && isSameDay(parseISO(b.checkOut), now));
  const inHouse = bookings.filter((b) => {
    if (!ACTIVE.includes(b.status)) return false;
    const ci = startOfDay(parseISO(b.checkIn)).getTime();
    const co = startOfDay(parseISO(b.checkOut)).getTime();
    return ci <= today && today < co;
  }).length;
  const pending = bookings.filter((b) => b.status === 'pending').length;

  return {
    checkInsToday: arrivals.length,
    checkOutsToday: departures.length,
    inHouse,
    pending,
    arrivals,
    departures,
  };
}

export interface HotelKpis {
  /** Taxa de ocupação (%). */
  occupancy: number;
  /** Diária média — Average Daily Rate. */
  adr: number;
  /** Receita por quarto disponível — RevPAR = ADR × ocupação. */
  revpar: number;
  /** Permanência média em noites — Length of Stay. */
  los: number;
}

/** KPIs hoteleiros derivados das reservas confirmadas/concluídas. */
export function getHotelKpis(bookings: Booking[] = [], occupancyRate = 0): HotelKpis {
  const active = bookings.filter((b) => ACTIVE.includes(b.status));
  const totalNights = active.reduce((s, b) => s + b.nights, 0);
  const totalRevenue = active.reduce((s, b) => s + b.totalPrice, 0);
  const adr = totalNights > 0 ? totalRevenue / totalNights : 0;
  const los = active.length > 0 ? totalNights / active.length : 0;
  const revpar = adr * (occupancyRate / 100);
  return { occupancy: occupancyRate, adr, revpar, los };
}

/** Quantas noites de uma reserva caem dentro do intervalo [start, end]. */
function nightsInRange(b: Booking, start: Date, end: Date): number {
  const ci = parseISO(b.checkIn);
  const co = parseISO(b.checkOut);
  const from = ci < start ? start : ci;
  const to = co > end ? end : co;
  const diff = Math.round((startOfDay(to).getTime() - startOfDay(from).getTime()) / DAY_MS);
  return diff > 0 ? diff : 0;
}

/** Ocupação (%) por mês, alinhada aos últimos `months` meses (mais antigo → mais recente). */
export function getMonthlyOccupancy(
  bookings: Booking[] = [],
  propertyCount = 1,
  months = 6,
  now: Date = new Date(),
): number[] {
  const pc = Math.max(propertyCount, 1);
  const out: number[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const monthDate = subMonths(now, i);
    const start = startOfMonth(monthDate);
    const end = endOfMonth(monthDate);
    const days = getDaysInMonth(monthDate);
    let bookedNights = 0;
    for (const b of bookings) {
      if (ACTIVE.includes(b.status)) bookedNights += nightsInRange(b, start, end);
    }
    out.push(Math.min(100, Math.round((bookedNights / (pc * days)) * 100)));
  }
  return out;
}

export interface DayOccupancy {
  date: Date;
  occupancy: number;
}

/** Ocupação (%) por dia do mês corrente (in-house no dia / propriedades). */
export function getCurrentMonthOccupancy(
  bookings: Booking[] = [],
  propertyCount = 1,
  now: Date = new Date(),
): DayOccupancy[] {
  const pc = Math.max(propertyCount, 1);
  const start = startOfMonth(now);
  const total = getDaysInMonth(now);
  const out: DayOccupancy[] = [];
  for (let d = 0; d < total; d++) {
    const day = startOfDay(subDays(start, -d)).getTime();
    let inHouse = 0;
    for (const b of bookings) {
      if (!ACTIVE.includes(b.status)) continue;
      const ci = startOfDay(parseISO(b.checkIn)).getTime();
      const co = startOfDay(parseISO(b.checkOut)).getTime();
      if (ci <= day && day < co) inHouse++;
    }
    out.push({ date: new Date(day), occupancy: Math.min(100, Math.round((inHouse / pc) * 100)) });
  }
  return out;
}

export type InsightTone = 'success' | 'info' | 'warning' | 'neutral';
export interface Insight {
  tone: InsightTone;
  text: string;
}

/** Destaques automáticos a partir da receita e dos canais. */
export function getInsights(
  revenueData: RevenueData[] = [],
  channelData: ChannelAnalyticsData[] = [],
): Insight[] {
  const insights: Insight[] = [];

  if (revenueData.length >= 2) {
    const last = revenueData[revenueData.length - 1];
    const prev = revenueData[revenueData.length - 2];
    if (prev.revenue > 0) {
      const delta = Math.round(((last.revenue - prev.revenue) / prev.revenue) * 100);
      insights.push({
        tone: delta >= 0 ? 'success' : 'warning',
        text: `Receita ${delta >= 0 ? '+' : ''}${delta}% vs. ${prev.month}`,
      });
    }
    const best = revenueData.reduce((a, b) => (b.revenue > a.revenue ? b : a));
    if (best.revenue > 0) insights.push({ tone: 'info', text: `Melhor mês: ${best.month}` });
  }

  if (channelData.length) {
    const top = channelData.reduce((a, b) => (b.count > a.count ? b : a));
    if (top.count > 0) insights.push({ tone: 'neutral', text: `Canal líder: ${top.channel} (${top.count})` });
  }

  return insights;
}
