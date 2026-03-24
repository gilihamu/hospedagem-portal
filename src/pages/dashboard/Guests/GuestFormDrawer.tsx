import { useState, useEffect } from 'react';
import { X, User, FileText, MapPin, MessageSquare, Loader2 } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Textarea } from '../../../components/ui/Textarea';
import { cn } from '../../../utils/cn';
import type { Guest, SaveGuestData } from '../../../types';

type Tab = 'basic' | 'document' | 'address' | 'notes';

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'basic',    label: 'Dados',      icon: User },
  { id: 'document', label: 'Documento',  icon: FileText },
  { id: 'address',  label: 'Endereço',   icon: MapPin },
  { id: 'notes',    label: 'Notas',      icon: MessageSquare },
];

interface Props {
  guest?: Guest;
  open: boolean;
  loading?: boolean;
  onClose: () => void;
  onSave: (data: SaveGuestData) => void;
}

function emptyForm(): SaveGuestData {
  return {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    documentType: '',
    documentNumber: '',
    documentCountry: '',
    address: { street: '', number: '', complement: '', neighborhood: '', city: '', state: '', zipCode: '', country: 'Brasil' },
    birthDate: '',
    nationality: '',
    tags: [],
    notes: '',
  };
}

export function GuestFormDrawer({ guest, open, loading, onClose, onSave }: Props) {
  const [tab, setTab] = useState<Tab>('basic');
  const [form, setForm] = useState<SaveGuestData>(emptyForm());
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    if (guest) {
      setForm({
        firstName: guest.firstName,
        lastName: guest.lastName,
        email: guest.email ?? '',
        phone: guest.phone ?? '',
        documentType: guest.documentType ?? '',
        documentNumber: guest.documentNumber ?? '',
        documentCountry: guest.documentCountry ?? '',
        address: guest.address ?? {},
        birthDate: guest.birthDate ? guest.birthDate.slice(0, 10) : '',
        nationality: guest.nationality ?? '',
        tags: guest.tags ?? [],
        notes: guest.notes ?? '',
      });
    } else {
      setForm(emptyForm());
    }
    setTab('basic');
  }, [guest, open]);

  const set = (field: keyof SaveGuestData, value: unknown) =>
    setForm(f => ({ ...f, [field]: value }));

  const setAddr = (field: string, value: string) =>
    setForm(f => ({ ...f, address: { ...f.address, [field]: value } }));

  const addTag = () => {
    const t = tagInput.trim().toLowerCase();
    if (t && !form.tags?.includes(t)) {
      set('tags', [...(form.tags ?? []), t]);
    }
    setTagInput('');
  };

  const removeTag = (t: string) =>
    set('tags', (form.tags ?? []).filter(x => x !== t));

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white shadow-2xl flex flex-col overflow-hidden animate-slide-in-right">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100">
          <h2 className="text-lg font-semibold text-neutral-900">
            {guest ? 'Editar Hóspede' : 'Novo Hóspede'}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-neutral-100 text-neutral-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-neutral-100 px-2 pt-2">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-t-lg transition-colors',
                tab === t.id
                  ? 'text-primary border-b-2 border-primary bg-primary/5'
                  : 'text-neutral-500 hover:text-neutral-700 hover:bg-neutral-50'
              )}
            >
              <t.icon className="w-3.5 h-3.5" />
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">

          {tab === 'basic' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Nome *"
                  value={form.firstName}
                  onChange={e => set('firstName', e.target.value)}
                  placeholder="João"
                />
                <Input
                  label="Sobrenome"
                  value={form.lastName}
                  onChange={e => set('lastName', e.target.value)}
                  placeholder="Silva"
                />
              </div>
              <Input
                label="E-mail"
                type="email"
                value={form.email}
                onChange={e => set('email', e.target.value)}
                placeholder="joao@exemplo.com"
              />
              <Input
                label="Telefone"
                value={form.phone}
                onChange={e => set('phone', e.target.value)}
                placeholder="+55 11 99999-0000"
              />
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Data de Nascimento"
                  type="date"
                  value={form.birthDate}
                  onChange={e => set('birthDate', e.target.value)}
                />
                <Input
                  label="Nacionalidade"
                  value={form.nationality}
                  onChange={e => set('nationality', e.target.value)}
                  placeholder="Brasileira"
                />
              </div>
              {/* Tags */}
              <div>
                <label className="text-sm font-medium text-neutral-700 block mb-1.5">Tags</label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {(form.tags ?? []).map(t => (
                    <span key={t} className="inline-flex items-center gap-1 bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full">
                      {t}
                      <button onClick={() => removeTag(t)} className="hover:text-error ml-0.5">×</button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    value={tagInput}
                    onChange={e => setTagInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag())}
                    placeholder="Adicionar tag (Enter)"
                    className="flex-1 text-sm border border-neutral-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                  <Button size="sm" variant="secondary" onClick={addTag}>+</Button>
                </div>
              </div>
            </>
          )}

          {tab === 'document' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-neutral-700 block mb-1.5">Tipo de Documento</label>
                  <select
                    value={form.documentType}
                    onChange={e => set('documentType', e.target.value)}
                    className="w-full text-sm border border-neutral-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30"
                  >
                    <option value="">Selecione</option>
                    <option value="CPF">CPF</option>
                    <option value="RG">RG</option>
                    <option value="Passaporte">Passaporte</option>
                    <option value="CNH">CNH</option>
                    <option value="RNE">RNE</option>
                  </select>
                </div>
                <Input
                  label="Número"
                  value={form.documentNumber}
                  onChange={e => set('documentNumber', e.target.value)}
                  placeholder="000.000.000-00"
                />
              </div>
              <Input
                label="País Emissor"
                value={form.documentCountry}
                onChange={e => set('documentCountry', e.target.value)}
                placeholder="Brasil"
              />
            </>
          )}

          {tab === 'address' && (
            <>
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                  <Input label="Rua" value={form.address?.street ?? ''} onChange={e => setAddr('street', e.target.value)} placeholder="Rua das Flores" />
                </div>
                <Input label="Número" value={form.address?.number ?? ''} onChange={e => setAddr('number', e.target.value)} placeholder="123" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input label="Complemento" value={form.address?.complement ?? ''} onChange={e => setAddr('complement', e.target.value)} placeholder="Ap 42" />
                <Input label="Bairro" value={form.address?.neighborhood ?? ''} onChange={e => setAddr('neighborhood', e.target.value)} placeholder="Centro" />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                  <Input label="Cidade" value={form.address?.city ?? ''} onChange={e => setAddr('city', e.target.value)} placeholder="São Paulo" />
                </div>
                <Input label="Estado" value={form.address?.state ?? ''} onChange={e => setAddr('state', e.target.value)} placeholder="SP" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input label="CEP" value={form.address?.zipCode ?? ''} onChange={e => setAddr('zipCode', e.target.value)} placeholder="00000-000" />
                <Input label="País" value={form.address?.country ?? ''} onChange={e => setAddr('country', e.target.value)} placeholder="Brasil" />
              </div>
            </>
          )}

          {tab === 'notes' && (
            <Textarea
              label="Notas internas"
              value={form.notes}
              onChange={e => set('notes', e.target.value)}
              rows={8}
              placeholder="Preferências, observações, histórico de atendimento..."
            />
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t border-neutral-100">
          <Button variant="secondary" fullWidth onClick={onClose}>Cancelar</Button>
          <Button
            variant="primary"
            fullWidth
            loading={loading}
            disabled={!form.firstName}
            onClick={() => onSave(form)}
            leftIcon={loading ? <Loader2 className="w-4 h-4 animate-spin" /> : undefined}
          >
            {guest ? 'Salvar Alterações' : 'Cadastrar Hóspede'}
          </Button>
        </div>
      </div>
    </div>
  );
}
