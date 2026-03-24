import { useState } from 'react';
import {
  ArrowLeft, Edit, Star, Ban, Phone, Mail, MapPin,
  Calendar, Banknote, Clock, AlertTriangle, CheckCircle,
  MessageSquare, TrendingUp,
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Spinner } from '../../../components/ui/Spinner';
import { cn } from '../../../utils/cn';
import { formatCurrency, formatDate } from '../../../utils/formatters';
import {
  useGuest, useGuestBookingHistory, useToggleVip, useToggleBlacklist,
} from '../../../hooks/useGuests';
import { useToast } from '../../../hooks/useToast';
import { BookingStatusBadge } from '../../../components/shared/BookingStatusBadge';
import type { Guest, Booking } from '../../../types';

interface Props {
  guestId: string;
  onBack: () => void;
  onEdit: (guest: Guest) => void;
}

const TAG_COLORS: Record<string, string> = {
  vip: 'bg-amber-100 text-amber-700',
  frequente: 'bg-blue-100 text-blue-700',
  corporativo: 'bg-purple-100 text-purple-700',
  default: 'bg-neutral-100 text-neutral-600',
};
const tagColor = (t: string) => TAG_COLORS[t.toLowerCase()] ?? TAG_COLORS.default;

export function GuestDetailPage({ guestId, onBack, onEdit }: Props) {
  const { success, error: showError } = useToast();
  const { data: guest, isLoading } = useGuest(guestId);
  const { data: bookings } = useGuestBookingHistory(guestId);
  const toggleVip = useToggleVip();
  const toggleBlacklist = useToggleBlacklist();

  const [blacklistDialog, setBlacklistDialog] = useState(false);
  const [blacklistReason, setBlacklistReason] = useState('');

  if (isLoading) {
    return <div className="flex items-center justify-center py-24"><Spinner size="lg" /></div>;
  }

  if (!guest) {
    return (
      <div className="text-center py-24">
        <p className="text-neutral-500">Hóspede não encontrado.</p>
        <Button variant="ghost" onClick={onBack} className="mt-4">Voltar</Button>
      </div>
    );
  }

  const handleVip = async () => {
    try {
      await toggleVip.mutateAsync({ id: guest.id, isVip: !guest.isVip });
      success(guest.isVip ? 'Status VIP removido.' : '⭐ Marcado como VIP!');
    } catch {
      showError('Erro ao atualizar status VIP.');
    }
  };

  const handleBlacklist = async () => {
    try {
      await toggleBlacklist.mutateAsync({
        id: guest.id,
        isBlacklisted: !guest.isBlacklisted,
        reason: blacklistReason || undefined,
      });
      success(guest.isBlacklisted ? 'Hóspede desbloqueado.' : 'Hóspede bloqueado.');
      setBlacklistDialog(false);
      setBlacklistReason('');
    } catch {
      showError('Erro ao atualizar status.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-700 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Hóspedes
        </button>
        <span className="text-neutral-300">/</span>
        <span className="text-sm font-medium text-neutral-800">{guest.fullName}</span>
      </div>

      {/* Header card */}
      <div className={cn(
        'rounded-2xl p-6 border',
        guest.isBlacklisted ? 'bg-red-50 border-red-100' :
        guest.isVip ? 'bg-amber-50 border-amber-100' :
        'bg-white border-neutral-100'
      )}>
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className={cn(
              'w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold shrink-0',
              guest.isVip ? 'bg-amber-100 text-amber-700' :
              guest.isBlacklisted ? 'bg-red-100 text-red-700' :
              'bg-primary/10 text-primary'
            )}>
              {guest.firstName[0]}{guest.lastName?.[0] ?? ''}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold text-neutral-900">{guest.fullName}</h1>
                {guest.isVip && (
                  <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-700 text-xs font-semibold px-2.5 py-1 rounded-full">
                    <Star className="w-3 h-3 fill-amber-400 stroke-amber-500" /> VIP
                  </span>
                )}
                {guest.isBlacklisted && (
                  <span className="inline-flex items-center gap-1 bg-red-100 text-red-700 text-xs font-semibold px-2.5 py-1 rounded-full">
                    <Ban className="w-3 h-3" /> Bloqueado
                  </span>
                )}
              </div>
              <p className="text-sm text-neutral-500 mt-1">
                Hóspede desde {formatDate(guest.createdAt)}
                {guest.nationality && ` · ${guest.nationality}`}
              </p>
              {guest.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {guest.tags.map(t => (
                    <span key={t} className={cn('text-xs font-medium px-2.5 py-0.5 rounded-full capitalize', tagColor(t))}>{t}</span>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button size="sm" variant="secondary" leftIcon={<Edit className="w-3.5 h-3.5" />} onClick={() => onEdit(guest)}>
              Editar
            </Button>
            <Button
              size="sm"
              variant={guest.isVip ? 'secondary' : 'outline'}
              leftIcon={<Star className={cn('w-3.5 h-3.5', guest.isVip ? 'fill-amber-400 stroke-amber-500' : '')} />}
              loading={toggleVip.isPending}
              onClick={handleVip}
            >
              {guest.isVip ? 'Remover VIP' : 'Marcar VIP'}
            </Button>
            <Button
              size="sm"
              variant={guest.isBlacklisted ? 'secondary' : 'danger'}
              leftIcon={guest.isBlacklisted ? <CheckCircle className="w-3.5 h-3.5" /> : <Ban className="w-3.5 h-3.5" />}
              loading={toggleBlacklist.isPending}
              onClick={() => guest.isBlacklisted ? handleBlacklist() : setBlacklistDialog(true)}
            >
              {guest.isBlacklisted ? 'Desbloquear' : 'Bloquear'}
            </Button>
          </div>
        </div>

        {/* Blacklist reason banner */}
        {guest.isBlacklisted && guest.blacklistReason && (
          <div className="mt-4 p-3 bg-red-100 rounded-lg flex gap-2">
            <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{guest.blacklistReason}</p>
          </div>
        )}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total de Estadias', value: guest.totalStays, icon: Calendar, color: 'text-primary', bg: 'bg-primary/10' },
          { label: 'Total Gasto', value: formatCurrency(guest.totalSpent), icon: Banknote, color: 'text-green-600', bg: 'bg-green-100' },
          { label: 'Última Estadia', value: guest.lastStayAt ? formatDate(guest.lastStayAt) : '—', icon: Clock, color: 'text-neutral-500', bg: 'bg-neutral-100' },
          { label: 'Média/Estadia', value: guest.totalStays > 0 ? formatCurrency(guest.totalSpent / guest.totalStays) : '—', icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-100' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-neutral-100 p-4">
            <div className={cn('w-8 h-8 rounded-full flex items-center justify-center mb-2', s.bg)}>
              <s.icon className={cn('w-4 h-4', s.color)} />
            </div>
            <p className="text-lg font-bold text-neutral-900">{s.value}</p>
            <p className="text-xs text-neutral-500">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Contact + Document + Address */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-neutral-100 p-5">
            <h2 className="text-sm font-semibold text-neutral-700 mb-3">Informações de Contato</h2>
            <div className="space-y-2.5">
              {guest.email && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="w-4 h-4 text-neutral-400 shrink-0" />
                  <a href={`mailto:${guest.email}`} className="text-neutral-700 hover:text-primary truncate">{guest.email}</a>
                </div>
              )}
              {guest.phone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="w-4 h-4 text-neutral-400 shrink-0" />
                  <a href={`tel:${guest.phone}`} className="text-neutral-700 hover:text-primary">{guest.phone}</a>
                </div>
              )}
              {guest.birthDate && (
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-neutral-400 shrink-0" />
                  <span className="text-neutral-700">{formatDate(guest.birthDate)}</span>
                </div>
              )}
            </div>
          </div>

          {(guest.documentType || guest.documentNumber) && (
            <div className="bg-white rounded-xl border border-neutral-100 p-5">
              <h2 className="text-sm font-semibold text-neutral-700 mb-3">Documento</h2>
              <div className="space-y-1 text-sm text-neutral-700">
                {guest.documentType && <p><span className="text-neutral-500">Tipo:</span> {guest.documentType}</p>}
                {guest.documentNumber && <p><span className="text-neutral-500">Número:</span> {guest.documentNumber}</p>}
                {guest.documentCountry && <p><span className="text-neutral-500">País:</span> {guest.documentCountry}</p>}
              </div>
            </div>
          )}

          {guest.address?.city && (
            <div className="bg-white rounded-xl border border-neutral-100 p-5">
              <h2 className="text-sm font-semibold text-neutral-700 mb-3 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-neutral-400" /> Endereço
              </h2>
              <address className="not-italic text-sm text-neutral-700 space-y-0.5">
                {guest.address.street && <p>{guest.address.street}{guest.address.number ? `, ${guest.address.number}` : ''}{guest.address.complement ? ` - ${guest.address.complement}` : ''}</p>}
                {guest.address.neighborhood && <p>{guest.address.neighborhood}</p>}
                <p>{[guest.address.city, guest.address.state].filter(Boolean).join(' - ')} {guest.address.zipCode}</p>
                {guest.address.country && <p>{guest.address.country}</p>}
              </address>
            </div>
          )}

          {guest.notes && (
            <div className="bg-white rounded-xl border border-neutral-100 p-5">
              <h2 className="text-sm font-semibold text-neutral-700 mb-3 flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4 text-neutral-400" /> Notas Internas
              </h2>
              <p className="text-sm text-neutral-700 whitespace-pre-wrap">{guest.notes}</p>
            </div>
          )}
        </div>

        {/* Right: Booking history */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-neutral-100 p-5">
            <h2 className="text-sm font-semibold text-neutral-700 mb-4">Histórico de Reservas</h2>
            {!bookings || bookings.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
                <p className="text-sm text-neutral-400">Nenhuma reserva registrada.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {(bookings as Booking[]).map(b => (
                  <div key={b.id} className="flex items-center justify-between p-3 bg-neutral-50 rounded-xl border border-neutral-100 hover:bg-neutral-100 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                        <Calendar className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-neutral-800">{b.propertyName}</p>
                        <p className="text-xs text-neutral-500">
                          {formatDate(b.checkIn)} → {formatDate(b.checkOut)} · {b.guests} hóspede{b.guests !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <BookingStatusBadge status={b.status} />
                      <span className="text-sm font-semibold text-neutral-700">{formatCurrency(b.totalPrice)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Blacklist modal */}
      {blacklistDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setBlacklistDialog(false)} />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-sm p-6 space-y-4">
            <h3 className="text-lg font-semibold text-neutral-900">Bloquear Hóspede</h3>
            <p className="text-sm text-neutral-600">Informe o motivo do bloqueio (opcional):</p>
            <textarea
              value={blacklistReason}
              onChange={e => setBlacklistReason(e.target.value)}
              rows={3}
              placeholder="Ex: Danos ao imóvel, não pagamento..."
              className="w-full text-sm border border-neutral-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
            />
            <div className="flex gap-3">
              <Button variant="secondary" fullWidth onClick={() => setBlacklistDialog(false)}>Cancelar</Button>
              <Button variant="danger" fullWidth loading={toggleBlacklist.isPending} onClick={handleBlacklist}>Bloquear</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
