import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { paymentService } from '../services/payment.service';

export function usePaymentHistory(hostId?: string) {
  return useQuery({
    queryKey: ['payments', 'history', hostId],
    queryFn: () => paymentService.getHistory(hostId),
  });
}

export function usePayment(id?: string) {
  return useQuery({
    queryKey: ['payment', id],
    queryFn: () => paymentService.getById(id!),
    enabled: !!id,
  });
}

export function useProcessPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { bookingId: string; amount: number; method: string }) =>
      paymentService.processPayment(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['payments'] }),
  });
}

export function useRefund() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (paymentId: string) => paymentService.refund(paymentId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['payments'] }),
  });
}
