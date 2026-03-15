import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { guestGuideService } from '../services/guestGuide.service';
import type { GuestGuide, GuestFeedbackType } from '../types';

// ── Query keys ────────────────────────────────────────────────────────────────
const KEYS = {
  byHost:     (hostId?: string)    => ['guest-guides', 'host', hostId],
  byProperty: (propId?: string)    => ['guest-guides', 'property', propId],
  byCode:     (code?: string)      => ['guest-guides', 'code', code],
  feedbacks:  (propId?: string)    => ['guest-feedbacks', propId],
};

// ── Queries ───────────────────────────────────────────────────────────────────
export function useGuestGuidesByHost(hostId?: string) {
  return useQuery({
    queryKey: KEYS.byHost(hostId),
    queryFn:  () => guestGuideService.getByHost(hostId!),
    enabled:  !!hostId,
  });
}

export function useGuestGuideByProperty(propertyId?: string) {
  return useQuery({
    queryKey: KEYS.byProperty(propertyId),
    queryFn:  () => guestGuideService.getByProperty(propertyId!),
    enabled:  !!propertyId,
  });
}

export function useGuestPortal(confirmationCode?: string) {
  return useQuery({
    queryKey: KEYS.byCode(confirmationCode),
    queryFn:  () => guestGuideService.getByConfirmationCode(confirmationCode!),
    enabled:  !!confirmationCode,
    retry:    false,
  });
}

export function useFeedbacksByProperty(propertyId?: string) {
  return useQuery({
    queryKey: KEYS.feedbacks(propertyId),
    queryFn:  () => guestGuideService.getFeedbacksByProperty(propertyId!),
    enabled:  !!propertyId,
  });
}

// ── Mutations ─────────────────────────────────────────────────────────────────
export function useSaveGuestGuide() {
  const qc = useQueryClient();
  return useMutation<GuestGuide, Error, GuestGuide>({
    mutationFn: guide => guestGuideService.save(guide),
    onSuccess: (saved) => {
      qc.invalidateQueries({ queryKey: ['guest-guides'] });
      qc.setQueryData(KEYS.byProperty(saved.propertyId), saved);
    },
  });
}

export function useCreateGuestGuide() {
  const qc = useQueryClient();
  return useMutation<GuestGuide, Error, { propertyId: string; propertyName: string; hostName: string }>({
    mutationFn: ({ propertyId, propertyName, hostName }) =>
      guestGuideService.create(propertyId, propertyName, hostName),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['guest-guides'] }),
  });
}

export function useSubmitFeedback() {
  const qc = useQueryClient();
  return useMutation<
    Awaited<ReturnType<typeof guestGuideService.submitFeedback>>,
    Error,
    {
      bookingId?: string;
      propertyId: string;
      propertyName: string;
      guestName: string;
      guestEmail?: string;
      type: GuestFeedbackType;
      rating?: number;
      message: string;
    }
  >({
    mutationFn: data => guestGuideService.submitFeedback(data),
    onSuccess:  ()   => qc.invalidateQueries({ queryKey: ['guest-feedbacks'] }),
  });
}
