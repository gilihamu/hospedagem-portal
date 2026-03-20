import type { Tenant, AuditLog, SystemMetrics } from '../types';
import { api } from '../lib/api';

const USE_API = !!import.meta.env.VITE_API_URL;

// Map backend TenantDto → frontend Tenant
function mapTenant(apiTenant: {
  id: string; name: string; slug: string; plan: string; status: string;
  maxProperties?: number; maxUsers?: number; createdAt: string;
}): Tenant {
  return {
    id: apiTenant.id,
    name: apiTenant.name,
    slug: apiTenant.slug,
    ownerId: '',
    plan: apiTenant.plan as Tenant['plan'],
    status: apiTenant.status as Tenant['status'],
    usersCount: apiTenant.maxUsers ?? 0,
    propertiesCount: apiTenant.maxProperties ?? 0,
    createdAt: apiTenant.createdAt,
  };
}

// Map backend AuditLogDto → frontend AuditLog
function mapAuditLog(apiLog: {
  id: string; tenantId?: string; userId: string; userEmail?: string;
  action: string; entityType?: string; entityId?: string; timestamp: string;
}): AuditLog {
  return {
    id: apiLog.id,
    userId: apiLog.userId,
    userName: apiLog.userEmail || apiLog.userId,
    action: apiLog.action,
    resource: apiLog.entityType || '',
    resourceId: apiLog.entityId,
    createdAt: apiLog.timestamp,
  };
}

export const adminService = {
  // ── Tenants ──────────────────────────────────────────────────────────────────
  async getTenants(): Promise<Tenant[]> {
    if (USE_API) {
      try {
        // Backend returns flat array (not wrapped in { items })
        const apiData = await api.get<unknown>('/admin/tenants');
        const list = Array.isArray(apiData) ? apiData : (apiData as { items: unknown[] }).items ?? [];
        return list.map(mapTenant);
      } catch { /* fallback */ }
    }
    // Mock tenants
    return [
      { id: 't1', name: 'Hotel Grand Plaza', slug: 'grand-plaza', ownerId: 'u2', ownerName: 'Carlos Oliveira', plan: 'professional', status: 'active', usersCount: 5, propertiesCount: 4, createdAt: '2024-01-15T00:00:00Z' },
      { id: 't2', name: 'Pousada Sol & Mar', slug: 'sol-mar', ownerId: 'u3', ownerName: 'Ana Costa', plan: 'starter', status: 'active', usersCount: 2, propertiesCount: 3, createdAt: '2024-02-01T00:00:00Z' },
      { id: 't3', name: 'Hostel Carioca', slug: 'hostel-carioca', ownerId: 'u6', ownerName: 'Lucas Ferreira', plan: 'free', status: 'active', usersCount: 1, propertiesCount: 1, createdAt: '2024-06-10T00:00:00Z' },
      { id: 't4', name: 'Resort Bahia Paradise', slug: 'bahia-paradise', ownerId: 'u7', ownerName: 'Mariana Alves', plan: 'enterprise', status: 'active', usersCount: 12, propertiesCount: 8, createdAt: '2024-03-20T00:00:00Z' },
      { id: 't5', name: 'Chalé Montanha Verde', slug: 'montanha-verde', ownerId: 'u8', ownerName: 'Roberto Lima', plan: 'starter', status: 'suspended', usersCount: 1, propertiesCount: 1, createdAt: '2024-07-05T00:00:00Z' },
    ];
  },

  async createTenant(data: { name: string; slug: string; ownerId: string; plan: Tenant['plan'] }): Promise<Tenant> {
    if (USE_API) {
      try {
        // Backend only accepts name, slug, plan (not ownerId)
        return await api.post<Tenant>('/admin/tenants', {
          name: data.name,
          slug: data.slug,
          plan: data.plan,
        });
      } catch { /* fallback */ }
    }
    return {
      id: `t${Date.now()}`,
      ...data,
      status: 'active',
      usersCount: 1,
      propertiesCount: 0,
      createdAt: new Date().toISOString(),
    };
  },

  // ── Audit Logs ──────────────────────────────────────────────────────────────
  async getAuditLogs(filters?: { userId?: string; action?: string; limit?: number }): Promise<AuditLog[]> {
    if (USE_API) {
      try {
        // Backend accepts: action, from, to, page, pageSize (not userId or limit)
        const params: Record<string, string> = {};
        if (filters?.action) params.action = filters.action;
        if (filters?.limit) params.pageSize = String(filters.limit);
        const apiData = await api.get<unknown>('/admin/audit-logs', params);
        const list = Array.isArray(apiData) ? apiData : (apiData as { items: unknown[] }).items ?? [];
        return list.map(mapAuditLog);
      } catch { /* fallback */ }
    }
    // Mock audit logs
    const actions = ['login', 'create_property', 'update_booking', 'connect_channel', 'export_report', 'update_user_role', 'create_business', 'delete_property'];
    const resources = ['auth', 'properties', 'bookings', 'channels', 'analytics', 'admin', 'business', 'properties'];
    const users = [
      { id: 'u1', name: 'Admin Sistema' },
      { id: 'u2', name: 'Carlos Oliveira' },
      { id: 'u3', name: 'Ana Costa' },
    ];
    return Array.from({ length: 20 }, (_, i) => {
      const user = users[i % users.length];
      const actionIdx = i % actions.length;
      return {
        id: `log-${i}`,
        userId: user.id,
        userName: user.name,
        action: actions[actionIdx],
        resource: resources[actionIdx],
        resourceId: `res-${i}`,
        details: `Ação ${actions[actionIdx]} executada no recurso ${resources[actionIdx]}`,
        ipAddress: `192.168.1.${100 + i}`,
        createdAt: new Date(Date.now() - i * 3600000).toISOString(),
      };
    });
  },

  // ── System Metrics ──────────────────────────────────────────────────────────
  async getMetrics(): Promise<SystemMetrics> {
    if (USE_API) {
      try {
        // Backend returns SystemMetricsDto with different field structure
        const apiData = await api.get<{
          totalTenants?: number; activeTenants?: number;
          totalUsers: number; activeUsers?: number;
          totalProperties: number; totalBookings: number; totalRevenue: number;
          health?: { status?: string; services?: Array<{ name: string; status: string; latencyMs: number }> };
        }>('/admin/metrics');
        return {
          totalUsers: apiData.totalUsers,
          totalProperties: apiData.totalProperties,
          totalBookings: apiData.totalBookings,
          totalRevenue: apiData.totalRevenue,
          activeUsers30d: apiData.activeUsers ?? 0,
          newUsersToday: 0,
          bookingsToday: 0,
          revenueToday: 0,
          systemHealth: (apiData.health?.status as SystemMetrics['systemHealth']) || 'healthy',
          services: apiData.health?.services?.map((s) => ({
            name: s.name,
            status: s.status === 'up' || s.status === 'Healthy' ? 'up' as const : 'down' as const,
            latencyMs: s.latencyMs,
          })) || [],
        };
      } catch { /* fallback */ }
    }
    return {
      totalUsers: 156,
      totalProperties: 48,
      totalBookings: 312,
      totalRevenue: 187450,
      activeUsers30d: 89,
      newUsersToday: 3,
      bookingsToday: 7,
      revenueToday: 4250,
      systemHealth: 'healthy',
      services: [
        { name: 'Identity', status: 'up', latencyMs: 12 },
        { name: 'Properties', status: 'up', latencyMs: 18 },
        { name: 'Bookings', status: 'up', latencyMs: 15 },
        { name: 'Payments', status: 'up', latencyMs: 22 },
        { name: 'Messaging', status: 'up', latencyMs: 8 },
        { name: 'Channels', status: 'up', latencyMs: 25 },
        { name: 'Analytics', status: 'up', latencyMs: 35 },
        { name: 'GuestGuide', status: 'up', latencyMs: 14 },
        { name: 'Business', status: 'up', latencyMs: 11 },
        { name: 'SuperAdmin', status: 'up', latencyMs: 9 },
      ],
    };
  },

  // ── Email Settings ──────────────────────────────────────────────────────────

  async getEmailSettings(): Promise<EmailSettingsDto | null> {
    if (USE_API) {
      try {
        return await api.get<EmailSettingsDto>('/admin/email-settings');
      } catch { return null; }
    }
    return null;
  },

  async saveEmailSettings(data: SaveEmailSettingsRequest): Promise<EmailSettingsDto> {
    return api.put<EmailSettingsDto>('/admin/email-settings', data);
  },

  async sendTestEmail(recipientEmail: string): Promise<void> {
    await api.post('/admin/email-settings/test', { recipientEmail });
  },
};

// ── Email Settings types ──────────────────────────────────────────────────
export interface EmailSettingsDto {
  id: string;
  smtpHost: string;
  smtpPort: number;
  smtpUsername: string;
  fromEmail: string;
  fromName: string;
  useSsl: boolean;
  useStartTls: boolean;
  isEnabled: boolean;
  createdAt: string;
  updatedAt: string | null;
}

export interface SaveEmailSettingsRequest {
  smtpHost: string;
  smtpPort: number;
  smtpUsername: string;
  smtpPassword: string;
  fromEmail: string;
  fromName: string;
  useSsl: boolean;
  useStartTls: boolean;
  isEnabled: boolean;
}
