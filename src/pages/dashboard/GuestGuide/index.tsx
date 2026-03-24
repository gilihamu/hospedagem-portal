import { useState, useEffect } from 'react';
import {
  BookOpen, ChevronDown, ChevronUp, Save, Eye, Plus, LogIn, LogOut,
  Wifi, Car, ListChecks, MapPin, Ambulance, Bus, Settings2,
  Copy, Check, MessageSquare, Star, AlertCircle,
} from 'lucide-react';
import { useAuthStore } from '../../../store/auth.store';
import { useGuestGuideByProperty, useSaveGuestGuide, useCreateGuestGuide, useFeedbacksByProperty } from '../../../hooks/useGuestGuide';
import { useOwnerProperties } from '../../../hooks/useProperties';
import { Spinner } from '../../../components/ui/Spinner';
import { EmptyState } from '../../../components/ui/EmptyState';
import { useToast } from '../../../hooks/useToast';
import { cn } from '../../../utils/cn';
import { formatDate } from '../../../utils/formatters';
import type { GuestGuide, GuestGuideSection, GuestSectionType, GuestFeedback } from '../../../types';

// ── Section icon map ──────────────────────────────────────────────────────────
const SECTION_ICONS: Record<GuestSectionType, React.ElementType> = {
  checkin:   LogIn,
  checkout:  LogOut,
  wifi:      Wifi,
  parking:   Car,
  rules:     ListChecks,
  tips:      MapPin,
  emergency: Ambulance,
  transport: Bus,
  custom:    Settings2,
};

const SECTION_COLORS: Record<GuestSectionType, string> = {
  checkin:   'text-emerald-600 bg-emerald-50',
  checkout:  'text-blue-600 bg-blue-50',
  wifi:      'text-violet-600 bg-violet-50',
  parking:   'text-orange-600 bg-orange-50',
  rules:     'text-rose-600 bg-rose-50',
  tips:      'text-teal-600 bg-teal-50',
  emergency: 'text-red-600 bg-red-50',
  transport: 'text-indigo-600 bg-indigo-50',
  custom:    'text-neutral-600 bg-neutral-50',
};

const FB_TYPE_LABEL: Record<string, { label: string; color: string }> = {
  review:       { label: 'Avaliação',        color: 'bg-amber-100 text-amber-700'   },
  complaint:    { label: 'Reclamação',        color: 'bg-rose-100 text-rose-700'     },
  suggestion:   { label: 'Sugestão',          color: 'bg-blue-100 text-blue-700'     },
  help_request: { label: 'Pedido de ajuda',   color: 'bg-emerald-100 text-emerald-700' },
};

// ── Section Editor ────────────────────────────────────────────────────────────
function SectionEditor({
  section,
  onChange,
}: {
  section: GuestGuideSection;
  onChange: (updated: GuestGuideSection) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const Icon = SECTION_ICONS[section.type] ?? Settings2;
  const colorCls = SECTION_COLORS[section.type] ?? SECTION_COLORS.custom;

  const update = (patch: Partial<GuestGuideSection>) => onChange({ ...section, ...patch });
  const updateExtra = (key: string, value: string) =>
    onChange({ ...section, extra: { ...section.extra, [key]: value } });

  return (
    <div className={cn('border rounded-xl overflow-hidden transition-all', section.enabled ? 'border-surface-border' : 'border-dashed border-neutral-300 opacity-60')}>
      {/* Header row */}
      <div className="flex items-center gap-3 px-4 py-3 bg-white">
        {/* Toggle */}
        <button
          type="button"
          onClick={() => update({ enabled: !section.enabled })}
          className={cn(
            'relative w-10 h-5 rounded-full transition-colors flex-shrink-0',
            section.enabled ? 'bg-primary' : 'bg-neutral-300',
          )}
        >
          <span className={cn(
            'absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform',
            section.enabled ? 'left-[22px]' : 'left-0.5',
          )} />
        </button>

        {/* Icon + title */}
        <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0', colorCls)}>
          <Icon className="w-4 h-4" />
        </div>
        <input
          type="text"
          value={section.title}
          onChange={e => update({ title: e.target.value })}
          className="flex-1 text-sm font-semibold text-neutral-800 bg-transparent border-none outline-none focus:ring-0"
        />

        {/* Expand */}
        <button
          type="button"
          onClick={() => setExpanded(e => !e)}
          className="p-1.5 rounded-lg hover:bg-neutral-100 text-neutral-400"
        >
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Expanded body */}
      {expanded && (
        <div className="px-4 pb-4 pt-1 border-t border-surface-border bg-neutral-50/50 space-y-3">
          {/* WiFi extras */}
          {section.type === 'wifi' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-neutral-500 mb-1 block">Nome da rede (SSID)</label>
                <input
                  type="text"
                  value={section.extra?.ssid ?? ''}
                  onChange={e => updateExtra('ssid', e.target.value)}
                  placeholder="Nome_WiFi"
                  className="w-full px-3 py-2 rounded-lg border border-surface-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-neutral-500 mb-1 block">Senha</label>
                <input
                  type="text"
                  value={section.extra?.password ?? ''}
                  onChange={e => updateExtra('password', e.target.value)}
                  placeholder="SenhaWiFi"
                  className="w-full px-3 py-2 rounded-lg border border-surface-border text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
            </div>
          )}

          {/* Check-in/out time */}
          {(section.type === 'checkin' || section.type === 'checkout') && (
            <div className="max-w-[200px]">
              <label className="text-xs font-medium text-neutral-500 mb-1 block">
                Horário de {section.type === 'checkin' ? 'check-in' : 'check-out'}
              </label>
              <input
                type="time"
                value={section.extra?.time ?? ''}
                onChange={e => updateExtra('time', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-surface-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
          )}

          {/* Content */}
          <div>
            <label className="text-xs font-medium text-neutral-500 mb-1 block">
              Conteúdo (uma instrução por linha)
            </label>
            <textarea
              rows={5}
              value={section.content}
              onChange={e => update({ content: e.target.value })}
              placeholder="Cada linha será exibida como um item na lista..."
              className="w-full px-3 py-2 rounded-lg border border-surface-border text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ── Feedback row ──────────────────────────────────────────────────────────────
function FeedbackRow({ fb }: { fb: GuestFeedback }) {
  const cfg = FB_TYPE_LABEL[fb.type] ?? FB_TYPE_LABEL.suggestion;
  return (
    <div className="flex items-start gap-3 py-3 border-b border-surface-border last:border-0">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full', cfg.color)}>{cfg.label}</span>
          {fb.rating && (
            <span className="flex items-center gap-0.5 text-xs text-amber-600">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" /> {fb.rating}/5
            </span>
          )}
          <span className="text-xs text-neutral-400">{formatDate(fb.createdAt)}</span>
        </div>
        <p className="text-sm text-neutral-700 line-clamp-2">{fb.message}</p>
        <p className="text-xs text-neutral-400 mt-0.5">{fb.guestName}</p>
      </div>
      <span className={cn(
        'text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0',
        fb.status === 'resolved' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700',
      )}>
        {fb.status === 'resolved' ? 'Resolvido' : 'Pendente'}
      </span>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export function GuestGuidePage() {
  const { user } = useAuthStore();
  const { data: properties, isLoading: loadingProps } = useOwnerProperties(user?.id);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('');
  const { data: guide, isLoading: loadingGuide } = useGuestGuideByProperty(selectedPropertyId || undefined);
  const { data: feedbacks } = useFeedbacksByProperty(selectedPropertyId || undefined);
  const saveGuide = useSaveGuestGuide();
  const createGuide = useCreateGuestGuide();
  const { success, error: showError } = useToast();

  const [draft, setDraft] = useState<GuestGuide | null>(null);
  const [tab, setTab] = useState<'editor' | 'feedbacks'>('editor');
  const [copied, setCopied] = useState(false);

  // Auto-select first property
  useEffect(() => {
    if (properties?.length && !selectedPropertyId) {
      setSelectedPropertyId(properties[0].id);
    }
  }, [properties, selectedPropertyId]);

  // Sync guide to draft
  useEffect(() => {
    setDraft(guide ?? null);
  }, [guide]);

  const handleCreate = async () => {
    const prop = properties?.find(p => p.id === selectedPropertyId);
    if (!prop || !user) return;
    try {
      const created = await createGuide.mutateAsync({
        propertyId: prop.id,
        propertyName: prop.name,
        hostName: user.name,
      });
      setDraft(created);
      success('Guia criado com sucesso!');
    } catch {
      showError('Erro ao criar guia');
    }
  };

  const handleSave = async () => {
    if (!draft) return;
    try {
      await saveGuide.mutateAsync(draft);
      success('Guia salvo com sucesso!');
    } catch {
      showError('Erro ao salvar guia');
    }
  };

  const updateSection = (idx: number, updated: GuestGuideSection) => {
    if (!draft) return;
    const sections = [...draft.sections];
    sections[idx] = updated;
    setDraft({ ...draft, sections });
  };

  const getPreviewUrl = () => {
    return `/stay/HBS-2026-001`;
  };

  const copyPreviewLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/stay/HBS-2026-001`).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (loadingProps) {
    return <div className="flex justify-center py-16"><Spinner size="lg" /></div>;
  }

  if (!properties?.length) {
    return (
      <EmptyState
        icon={BookOpen}
        title="Nenhuma propriedade encontrada"
        description="Cadastre uma propriedade primeiro para configurar o guia do hóspede."
      />
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-neutral-900">Guia do Hóspede</h1>
          <p className="text-sm text-neutral-500">Configure as instruções que seus hóspedes recebem</p>
        </div>
        <div className="flex items-center gap-2">
          {draft && (
            <>
              <button
                type="button"
                onClick={copyPreviewLink}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border transition-colors',
                  copied
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                    : 'border-surface-border text-neutral-600 hover:bg-neutral-50',
                )}
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copiado!' : 'Copiar link'}
              </button>
              <a
                href={getPreviewUrl()}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border border-surface-border text-neutral-600 hover:bg-neutral-50"
              >
                <Eye className="w-3.5 h-3.5" />
                Visualizar
              </a>
              <button
                type="button"
                onClick={handleSave}
                disabled={saveGuide.isPending}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium bg-primary text-white hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                <Save className="w-3.5 h-3.5" />
                {saveGuide.isPending ? 'Salvando…' : 'Salvar'}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Property selector */}
      <div className="card-base p-4 flex items-center gap-4 flex-wrap">
        <label className="text-sm font-medium text-neutral-700">Propriedade:</label>
        <select
          value={selectedPropertyId}
          onChange={e => setSelectedPropertyId(e.target.value)}
          className="px-3 py-2 rounded-lg border border-surface-border text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
        >
          {properties?.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>

        {/* Tabs */}
        <div className="flex items-center gap-1 ml-auto bg-surface-muted rounded-lg p-1 border border-surface-border">
          <button
            type="button"
            onClick={() => setTab('editor')}
            className={cn(
              'px-3 py-1.5 rounded-md text-xs font-medium transition-all',
              tab === 'editor' ? 'bg-white text-primary shadow-sm border border-surface-border' : 'text-neutral-500',
            )}
          >
            Editor
          </button>
          <button
            type="button"
            onClick={() => setTab('feedbacks')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all',
              tab === 'feedbacks' ? 'bg-white text-primary shadow-sm border border-surface-border' : 'text-neutral-500',
            )}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            Feedbacks
            {feedbacks && feedbacks.filter(f => f.status === 'pending').length > 0 && (
              <span className="w-5 h-5 rounded-full bg-rose-500 text-white text-xs flex items-center justify-center">
                {feedbacks.filter(f => f.status === 'pending').length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Loading guide */}
      {loadingGuide && <div className="flex justify-center py-8"><Spinner /></div>}

      {/* No guide — create */}
      {!loadingGuide && !draft && selectedPropertyId && (
        <div className="card-base p-8 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
            <BookOpen className="w-7 h-7 text-primary" />
          </div>
          <h3 className="text-lg font-bold text-neutral-800">Nenhum guia configurado</h3>
          <p className="text-sm text-neutral-500 max-w-md mx-auto">
            Crie um guia do hóspede para esta propriedade. Seus hóspedes terão acesso a todas as informações de check-in, Wi-Fi, regras e muito mais.
          </p>
          <button
            type="button"
            onClick={handleCreate}
            disabled={createGuide.isPending}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-white font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            <Plus className="w-4 h-4" />
            {createGuide.isPending ? 'Criando…' : 'Criar Guia do Hóspede'}
          </button>
        </div>
      )}

      {/* Editor tab */}
      {draft && tab === 'editor' && (
        <div className="space-y-4">
          {/* Welcome message + host info */}
          <div className="card-base p-5 space-y-4">
            <h3 className="text-sm font-bold text-neutral-800 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-primary" />
              Mensagem de Boas-vindas
            </h3>
            <textarea
              rows={3}
              value={draft.welcomeMessage}
              onChange={e => setDraft({ ...draft, welcomeMessage: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-surface-border text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              placeholder="Seja muito bem-vindo..."
            />

            <h3 className="text-sm font-bold text-neutral-800 pt-2">Contato do Anfitrião</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-neutral-500 mb-1 block">Nome</label>
                <input
                  type="text"
                  value={draft.hostName}
                  onChange={e => setDraft({ ...draft, hostName: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-surface-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-neutral-500 mb-1 block">Email</label>
                <input
                  type="email"
                  value={draft.hostEmail ?? ''}
                  onChange={e => setDraft({ ...draft, hostEmail: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-surface-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-neutral-500 mb-1 block">Telefone</label>
                <input
                  type="tel"
                  value={draft.hostPhone ?? ''}
                  onChange={e => setDraft({ ...draft, hostPhone: e.target.value })}
                  placeholder="+55 21 99999-0001"
                  className="w-full px-3 py-2 rounded-lg border border-surface-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-neutral-500 mb-1 block">WhatsApp</label>
                <input
                  type="tel"
                  value={draft.hostWhatsapp ?? ''}
                  onChange={e => setDraft({ ...draft, hostWhatsapp: e.target.value })}
                  placeholder="+55 21 99999-0001"
                  className="w-full px-3 py-2 rounded-lg border border-surface-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
            </div>
          </div>

          {/* Sections */}
          <div className="card-base p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-neutral-800">Seções do Guia</h3>
              <p className="text-xs text-neutral-400">Ative/desative e edite cada seção</p>
            </div>
            <div className="space-y-2">
              {draft.sections
                .sort((a, b) => a.order - b.order)
                .map((section, idx) => (
                  <SectionEditor
                    key={section.id}
                    section={section}
                    onChange={updated => updateSection(idx, updated)}
                  />
                ))}
            </div>
          </div>

          {/* Preview tip */}
          <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-xl p-4">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-semibold mb-0.5">Dica: Compartilhe o link do Portal</p>
              <p className="text-blue-600">
                O hóspede pode acessar o guia usando o código de confirmação da reserva.
                Ex: <code className="bg-blue-100 px-1.5 py-0.5 rounded text-xs font-mono">{window.location.origin}/stay/HBS-2026-001</code>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Feedbacks tab */}
      {draft && tab === 'feedbacks' && (
        <div className="card-base p-5">
          <h3 className="text-sm font-bold text-neutral-800 mb-3">Feedbacks dos Hóspedes</h3>
          {!feedbacks?.length ? (
            <EmptyState
              icon={MessageSquare}
              title="Nenhum feedback ainda"
              description="Avaliações, sugestões e reclamações dos hóspedes aparecerão aqui."
            />
          ) : (
            <div>
              {feedbacks.map(fb => <FeedbackRow key={fb.id} fb={fb} />)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
