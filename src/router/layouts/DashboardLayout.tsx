import { Outlet } from 'react-router-dom';
import { DashboardSidebar } from '../../components/layout/DashboardSidebar';
import { DashboardTopBar } from '../../components/layout/DashboardTopBar';
import { CommandPalette } from '../../components/dashboard/CommandPalette';
import { useUIStore } from '../../store/ui.store';
import { cn } from '../../utils/cn';

export function DashboardLayout() {
  const theme = useUIStore((s) => s.theme);
  return (
    <div className={cn(theme === 'dark' && 'dark')}>
      <div className="flex h-screen bg-surface-muted dark:bg-neutral-900 overflow-hidden">
        <DashboardSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <DashboardTopBar />
          <main className="flex-1 overflow-y-auto p-4 sm:p-6">
            <Outlet />
          </main>
        </div>
        <CommandPalette />
      </div>
    </div>
  );
}
