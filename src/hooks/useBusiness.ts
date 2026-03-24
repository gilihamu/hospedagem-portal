import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { businessService } from '../services/business.service';
import type { Business } from '../types';

export function useBusinessByOwner(ownerId?: string) {
  return useQuery({
    queryKey: ['businesses', 'owner', ownerId],
    queryFn: () => businessService.getByOwner(ownerId!),
    enabled: !!ownerId,
  });
}

export function useBusiness(id?: string) {
  return useQuery({
    queryKey: ['business', id],
    queryFn: () => businessService.getById(id!),
    enabled: !!id,
  });
}

export function useCreateBusiness() {
  const qc = useQueryClient();
  return useMutation<Business, Error, Omit<Business, 'id' | 'createdAt'>>({
    mutationFn: (data) => businessService.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['businesses'] }),
  });
}

export function useUpdateBusiness() {
  const qc = useQueryClient();
  return useMutation<Business, Error, { id: string; data: Partial<Business> }>({
    mutationFn: ({ id, data }) => businessService.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['businesses'] }),
  });
}

export function useAdvanceOnboardingStep() {
  return useMutation<void, Error, number>({
    mutationFn: (step) => businessService.updateOnboardingStep(step),
  });
}

export function useCompleteOnboarding() {
  const qc = useQueryClient();
  return useMutation<void, Error, void>({
    mutationFn: () => businessService.completeOnboarding(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['businesses'] }),
  });
}
