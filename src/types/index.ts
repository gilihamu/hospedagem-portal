export type UserRole = 'guest' | 'host' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  phone?: string;
  createdAt: string;
  bio?: string;
  verified?: boolean;
  tenantId?: string; // Business/tenant ID for multi-tenancy
}

export type PropertyType = 'hotel' | 'pousada' | 'hostel' | 'apartamento' | 'resort' | 'chalé';

export type PropertyStatus = 'active' | 'inactive' | 'pending';

export interface PropertyAddress {
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
}

export interface PropertyImage {
  id: string;
  url: string;
  alt: string;
  isPrimary?: boolean;
}

export interface PropertyReview {
  id: string;
  propertyId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface Dormitory {
  id: string;
  propertyId: string;
  name: string;
  totalBeds: number;
  pricePerBed: number;
  description?: string;
  isActive: boolean;
}

export interface Property {
  id: string;
  ownerId: string;
  ownerName: string;
  ownerAvatar?: string;
  name: string;
  type: PropertyType;
  description: string;
  images: PropertyImage[];
  address: PropertyAddress;
  amenities: string[];
  pricePerNight: number;
  maxGuests: number;
  bedrooms: number;
  bathrooms: number;
  rating: number;
  totalReviews: number;
  status: PropertyStatus;
  createdAt: string;
  featured?: boolean;
  checkInTime?: string;
  checkOutTime?: string;
  channelSource?: ChannelSlug;
  channelExternalId?: string;
  isSharedRoom?: boolean;
  dormitories?: Dormitory[];
}

export interface Branch {
  id: string;
  propertyId: string;
  name: string;
  address: PropertyAddress;
  phone: string;
  email: string;
  manager: string;
  active: boolean;
  createdAt: string;
}

export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show';

export interface Booking {
  id: string;
  propertyId: string;
  propertyName: string;
  propertyImage?: string;
  propertyCity: string;
  guestId: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  hostId: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  nights: number;
  pricePerNight: number;
  subtotal: number;
  taxes: number;
  totalPrice: number;
  status: BookingStatus;
  specialRequests?: string;
  createdAt: string;
  confirmationCode: string;
  channelSource?: ChannelSlug;
  channelExternalId?: string;
  dormitoryId?: string;
  bedsBooked?: number;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  content: string;
  createdAt: string;
  read: boolean;
}

export interface Conversation {
  id: string;
  bookingId?: string;
  propertyId: string;
  propertyName: string;
  participants: string[];
  lastMessage?: string;
  lastMessageAt?: string;
  unreadCount: number;
  otherUser: {
    id: string;
    name: string;
    avatar?: string;
  };
}

export interface SearchFilters {
  city?: string;
  checkIn?: string;
  checkOut?: string;
  guests?: number;
  type?: PropertyType;
  minPrice?: number;
  maxPrice?: number;
  amenities?: string[];
  minRating?: number;
  sortBy?: 'relevance' | 'price_asc' | 'price_desc' | 'rating';
}

export interface AnalyticsSummary {
  totalRevenue: number;
  revenueGrowth: number;
  totalBookings: number;
  bookingsGrowth: number;
  activeProperties: number;
  averageRating: number;
  occupancyRate: number;
}

export interface RevenueData {
  month: string;
  revenue: number;
  bookings: number;
}

export interface OccupancyData {
  property: string;
  occupancy: number;
}

// ── Guest Guide ──────────────────────────────────────────────────────────────
export type GuestSectionType =
  | 'checkin' | 'checkout' | 'wifi' | 'parking'
  | 'rules'   | 'tips'    | 'emergency' | 'transport' | 'custom';

export interface GuestGuideSection {
  id: string;
  type: GuestSectionType;
  title: string;
  content: string;       // newline-separated bullet lines
  enabled: boolean;
  order: number;
  extra?: Record<string, string>; // wifi: {ssid, password}; checkin: {time}; etc.
}

export interface GuestGuide {
  id: string;
  propertyId: string;
  propertyName: string;
  propertyImage?: string;
  welcomeMessage: string;
  hostName: string;
  hostAvatar?: string;
  hostPhone?: string;
  hostWhatsapp?: string;
  hostEmail?: string;
  sections: GuestGuideSection[];
  updatedAt: string;
}

export type GuestFeedbackType = 'review' | 'complaint' | 'suggestion' | 'help_request';

export interface GuestFeedback {
  id: string;
  bookingId?: string;
  propertyId: string;
  propertyName: string;
  guestName: string;
  guestEmail?: string;
  type: GuestFeedbackType;
  rating?: number;
  message: string;
  status: 'pending' | 'resolved';
  createdAt: string;
}

export interface ToastItem {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
}

// ── Business Registration ───────────────────────────────────────────────────
export type BusinessType = 'hotel' | 'pousada' | 'hostel' | 'resort' | 'property_manager' | 'individual';

export interface Business {
  id: string;
  ownerId: string;
  name: string;
  legalName?: string;
  document: string;
  documentType: 'cnpj' | 'cpf';
  type: BusinessType;
  description?: string;
  logo?: string;
  address: PropertyAddress;
  phone: string;
  email: string;
  website?: string;
  onboardingCompleted: boolean;
  onboardingStep: number;
  createdAt: string;
}

// ── Channel Manager ─────────────────────────────────────────────────────────
export type ChannelSlug = 'booking_com' | 'airbnb' | 'vrbo' | 'expedia' | 'tripadvisor' | 'decolar';

export type ChannelConnectionStatus = 'connected' | 'disconnected' | 'syncing' | 'error';

export type SyncStatus = 'idle' | 'syncing' | 'success' | 'error';

export interface Channel {
  slug: ChannelSlug;
  name: string;
  icon: string;
  description: string;
  color: string;
}

export interface ChannelConnection {
  id: string;
  businessId: string;
  channelSlug: ChannelSlug;
  status: ChannelConnectionStatus;
  syncStatus: SyncStatus;
  accountEmail?: string;
  accountId?: string;
  importedPropertiesCount: number;
  importedBookingsCount: number;
  lastSyncAt?: string;
  autoSync: boolean;
  syncIntervalHours: number;
  connectedAt: string;
  createdAt: string;
}

export interface ChannelImportLog {
  id: string;
  connectionId: string;
  channelSlug: ChannelSlug;
  type: 'properties' | 'bookings';
  itemsImported: number;
  status: 'success' | 'partial' | 'error';
  errorMessage?: string;
  startedAt: string;
  completedAt?: string;
}

// ── Channel Analytics ────────────────────────────────────────────────────────
export interface ChannelAnalyticsData {
  channel: string;
  slug: ChannelSlug;
  count: number;
  revenue: number;
  color: string;
}

// ── Property Availability ────────────────────────────────────────────────────
export interface PropertyAvailability {
  date: string;
  available: boolean;
  price?: number;
  minStay?: number;
}

// ── Booking Calendar ────────────────────────────────────────────────────────
export interface BookingCalendarEntry {
  id: string;
  guestName: string;
  checkIn: string;
  checkOut: string;
  status: BookingStatus;
}

// ── Admin ───────────────────────────────────────────────────────────────────
export interface Tenant {
  id: string;
  name: string;
  slug: string;
  ownerId: string;
  ownerName?: string;
  plan: 'free' | 'starter' | 'professional' | 'enterprise';
  status: 'active' | 'suspended' | 'cancelled';
  usersCount: number;
  propertiesCount: number;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: string;
  ipAddress?: string;
  createdAt: string;
}

export interface SystemMetrics {
  totalUsers: number;
  totalProperties: number;
  totalBookings: number;
  totalRevenue: number;
  activeUsers30d: number;
  newUsersToday: number;
  bookingsToday: number;
  revenueToday: number;
  systemHealth: 'healthy' | 'degraded' | 'down';
  services: { name: string; status: 'up' | 'down'; latencyMs: number }[];
}

// ── Payments ─────────────────────────────────────────────────────────────────
export type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';

export type PaymentMethod = 'credit_card' | 'debit_card' | 'pix' | 'boleto' | 'bank_transfer';

export interface Payment {
  id: string;
  bookingId: string;
  propertyId: string;
  propertyName: string;
  guestName: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  method: PaymentMethod;
  gateway?: string;
  transactionId?: string;
  paidAt?: string;
  refundedAt?: string;
  createdAt: string;
}
