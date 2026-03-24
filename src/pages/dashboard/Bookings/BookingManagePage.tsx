import { useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, Copy, Check, Phone, Mail, MessageCircle,
  Calendar, Clock, Users, CreditCard, Building2, User,
  MapPin, Star, Edit3, XCircle, CheckCircle, AlertTriangle,
  Send, History, PlusCircle, Printer,
  MoreHorizontal, Ban, BedDouble, Hash,
  ExternalLink,
} from 'lucide-react';
import { format, parseISO, differenceInDays, isFuture, isPast, isToday, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useBooking, useUpdateBookingStatus, useGuestBookings } from '../../../hooks/useBookings';
import { useProperty } from '../../../hooks/useProperties';
import { BookingStatusBadge } from '../../../components/shared/BookingStatusBadge';
import { ChannelBadge } from '../../../components/shared/ChannelBadge';
import { Spinner } from '../../../components/ui/Spinner';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { useToast } from '../../../hooks/useToast';
import { formatCurrency, formatDate } from '../../../utils/formatters';
import { ROUTES } from '../../../router/routes';
import type { Booking, BookingStatus } from '../../../types';

/* ═══════════════════════════════════════════════════════════════════
   STATUS CONFIG
   ═══════════════════════════════════════════════════════════════════ */
const STATUS_CONFIG: Record<BookingStatus, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  pending: { label: 'Pendente', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200', icon: Clock },
  confirmed: { label: 'Confirmada', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200', icon: CheckCircle },
  completed: { label: 'Concluída', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200', icon: CheckCircle },
  cancelled: { label: 'Cancelada', color: 'text-red-700', bg: 'bg-red-50 border-red-200', icon: XCircle },
  no_show: { label: 'No-show', color: 'text-neutral-700', bg: 'bg-neutral-100 border-neutral-300', icon: Ban },
};

/* ═══════════════════════════════════════════════════════════════════
   WHATSAPP MESSAGE TEMPLATES
   ═══════════════════════════════════════════════════════════════════ */
function buildWhatsAppUrl(phone: string, message: string) {
  const cleaned = phone.replace(/\D/g, '');
  const num = cleaned.startsWith('55') ? cleaned : `55${cleaned}`;
  return `https://wa.me/${num}?text=${encodeURIComponent(message)}`;
}

function confirmationMsg(b: Booking) {
  return `Olá ${b.guestName.split(' ')[0]}! 🏠\n\nSua reserva *${b.confirmationCode}* em *${b.propertyName}* está *confirmada*!\n\n📅 Check-in: ${formatDate(b.checkIn)}\n📅 Check-out: ${formatDate(b.checkOut)}\n👥 Hóspedes: ${b.guests}\n💰 Total: ${formatCurrency(b.totalPrice)}\n\nQualquer dúvida, estamos à disposição!\nEquipe ${b.propertyName}`;
}

function cancellationRequestMsg(b: Booking) {
  return `Olá ${b.guestName.split(' ')[0]},\n\nGostaríamos de informar sobre sua reserva *${b.confirmationCode}* em *${b.propertyName}* (${formatDate(b.checkIn)} - ${formatDate(b.checkOut)}).\n\nInfelizmente, precisamos solicitar o cancelamento desta reserva. Pedimos desculpas pelo inconveniente.\n\nPor favor, entre em contato conosco para conversarmos sobre alternativas ou reembolso.\n\nAtenciosamente,\nEquipe ${b.propertyName}`;
}

function reminderMsg(b: Booking) {
  return `Olá ${b.guestName.split(' ')[0]}! 👋\n\nLembramos que seu check-in em *${b.propertyName}* está chegando!\n\n📅 Data: ${formatDate(b.checkIn)}\n🕐 Horário: a partir das 14h\n📍 Endereço será enviado em breve\n\nAlguma dúvida? Estamos aqui!\nEquipe ${b.propertyName}`;
}

function checkoutMsg(b: Booking) {
  return `Olá ${b.guestName.split(' ')[0]}! 🙏\n\nObrigado por se hospedar conosco em *${b.propertyName}*!\n\nEsperamos que sua experiência tenha sido incrível. Ficaríamos muito gratos se pudesse deixar uma avaliação.\n\nAté a próxima!\nEquipe ${b.propertyName}`;
}

/* ═══════════════════════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════════════════════ */
export function BookingManagePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { success, error: showError } = useToast();

  const { data: booking, isLoading, refetch } = useBooking(id);
  const { data: property } = useProperty(booking?.propertyId || '');
  const { data: guestBookings } = useGuestBookings(booking?.guestId);
  const statusMutation = useUpdateBookingStatus();

  // Modals
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showExtendModal, setShowExtendModal] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [messageTemplate, setMessageTemplate] = useState('');
  const [messageChannel, setMessageChannel] = useState<'whatsapp' | 'email'>('whatsapp');
  const [extraDays, setExtraDays] = useState(1);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [statusChanging, setStatusChanging] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'actions' | 'history'>('details');

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
    success('Copiado!');
  };

  const handleStatusChange = async (status: BookingStatus) => {
    if (!booking) return;
    setStatusChanging(true);
    try {
      await statusMutation.mutateAsync({ id: booking.id, status });
      await refetch();
      setShowStatusModal(false);
      success(`Status alterado para ${STATUS_CONFIG[status].label}`);
    } catch {
      showError('Erro ao alterar status');
    } finally {
      setStatusChanging(false);
    }
  };

  const openMessage = (template: string, channel: 'whatsapp' | 'email' = 'whatsapp') => {
    setMessageTemplate(template);
    setMessageChannel(channel);
    setShowMessageModal(true);
  };

  const sendMessage = () => {
    if (!booking) return;
    if (messageChannel === 'whatsapp') {
      window.open(buildWhatsAppUrl(booking.guestPhone, messageTemplate), '_blank');
    } else {
      const subject = `Reserva ${booking.confirmationCode} - ${booking.propertyName}`;
      window.open(`mailto:${booking.guestEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(messageTemplate)}`, '_blank');
    }
    setShowMessageModal(false);
    success('Mensagem aberta!');
  };

  // Computed
  const checkIn = booking ? parseISO(booking.checkIn) : new Date();
  const checkOut = booking ? parseISO(booking.checkOut) : new Date();
  const isUpcoming = booking ? isFuture(checkIn) : false;
  const isOngoing = booking ? (isPast(checkIn) || isToday(checkIn)) && isFuture(checkOut) : false;
  const isPastBooking = booking ? isPast(checkOut) : false;
  const daysUntilCheckin = booking ? differenceInDays(checkIn, new Date()) : 0;

  const otherGuestBookings = useMemo(() =>
    guestBookings?.filter(b => b.id !== booking?.id).sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    ) || [],
    [guestBookings, booking]
  );

  const guestTotalSpent = useMemo(() =>
    guestBookings?.filter(b => b.status !== 'cancelled').reduce((s, b) => s + b.totalPrice, 0) || 0,
    [guestBookings]
  );

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><Spinner size="lg" /></div>;
  }

  if (!booking) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <AlertTriangle className="w-12 h-12 text-neutral-300 mb-3" />
        <h2 className="text-xl font-bold text-neutral-800 mb-2">Reserva não encontrada</h2>
        <Link to={ROUTES.DASHBOARD_BOOKINGS} className="text-primary font-medium hover:underline">
          ← Voltar para reservas
        </Link>
      </div>
    );
  }

  const sc = STATUS_CONFIG[booking.status];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* ═══ HEADER ═══ */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(ROUTES.DASHBOARD_BOOKINGS)} className="p-2 rounded-lg hover:bg-neutral-100 transition-colors">
            <ArrowLeft className="w-5 h-5 text-neutral-500" />
          </button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-neutral-900">Reserva {booking.confirmationCode}</h1>
              <BookingStatusBadge status={booking.status} />
              {booking.channelSource && <ChannelBadge slug={booking.channelSource} />}
            </div>
            <p className="text-sm text-neutral-500 mt-0.5">
              Criada em {format(parseISO(booking.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
            </p>
          </div>
        </div>

        {/* Quick actions */}
        <div className="flex items-center gap-2 flex-wrap">
          {booking.status === 'pending' && (
            <Button size="sm" leftIcon={<CheckCircle className="w-4 h-4" />} onClick={() => handleStatusChange('confirmed')}>
              Confirmar
            </Button>
          )}
          {(booking.status === 'pending' || booking.status === 'confirmed') && (
            <Button size="sm" variant="outline" leftIcon={<MessageCircle className="w-4 h-4" />} onClick={() => openMessage(confirmationMsg(booking))}>
              WhatsApp
            </Button>
          )}
          <Button size="sm" variant="ghost" leftIcon={<Printer className="w-4 h-4" />} onClick={() => window.print()}>
            Imprimir
          </Button>
        </div>
      </div>

      {/* ═══ STATUS BANNER ═══ */}
      <div className={`rounded-xl border p-4 ${sc.bg} flex items-center gap-3 flex-wrap`}>
        <sc.icon className={`w-5 h-5 ${sc.color}`} />
        <div className="flex-1">
          <p className={`font-semibold ${sc.color}`}>{sc.label}</p>
          <p className="text-sm text-neutral-600">
            {isUpcoming && daysUntilCheckin > 0 && `Check-in em ${daysUntilCheckin} dia(s)`}
            {isUpcoming && daysUntilCheckin === 0 && 'Check-in é hoje!'}
            {isOngoing && 'Hóspede está hospedado agora'}
            {isPastBooking && booking.status !== 'cancelled' && 'Reserva finalizada'}
            {booking.status === 'cancelled' && 'Esta reserva foi cancelada'}
          </p>
        </div>
        <Button size="sm" variant="outline" leftIcon={<Edit3 className="w-3.5 h-3.5" />} onClick={() => setShowStatusModal(true)}>
          Alterar Status
        </Button>
      </div>

      {/* ═══ TAB NAVIGATION (mobile) ═══ */}
      <div className="flex border-b border-surface-border lg:hidden">
        {(['details', 'actions', 'history'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2.5 text-sm font-medium transition-colors border-b-2 ${
              activeTab === tab ? 'border-primary text-primary' : 'border-transparent text-neutral-500'
            }`}
          >
            {tab === 'details' ? 'Detalhes' : tab === 'actions' ? 'Ações' : 'Histórico'}
          </button>
        ))}
      </div>

      {/* ═══ MAIN CONTENT ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT COLUMN — Details */}
        <div className={`lg:col-span-2 space-y-5 ${activeTab !== 'details' ? 'hidden lg:block' : ''}`}>
          {/* Dates & Property */}
          <div className="card-base p-5">
            <h2 className="font-semibold text-neutral-800 mb-4 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" /> Dados da Reserva
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <InfoItem icon={Calendar} label="Check-in" value={format(checkIn, "EEE, dd/MM/yyyy", { locale: ptBR })} />
              <InfoItem icon={Calendar} label="Check-out" value={format(checkOut, "EEE, dd/MM/yyyy", { locale: ptBR })} />
              <InfoItem icon={Clock} label="Noites" value={`${booking.nights} noite(s)`} />
              <InfoItem icon={Users} label="Hóspedes" value={`${booking.guests} pessoa(s)`} />
            </div>
            {booking.specialRequests && (
              <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-xs font-semibold text-amber-700 mb-1">Pedidos especiais:</p>
                <p className="text-sm text-amber-800">{booking.specialRequests}</p>
              </div>
            )}
          </div>

          {/* Property Info */}
          <div className="card-base p-5">
            <h2 className="font-semibold text-neutral-800 mb-4 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-primary" /> Propriedade
            </h2>
            <div className="flex items-start gap-4">
              {booking.propertyImage && (
                <img src={booking.propertyImage} alt={booking.propertyName} className="w-20 h-20 rounded-xl object-cover flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-neutral-800">{booking.propertyName}</p>
                <p className="text-sm text-neutral-500 flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3.5 h-3.5" /> {booking.propertyCity}
                </p>
                {property && (
                  <div className="flex items-center gap-3 mt-2 text-xs text-neutral-500">
                    <span className="flex items-center gap-1"><BedDouble className="w-3 h-3" /> {property.bedrooms} quarto(s)</span>
                    <span className="flex items-center gap-1"><Users className="w-3 h-3" /> Máx {property.maxGuests}</span>
                    {property.rating > 0 && <span className="flex items-center gap-1"><Star className="w-3 h-3 text-amber-400" /> {property.rating}</span>}
                  </div>
                )}
                {property?.checkInTime && (
                  <div className="flex items-center gap-4 mt-2 text-xs text-neutral-500">
                    <span>Check-in: {property.checkInTime}</span>
                    {property.checkOutTime && <span>Check-out: {property.checkOutTime}</span>}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Financeiro */}
          <div className="card-base p-5">
            <h2 className="font-semibold text-neutral-800 mb-4 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-primary" /> Financeiro
            </h2>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-neutral-500">{booking.nights} noite(s) × {formatCurrency(booking.pricePerNight)}</span>
                <span className="text-neutral-700">{formatCurrency(booking.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-neutral-500">Taxas</span>
                <span className="text-neutral-700">{formatCurrency(booking.taxes)}</span>
              </div>
              <div className="border-t border-surface-border pt-2 flex justify-between">
                <span className="font-semibold text-neutral-800">Total</span>
                <span className="font-bold text-lg text-primary">{formatCurrency(booking.totalPrice)}</span>
              </div>
              {booking.pricePerNight > 0 && (
                <p className="text-xs text-neutral-400 text-right">Diária média: {formatCurrency(booking.totalPrice / booking.nights)}</p>
              )}
            </div>
          </div>

          {/* Guest Booking History */}
          <div className={`card-base p-5 ${activeTab === 'history' ? '' : 'hidden lg:block'}`}>
            <h2 className="font-semibold text-neutral-800 mb-4 flex items-center gap-2">
              <History className="w-4 h-4 text-primary" /> Histórico do Hóspede
            </h2>
            <div className="flex items-center gap-4 mb-4 p-3 bg-neutral-50 rounded-lg">
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">{(guestBookings?.length || 1)}</p>
                <p className="text-[10px] text-neutral-500 uppercase">Reservas</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-emerald-600">{formatCurrency(guestTotalSpent)}</p>
                <p className="text-[10px] text-neutral-500 uppercase">Total gasto</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-amber-500">{guestBookings?.filter(b => b.status === 'completed').length || 0}</p>
                <p className="text-[10px] text-neutral-500 uppercase">Concluídas</p>
              </div>
            </div>
            {otherGuestBookings.length === 0 ? (
              <p className="text-sm text-neutral-400 text-center py-4">Primeira reserva deste hóspede</p>
            ) : (
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {otherGuestBookings.map(b => (
                  <div key={b.id} className="flex items-center justify-between p-2.5 rounded-lg border border-surface-border hover:bg-neutral-50 transition-colors">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-neutral-700 truncate">{b.propertyName}</p>
                      <p className="text-xs text-neutral-400">{formatDate(b.checkIn)} → {formatDate(b.checkOut)}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                      <BookingStatusBadge status={b.status} />
                      <span className="text-sm font-semibold text-neutral-700">{formatCurrency(b.totalPrice)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN — Guest & Actions */}
        <div className={`space-y-5 ${activeTab !== 'details' && activeTab !== 'actions' ? 'hidden lg:block' : ''}`}>
          {/* Guest Card */}
          <div className="card-base p-5">
            <h2 className="font-semibold text-neutral-800 mb-4 flex items-center gap-2">
              <User className="w-4 h-4 text-primary" /> Hóspede
            </h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-lg font-bold text-primary">{booking.guestName.charAt(0)}</span>
                </div>
                <div>
                  <p className="font-semibold text-neutral-800">{booking.guestName}</p>
                  <p className="text-xs text-neutral-500">{(guestBookings?.length || 1)} reserva(s) · {formatCurrency(guestTotalSpent)} total</p>
                </div>
              </div>

              <CopyableField icon={Mail} label="Email" value={booking.guestEmail} copied={copiedField} onCopy={handleCopy} />
              <CopyableField icon={Phone} label="Telefone" value={booking.guestPhone} copied={copiedField} onCopy={handleCopy} />
              <CopyableField icon={Hash} label="Código" value={booking.confirmationCode} copied={copiedField} onCopy={handleCopy} />
            </div>
          </div>

          {/* Quick Actions */}
          <div className={`card-base p-5 ${activeTab !== 'actions' ? 'hidden lg:block' : ''}`}>
            <h2 className="font-semibold text-neutral-800 mb-4 flex items-center gap-2">
              <MoreHorizontal className="w-4 h-4 text-primary" /> Ações
            </h2>
            <div className="space-y-2">
              {/* Messaging */}
              <ActionGroup title="Comunicação">
                <ActionButton
                  icon={MessageCircle} label="WhatsApp — Confirmação" color="text-green-600"
                  onClick={() => openMessage(confirmationMsg(booking))}
                />
                <ActionButton
                  icon={MessageCircle} label="WhatsApp — Lembrete check-in" color="text-green-600"
                  onClick={() => openMessage(reminderMsg(booking))}
                />
                <ActionButton
                  icon={MessageCircle} label="WhatsApp — Pós check-out" color="text-green-600"
                  onClick={() => openMessage(checkoutMsg(booking))}
                />
                <ActionButton
                  icon={Mail} label="Email — Confirmação" color="text-blue-600"
                  onClick={() => openMessage(confirmationMsg(booking), 'email')}
                />
                <ActionButton
                  icon={Phone} label="Ligar para hóspede" color="text-primary"
                  onClick={() => window.open(`tel:${booking.guestPhone}`, '_self')}
                />
              </ActionGroup>

              {/* Reservation management */}
              <ActionGroup title="Gerenciar Reserva">
                {booking.status !== 'cancelled' && booking.status !== 'completed' && (
                  <>
                    <ActionButton icon={Edit3} label="Alterar status" color="text-primary" onClick={() => setShowStatusModal(true)} />
                    <ActionButton icon={PlusCircle} label="Estender estadia" color="text-emerald-600" onClick={() => setShowExtendModal(true)} />
                  </>
                )}
                {booking.status === 'confirmed' && isOngoing && (
                  <ActionButton icon={CheckCircle} label="Marcar check-out" color="text-emerald-600" onClick={() => handleStatusChange('completed')} />
                )}
                {booking.status === 'confirmed' && isPastBooking && (
                  <ActionButton icon={Ban} label="Marcar no-show" color="text-neutral-600" onClick={() => handleStatusChange('no_show')} />
                )}
              </ActionGroup>

              {/* Cancellation */}
              {booking.status !== 'cancelled' && booking.status !== 'completed' && (
                <ActionGroup title="Cancelamento">
                  <ActionButton
                    icon={MessageCircle} label="Solicitar cancelamento (WhatsApp)" color="text-red-500"
                    onClick={() => openMessage(cancellationRequestMsg(booking))}
                  />
                  <ActionButton
                    icon={XCircle} label="Cancelar reserva" color="text-red-600"
                    onClick={() => setShowCancelModal(true)}
                  />
                </ActionGroup>
              )}

              {/* Utilities */}
              <ActionGroup title="Utilidades">
                <ActionButton icon={Printer} label="Imprimir ficha" color="text-neutral-600" onClick={() => window.print()} />
                <ActionButton
                  icon={ExternalLink} label="Ver propriedade" color="text-neutral-600"
                  onClick={() => navigate(`/property/${booking.propertyId}`)}
                />
              </ActionGroup>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ MODALS ═══ */}

      {/* Status Change Modal */}
      <Modal isOpen={showStatusModal} onClose={() => setShowStatusModal(false)} title="Alterar Status da Reserva" size="sm">
        <div className="space-y-3">
          {(Object.entries(STATUS_CONFIG) as [BookingStatus, typeof STATUS_CONFIG[BookingStatus]][]).map(([status, cfg]) => (
            <button
              key={status}
              disabled={status === booking.status || statusChanging}
              onClick={() => handleStatusChange(status)}
              className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-colors ${
                status === booking.status
                  ? 'bg-neutral-100 border-neutral-200 opacity-50 cursor-not-allowed'
                  : 'border-surface-border hover:bg-neutral-50 cursor-pointer'
              }`}
            >
              <cfg.icon className={`w-5 h-5 ${cfg.color}`} />
              <span className={`font-medium ${cfg.color}`}>{cfg.label}</span>
              {status === booking.status && <span className="text-xs text-neutral-400 ml-auto">(atual)</span>}
            </button>
          ))}
        </div>
      </Modal>

      {/* Cancel Modal */}
      <Modal isOpen={showCancelModal} onClose={() => setShowCancelModal(false)} title="Cancelar Reserva" size="sm">
        <div className="space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5" />
            <div>
              <p className="font-medium text-red-800">Tem certeza?</p>
              <p className="text-sm text-red-600 mt-1">
                Reserva <strong>{booking.confirmationCode}</strong> de <strong>{booking.guestName}</strong> será cancelada.
              </p>
            </div>
          </div>
          <div className="bg-neutral-50 rounded-xl p-3 text-sm space-y-1">
            <div className="flex justify-between"><span className="text-neutral-500">Check-in</span><span>{formatDate(booking.checkIn)}</span></div>
            <div className="flex justify-between"><span className="text-neutral-500">Check-out</span><span>{formatDate(booking.checkOut)}</span></div>
            <div className="flex justify-between"><span className="text-neutral-500">Total</span><span className="font-semibold">{formatCurrency(booking.totalPrice)}</span></div>
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setShowCancelModal(false)}>Manter</Button>
            <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={() => { handleStatusChange('cancelled'); setShowCancelModal(false); }}>
              Confirmar Cancelamento
            </Button>
          </div>
        </div>
      </Modal>

      {/* Extend Stay Modal */}
      <Modal isOpen={showExtendModal} onClose={() => setShowExtendModal(false)} title="Estender Estadia" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-neutral-600">
            Check-out atual: <strong>{format(checkOut, 'dd/MM/yyyy', { locale: ptBR })}</strong>
          </p>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Dias extras</label>
            <input
              type="number" min={1} max={30} value={extraDays}
              onChange={e => setExtraDays(Math.max(1, Number(e.target.value)))}
              className="input-base w-full"
            />
          </div>
          <div className="bg-neutral-50 rounded-xl p-3 text-sm space-y-1">
            <div className="flex justify-between">
              <span className="text-neutral-500">Novo check-out</span>
              <span className="font-semibold">{format(addDays(checkOut, extraDays), 'dd/MM/yyyy')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">Valor extra estimado</span>
              <span className="font-semibold text-primary">{formatCurrency(booking.pricePerNight * extraDays)}</span>
            </div>
            <div className="flex justify-between border-t border-surface-border pt-1 mt-1">
              <span className="text-neutral-500">Novo total estimado</span>
              <span className="font-bold text-primary">{formatCurrency(booking.totalPrice + booking.pricePerNight * extraDays)}</span>
            </div>
          </div>
          <p className="text-xs text-neutral-400">* A extensão será registrada. Verifique a disponibilidade antes de confirmar.</p>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setShowExtendModal(false)}>Cancelar</Button>
            <Button onClick={() => {
              const msg = `Olá ${booking.guestName.split(' ')[0]}! Sua estadia em ${booking.propertyName} foi estendida por mais ${extraDays} dia(s).\n\nNovo check-out: ${format(addDays(checkOut, extraDays), 'dd/MM/yyyy')}\nValor adicional: ${formatCurrency(booking.pricePerNight * extraDays)}\n\nObrigado pela preferência!`;
              openMessage(msg);
              setShowExtendModal(false);
            }}>
              Notificar Hóspede
            </Button>
          </div>
        </div>
      </Modal>

      {/* Message Preview Modal */}
      <Modal isOpen={showMessageModal} onClose={() => setShowMessageModal(false)} title={messageChannel === 'whatsapp' ? 'Enviar WhatsApp' : 'Enviar Email'} size="md">
        <div className="space-y-4">
          <div className="flex gap-2">
            <button
              onClick={() => setMessageChannel('whatsapp')}
              className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${messageChannel === 'whatsapp' ? 'bg-green-50 border-green-300 text-green-700' : 'border-surface-border text-neutral-500'}`}
            >
              <MessageCircle className="w-4 h-4 inline mr-1" /> WhatsApp
            </button>
            <button
              onClick={() => setMessageChannel('email')}
              className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${messageChannel === 'email' ? 'bg-blue-50 border-blue-300 text-blue-700' : 'border-surface-border text-neutral-500'}`}
            >
              <Mail className="w-4 h-4 inline mr-1" /> Email
            </button>
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Para: <strong>{messageChannel === 'whatsapp' ? booking.guestPhone : booking.guestEmail}</strong>
            </label>
            <textarea
              value={messageTemplate}
              onChange={e => setMessageTemplate(e.target.value)}
              rows={8}
              className="input-base w-full text-sm resize-none"
            />
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setShowMessageModal(false)}>Cancelar</Button>
            <Button leftIcon={<Send className="w-4 h-4" />} onClick={sendMessage}>
              {messageChannel === 'whatsapp' ? 'Abrir WhatsApp' : 'Abrir Email'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

/* ═══ SUB-COMPONENTS ═══ */

function InfoItem({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="p-3 bg-neutral-50 rounded-lg">
      <div className="flex items-center gap-1.5 mb-1">
        <Icon className="w-3.5 h-3.5 text-neutral-400" />
        <span className="text-[11px] text-neutral-500 uppercase font-medium">{label}</span>
      </div>
      <p className="text-sm font-semibold text-neutral-800 capitalize">{value}</p>
    </div>
  );
}

function CopyableField({ icon: Icon, label, value, copied, onCopy }: {
  icon: React.ElementType; label: string; value: string; copied: string | null;
  onCopy: (v: string, f: string) => void;
}) {
  return (
    <div className="flex items-center justify-between p-2.5 rounded-lg bg-neutral-50 group">
      <div className="flex items-center gap-2 min-w-0">
        <Icon className="w-4 h-4 text-neutral-400 flex-shrink-0" />
        <div className="min-w-0">
          <p className="text-[10px] text-neutral-400 uppercase">{label}</p>
          <p className="text-sm text-neutral-700 truncate">{value}</p>
        </div>
      </div>
      <button
        onClick={() => onCopy(value, label)}
        className="p-1.5 rounded-md hover:bg-neutral-200 transition-colors opacity-0 group-hover:opacity-100"
      >
        {copied === label
          ? <Check className="w-3.5 h-3.5 text-green-500" />
          : <Copy className="w-3.5 h-3.5 text-neutral-400" />
        }
      </button>
    </div>
  );
}

function ActionGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="pt-2 first:pt-0">
      <p className="text-[10px] text-neutral-400 uppercase font-semibold mb-1.5 px-1">{title}</p>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function ActionButton({ icon: Icon, label, color, onClick }: {
  icon: React.ElementType; label: string; color: string; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left hover:bg-neutral-50 transition-colors group"
    >
      <Icon className={`w-4 h-4 ${color} flex-shrink-0`} />
      <span className="text-sm text-neutral-700 group-hover:text-neutral-900">{label}</span>
    </button>
  );
}
