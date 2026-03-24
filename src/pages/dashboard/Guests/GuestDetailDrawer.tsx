import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X, Edit, Star, Ban, Tag, Phone, Mail, MapPin, FileText,
  Calendar, TrendingUp, Banknote, Clock, AlertTriangle, CheckCircle,
  ExternalLink, MessageSquare,
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { cn } from '../../../utils/cn';
import { formatCurrency, formatDate } from '../../../utils/formatters';
import { useGuestBookingHistory, useToggleVip, useToggleBlacklist } from '../../../hooks/useGuests';
import { useToast } from '../../../hooks/useToast';
import { ROUTES } from '../../../router/routes';
import { FnrhDrawer } from './FnrhDrawer';
import type { Guest, Booking } from '../../../types';

interface Props {
  guest: Guest | null;
  open: boolean;
  onClose: () => void;
  onEdit: (guest: Guest) => void;
}

const TAG_COLORS: Record<string, string> = {
  vip: 'bg-amber-100 text-amber-700',
  frequente: 'bg-blue-100 text-blue-700',
  corporativo: 'bg-purple-100 text-purple-700',
  default: 'bg-neutral-100 text-neutral-600',
};

function tagColor(tag: string) {
  return TAG_COLORS[tag.toLowerCase()] ?? TAG_COLORS.default;
}

export function GuestDetailDrawer({ guest, open, onClose, onEdit }: Props) {
  const navigate = useNavigate();
  const { success, error: showError } = useToast();
  const toggleVip = useToggleVip();
  const toggleBlacklist = useToggleBlacklist();
  const { data: bookings } = useGuestBookingHistory(guest?.id);

  const [blacklistDialog, setBlacklistDialog] = useState(false);
  const [blacklistReason, setBlacklistReason] = useState('');
  const [fnrhBookingId, setFnrhBookingId] = useState<string | null>(null);

  if (!open || !guest) return null;

  const handleVip = async () => {
    try {
      await toggleVip.mutateAsync({ id: guest.id, isVip: !guest.isVip });
      success(guest.isVip ? 'Status VIP removido.' : '⭐ Marcado como VIP!');
    } catch {
      showError('Erro ao atualizar status VIP.');
    }
  };

  const handleBlacklist = async () => {
    if (!guest.isBlacklisted && !blacklistReason.trim()) return;
    try {
      await toggleBlacklist.mutateAsync({
        id: guest.id,
        isBlacklisted: !guest.isBlacklisted,
        reason: blacklistReason || undefined,
      });
      success(guest.isBlacklisted ? 'Hóspede removido da lista negra.' : 'Hóspede bloqueado.');
      setBlacklistDialog(false);
      setBlacklistReason('');
    } catch {
      showError('Erro ao atualizar status.');
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex justify-end">
        <div className="absolute inset-0 bg-black/40" onClick={onClose} />
        <div className="relative w-full max-w-lg bg-white shadow-2xl flex flex-col overflow-hidden">

          {/* Header */}
          <div className={cn(
            'px-6 py-5 border-b border-neutral-100',
            guest.isBlacklisted ? 'bg-red-50' : guest.isVip ? 'bg-amber-50' : 'bg-white'
          )}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-xl font-bold text-neutral-900 truncate">{guest.fullName}</h2>
                  {guest.isVip && (
                    <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                      <Star className="w-3 h-3 fill-amber-400 stroke-amber-500" /> VIP
                    </span>
                  )}
                  {guest.isBlacklisted && (
                    <span className="inline-flex items-center gap-1 bg-red-100 text-red-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                      <Ban className="w-3 h-3" /> Bloqueado
                    </span>
                  )}
                </div>
                <p className="text-sm text-neutral-500 mt-0.5">
                  Hóspede desde {formatDate(guest.createdAt)}
                </p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => onEdit(guest)} className="p-1.5 rounded-lg hover:bg-neutral-100 text-neutral-500 transition-colors" title="Editar">
                  <Edit className="w-4 h-4" />
                </button>
                <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-neutral-100 text-neutral-500 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">

            {/* Stats */}
            <div className="grid grid-cols-3 gap-0 border-b border-neutral-100">
              {[
                { label: 'Estadias', value: guest.totalStays, icon: Calendar, color: 'text-primary' },
                { label: 'Total Gasto', value: formatCurrency(guest.totalSpent), icon: Banknote, color: 'text-success' },
                { label: 'Última Estadia', value: guest.lastStayAt ? formatDate(guest.lastStayAt) : '—', icon: Clock, color: 'text-neutral-500' },
              ].map(s => (
                <div key={s.label} className="flex flex-col items-center py-4 border-r border-neutral-100 last:border-r-0">
                  <s.icon className={cn('w-4 h-4 mb-1', s.color)} />
                  <span className="text-sm font-semibold text-neutral-900">{s.value}</span>
                  <span className="text-xs text-neutral-500">{s.label}</span>
                </div>
              ))}
            </div>

            {/* Contact */}
            <div className="px-6 py-4 border-b border-neutral-100 space-y-2">
              <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Contato</h3>
              {guest.email && (
                <div className="flex items-center gap-2 text-sm text-neutral-700">
                  <Mail className="w-4 h-4 text-neutral-400 shrink-0" />
                  <a href={`mailto:${guest.email}`} className="hover:text-primary truncate">{guest.email}</a>
                </div>
              )}
              {guest.phone && (
                <div className="flex items-center gap-2 text-sm text-neutral-700">
                  <Phone className="w-4 h-4 text-neutral-400 shrink-0" />
                  <a href={`tel:${guest.phone}`} className="hover:text-primary">{guest.phone}</a>
                </div>
              )}
              {guest.address?.city && (
                <div className="flex items-center gap-2 text-sm text-neutral-700">
                  <MapPin className="w-4 h-4 text-neutral-400 shrink-0" />
                  <span>{[guest.address.city, guest.address.state, guest.address.country].filter(Boolean).join(', ')}</span>
                </div>
              )}
              {guest.documentType && guest.documentNumber && (
                <div className="flex items-center gap-2 text-sm text-neutral-700">
                  <FileText className="w-4 h-4 text-neutral-400 shrink-0" />
                  <span>{guest.documentType}: {guest.documentNumber}</span>
                </div>
              )}
              {guest.nationality && (
                <div className="flex items-center gap-2 text-sm text-neutral-700">
                  <TrendingUp className="w-4 h-4 text-neutral-400 shrink-0" />
                  <span>{guest.nationality}</span>
                </div>
              )}
            </div>

            {/* Tags */}
            {guest.tags.length > 0 && (
              <div className="px-6 py-4 border-b border-neutral-100">
                <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">Tags</h3>
                <div className="flex flex-wrap gap-1.5">
                  {guest.tags.map(t => (
                    <span key={t} className={cn('text-xs font-medium px-2.5 py-1 rounded-full capitalize', tagColor(t))}>
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Blacklist reason */}
            {guest.isBlacklisted && guest.blacklistReason && (
              <div className="mx-6 my-3 p-3 bg-red-50 border border-red-100 rounded-lg flex gap-2">
                <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{guest.blacklistReason}</p>
              </div>
            )}

            {/* Notes */}
            {guest.notes && (
              <div className="px-6 py-4 border-b border-neutral-100">
                <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">
                  <MessageSquare className="w-3 h-3 inline mr-1" /> Notas Internas
                </h3>
                <p className="text-sm text-neutral-700 whitespace-pre-wrap">{guest.notes}</p>
              </div>
            )}

            {/* Booking history */}
            <div className="px-6 py-4">
              <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-3">
                Histórico de Reservas
              </h3>
              {!bookings || bookings.length === 0 ? (
                <p className="text-sm text-neutral-400 italic">Nenhuma reserva encontrada.</p>
              ) : (
                <div className="space-y-2">
                    {(bookings as Booking[]).map(b => (
                    <div key={b.id} className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg text-sm">
                      <div>
                        <p className="font-medium text-neutral-800">{b.propertyName}</p>
                        <p className="text-neutral-500 text-xs">{formatDate(b.checkIn)} → {formatDate(b.checkOut)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-neutral-700">{formatCurrency(b.totalPrice)}</span>
                        <button
                          onClick={() => setFnrhBookingId(b.id)}
                          className="text-indigo-500 hover:text-indigo-700" title="FNRH"
                        >
                          <FileText className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => navigate(ROUTES.DASHBOARD_BOOKINGS)}
                          className="text-neutral-400 hover:text-primary"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Footer actions */}
          <div className="px-6 py-4 border-t border-neutral-100 flex flex-wrap gap-2">
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

            <Button
              size="sm"
              variant="ghost"
              leftIcon={<Tag className="w-3.5 h-3.5" />}
              onClick={() => onEdit(guest)}
            >
              Editar Tags
            </Button>
          </div>
        </div>
      </div>

      {/* Blacklist modal */}
      {blacklistDialog && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
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

      {/* FNRH Drawer */}
      {fnrhBookingId && guest && (
        <FnrhDrawer
          isOpen
          onClose={() => setFnrhBookingId(null)}
          bookingId={fnrhBookingId}
          guestId={guest.id}
        />
      )}
    </>
  );
}
