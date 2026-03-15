export const ROUTES = {
  HOME: '/',
  SEARCH: '/search',
  PROPERTY: '/property/:id',
  BOOKING: '/booking/:propertyId',
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
  DASHBOARD: '/dashboard',
  DASHBOARD_ONBOARDING: '/dashboard/onboarding',
  DASHBOARD_CHANNELS: '/dashboard/channels',
  DASHBOARD_PROPERTIES: '/dashboard/properties',
  DASHBOARD_PROPERTY_NEW: '/dashboard/properties/new',
  DASHBOARD_PROPERTY_EDIT: '/dashboard/properties/:id/edit',
  DASHBOARD_BRANCHES: '/dashboard/branches',
  DASHBOARD_BRANCHES_NEW: '/dashboard/branches/new',
  DASHBOARD_BOOKINGS: '/dashboard/bookings',
  DASHBOARD_BOOKINGS_CALENDAR: '/dashboard/bookings/calendar',
  DASHBOARD_ANALYTICS: '/dashboard/analytics',
  DASHBOARD_PAYMENTS: '/dashboard/payments',
  DASHBOARD_PROFILE: '/dashboard/profile',
  ADMIN: '/admin',
  ADMIN_USERS: '/admin/users',
  ADMIN_PROPERTIES: '/admin/properties',
  ADMIN_BOOKINGS: '/admin/bookings',
  ADMIN_REPORTS: '/admin/reports',
  ADMIN_CHANNELS: '/admin/channels',
  ADMIN_TENANTS: '/admin/tenants',
  ADMIN_AUDIT_LOGS: '/admin/audit-logs',
  ADMIN_METRICS: '/admin/metrics',
  VERIFY_EMAIL: '/verify-email',
  DASHBOARD_GUEST_GUIDE: '/dashboard/guest-guide',
  MESSAGES: '/messages',
  MESSAGE_DETAIL: '/messages/:id',
  GUEST_PORTAL: '/stay/:code',
};

export function propertyRoute(id: string) {
  return `/property/${id}`;
}

export function bookingRoute(propertyId: string) {
  return `/booking/${propertyId}`;
}

export function editPropertyRoute(id: string) {
  return `/dashboard/properties/${id}/edit`;
}

export function messageDetailRoute(id: string) {
  return `/messages/${id}`;
}

export function guestPortalRoute(code: string) {
  return `/stay/${code}`;
}
