import { useState, useEffect } from 'react';
import { FileText, Save, Check, X } from 'lucide-react';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Textarea } from '../../../components/ui/Textarea';
import { Button } from '../../../components/ui/Button';
import { Spinner } from '../../../components/ui/Spinner';
import { useFnrhByBooking, useFnrhPrefill, useSaveFnrh } from '../../../hooks/useFnrh';
import { useToast } from '../../../hooks/useToast';
import type { SaveFnrhData, FnrhRecord } from '../../../types';

interface FnrhDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  bookingId: string;
  guestId: string;
}

const SEX_OPTIONS = [
  { value: '', label: 'Selecione' },
  { value: 'M', label: 'Masculino' },
  { value: 'F', label: 'Feminino' },
];

const TRAVEL_REASONS = [
  { value: '', label: 'Selecione' },
  { value: 'Lazer', label: 'Lazer' },
  { value: 'Negócios', label: 'Negócios' },
  { value: 'Congresso/Feira', label: 'Congresso/Feira' },
  { value: 'Religião/Peregrinação', label: 'Religião/Peregrinação' },
  { value: 'Saúde', label: 'Saúde' },
  { value: 'Estudos', label: 'Estudos' },
  { value: 'Outro', label: 'Outro' },
];

const TRANSPORT_TYPES = [
  { value: '', label: 'Selecione' },
  { value: 'Avião', label: 'Avião' },
  { value: 'Carro', label: 'Carro' },
  { value: 'Ônibus', label: 'Ônibus' },
  { value: 'Trem', label: 'Trem' },
  { value: 'Navio/Barco', label: 'Navio/Barco' },
  { value: 'Outro', label: 'Outro' },
];

const DOC_TYPES = [
  { value: '', label: 'Selecione' },
  { value: 'CPF', label: 'CPF' },
  { value: 'RG', label: 'RG' },
  { value: 'Passaporte', label: 'Passaporte' },
  { value: 'CNH', label: 'CNH' },
  { value: 'RNE', label: 'RNE' },
];

const STATES = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO']
  .map(s => ({ value: s, label: s }));

export function FnrhDrawer({ isOpen, onClose, bookingId, guestId }: FnrhDrawerProps) {
  const { data: existing, isLoading: loadingExisting } = useFnrhByBooking(bookingId, guestId);
  const { data: prefill, isLoading: loadingPrefill } = useFnrhPrefill(bookingId);
  const saveMutation = useSaveFnrh();
  const { success, error: showError } = useToast();

  const [form, setForm] = useState<Partial<SaveFnrhData>>({});
  const [initialized, setInitialized] = useState(false);

  // Initialize form from existing record or prefill
  useEffect(() => {
    if (initialized) return;
    if (existing) {
      setForm(existing);
      setInitialized(true);
    } else if (prefill && !loadingExisting) {
      setForm(prefill);
      setInitialized(true);
    }
  }, [existing, prefill, loadingExisting, initialized]);

  // Reset when drawer opens with new booking
  useEffect(() => {
    if (!isOpen) setInitialized(false);
  }, [isOpen, bookingId]);

  const set = (field: keyof SaveFnrhData, value: unknown) =>
    setForm(prev => ({ ...prev, [field]: value }));

  const isCompleted = existing?.status === 'Completed' || existing?.status === 'Signed' || existing?.status === 'Sent';

  const handleSave = async () => {
    if (!form.fullName || !form.documentType || !form.documentNumber) {
      showError('Preencha nome completo e documento');
      return;
    }
    try {
      await saveMutation.mutateAsync(form as SaveFnrhData);
      success('FNRH salva com sucesso!');
      onClose();
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Erro ao salvar FNRH');
    }
  };

  if (!isOpen) return null;

  const loading = loadingExisting || loadingPrefill;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />

      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-full max-w-2xl bg-white z-50 shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-border bg-gradient-to-r from-indigo-50 to-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
              <FileText className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-neutral-900">FNRH</h2>
              <p className="text-xs text-neutral-500">Ficha Nacional de Registro de Hóspedes</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {existing && (
              <StatusBadge status={existing.status} />
            )}
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-neutral-100">
              <X className="w-5 h-5 text-neutral-500" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading ? (
            <div className="flex justify-center py-12"><Spinner /></div>
          ) : (
            <>
              {/* Section: Dados pessoais */}
              <Section title="Dados Pessoais">
                <Input label="Nome completo *" value={form.fullName || ''} onChange={e => set('fullName', e.target.value)} />
                <div className="grid grid-cols-2 gap-3">
                  <Input label="Nacionalidade" value={form.nationality || ''} onChange={e => set('nationality', e.target.value)} placeholder="Brasileira" />
                  <Input label="Data de nascimento" type="date" value={form.birthDate?.split('T')[0] || ''} onChange={e => set('birthDate', e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Select label="Sexo" options={SEX_OPTIONS} value={form.sex || ''} onChange={e => set('sex', e.target.value)} />
                  <Input label="Profissão" value={form.profession || ''} onChange={e => set('profession', e.target.value)} />
                </div>
              </Section>

              {/* Section: Documento */}
              <Section title="Documento">
                <div className="grid grid-cols-3 gap-3">
                  <Select label="Tipo *" options={DOC_TYPES} value={form.documentType || ''} onChange={e => set('documentType', e.target.value)} />
                  <Input label="Número *" value={form.documentNumber || ''} onChange={e => set('documentNumber', e.target.value)} />
                  <Input label="Órgão expedidor" value={form.documentIssuer || ''} onChange={e => set('documentIssuer', e.target.value)} placeholder="SSP" />
                </div>
              </Section>

              {/* Section: Endereço */}
              <Section title="Endereço de Residência">
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <Input label="Rua" value={form.addressStreet || ''} onChange={e => set('addressStreet', e.target.value)} />
                  </div>
                  <Input label="Número" value={form.addressNumber || ''} onChange={e => set('addressNumber', e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Input label="Bairro" value={form.addressNeighborhood || ''} onChange={e => set('addressNeighborhood', e.target.value)} />
                  <Input label="Complemento" value={form.addressComplement || ''} onChange={e => set('addressComplement', e.target.value)} />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <Input label="Cidade *" value={form.addressCity || ''} onChange={e => set('addressCity', e.target.value)} />
                  <Select label="Estado" options={[{ value: '', label: 'UF' }, ...STATES]} value={form.addressState || ''} onChange={e => set('addressState', e.target.value)} />
                  <Input label="CEP" value={form.addressZipCode || ''} onChange={e => set('addressZipCode', e.target.value)} />
                </div>
                <Input label="País" value={form.addressCountry || 'Brasil'} onChange={e => set('addressCountry', e.target.value)} />
              </Section>

              {/* Section: Contato */}
              <Section title="Contato">
                <div className="grid grid-cols-2 gap-3">
                  <Input label="Telefone" value={form.phone || ''} onChange={e => set('phone', e.target.value)} />
                  <Input label="E-mail" value={form.email || ''} onChange={e => set('email', e.target.value)} />
                </div>
              </Section>

              {/* Section: Estadia */}
              <Section title="Dados da Estadia">
                <div className="grid grid-cols-3 gap-3">
                  <Input label="Check-in" type="date" value={form.checkIn?.split('T')[0] || ''} onChange={e => set('checkIn', e.target.value)} disabled />
                  <Input label="Check-out" type="date" value={form.checkOut?.split('T')[0] || ''} onChange={e => set('checkOut', e.target.value)} disabled />
                  <Input label="Nº do quarto" value={form.roomNumber || ''} onChange={e => set('roomNumber', e.target.value)} />
                </div>
                <Input label="Hóspedes" type="number" min={1} value={form.guestsCount || 1} onChange={e => set('guestsCount', Number(e.target.value))} />
              </Section>

              {/* Section: Viagem */}
              <Section title="Informações de Viagem">
                <div className="grid grid-cols-2 gap-3">
                  <Select label="Motivo da viagem" options={TRAVEL_REASONS} value={form.travelReason || ''} onChange={e => set('travelReason', e.target.value)} />
                  <Select label="Meio de transporte" options={TRANSPORT_TYPES} value={form.transportType || ''} onChange={e => set('transportType', e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Input label="Cidade de origem" value={form.originCity || ''} onChange={e => set('originCity', e.target.value)} />
                  <Input label="Próximo destino" value={form.destinationCity || ''} onChange={e => set('destinationCity', e.target.value)} />
                </div>
                {form.transportType === 'Carro' && (
                  <Input label="Placa do veículo" value={form.licensePlate || ''} onChange={e => set('licensePlate', e.target.value)} placeholder="ABC-1234" />
                )}
              </Section>

              {/* Section: Acompanhante */}
              <Section title="Acompanhante (opcional)">
                <div className="grid grid-cols-3 gap-3">
                  <Input label="Nome" value={form.companionName || ''} onChange={e => set('companionName', e.target.value)} />
                  <Input label="Documento" value={form.companionDocument || ''} onChange={e => set('companionDocument', e.target.value)} />
                  <Input label="Parentesco" value={form.companionRelationship || ''} onChange={e => set('companionRelationship', e.target.value)} placeholder="Cônjuge, Filho..." />
                </div>
              </Section>

              {/* Section: Observações */}
              <Section title="Observações">
                <Textarea value={form.notes || ''} onChange={e => set('notes', e.target.value)} rows={3} placeholder="Informações adicionais..." />
              </Section>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-surface-border bg-surface-muted/30">
          <p className="text-xs text-neutral-400">Art. 23, Lei 11.771/2008</p>
          <div className="flex gap-3">
            <Button variant="ghost" onClick={onClose}>Cancelar</Button>
            <Button
              onClick={handleSave}
              loading={saveMutation.isPending}
              leftIcon={isCompleted ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            >
              {isCompleted ? 'Atualizar' : 'Salvar FNRH'}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-neutral-700 mb-3 pb-1 border-b border-surface-border">{title}</h3>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: FnrhRecord['status'] }) {
  const styles: Record<string, string> = {
    Draft: 'bg-neutral-100 text-neutral-600',
    Completed: 'bg-blue-100 text-blue-700',
    Signed: 'bg-green-100 text-green-700',
    Sent: 'bg-violet-100 text-violet-700',
  };
  const labels: Record<string, string> = {
    Draft: 'Rascunho',
    Completed: 'Preenchida',
    Signed: 'Assinada',
    Sent: 'Enviada',
  };
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${styles[status] || styles.Draft}`}>
      {labels[status] || status}
    </span>
  );
}
