import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, XCircle, Calendar, LayoutList, CalendarDays, Phone, Eye } from 'lucide-react';
import { useAuthStore } from '../../../store/auth.store';
import { useHostBookings, useUpdateBookingStatus } from '../../../hooks/useBookings';
import { Tabs } from '../../../components/ui/Tabs';
import { EmptyState } from '../../../components/ui/EmptyState';
import { BookingStatusBadge } from '../../../components/shared/BookingStatusBadge';
import { ChannelBadge } from '../../../components/shared/ChannelBadge';
import { ConfirmDialog } from '../../../components/shared/ConfirmDialog';
import { Spinner } from '../../../components/ui/Spinner';
import { Button } from '../../../components/ui/Button';
import { useToast } from '../../../hooks/useToast';
import { formatCurrency, formatDate } from '../../../utils/formatters';
import { CalendarView } from './CalendarView';
import { cn } from '../../../utils/cn';
import { ROUTES, bookingManageRoute } from '../../../router/routes';
import type { Booking, BookingStatus } from '../../../types';

type ViewMode = 'list' | 'calendar';

const tabs = [
  { id: 'all',       label: 'Todas'      },
  { id: 'pending',   label: 'Pendentes'  },
  { id: 'confirmed', label: 'Confirmadas'},
  { id: 'completed', label: 'Concluídas' },
  { id: 'cancelled', label: 'Canceladas' },
];

export function BookingsPage() {
  const { user } = useAuthStore();
  const { data: bookings, isLoading } = useHostBookings(user?.id);
  const updateStatus = useUpdateBookingStatus();
  const { success, error: showError } = useToast();
  const [view, setView] = useState<ViewMode>('list');
  const [activeTab, setActiveTab] = useState('all');
  const [actionTarget, setActionTarget] = useState<{ booking: Booking; action: 'confirm' | 'cancel' } | null>(null);

  const filtered = (bookings || []).filter(b => activeTab === 'all' || b.status === activeTab);

  const tabsWithCount = tabs.map(tab => ({
    ...tab,
    count: tab.id === 'all'
      ? bookings?.length
      : bookings?.filter(b => b.status === tab.id).length,
  }));

  const handleAction = async () => {
    if (!actionTarget) return;
    try {
      const newStatus: BookingStatus = actionTarget.action === 'confirm' ? 'confirmed' : 'cancelled';
      await updateStatus.mutateAsync({ id: actionTarget.booking.id, status: newStatus });
      success(`Reserva ${actionTarget.action === 'confirm' ? 'confirmada' : 'cancelada'} com sucesso!`);
      setActionTarget(null);
    } catch {
      showError('Erro ao atualizar reserva');
    }
  };

  if (isLoading) {
    return <div className="flex justify-center py-16"><Spinner size="lg" /></div>;
  }

  return (
    <div className="space-y-5">
      {/* Header with view toggle */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-neutral-900">Reservas</h1>
          <p className="text-sm text-neutral-500">
            {bookings?.length || 0} reserva{(bookings?.length || 0) !== 1 ? 's' : ''} no total
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link to={ROUTES.DASHBOARD_BOOKINGS_NEW}>
            <Button size="sm">
              <Phone className="w-4 h-4 mr-1.5" />
              Nova Reserva
            </Button>
          </Link>

          <div className="flex items-center gap-1 bg-surface-muted rounded-lg p-1 border border-surface-border">
          <button
            onClick={() => setView('list')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all',
              view === 'list'
                ? 'bg-white text-primary shadow-sm border border-surface-border'
                : 'text-neutral-500 hover:text-neutral-700',
            )}
          >
            <LayoutList className="w-3.5 h-3.5" />
            Lista
          </button>
          <button
            onClick={() => setView('calendar')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all',
              view === 'calendar'
                ? 'bg-white text-primary shadow-sm border border-surface-border'
                : 'text-neutral-500 hover:text-neutral-700',
            )}
          >
            <CalendarDays className="w-3.5 h-3.5" />
                 Calendário
                </button>
              </div>
              </div>
            </div>

      {/* Calendar view */}
      {view === 'calendar' && <CalendarView bookings={bookings || []} />}

      {/* List view */}
      {view === 'list' && (
        <Tabs tabs={tabsWithCount} activeTab={activeTab} onChange={setActiveTab} />
      )}

      {view === 'list' && filtered.length === 0 && (
        <EmptyState
          icon={Calendar}
          title="Nenhuma reserva encontrada"
          description="As reservas para esta categoria aparecerão aqui."
        />
      )}

      {view === 'list' && filtered.length > 0 && (
        <div className="card-base overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-surface-border bg-surface-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">Hóspede</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider hidden md:table-cell">Propriedade</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider hidden sm:table-cell">Datas</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider hidden lg:table-cell">Noites</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">Total</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-neutral-500 uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(booking => (
                  <tr key={booking.id} className="border-b border-surface-border hover:bg-surface-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-neutral-800">{booking.guestName}</p>
                      <p className="text-xs text-neutral-400">{booking.confirmationCode}</p>
                    </td>
                    <td className="px-4 py-3 text-neutral-600 hidden md:table-cell">
                      <div className="flex items-center gap-2">
                        <span className="truncate max-w-32">{booking.propertyName}</span>
                        <ChannelBadge slug={booking.channelSource} />
                      </div>
                    </td>
                    <td className="px-4 py-3 text-neutral-600 hidden sm:table-cell">
                      <p className="whitespace-nowrap">{formatDate(booking.checkIn)} → {formatDate(booking.checkOut)}</p>
                    </td>
                    <td className="px-4 py-3 text-neutral-600 hidden lg:table-cell">{booking.nights}</td>
                    <td className="px-4 py-3 font-semibold text-primary">{formatCurrency(booking.totalPrice)}</td>
                    <td className="px-4 py-3">
                      <BookingStatusBadge status={booking.status} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Link to={bookingManageRoute(booking.id)} className="p-1.5 rounded-lg text-primary hover:bg-primary/10 transition-colors" title="Gerenciar">
                          <Eye className="w-4 h-4" />
                        </Link>
                        {booking.status === 'pending' && (
                          <>
                            <button
                              onClick={() => setActionTarget({ booking, action: 'confirm' })}
                              className="p-1.5 rounded-lg text-success hover:bg-success-light transition-colors"
                              title="Confirmar"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setActionTarget({ booking, action: 'cancel' })}
                              className="p-1.5 rounded-lg text-error hover:bg-error-light transition-colors"
                              title="Cancelar"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        {booking.status === 'confirmed' && (
                          <button
                            onClick={() => setActionTarget({ booking, action: 'cancel' })}
                            className="p-1.5 rounded-lg text-error hover:bg-error-light transition-colors"
                            title="Cancelar"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {view === 'list' && (
        <ConfirmDialog
          isOpen={!!actionTarget}
          onClose={() => setActionTarget(null)}
          onConfirm={handleAction}
          title={actionTarget?.action === 'confirm' ? 'Confirmar reserva' : 'Cancelar reserva'}
          description={`Tem certeza que deseja ${actionTarget?.action === 'confirm' ? 'confirmar' : 'cancelar'} a reserva de ${actionTarget?.booking.guestName}?`}
          confirmLabel={actionTarget?.action === 'confirm' ? 'Confirmar' : 'Cancelar reserva'}
          loading={updateStatus.isPending}
        />
      )}
    </div>
  );
}
