import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { branchService } from '../services/branch.service';
import type { Branch } from '../types';

export function useBranches(ownerId?: string) {
  return useQuery({
    queryKey: ['branches', ownerId],
    queryFn: () => branchService.getAll(ownerId),
  });
}

export function useBranchesByProperty(propertyId?: string) {
  return useQuery({
    queryKey: ['branches', 'property', propertyId],
    queryFn: () => branchService.getByProperty(propertyId!),
    enabled: !!propertyId,
  });
}

export function useCreateBranch() {
  const queryClient = useQueryClient();
  return useMutation<Branch, Error, Omit<Branch, 'id' | 'createdAt'>>({
    mutationFn: (data) => branchService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches'] });
    },
  });
}

export function useUpdateBranch() {
  const queryClient = useQueryClient();
  return useMutation<Branch, Error, { id: string; data: Partial<Branch> }>({
    mutationFn: ({ id, data }) => branchService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches'] });
    },
  });
}

export function useDeleteBranch() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: (id) => branchService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches'] });
    },
  });
}
