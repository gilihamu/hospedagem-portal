import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { guestService, type GuestFilters } from '../services/guest.service';
import type { SaveGuestData } from '../types';

const KEYS = {
  all: ['guests'] as const,
  list: (f?: GuestFilters) => ['guests', 'list', f] as const,
  detail: (id: string) => ['guests', id] as const,
  stats: ['guests', 'stats'] as const,
  bookings: (id: string) => ['guests', id, 'bookings'] as const,
  search: (q: string) => ['guests', 'search', q] as const,
};

export function useGuests(filters?: GuestFilters) {
  return useQuery({
    queryKey: KEYS.list(filters),
    queryFn: () => guestService.getAll(filters),
  });
}

export function useGuest(id?: string) {
  return useQuery({
    queryKey: KEYS.detail(id!),
    queryFn: () => guestService.getById(id!),
    enabled: !!id,
  });
}

export function useGuestStats() {
  return useQuery({
    queryKey: KEYS.stats,
    queryFn: () => guestService.getStats(),
  });
}

export function useGuestAnalytics() {
  return useQuery({
    queryKey: [...KEYS.stats, 'analytics'] as const,
    queryFn: () => guestService.getAnalytics(),
  });
}

export function useGuestBookingHistory(guestId?: string) {
  return useQuery({
    queryKey: KEYS.bookings(guestId!),
    queryFn: () => guestService.getBookings(guestId!),
    enabled: !!guestId,
  });
}

export function useGuestSearch(q: string) {
  return useQuery({
    queryKey: KEYS.search(q),
    queryFn: () => guestService.search(q),
    enabled: q.length >= 2,
    staleTime: 10_000,
  });
}

export function useCreateGuest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: SaveGuestData) => guestService.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.all }),
  });
}

export function useUpdateGuest(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: SaveGuestData) => guestService.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.all });
      qc.invalidateQueries({ queryKey: KEYS.detail(id) });
    },
  });
}

export function useToggleVip() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isVip }: { id: string; isVip: boolean }) =>
      guestService.toggleVip(id, isVip),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: KEYS.all });
      qc.invalidateQueries({ queryKey: KEYS.detail(id) });
      qc.invalidateQueries({ queryKey: KEYS.stats });
    },
  });
}

export function useToggleBlacklist() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isBlacklisted, reason }: { id: string; isBlacklisted: boolean; reason?: string }) =>
      guestService.toggleBlacklist(id, isBlacklisted, reason),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: KEYS.all });
      qc.invalidateQueries({ queryKey: KEYS.detail(id) });
      qc.invalidateQueries({ queryKey: KEYS.stats });
    },
  });
}

export function useUpdateGuestTags(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (tags: string[]) => guestService.updateTags(id, tags),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.all });
      qc.invalidateQueries({ queryKey: KEYS.detail(id) });
    },
  });
}
