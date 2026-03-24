import { Outlet } from 'react-router-dom';
import { AdminSidebar } from '../../components/layout/AdminSidebar';
import { DashboardTopBar } from '../../components/layout/DashboardTopBar';

export function AdminLayout() {
  return (
    <div className="flex h-screen bg-surface-muted overflow-hidden">
      <AdminSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <DashboardTopBar />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
