import { createBrowserRouter, Navigate } from 'react-router-dom';
import { PublicLayout } from './layouts/PublicLayout';
import { DashboardLayout } from './layouts/DashboardLayout';
import { AdminLayout } from './layouts/AdminLayout';
import { AuthLayout } from './layouts/AuthLayout';
import { AuthGuard } from './guards/AuthGuard';
import { GuestGuard } from './guards/GuestGuard';
import { RoleGuard } from './guards/RoleGuard';
import { ROUTES } from './routes';

// Lazy page imports
import { lazy, Suspense, type ReactNode } from 'react';
import { Spinner } from '../components/ui/Spinner';

function withSuspense(Component: React.LazyExoticComponent<() => ReactNode>) {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    }>
      <Component />
    </Suspense>
  );
}

// Public pages
const Home = lazy(() => import('../pages/public/Home').then(m => ({ default: m.HomePage })));
const Search = lazy(() => import('../pages/public/Search').then(m => ({ default: m.SearchPage })));
const PropertyDetail = lazy(() => import('../pages/public/PropertyDetail').then(m => ({ default: m.PropertyDetailPage })));
const Booking = lazy(() => import('../pages/public/Booking').then(m => ({ default: m.BookingPage })));

// Auth pages
const Login = lazy(() => import('../pages/auth/Login').then(m => ({ default: m.LoginPage })));
const Register = lazy(() => import('../pages/auth/Register').then(m => ({ default: m.RegisterPage })));
const ForgotPassword = lazy(() => import('../pages/auth/ForgotPassword').then(m => ({ default: m.ForgotPasswordPage })));
const ResetPassword = lazy(() => import('../pages/auth/ResetPassword').then(m => ({ default: m.ResetPasswordPage })));

// Dashboard pages
const DashboardOverview = lazy(() => import('../pages/dashboard/Overview').then(m => ({ default: m.OverviewPage })));
const DashboardProperties = lazy(() => import('../pages/dashboard/Properties').then(m => ({ default: m.PropertiesPage })));
const DashboardPropertyForm = lazy(() => import('../pages/dashboard/PropertyForm').then(m => ({ default: m.PropertyFormPage })));
const DashboardBranches = lazy(() => import('../pages/dashboard/Branches').then(m => ({ default: m.BranchesPage })));
const DashboardBranchForm = lazy(() => import('../pages/dashboard/BranchForm').then(m => ({ default: m.BranchFormPage })));
const DashboardBookings = lazy(() => import('../pages/dashboard/Bookings').then(m => ({ default: m.BookingsPage })));
const DashboardBookingsCalendar = lazy(() => import('../pages/dashboard/Bookings/CalendarPage').then(m => ({ default: m.BookingsCalendarPage })));
const DashboardAnalytics = lazy(() => import('../pages/dashboard/Analytics').then(m => ({ default: m.AnalyticsPage })));
const DashboardPayments = lazy(() => import('../pages/dashboard/Payments').then(m => ({ default: m.PaymentsPage })));
const DashboardProfile = lazy(() => import('../pages/dashboard/Profile').then(m => ({ default: m.ProfilePage })));

// Admin pages
const AdminOverview = lazy(() => import('../pages/admin/Overview').then(m => ({ default: m.AdminOverviewPage })));
const AdminUsers = lazy(() => import('../pages/admin/Users').then(m => ({ default: m.AdminUsersPage })));
const AdminProperties = lazy(() => import('../pages/admin/Properties').then(m => ({ default: m.AdminPropertiesPage })));
const AdminBookings = lazy(() => import('../pages/admin/Bookings').then(m => ({ default: m.AdminBookingsPage })));
const AdminReports = lazy(() => import('../pages/admin/Reports').then(m => ({ default: m.AdminReportsPage })));
const AdminChannels = lazy(() => import('../pages/admin/Channels').then(m => ({ default: m.AdminChannelsPage })));
const AdminTenants = lazy(() => import('../pages/admin/Tenants').then(m => ({ default: m.AdminTenantsPage })));
const AdminAuditLogs = lazy(() => import('../pages/admin/AuditLogs').then(m => ({ default: m.AdminAuditLogsPage })));
const AdminMetrics = lazy(() => import('../pages/admin/Metrics').then(m => ({ default: m.AdminMetricsPage })));

// Verify Email
const VerifyEmail = lazy(() => import('../pages/auth/VerifyEmail').then(m => ({ default: m.VerifyEmailPage })));

// Dashboard Guest Guide
const DashboardGuestGuide = lazy(() => import('../pages/dashboard/GuestGuide').then(m => ({ default: m.GuestGuidePage })));

// Dashboard Onboarding & Channels
const DashboardOnboarding = lazy(() => import('../pages/dashboard/BusinessOnboarding').then(m => ({ default: m.BusinessOnboardingPage })));
const DashboardChannels = lazy(() => import('../pages/dashboard/ChannelManager').then(m => ({ default: m.ChannelManagerPage })));

// Guest Portal (public)
const GuestPortal = lazy(() => import('../pages/guest/GuestPortal').then(m => ({ default: m.GuestPortalPage })));

// Messages
const Messages = lazy(() => import('../pages/messages').then(m => ({ default: m.MessagesPage })));

// 404
function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <h1 className="text-7xl font-bold text-primary mb-4">404</h1>
      <h2 className="text-2xl font-semibold text-neutral-800 mb-2">Página não encontrada</h2>
      <p className="text-neutral-500 mb-8">A página que você está procurando não existe.</p>
      <a href="/" className="bg-primary text-white px-6 py-2.5 rounded-lg font-medium hover:bg-primary-light transition-colors">
        Voltar ao início
      </a>
    </div>
  );
}

export const router = createBrowserRouter([
  // Public routes
  {
    element: <PublicLayout />,
    children: [
      { path: ROUTES.HOME, element: withSuspense(Home) },
      { path: ROUTES.SEARCH, element: withSuspense(Search) },
      { path: ROUTES.PROPERTY, element: withSuspense(PropertyDetail) },
      {
        element: <AuthGuard />,
        children: [
          { path: ROUTES.BOOKING, element: withSuspense(Booking) },
          { path: ROUTES.MESSAGES, element: withSuspense(Messages) },
          { path: ROUTES.MESSAGE_DETAIL, element: withSuspense(Messages) },
        ],
      },
    ],
  },

  // Auth routes (guest only)
  {
    element: <GuestGuard />,
    children: [
      {
        element: <AuthLayout />,
        children: [
          { path: ROUTES.LOGIN, element: withSuspense(Login) },
          { path: ROUTES.REGISTER, element: withSuspense(Register) },
          { path: ROUTES.FORGOT_PASSWORD, element: withSuspense(ForgotPassword) },
          { path: ROUTES.RESET_PASSWORD, element: withSuspense(ResetPassword) },
          { path: ROUTES.VERIFY_EMAIL, element: withSuspense(VerifyEmail) },
        ],
      },
    ],
  },

  // Dashboard (host + admin)
  {
    element: <AuthGuard />,
    children: [
      {
        element: <RoleGuard requiredRoles={['host', 'admin']} />,
        children: [
          {
            element: <DashboardLayout />,
            children: [
              { path: ROUTES.DASHBOARD, element: withSuspense(DashboardOverview) },
              { path: ROUTES.DASHBOARD_ONBOARDING, element: withSuspense(DashboardOnboarding) },
              { path: ROUTES.DASHBOARD_CHANNELS, element: withSuspense(DashboardChannels) },
              { path: ROUTES.DASHBOARD_PROPERTIES, element: withSuspense(DashboardProperties) },
              { path: ROUTES.DASHBOARD_PROPERTY_NEW, element: withSuspense(DashboardPropertyForm) },
              { path: ROUTES.DASHBOARD_PROPERTY_EDIT, element: withSuspense(DashboardPropertyForm) },
              { path: ROUTES.DASHBOARD_BRANCHES, element: withSuspense(DashboardBranches) },
              { path: ROUTES.DASHBOARD_BRANCHES_NEW, element: withSuspense(DashboardBranchForm) },
              { path: ROUTES.DASHBOARD_BOOKINGS, element: withSuspense(DashboardBookings) },
              { path: ROUTES.DASHBOARD_BOOKINGS_CALENDAR, element: withSuspense(DashboardBookingsCalendar) },
              { path: ROUTES.DASHBOARD_ANALYTICS, element: withSuspense(DashboardAnalytics) },
              { path: ROUTES.DASHBOARD_PAYMENTS, element: withSuspense(DashboardPayments) },
              { path: ROUTES.DASHBOARD_GUEST_GUIDE, element: withSuspense(DashboardGuestGuide) },
              { path: ROUTES.DASHBOARD_PROFILE, element: withSuspense(DashboardProfile) },
            ],
          },
        ],
      },
    ],
  },

  // Admin
  {
    element: <AuthGuard />,
    children: [
      {
        element: <RoleGuard requiredRoles={['admin']} />,
        children: [
          {
            element: <AdminLayout />,
            children: [
              { path: ROUTES.ADMIN, element: withSuspense(AdminOverview) },
              { path: ROUTES.ADMIN_USERS, element: withSuspense(AdminUsers) },
              { path: ROUTES.ADMIN_PROPERTIES, element: withSuspense(AdminProperties) },
              { path: ROUTES.ADMIN_BOOKINGS, element: withSuspense(AdminBookings) },
              { path: ROUTES.ADMIN_CHANNELS, element: withSuspense(AdminChannels) },
              { path: ROUTES.ADMIN_REPORTS, element: withSuspense(AdminReports) },
              { path: ROUTES.ADMIN_TENANTS, element: withSuspense(AdminTenants) },
              { path: ROUTES.ADMIN_AUDIT_LOGS, element: withSuspense(AdminAuditLogs) },
              { path: ROUTES.ADMIN_METRICS, element: withSuspense(AdminMetrics) },
            ],
          },
        ],
      },
    ],
  },

  // Guest Portal (public, standalone layout)
  { path: ROUTES.GUEST_PORTAL, element: withSuspense(GuestPortal) },

  // Redirects
  { path: '/dashboard/branches/:id/edit', element: <Navigate to={ROUTES.DASHBOARD_BRANCHES} replace /> },

  // 404
  { path: '*', element: <PublicLayout />, children: [{ path: '*', element: <NotFoundPage /> }] },
]);
