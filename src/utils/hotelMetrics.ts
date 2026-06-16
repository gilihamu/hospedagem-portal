import { parseISO, isSameDay, startOfDay } from 'date-fns';
import type { Booking } from '../types';

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
