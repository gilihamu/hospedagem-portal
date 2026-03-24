import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  LogIn, LogOut, Wifi, Car, ListChecks, MapPin, Ambulance,
  Bus, Settings2, Copy, Check, Star, CalendarPlus,
  HelpCircle, Megaphone, ChevronDown, ChevronUp, ExternalLink,
  PhoneCall, Mail, MessageSquare, Home, AlertTriangle,
} from 'lucide-react';
import { format, parseISO, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useGuestPortal, useSubmitFeedback } from '../../../hooks/useGuestGuide';
import { Spinner } from '../../../components/ui/Spinner';
import { cn } from '../../../utils/cn';
import { formatCurrency } from '../../../utils/formatters';
import type { GuestSectionType, GuestGuideSection, GuestFeedbackType } from '../../../types';

// ── Section config ─────────────────────────────────────────────────────────────
const SECTION_CONFIG: Record<GuestSectionType, {
  icon: React.ElementType;
  color: string;
  bg: string;
  border: string;
}> = {
  checkin:   { icon: LogIn,       color: 'text-emerald-600', bg: 'bg-emerald-50',  border: 'border-emerald-200' },
  checkout:  { icon: LogOut,      color: 'text-blue-600',    bg: 'bg-blue-50',     border: 'border-blue-200'    },
  wifi:      { icon: Wifi,        color: 'text-violet-600',  bg: 'bg-violet-50',   border: 'border-violet-200'  },
  parking:   { icon: Car,         color: 'text-orange-600',  bg: 'bg-orange-50',   border: 'border-orange-200'  },
  rules:     { icon: ListChecks,  color: 'text-rose-600',    bg: 'bg-rose-50',     border: 'border-rose-200'    },
  tips:      { icon: MapPin,      color: 'text-teal-600',    bg: 'bg-teal-50',     border: 'border-teal-200'    },
  emergency: { icon: Ambulance,   color: 'text-red-600',     bg: 'bg-red-50',      border: 'border-red-200'     },
  transport: { icon: Bus,         color: 'text-indigo-600',  bg: 'bg-indigo-50',   border: 'border-indigo-200'  },
  custom:    { icon: Settings2,   color: 'text-neutral-600', bg: 'bg-neutral-50',  border: 'border-neutral-200' },
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function useCopy(text: string) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return { copied, copy };
}

// ── Sub-components ─────────────────────────────────────────────────────────────
function SectionCard({ section }: { section: GuestGuideSection }) {
  const [open, setOpen] = useState(true);
  const cfg = SECTION_CONFIG[section.type] ?? SECTION_CONFIG.custom;
  const Icon = cfg.icon;
  const lines = section.content.split('\n').filter(Boolean);

  // WiFi special layout
  const isWifi = section.type === 'wifi';
  const ssid     = section.extra?.ssid     ?? '';
  const password = section.extra?.password ?? '';
  const { copied: copiedSSID,     copy: copySSID     } = useCopy(ssid);
  const { copied: copiedPassword, copy: copyPassword } = useCopy(password);

  return (
    <div className={cn('rounded-2xl border bg-white overflow-hidden shadow-sm', cfg.border)}>
      {/* Header */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-neutral-50/60 transition-colors"
      >
        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', cfg.bg)}>
          <Icon className={cn('w-5 h-5', cfg.color)} />
        </div>
        <span className="flex-1 font-semibold text-neutral-800">{section.title}</span>
        {open
          ? <ChevronUp   className="w-4 h-4 text-neutral-400" />
          : <ChevronDown className="w-4 h-4 text-neutral-400" />
        }
      </button>

      {/* Body */}
      {open && (
        <div className="px-5 pb-5 space-y-3">
          {/* WiFi special row */}
          {isWifi && (ssid || password) && (
            <div className={cn('rounded-xl p-4 space-y-2.5', cfg.bg)}>
              {ssid && (
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs text-neutral-500 font-medium uppercase tracking-wider mb-0.5">Rede</p>
                    <p className="font-semibold text-neutral-800">{ssid}</p>
                  </div>
                  <button
                    type="button"
                    onClick={copySSID}
                    className={cn('p-2 rounded-lg transition-colors', copiedSSID ? 'bg-emerald-100 text-emerald-600' : 'bg-white text-neutral-500 hover:text-violet-600')}
                    title="Copiar rede"
                  >
                    {copiedSSID ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              )}
              {password && (
                <div className="flex items-center justify-between gap-3 pt-2 border-t border-violet-100">
                  <div>
                    <p className="text-xs text-neutral-500 font-medium uppercase tracking-wider mb-0.5">Senha</p>
                    <p className="font-mono font-semibold text-neutral-800 text-lg tracking-wider">{password}</p>
                  </div>
                  <button
                    type="button"
                    onClick={copyPassword}
                    className={cn('p-2 rounded-lg transition-colors', copiedPassword ? 'bg-emerald-100 text-emerald-600' : 'bg-white text-neutral-500 hover:text-violet-600')}
                    title="Copiar senha"
                  >
                    {copiedPassword ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Content lines */}
          {lines.length > 0 && (
            <ul className="space-y-2">
              {lines.map((line, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm text-neutral-700">
                  <span className={cn('w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0', cfg.color.replace('text-', 'bg-'))} />
                  <span>{line.replace(/^[•\-–]\s*/, '')}</span>
                </li>
              ))}
            </ul>
          )}

          {/* Check-in / checkout time badge */}
          {(section.type === 'checkin' || section.type === 'checkout') && section.extra?.time && (
            <div className={cn('inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-bold', cfg.bg, cfg.color)}>
              {section.type === 'checkin' ? <LogIn className="w-4 h-4" /> : <LogOut className="w-4 h-4" />}
              {section.type === 'checkin' ? 'A partir das' : 'Até as'} {section.extra.time}h
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Feedback Modal ─────────────────────────────────────────────────────────────
interface FeedbackModalProps {
  type: GuestFeedbackType;
  title: string;
  propertyId: string;
  propertyName: string;
  bookingId?: string;
  guestName: string;
  guestEmail?: string;
  onClose: () => void;
}

function FeedbackModal({ type, title, propertyId, propertyName, bookingId, guestName, guestEmail, onClose }: FeedbackModalProps) {
  const [rating, setRating] = useState(0);
  const [hover,  setHover]  = useState(0);
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);
  const submitFeedback = useSubmitFeedback();

  const handleSubmit = async () => {
    if (!message.trim()) return;
    await submitFeedback.mutateAsync({
      bookingId, propertyId, propertyName, guestName, guestEmail, type,
      rating: type === 'review' ? rating : undefined,
      message,
    });
    setSent(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-primary px-6 py-5">
          <h3 className="text-lg font-bold text-white">{title}</h3>
          <p className="text-primary-foreground/70 text-sm mt-0.5 text-white/70">{propertyName}</p>
        </div>

        {sent ? (
          <div className="p-8 text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
              <Check className="w-8 h-8 text-emerald-600" />
            </div>
            <h4 className="font-bold text-neutral-800 text-lg">Enviado com sucesso!</h4>
            <p className="text-neutral-500 text-sm">Sua mensagem foi recebida. O anfitrião entrará em contato em breve.</p>
            <button onClick={onClose} className="mt-2 px-6 py-2.5 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors">
              Fechar
            </button>
          </div>
        ) : (
          <div className="p-6 space-y-5">
            {/* Star rating for reviews */}
            {type === 'review' && (
              <div>
                <p className="text-sm font-medium text-neutral-700 mb-2">Sua avaliação</p>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map(n => (
                    <button
                      key={n}
                      type="button"
                      onMouseEnter={() => setHover(n)}
                      onMouseLeave={() => setHover(0)}
                      onClick={() => setRating(n)}
                      className="p-0.5 transition-transform hover:scale-110"
                    >
                      <Star
                        className={cn(
                          'w-8 h-8 transition-colors',
                          (hover || rating) >= n ? 'text-accent fill-accent' : 'text-neutral-300',
                        )}
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Message */}
            <div>
              <label className="text-sm font-medium text-neutral-700 block mb-2">
                {type === 'review'       ? 'Conte sua experiência'          :
                 type === 'complaint'    ? 'Descreva o problema'            :
                 type === 'suggestion'   ? 'Qual é a sua sugestão?'         :
                                          'Como podemos ajudar?'            }
              </label>
              <textarea
                rows={4}
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder={
                  type === 'review'     ? 'O que você mais gostou? O que podemos melhorar?' :
                  type === 'complaint'  ? 'Descreva o que aconteceu...'                      :
                  type === 'suggestion' ? 'Sua ideia para melhorar nossa hospedagem...'      :
                                         'Descreva o que precisa...'
                }
                className="w-full rounded-xl border border-surface-border px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 rounded-xl border border-surface-border text-neutral-600 font-medium hover:bg-neutral-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!message.trim() || (type === 'review' && rating === 0) || submitFeedback.isPending}
                className="flex-1 py-3 rounded-xl bg-primary text-white font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {submitFeedback.isPending ? 'Enviando…' : 'Enviar'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Action button ──────────────────────────────────────────────────────────────
function ActionBtn({ icon: Icon, label, color, onClick }: {
  icon: React.ElementType; label: string; color: string; onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all hover:scale-[1.03] active:scale-95 flex-1 min-w-[80px]',
        color,
      )}
    >
      <Icon className="w-6 h-6" />
      <span className="text-xs font-semibold text-center leading-tight">{label}</span>
    </button>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────
type ModalType = GuestFeedbackType | 'new_stay' | null;

export function GuestPortalPage() {
  const { code } = useParams<{ code: string }>();
  const { data, isLoading, error } = useGuestPortal(code);
  const [modal, setModal] = useState<ModalType>(null);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="text-center space-y-3">
          <Spinner size="lg" />
          <p className="text-neutral-500 text-sm">Carregando seu guia…</p>
        </div>
      </div>
    );
  }

  if (!data || error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 px-4">
        <div className="text-center space-y-4 max-w-sm">
          <div className="w-16 h-16 rounded-2xl bg-rose-100 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-8 h-8 text-rose-500" />
          </div>
          <h1 className="text-xl font-bold text-neutral-800">Reserva não encontrada</h1>
          <p className="text-neutral-500 text-sm">
            O código <span className="font-mono font-bold">{code}</span> não corresponde a nenhuma reserva ativa.
          </p>
          <Link to="/" className="inline-flex items-center gap-2 text-primary font-medium hover:underline">
            <Home className="w-4 h-4" /> Voltar ao início
          </Link>
        </div>
      </div>
    );
  }

  const { guide, booking } = data;
  const enabledSections = guide.sections
    .filter(s => s.enabled)
    .sort((a, b) => a.order - b.order);

  const checkInDate  = parseISO(booking.checkIn);
  const checkOutDate = parseISO(booking.checkOut);
  const today        = new Date();
  const daysToCheckin = differenceInDays(checkInDate, today);
  const isActive     = today >= checkInDate && today <= checkOutDate;

  const fmtDate = (d: Date) => format(d, "dd 'de' MMMM", { locale: ptBR });

  return (
    <div className="min-h-screen bg-neutral-100">
      {/* ── Hero ─────────────────────────────────────────────────────────────── */}
      <div className="relative min-h-[340px] flex flex-col justify-end overflow-hidden">
        {/* Background image */}
        {guide.propertyImage && (
          <img
            src={guide.propertyImage}
            alt={guide.propertyName}
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0d1f36] via-[#1E3A5F]/70 to-[#1E3A5F]/30" />

        {/* HospedaBR brand */}
        <div className="absolute top-5 left-5 flex items-center gap-2">
          <div className="w-8 h-8 bg-white/20 backdrop-blur rounded-lg flex items-center justify-center">
            <Home className="w-4 h-4 text-white" />
          </div>
          <span className="text-white font-bold text-sm tracking-wide">HospedaBR</span>
        </div>

        {/* Status badge */}
        <div className="absolute top-5 right-5">
          {isActive ? (
            <span className="inline-flex items-center gap-1.5 bg-emerald-500/90 backdrop-blur text-white text-xs font-bold px-3 py-1.5 rounded-full">
              <span className="w-2 h-2 rounded-full bg-white animate-pulse" /> Check-in ativo
            </span>
          ) : daysToCheckin > 0 ? (
            <span className="inline-flex items-center gap-1.5 bg-amber-500/90 backdrop-blur text-white text-xs font-bold px-3 py-1.5 rounded-full">
              {daysToCheckin} dia{daysToCheckin !== 1 ? 's' : ''} para check-in
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 bg-neutral-600/90 backdrop-blur text-white text-xs font-bold px-3 py-1.5 rounded-full">
              Estadia concluída
            </span>
          )}
        </div>

        {/* Content */}
        <div className="relative px-5 pb-6 pt-16 space-y-1">
          <p className="text-white/70 text-sm font-medium">Bem-vindo,</p>
          <h1 className="text-3xl font-extrabold text-white leading-tight">{booking.guestName.split(' ')[0]}!</h1>
          <p className="text-white/90 font-semibold text-lg">{guide.propertyName}</p>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span className="bg-white/15 backdrop-blur text-white text-xs font-medium px-2.5 py-1 rounded-full">
              {fmtDate(checkInDate)} → {fmtDate(checkOutDate)}
            </span>
            <span className="bg-white/15 backdrop-blur text-white text-xs font-medium px-2.5 py-1 rounded-full">
              {booking.nights} noite{booking.nights !== 1 ? 's' : ''}
            </span>
            <span className="bg-accent/80 backdrop-blur text-white text-xs font-bold px-2.5 py-1 rounded-full font-mono">
              {booking.confirmationCode}
            </span>
          </div>
        </div>
      </div>

      {/* ── Content ──────────────────────────────────────────────────────────── */}
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">

        {/* Welcome message */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-surface-border">
          <p className="text-neutral-600 text-sm leading-relaxed italic">"{guide.welcomeMessage}"</p>
          {/* Host info */}
          <div className="mt-4 pt-4 border-t border-surface-border flex items-center gap-3">
            {guide.hostAvatar && (
              <img src={guide.hostAvatar} alt={guide.hostName} className="w-10 h-10 rounded-full bg-neutral-100 border-2 border-white shadow" />
            )}
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-neutral-800 text-sm">{guide.hostName}</p>
              <p className="text-xs text-neutral-400">Seu anfitrião</p>
            </div>
            <div className="flex items-center gap-2">
              {guide.hostWhatsapp && (
                <a
                  href={`https://wa.me/${guide.hostWhatsapp.replace(/\D/g, '')}`}
                  target="_blank" rel="noreferrer"
                  className="w-9 h-9 rounded-xl bg-emerald-500 flex items-center justify-center text-white hover:bg-emerald-600 transition-colors"
                  title="WhatsApp"
                >
                  <MessageSquare className="w-4 h-4" />
                </a>
              )}
              {guide.hostPhone && (
                <a
                  href={`tel:${guide.hostPhone}`}
                  className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-white hover:bg-primary/90 transition-colors"
                  title="Ligar"
                >
                  <PhoneCall className="w-4 h-4" />
                </a>
              )}
              {guide.hostEmail && (
                <a
                  href={`mailto:${guide.hostEmail}`}
                  className="w-9 h-9 rounded-xl bg-neutral-100 flex items-center justify-center text-neutral-600 hover:bg-neutral-200 transition-colors"
                  title="Email"
                >
                  <Mail className="w-4 h-4" />
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Booking summary */}
        <div className="bg-primary rounded-2xl p-5 shadow-sm text-white">
          <p className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-3">Resumo da Reserva</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-white/60 text-xs mb-0.5">Check-in</p>
              <p className="font-bold">{format(checkInDate, 'dd/MM/yyyy')}</p>
            </div>
            <div>
              <p className="text-white/60 text-xs mb-0.5">Check-out</p>
              <p className="font-bold">{format(checkOutDate, 'dd/MM/yyyy')}</p>
            </div>
            <div>
              <p className="text-white/60 text-xs mb-0.5">Hóspedes</p>
              <p className="font-bold">{booking.guests} pessoa{booking.guests !== 1 ? 's' : ''}</p>
            </div>
            <div>
              <p className="text-white/60 text-xs mb-0.5">Total pago</p>
              <p className="font-bold">{formatCurrency(booking.totalPrice)}</p>
            </div>
          </div>
        </div>

        {/* Info sections */}
        {enabledSections.map(section => (
          <SectionCard key={section.id} section={section} />
        ))}

        {/* ── Quick Actions ─────────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-surface-border space-y-3">
          <p className="font-semibold text-neutral-800 text-sm">O que você precisa?</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <ActionBtn
              icon={Star}
              label="Avaliar estadia"
              color="bg-amber-50 border-amber-200 text-amber-600 hover:border-amber-400"
              onClick={() => setModal('review')}
            />
            <ActionBtn
              icon={CalendarPlus}
              label="Reservar novamente"
              color="bg-emerald-50 border-emerald-200 text-emerald-600 hover:border-emerald-400"
              onClick={() => setModal('new_stay')}
            />
            <ActionBtn
              icon={HelpCircle}
              label="Pedir ajuda"
              color="bg-blue-50 border-blue-200 text-blue-600 hover:border-blue-400"
              onClick={() => setModal('help_request')}
            />
            <ActionBtn
              icon={Megaphone}
              label="Sugestão / Reclamação"
              color="bg-rose-50 border-rose-200 text-rose-500 hover:border-rose-400"
              onClick={() => setModal('complaint')}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="text-center py-4 space-y-1">
          <div className="flex items-center justify-center gap-1.5 text-primary">
            <Home className="w-3.5 h-3.5" />
            <span className="text-xs font-bold">HospedaBR</span>
          </div>
          <p className="text-xs text-neutral-400">Portal do Hóspede · Todas as informações foram configuradas pelo anfitrião</p>
          <Link to="/" className="inline-flex items-center gap-1 text-xs text-primary/70 hover:text-primary">
            <ExternalLink className="w-3 h-3" /> Explorar outras propriedades
          </Link>
        </div>
      </div>

      {/* ── New Stay modal (simplified) ────────────────────────────────────── */}
      {modal === 'new_stay' && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="bg-primary px-6 py-5">
              <h3 className="text-lg font-bold text-white">Reservar Novamente</h3>
              <p className="text-white/70 text-sm mt-0.5">{guide.propertyName}</p>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3 bg-emerald-50 rounded-xl p-4">
                <CalendarPlus className="w-8 h-8 text-emerald-600 flex-shrink-0" />
                <p className="text-sm text-neutral-700">
                  Para nova reserva, acesse nossa plataforma e verifique disponibilidade para as datas desejadas.
                </p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setModal(null)} className="flex-1 py-3 rounded-xl border border-surface-border text-neutral-600 font-medium hover:bg-neutral-50">
                  Fechar
                </button>
                <Link
                  to={`/property/${booking.propertyId}`}
                  className="flex-1 py-3 rounded-xl bg-primary text-white font-medium text-center hover:bg-primary/90 transition-colors"
                  onClick={() => setModal(null)}
                >
                  Ver disponibilidade
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Feedback modals ────────────────────────────────────────────────── */}
      {modal === 'review' && (
        <FeedbackModal
          type="review"
          title="Avaliar Estadia"
          propertyId={booking.propertyId}
          propertyName={guide.propertyName}
          bookingId={booking.id}
          guestName={booking.guestName}
          guestEmail={booking.guestEmail}
          onClose={() => setModal(null)}
        />
      )}
      {modal === 'help_request' && (
        <FeedbackModal
          type="help_request"
          title="Solicitar Ajuda"
          propertyId={booking.propertyId}
          propertyName={guide.propertyName}
          bookingId={booking.id}
          guestName={booking.guestName}
          guestEmail={booking.guestEmail}
          onClose={() => setModal(null)}
        />
      )}
      {modal === 'complaint' && (
        <FeedbackModal
          type="complaint"
          title="Sugestão ou Reclamação"
          propertyId={booking.propertyId}
          propertyName={guide.propertyName}
          bookingId={booking.id}
          guestName={booking.guestName}
          guestEmail={booking.guestEmail}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
