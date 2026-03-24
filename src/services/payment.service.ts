import type { Payment, PaymentStatus } from '../types';
import { api } from '../lib/api';
import { getItem, setItem } from '../utils/storage';
import { mockBookings } from '../mocks/data';

const STORAGE_KEY = 'hbs_payments';
const USE_API = !!import.meta.env.VITE_API_URL;

function generateMockPayments(): Payment[] {
  const storedBookings = getItem<typeof mockBookings>('hbs_bookings') || [];
  const allBookings = [...mockBookings, ...storedBookings];

  return allBookings
    .filter(b => b.status === 'completed' || b.status === 'confirmed')
    .map(b => ({
      id: `pay_${b.id}`,
      bookingId: b.id,
      propertyId: b.propertyId,
      propertyName: b.propertyName,
      guestName: b.guestName,
      amount: b.totalPrice,
      currency: 'BRL',
      status: b.status === 'completed' ? 'completed' as PaymentStatus : 'pending' as PaymentStatus,
      method: (['credit_card', 'pix', 'debit_card', 'boleto'] as const)[Math.floor(Math.random() * 4)],
      gateway: 'stripe',
      transactionId: `txn_${b.id.slice(0, 8)}`,
      paidAt: b.status === 'completed' ? b.createdAt : undefined,
      createdAt: b.createdAt,
    }));
}

function getAllPaymentsLocal(): Payment[] {
  const stored = getItem<Payment[]>(STORAGE_KEY);
  if (stored && stored.length > 0) return stored;
  const generated = generateMockPayments();
  setItem(STORAGE_KEY, generated);
  return generated;
}

export const paymentService = {
  async getHistory(_hostId?: string): Promise<Payment[]> {
    if (USE_API) {
      try {
        // Backend accepts status, from, to (not hostId)
        const apiData = await api.get<Array<{
          id: string; bookingId: string; guestId: string; amount: number;
          currency: string; status: string; method: string; gatewayTransactionId?: string;
          paidAt?: string; refundedAt?: string; createdAt: string;
        }>>('/payments/history');
        // Map PaymentDto → frontend Payment
        return apiData.map((p) => ({
          id: p.id,
          bookingId: p.bookingId,
          propertyId: '',
          propertyName: '',
          guestName: '',
          amount: p.amount,
          currency: p.currency || 'BRL',
          status: p.status as PaymentStatus,
          method: p.method as Payment['method'],
          gateway: 'stripe',
          transactionId: p.gatewayTransactionId,
          paidAt: p.paidAt,
          refundedAt: p.refundedAt,
          createdAt: p.createdAt,
        }));
      } catch { /* fallback */ }
    }
    return getAllPaymentsLocal();
  },

  async getById(id: string): Promise<Payment | null> {
    if (USE_API) {
      try {
        return await api.get<Payment>(`/payments/${id}`);
      } catch { /* fallback */ }
    }
    return getAllPaymentsLocal().find(p => p.id === id) ?? null;
  },

  async processPayment(data: { bookingId: string; amount: number; method: string }): Promise<Payment> {
    if (USE_API) {
      try {
        return await api.post<Payment>('/payments/process', data);
      } catch { /* fallback */ }
    }
    const payment: Payment = {
      id: `pay_${Date.now()}`,
      bookingId: data.bookingId,
      propertyId: '',
      propertyName: '',
      guestName: '',
      amount: data.amount,
      currency: 'BRL',
      status: 'processing',
      method: data.method as Payment['method'],
      gateway: 'stripe',
      createdAt: new Date().toISOString(),
    };
    const all = getAllPaymentsLocal();
    all.unshift(payment);
    setItem(STORAGE_KEY, all);
    return payment;
  },

  async refund(paymentId: string, amount?: number, reason = 'Reembolso solicitado'): Promise<Payment> {
    if (USE_API) {
      try {
        // Backend requires paymentId, amount, and reason
        const payment = await this.getById(paymentId);
        return await api.post<Payment>('/payments/refund', {
          paymentId,
          amount: amount ?? payment?.amount ?? 0,
          reason,
        });
      } catch { /* fallback */ }
    }
    const all = getAllPaymentsLocal();
    const idx = all.findIndex(p => p.id === paymentId);
    if (idx < 0) throw new Error('Pagamento não encontrado');
    all[idx] = { ...all[idx], status: 'refunded', refundedAt: new Date().toISOString() };
    setItem(STORAGE_KEY, all);
    return all[idx];
  },
};
