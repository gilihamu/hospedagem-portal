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
  DASHBOARD_PROPERTY_CALENDAR: '/dashboard/properties/:id/calendar',
  DASHBOARD_BRANCHES: '/dashboard/branches',
  DASHBOARD_BRANCHES_NEW: '/dashboard/branches/new',
  DASHBOARD_BOOKINGS: '/dashboard/bookings',
  DASHBOARD_BOOKINGS_NEW: '/dashboard/bookings/new',
  DASHBOARD_BOOKINGS_CALENDAR: '/dashboard/bookings/calendar',
  DASHBOARD_IMPORT_BOOKING: '/dashboard/bookings/import',
  DASHBOARD_BOOKING_MANAGE: '/dashboard/bookings/:id/manage',
  DASHBOARD_GUESTS: '/dashboard/guests',
  DASHBOARD_GUEST_DETAIL: '/dashboard/guests/:id',
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
  ADMIN_EMAIL_SETTINGS: '/admin/email-settings',
  VERIFY_EMAIL: '/verify-email',
  DASHBOARD_GUEST_GUIDE: '/dashboard/guest-guide',
  MESSAGES: '/messages',
  MESSAGE_DETAIL: '/messages/:id',
  DASHBOARD_FINANCE: '/dashboard/finance',
  DASHBOARD_FINANCE_EXPENSES: '/dashboard/finance/expenses',
  DASHBOARD_FINANCE_CASHFLOW: '/dashboard/finance/cashflow',
  DASHBOARD_FINANCE_REPORTS: '/dashboard/finance/reports',
  GUEST_PORTAL: '/stay/:code',
  PORTFOLIO: '/portfolio/:slug',
  MY_BOOKINGS: '/my-bookings',
  MY_BOOKING_DETAIL: '/my-bookings/:id',
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

export function propertyCalendarRoute(id: string) {
  return `/dashboard/properties/${id}/calendar`;
}

export function portfolioRoute(slug: string) {
  return `/portfolio/${slug}`;
}

export function messageDetailRoute(id: string) {
  return `/messages/${id}`;
}

export function guestPortalRoute(code: string) {
  return `/stay/${code}`;
}
export function guestDetailRoute(id: string) {
  return `/dashboard/guests/${id}`;
}


export function bookingManageRoute(id: string) {
  return `/dashboard/bookings/${id}/manage`;
}
