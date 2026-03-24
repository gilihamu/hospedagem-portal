import { useState } from 'react';
import { Calendar, Search } from 'lucide-react';
import { useBookings } from '../../../hooks/useBookings';
import { BookingStatusBadge } from '../../../components/shared/BookingStatusBadge';
import { EmptyState } from '../../../components/ui/EmptyState';
import { Input } from '../../../components/ui/Input';
import { Tabs } from '../../../components/ui/Tabs';
import { Spinner } from '../../../components/ui/Spinner';
import { formatCurrency, formatDate } from '../../../utils/formatters';

const tabs = [
  { id: 'all', label: 'Todas' },
  { id: 'pending', label: 'Pendentes' },
  { id: 'confirmed', label: 'Confirmadas' },
  { id: 'completed', label: 'Concluídas' },
  { id: 'cancelled', label: 'Canceladas' },
];

export function AdminBookingsPage() {
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');
  const { data: bookings, isLoading } = useBookings();

  const filtered = (bookings || []).filter((b) => {
    const matchTab = activeTab === 'all' || b.status === activeTab;
    const matchSearch = !search ||
      b.guestName.toLowerCase().includes(search.toLowerCase()) ||
      b.propertyName.toLowerCase().includes(search.toLowerCase()) ||
      b.confirmationCode.toLowerCase().includes(search.toLowerCase());
    return matchTab && matchSearch;
  });

  const tabsWithCount = tabs.map((t) => ({
    ...t,
    count: t.id === 'all' ? bookings?.length : bookings?.filter((b) => b.status === t.id).length,
  }));

  if (isLoading) return <div className="flex justify-center py-16"><Spinner size="lg" /></div>;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-neutral-900">Reservas</h1>
        <p className="text-sm text-neutral-500">{bookings?.length || 0} reservas na plataforma</p>
      </div>

      <Input
        placeholder="Buscar por hóspede, propriedade ou código..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        prefixIcon={<Search className="w-4 h-4" />}
      />

      <Tabs tabs={tabsWithCount} activeTab={activeTab} onChange={setActiveTab} />

      {filtered.length === 0 ? (
        <EmptyState icon={Calendar} title="Nenhuma reserva encontrada" description="Ajuste os filtros." />
      ) : (
        <div className="card-base overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-surface-border bg-surface-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">Código</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">Hóspede</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider hidden md:table-cell">Propriedade</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider hidden lg:table-cell">Anfitrião</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider hidden sm:table-cell">Datas</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">Total</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((b) => (
                  <tr key={b.id} className="border-b border-surface-border hover:bg-surface-muted/30">
                    <td className="px-4 py-3 font-mono text-xs text-neutral-500">{b.confirmationCode}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-neutral-800">{b.guestName}</p>
                      <p className="text-xs text-neutral-400">{b.guestEmail}</p>
                    </td>
                    <td className="px-4 py-3 text-neutral-600 hidden md:table-cell truncate max-w-32">{b.propertyName}</td>
                    <td className="px-4 py-3 text-neutral-600 hidden lg:table-cell">{b.hostId}</td>
                    <td className="px-4 py-3 text-neutral-600 hidden sm:table-cell whitespace-nowrap">
                      {formatDate(b.checkIn)} → {formatDate(b.checkOut)}
                    </td>
                    <td className="px-4 py-3 font-semibold text-primary">{formatCurrency(b.totalPrice)}</td>
                    <td className="px-4 py-3"><BookingStatusBadge status={b.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
