import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fnrhService } from '../services/fnrh.service';
import type { SaveFnrhData } from '../types';

const KEYS = {
  all: ['fnrh'] as const,
  detail: (id: string) => ['fnrh', id] as const,
  booking: (bookingId: string, guestId: string) => ['fnrh', 'booking', bookingId, guestId] as const,
  guest: (guestId: string) => ['fnrh', 'guest', guestId] as const,
  prefill: (bookingId: string) => ['fnrh', 'prefill', bookingId] as const,
};

export function useFnrhList(params?: Record<string, string>) {
  return useQuery({
    queryKey: [...KEYS.all, params] as const,
    queryFn: () => fnrhService.getAll(params),
  });
}

export function useFnrh(id?: string) {
  return useQuery({
    queryKey: KEYS.detail(id!),
    queryFn: () => fnrhService.getById(id!),
    enabled: !!id,
  });
}

export function useFnrhByBooking(bookingId?: string, guestId?: string) {
  return useQuery({
    queryKey: KEYS.booking(bookingId!, guestId!),
    queryFn: () => fnrhService.getByBookingAndGuest(bookingId!, guestId!),
    enabled: !!bookingId && !!guestId,
  });
}

export function useFnrhByGuest(guestId?: string) {
  return useQuery({
    queryKey: KEYS.guest(guestId!),
    queryFn: () => fnrhService.getByGuest(guestId!),
    enabled: !!guestId,
  });
}

export function useFnrhPrefill(bookingId?: string) {
  return useQuery({
    queryKey: KEYS.prefill(bookingId!),
    queryFn: () => fnrhService.prefill(bookingId!),
    enabled: !!bookingId,
  });
}

export function useSaveFnrh() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: SaveFnrhData) => fnrhService.save(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.all }),
  });
}

export function useSignFnrh() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, signatureData }: { id: string; signatureData: string }) =>
      fnrhService.sign(id, signatureData),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.all }),
  });
}
