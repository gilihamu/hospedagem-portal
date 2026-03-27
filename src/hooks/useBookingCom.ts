import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bookingComService } from '../services/booking-com.service';
import type {
  SaveCredentialsRequest,
  ChannelCredentialStatus,
  CredentialTestResult,
  PropertyStatusResult,
  SyncLogEntry,
  ChannelReservation,
  FullSyncResult,
} from '../types';

// ── Credentials ──────────────────────────────────────────────────────────────
export function useBookingComCredentials() {
  return useQuery({
    queryKey: ['booking-com', 'credentials'],
    queryFn: () => bookingComService.getCredentialStatus(),
    retry: false,
  });
}

export function useSaveBookingComCredentials() {
  const qc = useQueryClient();
  return useMutation<{ message: string }, Error, SaveCredentialsRequest>({
    mutationFn: (data) => bookingComService.saveCredentials(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['booking-com', 'credentials'] });
    },
  });
}

export function useTestBookingComCredentials() {
  return useMutation<CredentialTestResult, Error>({
    mutationFn: () => bookingComService.testCredentials(),
  });
}

// ── Properties ───────────────────────────────────────────────────────────────
export function useBookingComProperties(enabled = true) {
  return useQuery({
    queryKey: ['booking-com', 'properties'],
    queryFn: () => bookingComService.listProperties(),
    enabled,
  });
}

export function useBookingComPropertyStatus(hotelCode?: string) {
  return useQuery({
    queryKey: ['booking-com', 'property-status', hotelCode],
    queryFn: () => bookingComService.getPropertyStatus(hotelCode!),
    enabled: !!hotelCode,
  });
}

// ── Sync ─────────────────────────────────────────────────────────────────────
export function useSyncLogs(propertyChannelId?: string) {
  return useQuery<SyncLogEntry[]>({
    queryKey: ['booking-com', 'sync-logs', propertyChannelId],
    queryFn: () => bookingComService.getSyncLogs(propertyChannelId!),
    enabled: !!propertyChannelId,
    refetchInterval: 30_000,
  });
}

export function useTriggerFullSync() {
  const qc = useQueryClient();
  return useMutation<FullSyncResult, Error, { hotelCode: string; propertyChannelId?: string }>({
    mutationFn: ({ hotelCode, propertyChannelId }) =>
      bookingComService.triggerFullSync(hotelCode, propertyChannelId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['booking-com', 'sync-logs'] });
      qc.invalidateQueries({ queryKey: ['booking-com', 'properties'] });
    },
  });
}

// ── Reservations ─────────────────────────────────────────────────────────────
export function useChannelReservations(propertyChannelId?: string) {
  return useQuery<ChannelReservation[]>({
    queryKey: ['booking-com', 'reservations', propertyChannelId],
    queryFn: () => bookingComService.getReservations(propertyChannelId!),
    enabled: !!propertyChannelId,
    refetchInterval: 60_000,
  });
}

export function useUnprocessedReservations(propertyChannelId?: string) {
  return useQuery<ChannelReservation[]>({
    queryKey: ['booking-com', 'reservations', 'unprocessed', propertyChannelId],
    queryFn: () => bookingComService.getUnprocessedReservations(propertyChannelId!),
    enabled: !!propertyChannelId,
    refetchInterval: 30_000,
  });
}

export function usePullReservations() {
  const qc = useQueryClient();
  return useMutation<unknown, Error, { hotelCode: string; propertyChannelId: string; since?: string }>({
    mutationFn: ({ hotelCode, propertyChannelId, since }) =>
      bookingComService.pullReservations(hotelCode, propertyChannelId, since),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['booking-com', 'reservations'] });
    },
  });
}
