import type { GuestGuide, GuestFeedback, GuestFeedbackType, Booking } from '../types';
import { api } from '../lib/api';
import { mockGuestGuides, mockGuestFeedbacks, mockBookings } from '../mocks/data';

const GUIDES_KEY    = 'hbs_guest_guides';
const FEEDBACK_KEY  = 'hbs_guest_feedbacks';
const USE_API = !!import.meta.env.VITE_API_URL;

// ── Storage helpers ───────────────────────────────────────────────────────────
function loadGuides(): GuestGuide[] {
  try {
    const raw = localStorage.getItem(GUIDES_KEY);
    return raw ? (JSON.parse(raw) as GuestGuide[]) : [...mockGuestGuides];
  } catch {
    return [...mockGuestGuides];
  }
}
function saveGuides(guides: GuestGuide[]) {
  localStorage.setItem(GUIDES_KEY, JSON.stringify(guides));
}

function loadFeedbacks(): GuestFeedback[] {
  try {
    const raw = localStorage.getItem(FEEDBACK_KEY);
    return raw ? (JSON.parse(raw) as GuestFeedback[]) : [...mockGuestFeedbacks];
  } catch {
    return [...mockGuestFeedbacks];
  }
}
function saveFeedbacks(fb: GuestFeedback[]) {
  localStorage.setItem(FEEDBACK_KEY, JSON.stringify(fb));
}

// ── Service ───────────────────────────────────────────────────────────────────
export const guestGuideService = {
  /** Return all guides for a host */
  async getByHost(hostId: string): Promise<GuestGuide[]> {
    if (USE_API) {
      try {
        return await api.get<GuestGuide[]>('/guest-guides');
      } catch { /* fallback */ }
    }
    // Derive propertyIds for this host from mock bookings
    const allBookings = mockBookings;
    const hostPropertyIds = new Set(
      allBookings.filter(b => b.hostId === hostId).map(b => b.propertyId)
    );
    return loadGuides().filter(g => hostPropertyIds.has(g.propertyId));
  },

  /** Return guide for a property */
  async getByProperty(propertyId: string): Promise<GuestGuide | null> {
    if (USE_API) {
      try {
        return await api.get<GuestGuide>(`/guest-guides/${propertyId}`);
      } catch { /* fallback */ }
    }
    return loadGuides().find(g => g.propertyId === propertyId) ?? null;
  },

  /** Return guide + booking info by booking confirmation code */
  async getByConfirmationCode(code: string): Promise<{
    guide: GuestGuide;
    booking: Booking;
  } | null> {
    if (USE_API) {
      try {
        return await api.get<{ guide: GuestGuide; booking: Booking }>(`/guest-guides/portal/${code}`);
      } catch { /* fallback */ }
    }
    const booking = mockBookings.find(b => b.confirmationCode === code);
    if (!booking) return null;
    const guide = loadGuides().find(g => g.propertyId === booking.propertyId);
    if (!guide) return null;
    return { guide, booking };
  },

  /** Upsert a guide */
  async save(guide: GuestGuide): Promise<GuestGuide> {
    if (USE_API) {
      try {
        return await api.put<GuestGuide>(`/guest-guides/${guide.propertyId}`, guide);
      } catch { /* fallback */ }
    }
    const guides = loadGuides();
    const idx = guides.findIndex(g => g.id === guide.id);
    const updated = { ...guide, updatedAt: new Date().toISOString() };
    if (idx >= 0) {
      guides[idx] = updated;
    } else {
      guides.push(updated);
    }
    saveGuides(guides);
    return updated;
  },

  /** Create a blank guide for a property */
  async create(propertyId: string, propertyName: string, hostName: string): Promise<GuestGuide> {
    if (USE_API) {
      try {
        return await api.post<GuestGuide>('/guest-guides', {
          propertyId,
          propertyName,
          hostName,
        });
      } catch { /* fallback */ }
    }
    const guide: GuestGuide = {
      id: `gg${Date.now()}`,
      propertyId,
      propertyName,
      welcomeMessage: `Seja bem-vindo a ${propertyName}! Estamos felizes em recebê-lo.`,
      hostName,
      hostPhone: '',
      hostWhatsapp: '',
      hostEmail: '',
      updatedAt: new Date().toISOString(),
      sections: [
        { id: `s${Date.now()}1`, type: 'checkin',   title: 'Check-in',           enabled: true,  order: 1, content: 'Horário de check-in a partir das 14h00\nRecepção disponível na entrada', extra: { time: '14:00' } },
        { id: `s${Date.now()}2`, type: 'checkout',  title: 'Check-out',          enabled: true,  order: 2, content: 'Horário de check-out até as 12h00\nEntregue a chave na saída', extra: { time: '12:00' } },
        { id: `s${Date.now()}3`, type: 'wifi',      title: 'Wi-Fi',              enabled: true,  order: 3, content: 'Internet disponível em todos os ambientes', extra: { ssid: '', password: '' } },
        { id: `s${Date.now()}4`, type: 'parking',   title: 'Estacionamento',     enabled: false, order: 4, content: '', extra: {} },
        { id: `s${Date.now()}5`, type: 'rules',     title: 'Regras da Casa',     enabled: true,  order: 5, content: 'Proibido fumar\nSilêncio após as 22h', extra: {} },
        { id: `s${Date.now()}6`, type: 'tips',      title: 'Dicas do Anfitrião', enabled: true,  order: 6, content: '', extra: {} },
        { id: `s${Date.now()}7`, type: 'emergency', title: 'Emergências',        enabled: true,  order: 7, content: 'Bombeiros: 193\nSAMU: 192\nPolícia: 190', extra: {} },
      ],
    };
    const guides = loadGuides();
    guides.push(guide);
    saveGuides(guides);
    return guide;
  },

  // ── Feedback ────────────────────────────────────────────────────────────────
  async submitFeedback(data: {
    bookingId?: string;
    propertyId: string;
    propertyName: string;
    guestName: string;
    guestEmail?: string;
    type: GuestFeedbackType;
    rating?: number;
    message: string;
  }): Promise<GuestFeedback> {
    if (USE_API) {
      try {
        return await api.post<GuestFeedback>('/guest-guides/feedbacks', data);
      } catch { /* fallback */ }
    }
    const feedback: GuestFeedback = {
      id: `fb${Date.now()}`,
      ...data,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    const all = loadFeedbacks();
    all.unshift(feedback);
    saveFeedbacks(all);
    return feedback;
  },

  async getFeedbacksByProperty(propertyId: string): Promise<GuestFeedback[]> {
    if (USE_API) {
      try {
        return await api.get<GuestFeedback[]>(`/guest-guides/feedbacks/${propertyId}`);
      } catch { /* fallback */ }
    }
    return loadFeedbacks().filter(f => f.propertyId === propertyId);
  },

  async getAllFeedbacks(): Promise<GuestFeedback[]> {
    if (USE_API) {
      try {
        return await api.get<GuestFeedback[]>('/guest-guides/feedbacks');
      } catch { /* fallback */ }
    }
    return loadFeedbacks();
  },

  async resolveFeedback(id: string): Promise<void> {
    if (USE_API) {
      try {
        await api.patch(`/guest-guides/feedbacks/${id}/resolve`);
        return;
      } catch { /* fallback */ }
    }
    const all = loadFeedbacks();
    const idx = all.findIndex(f => f.id === id);
    if (idx >= 0) all[idx].status = 'resolved';
    saveFeedbacks(all);
  },

  async deleteGuide(propertyId: string): Promise<void> {
    if (USE_API) {
      try {
        await api.delete(`/guest-guides/${propertyId}`);
        return;
      } catch { /* fallback */ }
    }
    const guides = loadGuides().filter(g => g.propertyId !== propertyId);
    saveGuides(guides);
  },
};
