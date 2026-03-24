import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { propertyService } from '../services/property.service';
import type { SearchFilters, Property } from '../types';

export function useProperties(filters?: SearchFilters) {
  return useQuery({
    queryKey: ['properties', filters],
    queryFn: () => propertyService.getAll(filters),
  });
}

export function useProperty(id: string) {
  return useQuery({
    queryKey: ['property', id],
    queryFn: () => propertyService.getById(id),
    enabled: !!id,
  });
}

export function useFeaturedProperties() {
  return useQuery({
    queryKey: ['properties', 'featured'],
    queryFn: () => propertyService.getFeatured(),
  });
}

export function useOwnerProperties(ownerId?: string) {
  return useQuery({
    queryKey: ['properties', 'owner', ownerId],
    queryFn: () => propertyService.getByOwner(ownerId!),
    enabled: !!ownerId,
  });
}

export function useCreateProperty() {
  const queryClient = useQueryClient();
  return useMutation<Property, Error, Omit<Property, 'id' | 'createdAt' | 'rating' | 'totalReviews'>>({
    mutationFn: (data) => propertyService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['properties'] });
    },
  });
}

export function useUpdateProperty() {
  const queryClient = useQueryClient();
  return useMutation<Property, Error, { id: string; data: Partial<Property> }>({
    mutationFn: ({ id, data }) => propertyService.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      queryClient.invalidateQueries({ queryKey: ['property', id] });
    },
  });
}

export function useDeleteProperty() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: (id) => propertyService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['properties'] });
    },
  });
}
