import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bookingService, type CreateBookingData } from '../services/booking.service';
import type { Booking, BookingStatus } from '../types';

export function useBookings(filters?: { status?: BookingStatus }) {
  return useQuery({
    queryKey: ['bookings', filters],
    queryFn: () => bookingService.getAll(filters),
  });
}

export function useGuestBookings(guestId?: string) {
  return useQuery({
    queryKey: ['bookings', 'guest', guestId],
    queryFn: () => bookingService.getByGuest(guestId!),
    enabled: !!guestId,
  });
}

export function useHostBookings(hostId?: string) {
  return useQuery({
    queryKey: ['bookings', 'host', hostId],
    queryFn: () => bookingService.getByHost(hostId!),
    enabled: !!hostId,
  });
}

export function useBooking(id?: string) {
  return useQuery({
    queryKey: ['booking', id],
    queryFn: () => bookingService.getById(id!),
    enabled: !!id,
  });
}

export function useCreateBooking() {
  const queryClient = useQueryClient();
  return useMutation<Booking, Error, CreateBookingData>({
    mutationFn: (data) => bookingService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
  });
}

export function useUpdateBookingStatus() {
  const queryClient = useQueryClient();
  return useMutation<Booking, Error, { id: string; status: BookingStatus }>({
    mutationFn: ({ id, status }) => bookingService.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
  });
}

export function useCalculatePrice(propertyId?: string, checkIn?: string, checkOut?: string, guests?: number) {
  return useQuery({
    queryKey: ['price', propertyId, checkIn, checkOut, guests],
    queryFn: () => bookingService.calculatePrice(propertyId!, checkIn!, checkOut!, guests || 1),
    enabled: !!propertyId && !!checkIn && !!checkOut,
  });
}
