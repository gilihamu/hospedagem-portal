import { Outlet } from 'react-router-dom';
import { DashboardSidebar } from '../../components/layout/DashboardSidebar';
import { DashboardTopBar } from '../../components/layout/DashboardTopBar';

export function DashboardLayout() {
  return (
    <div className="flex h-screen bg-surface-muted overflow-hidden">
      <DashboardSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <DashboardTopBar />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
