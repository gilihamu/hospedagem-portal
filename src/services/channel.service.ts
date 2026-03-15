import type { Channel, ChannelConnection, ChannelImportLog, Property, Booking } from '../types';
import { api } from '../lib/api';
import { mockChannels, mockChannelConnections, mockImportLogs } from '../mocks/data';
import { getItem, setItem } from '../utils/storage';

const CONN_KEY = 'hbs_channel_connections';
const LOGS_KEY = 'hbs_channel_import_logs';
const USE_API = !!import.meta.env.VITE_API_URL;

// ── helpers ──────────────────────────────────────────────────────────────────
function loadConnections(): ChannelConnection[] {
  const stored = getItem<ChannelConnection[]>(CONN_KEY) || [];
  const storedIds = new Set(stored.map((c) => c.id));
  const mockFiltered = mockChannelConnections.filter((c) => !storedIds.has(c.id));
  return [...mockFiltered, ...stored];
}
function saveConnections(conns: ChannelConnection[]) {
  setItem(CONN_KEY, conns);
}

function loadLogs(): ChannelImportLog[] {
  const stored = getItem<ChannelImportLog[]>(LOGS_KEY) || [];
  const storedIds = new Set(stored.map((l) => l.id));
  const mockFiltered = mockImportLogs.filter((l) => !storedIds.has(l.id));
  return [...mockFiltered, ...stored];
}
function saveLogs(logs: ChannelImportLog[]) {
  setItem(LOGS_KEY, logs);
}

function updateConnection(id: string, patch: Partial<ChannelConnection>) {
  const all = loadConnections();
  const idx = all.findIndex((c) => c.id === id);
  if (idx >= 0) all[idx] = { ...all[idx], ...patch };
  saveConnections(all);
  return all[idx];
}

// ── fake data generators ─────────────────────────────────────────────────────
const UNSPLASH = [
  'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800',
  'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800',
  'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800',
  'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800',
  'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=800',
  'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800',
];

const CHANNEL_NAMES: Record<string, string> = {
  booking_com: 'Booking.com',
  airbnb: 'Airbnb',
  vrbo: 'Vrbo',
  expedia: 'Expedia',
  tripadvisor: 'TripAdvisor',
  decolar: 'Decolar',
};

const PROP_TEMPLATES = [
  { name: 'Suite Premium Oceanview', city: 'Florianópolis', state: 'SC', neighborhood: 'Jurerê Internacional', street: 'Rua das Algas', zip: '88053-300', type: 'apartamento' as const, price: 480 },
  { name: 'Chalé Montanha Encantada', city: 'Campos do Jordão', state: 'SP', neighborhood: 'Capivari', street: 'Av. Machadinho', zip: '12460-000', type: 'chalé' as const, price: 350 },
  { name: 'Pousada Vista Mar', city: 'Paraty', state: 'RJ', neighborhood: 'Centro Histórico', street: 'Rua do Comércio', zip: '23970-000', type: 'pousada' as const, price: 280 },
  { name: 'Flat Executivo Center', city: 'Curitiba', state: 'PR', neighborhood: 'Batel', street: 'Rua Visconde de Nácar', zip: '80410-000', type: 'apartamento' as const, price: 220 },
  { name: 'Resort Águas Claras', city: 'Caldas Novas', state: 'GO', neighborhood: 'Setor Turístico', street: 'Rua das Termas', zip: '75690-000', type: 'resort' as const, price: 550 },
];

function generateProperties(_connectionId: string, channelSlug: string, count: number): Property[] {
  const now = Date.now();
  const shuffled = [...PROP_TEMPLATES].sort(() => Math.random() - 0.5).slice(0, count);
  const source = CHANNEL_NAMES[channelSlug] || channelSlug;

  return shuffled.map((tpl, i) => ({
    id: `imp-p-${now}-${i}`,
    ownerId: 'u2',
    ownerName: 'Carlos Oliveira',
    ownerAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=carlos',
    name: `${tpl.name} (${source})`,
    type: tpl.type,
    description: `Acomodação importada automaticamente do ${source}. ${tpl.name} localizada em ${tpl.city}/${tpl.state}, oferecendo conforto e praticidade para seus hóspedes.`,
    images: [
      { id: `img-${now}-${i}-1`, url: UNSPLASH[i % UNSPLASH.length], alt: tpl.name, isPrimary: true },
      { id: `img-${now}-${i}-2`, url: UNSPLASH[(i + 1) % UNSPLASH.length], alt: `${tpl.name} interior` },
    ],
    address: {
      street: tpl.street,
      number: `${100 + i * 50}`,
      neighborhood: tpl.neighborhood,
      city: tpl.city,
      state: tpl.state,
      zipCode: tpl.zip,
    },
    amenities: ['wifi', 'ac', 'tv', 'parking', 'breakfast'],
    pricePerNight: tpl.price,
    maxGuests: 2 + i,
    bedrooms: 1 + (i % 2),
    bathrooms: 1,
    rating: +(4.2 + Math.random() * 0.7).toFixed(1),
    totalReviews: Math.floor(50 + Math.random() * 200),
    status: 'active' as const,
    createdAt: new Date().toISOString(),
    checkInTime: '14:00',
    checkOutTime: '12:00',
    channelSource: channelSlug as Property['channelSource'],
    channelExternalId: `${channelSlug.toUpperCase()}-${Math.floor(100000 + Math.random() * 900000)}`,
  }));
}

function generateBookings(_connectionId: string, channelSlug: string, propertyIds: string[], count: number): Booking[] {
  const now = Date.now();
  const source = CHANNEL_NAMES[channelSlug] || channelSlug;
  const guests = ['Ana Paula', 'Ricardo Lima', 'Fernanda Souza', 'Pedro Almeida', 'Camila Rodrigues'];

  return Array.from({ length: count }, (_, i) => {
    const checkIn = new Date();
    checkIn.setDate(checkIn.getDate() + 5 + i * 7);
    const nights = 2 + (i % 4);
    const checkOut = new Date(checkIn);
    checkOut.setDate(checkOut.getDate() + nights);
    const price = 200 + i * 50;

    return {
      id: `imp-bk-${now}-${i}`,
      propertyId: propertyIds[i % propertyIds.length],
      propertyName: `Acomodação ${source}`,
      propertyImage: UNSPLASH[i % UNSPLASH.length],
      propertyCity: 'Brasil',
      guestId: `guest-${now}-${i}`,
      guestName: guests[i % guests.length],
      guestEmail: `${guests[i % guests.length].toLowerCase().replace(/\s/g, '.')}@email.com`,
      guestPhone: `+55 11 9${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`,
      hostId: 'u2',
      checkIn: checkIn.toISOString().split('T')[0],
      checkOut: checkOut.toISOString().split('T')[0],
      guests: 1 + (i % 3),
      nights,
      pricePerNight: price,
      subtotal: price * nights,
      taxes: Math.round(price * nights * 0.05),
      totalPrice: Math.round(price * nights * 1.05),
      status: i % 3 === 0 ? 'confirmed' as const : 'pending' as const,
      createdAt: new Date().toISOString(),
      confirmationCode: `${channelSlug.toUpperCase().slice(0, 3)}-${now}-${i}`,
      channelSource: channelSlug as Booking['channelSource'],
      channelExternalId: `${channelSlug.toUpperCase()}-BK-${Math.floor(100000 + Math.random() * 900000)}`,
    };
  });
}

// ── service ──────────────────────────────────────────────────────────────────
export const channelService = {
  async getChannels(): Promise<Channel[]> {
    if (USE_API) {
      try {
        return await api.get<Channel[]>('/channels');
      } catch { /* fallback */ }
    }
    return mockChannels;
  },

  async getConnections(businessId: string): Promise<ChannelConnection[]> {
    if (USE_API) {
      try {
        return await api.get<ChannelConnection[]>('/channels/connections');
      } catch { /* fallback */ }
    }
    return loadConnections().filter((c) => c.businessId === businessId);
  },

  async getConnection(id: string): Promise<ChannelConnection | null> {
    return loadConnections().find((c) => c.id === id) ?? null;
  },

  async connect(businessId: string, channelSlug: string, accountEmail: string): Promise<ChannelConnection> {
    if (USE_API) {
      try {
        return await api.post<ChannelConnection>('/channels/connect', {
          channelSlug,
          accountEmail,
        });
      } catch { /* fallback */ }
    }
    const conn: ChannelConnection = {
      id: `cc${Date.now()}`,
      businessId,
      channelSlug: channelSlug as ChannelConnection['channelSlug'],
      status: 'connected',
      syncStatus: 'idle',
      accountEmail,
      importedPropertiesCount: 0,
      importedBookingsCount: 0,
      autoSync: true,
      syncIntervalHours: 6,
      connectedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };
    const all = loadConnections();
    all.push(conn);
    saveConnections(all);
    return conn;
  },

  async disconnect(connectionId: string): Promise<void> {
    if (USE_API) {
      try {
        await api.delete(`/channels/connections/${connectionId}`);
        return;
      } catch { /* fallback */ }
    }
    updateConnection(connectionId, { status: 'disconnected', syncStatus: 'idle' });
  },

  async updateSyncSettings(connectionId: string, settings: { autoSync?: boolean; syncIntervalHours?: number }): Promise<ChannelConnection> {
    if (USE_API) {
      try {
        return await api.patch<ChannelConnection>(`/channels/connections/${connectionId}/settings`, settings);
      } catch { /* fallback */ }
    }
    return updateConnection(connectionId, settings);
  },

  async importProperties(connectionId: string): Promise<Property[]> {
    if (USE_API) {
      try {
        // Backend returns ChannelImportLogDto (202 Accepted), not Property[]
        // We trigger the import and then return empty — the caller should refresh
        await api.post<unknown>('/channels/import/properties', { connectionId });
        return []; // Import runs async on backend
      } catch { /* fallback */ }
    }
    const conn = loadConnections().find((c) => c.id === connectionId);
    if (!conn) throw new Error('Conexão não encontrada');

    const count = 2 + Math.floor(Math.random() * 2); // 2-3
    const imported = generateProperties(connectionId, conn.channelSlug, count);

    // Save to properties storage
    const existingProps = getItem<Property[]>('hbs_properties') || [];
    setItem('hbs_properties', [...existingProps, ...imported]);

    // Update connection counts
    updateConnection(connectionId, {
      importedPropertiesCount: conn.importedPropertiesCount + count,
      lastSyncAt: new Date().toISOString(),
    });

    // Create import log
    const log: ChannelImportLog = {
      id: `log${Date.now()}`,
      connectionId,
      channelSlug: conn.channelSlug,
      type: 'properties',
      itemsImported: count,
      status: 'success',
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
    };
    const logs = loadLogs();
    logs.unshift(log);
    saveLogs(logs);

    return imported;
  },

  async importBookings(connectionId: string): Promise<Booking[]> {
    if (USE_API) {
      try {
        // Backend returns ChannelImportLogDto (202 Accepted), not Booking[]
        await api.post<unknown>('/channels/import/bookings', { connectionId });
        return []; // Import runs async on backend
      } catch { /* fallback */ }
    }
    const conn = loadConnections().find((c) => c.id === connectionId);
    if (!conn) throw new Error('Conexão não encontrada');

    // Get existing property IDs for this channel
    const allProps = getItem<Property[]>('hbs_properties') || [];
    const channelPropIds = allProps
      .filter((p) => p.channelSource === conn.channelSlug)
      .map((p) => p.id);
    const propIds = channelPropIds.length > 0 ? channelPropIds : ['p1', 'p2'];

    const count = 2 + Math.floor(Math.random() * 2);
    const imported = generateBookings(connectionId, conn.channelSlug, propIds, count);

    // Save to bookings storage
    const existingBookings = getItem<Booking[]>('hbs_bookings') || [];
    setItem('hbs_bookings', [...existingBookings, ...imported]);

    // Update connection
    updateConnection(connectionId, {
      importedBookingsCount: conn.importedBookingsCount + count,
      lastSyncAt: new Date().toISOString(),
    });

    // Log
    const log: ChannelImportLog = {
      id: `log${Date.now()}b`,
      connectionId,
      channelSlug: conn.channelSlug,
      type: 'bookings',
      itemsImported: count,
      status: 'success',
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
    };
    const logs = loadLogs();
    logs.unshift(log);
    saveLogs(logs);

    return imported;
  },

  async syncNow(connectionId: string): Promise<void> {
    if (USE_API) {
      try {
        await api.post(`/channels/connections/${connectionId}/sync`);
        return;
      } catch { /* fallback */ }
    }
    updateConnection(connectionId, { syncStatus: 'syncing' });
    return new Promise((resolve) => {
      setTimeout(() => {
        updateConnection(connectionId, {
          syncStatus: 'success',
          lastSyncAt: new Date().toISOString(),
        });
        resolve();
      }, 1500);
    });
  },

  async getImportLogs(connectionId: string): Promise<ChannelImportLog[]> {
    if (USE_API) {
      try {
        return await api.get<ChannelImportLog[]>(`/channels/connections/${connectionId}/logs`);
      } catch { /* fallback */ }
    }
    return loadLogs().filter((l) => l.connectionId === connectionId);
  },
};
