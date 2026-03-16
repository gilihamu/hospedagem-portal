import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, CalendarDays, Clock, Users, MapPin, Copy, Check,
  Phone, MessageSquare, Star, Wifi, Car, Wind, Coffee,
  Dumbbell, Waves, UtensilsCrossed, Tv, Lock, PawPrint,
  LogIn, LogOut, AlertTriangle, Ban, Download, Share2,
  ChevronDown, ChevronUp, Shield, Info, ListChecks, Sparkles,
  Home, CreditCard, HelpCircle, CheckCircle2,
} from 'lucide-react';
import { format, parseISO, differenceInDays, isFuture, isPast, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { bookingService } from '../../../services/booking.service';
import { propertyService } from '../../../services/property.service';
import { BookingStatusBadge } from '../../../components/shared/BookingStatusBadge';
import { Spinner } from '../../../components/ui/Spinner';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { formatCurrency } from '../../../utils/formatters';
import { useToast } from '../../../hooks/useToast';
import type { Booking, Property } from '../../../types';

/* ═══════════════════════════════════════════════════════════════════
   BOOKING DETAIL — Guest View
   Shows full booking info, property rules, amenities and actions
   ═══════════════════════════════════════════════════════════════════ */

// Amenity icon map
const AMENITY_ICONS: Record<string, React.ElementType> = {
  wifi: Wifi, pool: Waves, parking: Car, ac: Wind, breakfast: Coffee,
  gym: Dumbbell, restaurant: UtensilsCrossed, tv: Tv, safe: Lock,
  pet_friendly: PawPrint, spa: Sparkles,
};

const AMENITY_LABELS: Record<string, string> = {
  wifi: 'Wi-Fi gratuito', pool: 'Piscina', parking: 'Estacionamento',
  ac: 'Ar-condicionado', breakfast: 'Café da manhã', gym: 'Academia',
  restaurant: 'Restaurante', tv: 'TV a cabo', safe: 'Cofre',
  pet_friendly: 'Pet friendly', spa: 'Spa', bar: 'Bar',
  laundry: 'Lavanderia', room_service: 'Room service', elevator: 'Elevador',
  beach_access: 'Acesso à praia',
};

export function BookingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { success, error: showError } = useToast();

  const [booking, setBooking] = useState<Booking | null>(null);
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelModal, setCancelModal] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['dates', 'rules', 'amenities'])
  );

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    bookingService
      .getById(id)
      .then(async (b) => {
        if (!b) return;
        setBooking(b);
        try {
          const p = await propertyService.getById(b.propertyId);
          setProperty(p || null);
        } catch {}
      })
      .finally(() => setLoading(false));
  }, [id]);

  const toggleSection = (key: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => success(`${label} copiado!`));
  };

  const handleCancel = async () => {
    if (!booking) return;
    setCancelling(true);
    try {
      await bookingService.cancel(booking.id);
      setBooking({ ...booking, status: 'cancelled' });
      setCancelModal(false);
      success('Reserva cancelada com sucesso.');
    } catch {
      showError('Erro ao cancelar reserva.');
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="text-5xl mb-4">🔍</div>
        <h2 className="text-xl font-bold text-neutral-800 mb-2">Reserva não encontrada</h2>
        <Link to="/my-bookings" className="text-primary font-medium hover:underline">
          ← Voltar para minhas reservas
        </Link>
      </div>
    );
  }

  const checkIn = parseISO(booking.checkIn);
  const checkOut = parseISO(booking.checkOut);
  const isActive = (isToday(checkIn) || isPast(checkIn)) && isFuture(checkOut);
  const isUpcoming = isFuture(checkIn);
  const daysUntilCheckIn = isUpcoming ? differenceInDays(checkIn, new Date()) : 0;
  const canCancel = (booking.status === 'pending' || booking.status === 'confirmed') && isUpcoming;

  const checkInTime = property?.checkInTime?.slice(0, 5) || '14:00';
  const checkOutTime = property?.checkOutTime?.slice(0, 5) || '12:00';
  const amenities = property?.amenities || [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Bar */}
      <div className="bg-white border-b sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 md:px-6 py-3 flex items-center justify-between">
          <button
            onClick={() => navigate('/my-bookings')}
            className="flex items-center gap-2 text-sm text-neutral-600 hover:text-primary transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Minhas Reservas
          </button>
          <BookingStatusBadge status={booking.status} />
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 md:px-6 py-6 space-y-6">
        {/* ═══ HERO CARD ═══ */}
        <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden shadow-sm">
          {/* Property Image */}
          <div className="relative h-48 sm:h-64 overflow-hidden">
            <img
              src={booking.propertyImage || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800'}
              alt={booking.propertyName}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute bottom-4 left-4 right-4">
              <h1 className="text-2xl font-bold text-white drop-shadow-lg">{booking.propertyName}</h1>
              <p className="text-white/80 text-sm flex items-center gap-1 mt-1">
                <MapPin className="w-3.5 h-3.5" />
                {booking.propertyCity}
              </p>
            </div>
            {isActive && (
              <div className="absolute top-4 right-4">
                <span className="bg-primary text-white text-xs font-bold px-3 py-1.5 rounded-full animate-pulse shadow-lg">
                  🏨 HOSPEDADO AGORA
                </span>
              </div>
            )}
            {isUpcoming && daysUntilCheckIn <= 3 && (
              <div className="absolute top-4 right-4">
                <span className="bg-amber-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
                  ⏳ Em {daysUntilCheckIn} dia{daysUntilCheckIn !== 1 ? 's' : ''}
                </span>
              </div>
            )}
          </div>

          {/* Confirmation Code + Dates */}
          <div className="p-5">
            <div className="flex flex-wrap items-center gap-4 mb-4">
              <div
                className="flex items-center gap-2 bg-neutral-50 px-3 py-2 rounded-lg cursor-pointer hover:bg-neutral-100 transition"
                onClick={() => handleCopy(booking.confirmationCode, 'Código')}
              >
                <span className="text-xs text-neutral-500">Código:</span>
                <span className="font-mono font-bold text-neutral-800">{booking.confirmationCode}</span>
                <Copy className="w-3.5 h-3.5 text-neutral-400" />
              </div>
              <span className="text-xs text-neutral-400">
                Reservado em {format(parseISO(booking.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              </span>
            </div>

            {/* Check-in / Check-out Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                <div className="flex items-center gap-2 text-emerald-700 mb-2">
                  <LogIn className="w-4 h-4" />
                  <span className="text-xs font-semibold uppercase tracking-wide">Check-in</span>
                </div>
                <p className="text-lg font-bold text-neutral-900">
                  {format(checkIn, "dd 'de' MMMM", { locale: ptBR })}
                </p>
                <p className="text-sm text-neutral-500 mt-0.5">
                  A partir das <strong>{checkInTime}</strong>
                </p>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="flex items-center gap-2 text-blue-700 mb-2">
                  <LogOut className="w-4 h-4" />
                  <span className="text-xs font-semibold uppercase tracking-wide">Check-out</span>
                </div>
                <p className="text-lg font-bold text-neutral-900">
                  {format(checkOut, "dd 'de' MMMM", { locale: ptBR })}
                </p>
                <p className="text-sm text-neutral-500 mt-0.5">
                  Até as <strong>{checkOutTime}</strong>
                </p>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="flex flex-wrap gap-4 mt-4 text-sm text-neutral-600">
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-neutral-400" />
                {booking.nights} noite{booking.nights !== 1 ? 's' : ''}
              </span>
              <span className="flex items-center gap-1.5">
                <Users className="w-4 h-4 text-neutral-400" />
                {booking.guests} hóspede{booking.guests !== 1 ? 's' : ''}
              </span>
              {booking.channelSource && (
                <span className="flex items-center gap-1.5">
                  <Share2 className="w-4 h-4 text-neutral-400" />
                  via {booking.channelSource.replace('_', '.')}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ═══ COLLAPSIBLE SECTIONS ═══ */}

        {/* Regras da Reserva */}
        <CollapsibleSection
          id="rules"
          title="Regras da Reserva"
          icon={ListChecks}
          iconColor="text-rose-600"
          iconBg="bg-rose-50"
          expanded={expandedSections.has('rules')}
          onToggle={() => toggleSection('rules')}
        >
          <div className="space-y-3">
            <RuleItem
              icon={LogIn}
              label="Check-in"
              value={`A partir das ${checkInTime}`}
              hint="Apresente um documento com foto na recepção"
            />
            <RuleItem
              icon={LogOut}
              label="Check-out"
              value={`Até as ${checkOutTime}`}
              hint="Late checkout sujeito a disponibilidade e taxa extra"
            />
            <RuleItem
              icon={Users}
              label="Hóspedes"
              value={`Máximo ${property?.maxGuests || booking.guests} pessoas`}
            />
            <RuleItem
              icon={Ban}
              label="Cancelamento"
              value={canCancel ? 'Cancelamento gratuito disponível' : 'Política de cancelamento aplicada'}
              hint={canCancel ? `Cancele até ${format(checkIn, "dd/MM", { locale: ptBR })} sem custos` : undefined}
            />
            <RuleItem
              icon={AlertTriangle}
              label="Observações"
              value="Não é permitido fumar nas áreas internas"
            />
            <RuleItem
              icon={Shield}
              label="Segurança"
              value="Acesso por cartão magnético / código"
            />
          </div>
        </CollapsibleSection>

        {/* Comodidades */}
        {amenities.length > 0 && (
          <CollapsibleSection
            id="amenities"
            title="Comodidades"
            icon={Sparkles}
            iconColor="text-violet-600"
            iconBg="bg-violet-50"
            expanded={expandedSections.has('amenities')}
            onToggle={() => toggleSection('amenities')}
          >
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {amenities.map((amenity) => {
                const Icon = AMENITY_ICONS[amenity] || CheckCircle2;
                const label = AMENITY_LABELS[amenity] || amenity;
                return (
                  <div
                    key={amenity}
                    className="flex items-center gap-2.5 bg-neutral-50 rounded-xl px-3 py-2.5"
                  >
                    <Icon className="w-4.5 h-4.5 text-primary flex-shrink-0" />
                    <span className="text-sm text-neutral-700">{label}</span>
                  </div>
                );
              })}
            </div>
          </CollapsibleSection>
        )}

        {/* Wi-Fi */}
        {amenities.includes('wifi') && (
          <CollapsibleSection
            id="wifi"
            title="Informações Wi-Fi"
            icon={Wifi}
            iconColor="text-indigo-600"
            iconBg="bg-indigo-50"
            expanded={expandedSections.has('wifi')}
            onToggle={() => toggleSection('wifi')}
          >
            <div className="grid grid-cols-2 gap-4">
              <div
                className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 cursor-pointer hover:bg-indigo-100 transition"
                onClick={() => handleCopy(`${booking.propertyName}_Guest`, 'Rede Wi-Fi')}
              >
                <p className="text-xs text-indigo-600 font-semibold mb-1">Rede (SSID)</p>
                <p className="font-mono font-bold text-neutral-800 flex items-center gap-2">
                  {booking.propertyName.replace(/\s+/g, '_')}_Guest
                  <Copy className="w-3.5 h-3.5 text-neutral-400" />
                </p>
              </div>
              <div
                className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 cursor-pointer hover:bg-indigo-100 transition"
                onClick={() => handleCopy('Consulte a recepção', 'Senha')}
              >
                <p className="text-xs text-indigo-600 font-semibold mb-1">Senha</p>
                <p className="font-mono font-bold text-neutral-800 flex items-center gap-2">
                  Consulte a recepção
                  <Copy className="w-3.5 h-3.5 text-neutral-400" />
                </p>
              </div>
            </div>
          </CollapsibleSection>
        )}

        {/* Pedidos Especiais */}
        {booking.specialRequests && (
          <CollapsibleSection
            id="requests"
            title="Pedidos Especiais"
            icon={MessageSquare}
            iconColor="text-teal-600"
            iconBg="bg-teal-50"
            expanded={expandedSections.has('requests')}
            onToggle={() => toggleSection('requests')}
          >
            <div className="bg-teal-50 border border-teal-100 rounded-xl p-4">
              <p className="text-sm text-neutral-700 italic">"{booking.specialRequests}"</p>
            </div>
          </CollapsibleSection>
        )}

        {/* Resumo Financeiro */}
        <CollapsibleSection
          id="payment"
          title="Resumo Financeiro"
          icon={CreditCard}
          iconColor="text-emerald-600"
          iconBg="bg-emerald-50"
          expanded={expandedSections.has('payment')}
          onToggle={() => toggleSection('payment')}
        >
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-neutral-500">
                {formatCurrency(booking.pricePerNight)} × {booking.nights} noite{booking.nights !== 1 ? 's' : ''}
              </span>
              <span className="text-neutral-700">{formatCurrency(booking.subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-neutral-500">Taxas e impostos</span>
              <span className="text-neutral-700">{formatCurrency(booking.taxes)}</span>
            </div>
            <div className="border-t pt-3 flex justify-between">
              <span className="font-semibold text-neutral-800">Total</span>
              <span className="text-xl font-bold text-primary">{formatCurrency(booking.totalPrice)}</span>
            </div>
          </div>
        </CollapsibleSection>

        {/* Precisa de Ajuda */}
        <CollapsibleSection
          id="help"
          title="Precisa de ajuda?"
          icon={HelpCircle}
          iconColor="text-amber-600"
          iconBg="bg-amber-50"
          expanded={expandedSections.has('help')}
          onToggle={() => toggleSection('help')}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button className="flex items-center gap-3 bg-neutral-50 hover:bg-neutral-100 rounded-xl p-4 transition text-left">
              <Phone className="w-5 h-5 text-primary" />
              <div>
                <p className="text-sm font-medium text-neutral-800">Ligar para o hotel</p>
                <p className="text-xs text-neutral-500">Fale direto com a recepção</p>
              </div>
            </button>
            <Link
              to="/messages"
              className="flex items-center gap-3 bg-neutral-50 hover:bg-neutral-100 rounded-xl p-4 transition"
            >
              <MessageSquare className="w-5 h-5 text-primary" />
              <div>
                <p className="text-sm font-medium text-neutral-800">Enviar mensagem</p>
                <p className="text-xs text-neutral-500">Chat com o anfitrião</p>
              </div>
            </Link>
          </div>
        </CollapsibleSection>

        {/* ═══ ACTIONS BAR ═══ */}
        {(canCancel || isActive) && (
          <div className="bg-white rounded-2xl border border-neutral-200 p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-neutral-700 mb-3">Ações</h3>
            <div className="flex flex-wrap gap-3">
              {canCancel && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCancelModal(true)}
                  className="border-red-200 text-red-600 hover:bg-red-50"
                >
                  <Ban className="w-4 h-4 mr-1.5" />
                  Cancelar reserva
                </Button>
              )}
              {isActive && (
                <Button variant="outline" size="sm">
                  <Star className="w-4 h-4 mr-1.5" />
                  Avaliar estadia
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleCopy(
                  `Reserva ${booking.confirmationCode}\n${booking.propertyName}\n${format(checkIn, 'dd/MM/yyyy')} - ${format(checkOut, 'dd/MM/yyyy')}\n${formatCurrency(booking.totalPrice)}`,
                  'Detalhes da reserva'
                )}
              >
                <Download className="w-4 h-4 mr-1.5" />
                Copiar detalhes
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* ═══ CANCEL MODAL ═══ */}
      <Modal
        isOpen={cancelModal}
        onClose={() => setCancelModal(false)}
        title="Cancelar reserva"
      >
        <div className="space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5" />
              <div>
                <p className="font-medium text-red-800">Tem certeza?</p>
                <p className="text-sm text-red-600 mt-1">
                  Ao cancelar a reserva <strong>{booking.confirmationCode}</strong> em{' '}
                  <strong>{booking.propertyName}</strong>, esta ação não poderá ser desfeita.
                </p>
              </div>
            </div>
          </div>
          <div className="bg-neutral-50 rounded-xl p-4 text-sm space-y-1">
            <div className="flex justify-between">
              <span className="text-neutral-500">Check-in</span>
              <span className="font-medium">{format(checkIn, 'dd/MM/yyyy')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">Check-out</span>
              <span className="font-medium">{format(checkOut, 'dd/MM/yyyy')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">Total</span>
              <span className="font-medium">{formatCurrency(booking.totalPrice)}</span>
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setCancelModal(false)}>
              Manter reserva
            </Button>
            <Button
              variant="primary"
              onClick={handleCancel}
              loading={cancelling}
              className="bg-red-600 hover:bg-red-700"
            >
              Confirmar cancelamento
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

/* ═══ Collapsible Section ═══ */
function CollapsibleSection({
  id,
  title,
  icon: Icon,
  iconColor,
  iconBg,
  expanded,
  onToggle,
  children,
}: {
  id: string;
  title: string;
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden shadow-sm">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-neutral-50/60 transition-colors"
      >
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg}`}>
          <Icon className={`w-5 h-5 ${iconColor}`} />
        </div>
        <span className="flex-1 font-semibold text-neutral-800">{title}</span>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-neutral-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-neutral-400" />
        )}
      </button>
      {expanded && <div className="px-5 pb-5">{children}</div>}
    </div>
  );
}

/* ═══ Rule Item ═══ */
function RuleItem({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="flex items-start gap-3 bg-neutral-50 rounded-xl p-3">
      <div className="w-8 h-8 rounded-lg bg-white border border-neutral-200 flex items-center justify-center flex-shrink-0 mt-0.5">
        <Icon className="w-4 h-4 text-neutral-600" />
      </div>
      <div>
        <p className="text-sm font-medium text-neutral-800">{label}</p>
        <p className="text-sm text-neutral-600">{value}</p>
        {hint && <p className="text-xs text-neutral-400 mt-0.5">{hint}</p>}
      </div>
    </div>
  );
}
