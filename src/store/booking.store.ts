import { create } from 'zustand';

interface BookingState {
  propertyId: string | null;
  checkIn: string | null;
  checkOut: string | null;
  guests: number;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  specialRequests: string;
}

interface BookingActions {
  setDates: (checkIn: string, checkOut: string) => void;
  setGuests: (guests: number) => void;
  setGuestInfo: (info: Partial<Pick<BookingState, 'guestName' | 'guestEmail' | 'guestPhone' | 'specialRequests'>>) => void;
  setPropertyId: (propertyId: string) => void;
  clearBooking: () => void;
}

export const useBookingStore = create<BookingState & BookingActions>((set) => ({
  propertyId: null,
  checkIn: null,
  checkOut: null,
  guests: 1,
  guestName: '',
  guestEmail: '',
  guestPhone: '',
  specialRequests: '',

  setDates: (checkIn, checkOut) => set({ checkIn, checkOut }),
  setGuests: (guests) => set({ guests }),
  setGuestInfo: (info) => set((state) => ({ ...state, ...info })),
  setPropertyId: (propertyId) => set({ propertyId }),
  clearBooking: () => set({
    propertyId: null,
    checkIn: null,
    checkOut: null,
    guests: 1,
    guestName: '',
    guestEmail: '',
    guestPhone: '',
    specialRequests: '',
  }),
}));
