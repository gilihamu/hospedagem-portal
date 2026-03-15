import { useQuery } from '@tanstack/react-query';
import { analyticsService } from '../services/analytics.service';

export function useAnalyticsSummary(hostId?: string) {
  return useQuery({
    queryKey: ['analytics', 'summary', hostId],
    queryFn: () => analyticsService.getSummary(hostId),
  });
}

export function useRevenueData(hostId?: string, months = 6) {
  return useQuery({
    queryKey: ['analytics', 'revenue', hostId, months],
    queryFn: () => analyticsService.getRevenueData(hostId, months),
  });
}

export function useOccupancyData(hostId?: string) {
  return useQuery({
    queryKey: ['analytics', 'occupancy', hostId],
    queryFn: () => analyticsService.getOccupancyData(hostId),
  });
}

export function useTopProperties(hostId?: string) {
  return useQuery({
    queryKey: ['analytics', 'top-properties', hostId],
    queryFn: () => analyticsService.getTopProperties(hostId),
  });
}

export function useBookingsByChannel(hostId?: string) {
  return useQuery({
    queryKey: ['analytics', 'bookings-by-channel', hostId],
    queryFn: () => analyticsService.getBookingsByChannel(hostId),
  });
}
