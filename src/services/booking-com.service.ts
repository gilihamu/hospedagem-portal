import { api } from '../lib/api';
import type {
  ChannelCredentialStatus,
  SaveCredentialsRequest,
  CredentialTestResult,
  PropertyStatusResult,
  ChannelReservation,
  SyncLogEntry,
  FullSyncResult,
} from '../types';

/**
 * Booking.com API service — calls the real backend /api/booking-com/* endpoints.
 * Multi-channel ready: other channels will have their own service files (airbnb.service.ts, etc.)
 */
export const bookingComService = {
  // ── Credentials ─────────────────────────────────────────────────────────
  async getCredentialStatus(): Promise<ChannelCredentialStatus> {
    return api.get<ChannelCredentialStatus>('/booking-com/credentials');
  },

  async saveCredentials(data: SaveCredentialsRequest): Promise<{ message: string }> {
    return api.post<{ message: string }>('/booking-com/credentials', data);
  },

  async testCredentials(): Promise<CredentialTestResult> {
    return api.post<CredentialTestResult>('/booking-com/credentials/test');
  },

  // ── Properties ──────────────────────────────────────────────────────────
  async listProperties(page = 1, pageSize = 100): Promise<PropertyStatusResult[]> {
    return api.get<PropertyStatusResult[]>('/booking-com/properties', {
      page: String(page),
      pageSize: String(pageSize),
    });
  },

  async getPropertyStatus(hotelCode: string): Promise<PropertyStatusResult> {
    return api.get<PropertyStatusResult>(`/booking-com/properties/${hotelCode}/status`);
  },

  // ── Rates & Availability ────────────────────────────────────────────────
  async pushAvailability(hotelCode: string, availability: unknown[]): Promise<unknown> {
    return api.post(`/booking-com/properties/${hotelCode}/availability`, availability);
  },

  async pushRates(hotelCode: string, rates: unknown[]): Promise<unknown> {
    return api.post(`/booking-com/properties/${hotelCode}/rates`, rates);
  },

  // ── Sync ────────────────────────────────────────────────────────────────
  async triggerFullSync(
    hotelCode: string,
    propertyChannelId?: string
  ): Promise<FullSyncResult> {
    return api.post<FullSyncResult>(`/booking-com/properties/${hotelCode}/sync`, {
      propertyChannelId,
    });
  },

  async getSyncLogs(propertyChannelId: string, take = 20): Promise<SyncLogEntry[]> {
    return api.get<SyncLogEntry[]>(`/booking-com/sync-logs/${propertyChannelId}`, {
      take: String(take),
    });
  },

  // ── Reservations ────────────────────────────────────────────────────────
  async pullReservations(
    hotelCode: string,
    propertyChannelId: string,
    since?: string
  ): Promise<unknown> {
    return api.post(`/booking-com/properties/${hotelCode}/reservations/pull`, {
      propertyChannelId,
      since,
    });
  },

  async getReservations(
    propertyChannelId: string,
    take = 50
  ): Promise<ChannelReservation[]> {
    return api.get<ChannelReservation[]>(
      `/booking-com/reservations/${propertyChannelId}`,
      { take: String(take) }
    );
  },

  async getUnprocessedReservations(
    propertyChannelId: string
  ): Promise<ChannelReservation[]> {
    return api.get<ChannelReservation[]>(
      `/booking-com/reservations/unprocessed/${propertyChannelId}`
    );
  },

  async confirmReservation(
    externalReservationId: string,
    hotelCode: string
  ): Promise<{ message: string }> {
    return api.post<{ message: string }>(
      `/booking-com/reservations/${externalReservationId}/confirm`,
      { hotelCode }
    );
  },

  // ── Content ─────────────────────────────────────────────────────────────
  async pullContent(hotelCode: string): Promise<unknown> {
    return api.get(`/booking-com/properties/${hotelCode}/content`);
  },
};
