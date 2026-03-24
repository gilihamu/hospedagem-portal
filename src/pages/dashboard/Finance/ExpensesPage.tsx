import { useState, useRef, useEffect, useCallback } from 'react';
import { Plus, Trash2, Search, Upload, Paperclip, RefreshCw, Pencil, X, FileText, Sparkles, ClipboardPaste, Copy, Check } from 'lucide-react';
import {
  useFinanceExpenses,
  useFinanceCategories,
  useCreateExpense,
  useUpdateExpense,
  useDeleteExpense,
  useUploadReceipt,
  useProcessOcr,
  useProperties,
} from '../../../hooks/useFinance';
import { Spinner } from '../../../components/ui/Spinner';
import { Button } from '../../../components/ui/Button';
import { formatCurrency, formatDate } from '../../../utils/formatters';
import type { Expense, CreateExpenseData, OcrResult } from '../../../services/finance.service';

const RECURRENCE_OPTIONS = [
  { value: '', label: 'Não recorrente' },
  { value: 'monthly', label: 'Mensal' },
  { value: 'weekly', label: 'Semanal' },
  { value: 'daily', label: 'Diário' },
  { value: 'yearly', label: 'Anual' },
];

const PAYMENT_METHODS = ['PIX', 'Boleto', 'Cartão crédito', 'Cartão débito', 'Dinheiro', 'Transferência', 'Débito automático'];

const emptyForm = (): CreateExpenseData & { file?: File | null } => ({
  propertyId: null,
  categoryId: '',
  description: '',
  amount: 0,
  expenseDate: new Date().toISOString().split('T')[0],
  supplierName: '',
  paymentMethod: '',
  notes: '',
  isRecurring: false,
  recurrenceRule: '',
  file: null,
});

export function ExpensesPage() {
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [ocrResult, setOcrResult] = useState<OcrResult | null>(null);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  const handlePasteOrDrop = useCallback((file: File) => {
    if (ocrLoading || isSaving) return;
    handleFileChange(file);
  }, [ocrLoading, isSaving]);

  useEffect(() => {
    if (!showForm) return;
    const onPaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of items) {
        if (item.type.startsWith('image/')) {
          e.preventDefault();
          const file = item.getAsFile();
          if (file) {
            const named = new File([file], `colado-${Date.now()}.${file.type.split('/')[1] || 'png'}`, { type: file.type });
            handlePasteOrDrop(named);
          }
          return;
        }
      }
    };
    document.addEventListener('paste', onPaste);
    return () => document.removeEventListener('paste', onPaste);
  }, [showForm, handlePasteOrDrop]);

  const { data: expenses, isLoading } = useFinanceExpenses();
  const { data: categories } = useFinanceCategories();
  const { data: properties } = useProperties();
  const createMutation = useCreateExpense();
  const updateMutation = useUpdateExpense();
  const deleteMutation = useDeleteExpense();
  const uploadReceiptMutation = useUploadReceipt();
  const processOcrMutation = useProcessOcr();

  const [form, setForm] = useState(emptyForm());

  const filtered = expenses?.filter((e) =>
    e.description.toLowerCase().includes(search.toLowerCase()) ||
    (e.categoryName ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (e.supplierName ?? '').toLowerCase().includes(search.toLowerCase())
  ) ?? [];

  const handleFileChange = async (file: File) => {
    setForm((f) => ({ ...f, file }));
    setOcrLoading(true);
    setOcrResult(null);
    try {
      const result = await processOcrMutation.mutateAsync(file);
      setOcrResult(result);
      if (result.success) {
        setForm((f) => ({
          ...f,
          description: result.description || f.description,
          amount: result.amount ?? f.amount,
          expenseDate: result.date ? result.date.split('T')[0] : f.expenseDate,
          supplierName: result.supplierName || f.supplierName,
        }));
        if (result.suggestedCategory && categories) {
          const match = categories.find((c) =>
            c.name.toLowerCase().includes(result.suggestedCategory!.toLowerCase()) ||
            result.suggestedCategory!.toLowerCase().includes(c.name.toLowerCase())
          );
          if (match) setForm((f) => ({ ...f, categoryId: match.id }));
        }
      }
    } catch {
      // OCR failed silently
    } finally {
      setOcrLoading(false);
    }
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (isSaving) return;
    setIsSaving(true);
    try {
      const { file, ...data } = form;
      const payload: CreateExpenseData = {
        ...data,
        amount: Number(data.amount),
        propertyId: data.propertyId || undefined,
        isRecurring: !!data.recurrenceRule,
        recurrenceRule: data.recurrenceRule || undefined,
      };

      if (editId) {
        await updateMutation.mutateAsync({ id: editId, data: payload });
        if (file) {
          try { await uploadReceiptMutation.mutateAsync({ expenseId: editId, file }); } catch { /* ok */ }
        }
      } else {
        const created = await createMutation.mutateAsync(payload);
        if (file && created?.id) {
          try { await uploadReceiptMutation.mutateAsync({ expenseId: created.id, file }); } catch { /* ok */ }
        }
      }

      resetForm();
    } finally {
      setIsSaving(false);
    }
  };

  const resetForm = () => {
    setForm(emptyForm());
    setShowForm(false);
    setEditId(null);
    setOcrResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const startEdit = (exp: Expense) => {
    setForm({
      propertyId: exp.propertyId || null,
      categoryId: exp.categoryId,
      description: exp.description,
      amount: exp.amount,
      expenseDate: exp.expenseDate.split('T')[0],
      supplierName: exp.supplierName || '',
      paymentMethod: exp.paymentMethod || '',
      notes: exp.notes || '',
      isRecurring: exp.isRecurring,
      recurrenceRule: exp.recurrenceRule || '',
      file: null,
    });
    setEditId(exp.id);
    setShowForm(true);
    setOcrResult(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Despesas</h1>
          <p className="text-neutral-500">Gerencie despesas gerais ou por propriedade</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" leftIcon={<Upload className="w-4 h-4" />} onClick={() => { resetForm(); setShowForm(true); setTimeout(() => fileInputRef.current?.click(), 100); }}>
            Importar Comprovante
          </Button>
          <Button size="sm" leftIcon={<Plus className="w-4 h-4" />} onClick={() => { resetForm(); setShowForm(true); }}>
            Nova Despesa
          </Button>
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="card-base p-5 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold text-neutral-800">
              {editId ? 'Editar Despesa' : 'Nova Despesa'}
            </h2>
            <button type="button" onClick={resetForm} className="text-neutral-400 hover:text-neutral-600">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* OCR Upload Area */}
          <div
            ref={dropZoneRef}
            className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
              isDragging
                ? 'border-primary-400 bg-primary-50'
                : 'border-neutral-200 hover:border-primary-300'
            }`}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              const file = e.dataTransfer.files?.[0];
              if (file) handlePasteOrDrop(file);
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.pdf"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFileChange(f);
              }}
            />
            {ocrLoading ? (
              <div className="flex items-center justify-center gap-2 text-primary-600">
                <Spinner />
                <span className="text-sm font-medium">IA analisando comprovante...</span>
              </div>
            ) : form.file ? (
              <div className="flex items-center justify-center gap-2 text-neutral-600">
                <Paperclip className="w-4 h-4" />
                <span className="text-sm">{form.file.name}</span>
                <button type="button" onClick={() => { setForm((f) => ({ ...f, file: null })); setOcrResult(null); if (fileInputRef.current) fileInputRef.current.value = ''; }} className="text-neutral-400 hover:text-error ml-2">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : isDragging ? (
              <div className="flex flex-col items-center gap-1 text-primary-500 py-2">
                <Upload className="w-8 h-8" />
                <span className="text-sm font-medium">Solte o arquivo aqui</span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <button type="button" onClick={() => fileInputRef.current?.click()} className="flex flex-col items-center gap-1 mx-auto text-neutral-400 hover:text-primary-500">
                  <Sparkles className="w-6 h-6" />
                  <span className="text-sm">Arraste, clique ou cole (Ctrl+V) um comprovante</span>
                  <span className="text-xs text-neutral-400">A IA preenche os campos automaticamente</span>
                </button>
                <div className="flex items-center gap-3 mt-1">
                  <span className="inline-flex items-center gap-1 text-xs text-neutral-400">
                    <ClipboardPaste className="w-3 h-3" /> Ctrl+V para colar print de tela ou imagem copiada
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* OCR Result Banner */}
          {ocrResult && ocrResult.success && (
            <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-2 text-sm text-green-700 flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              <span>IA detectou: <strong>{ocrResult.supplierName}</strong> {ocrResult.amount ? `— R$ ${ocrResult.amount.toFixed(2)}` : ''} — Confiança: {(ocrResult.confidence * 100).toFixed(0)}%</span>
            </div>
          )}
          {ocrResult && !ocrResult.success && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-2 text-sm text-amber-700">
              IA não conseguiu ler o comprovante. Preencha manualmente.
            </div>
          )}

          {/* Form Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Propriedade</label>
              <select value={form.propertyId ?? ''} onChange={(e) => setForm({ ...form, propertyId: e.target.value || null })} className="input-base w-full">
                <option value="">Despesa geral (todas)</option>
                {properties?.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Categoria *</label>
              <select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })} required className="input-base w-full">
                <option value="">Selecione...</option>
                {categories?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Descrição *</label>
              <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required className="input-base w-full" placeholder="Ex: Conta de luz março" />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Valor (R$) *</label>
              <input type="number" step="0.01" min="0.01" value={form.amount || ''} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })} required className="input-base w-full" placeholder="0,00" />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Data *</label>
              <input type="date" value={form.expenseDate} onChange={(e) => setForm({ ...form, expenseDate: e.target.value })} required className="input-base w-full" />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Fornecedor</label>
              <input value={form.supplierName} onChange={(e) => setForm({ ...form, supplierName: e.target.value })} className="input-base w-full" placeholder="Ex: CEMIG, Google" />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Pagamento</label>
              <select value={form.paymentMethod} onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })} className="input-base w-full">
                <option value="">Selecione...</option>
                {PAYMENT_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                <RefreshCw className="w-3.5 h-3.5 inline mr-1" />
                Recorrência
              </label>
              <select value={form.recurrenceRule} onChange={(e) => setForm({ ...form, recurrenceRule: e.target.value, isRecurring: !!e.target.value })} className="input-base w-full">
                {RECURRENCE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Observações</label>
              <input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="input-base w-full" placeholder="Notas adicionais..." />
            </div>
          </div>

          <div className="flex gap-2 justify-end pt-2 border-t border-neutral-100">
            <Button variant="ghost" size="sm" onClick={resetForm}>Cancelar</Button>
            <Button size="sm" type="submit" disabled={isSaving || ocrLoading}>
              {isSaving ? 'Salvando...' : ocrLoading ? 'Aguardando IA...' : editId ? 'Atualizar' : 'Salvar Despesa'}
            </Button>
          </div>
        </form>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por descrição, categoria ou fornecedor..." className="input-base w-full pl-10" />
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex justify-center py-8"><Spinner /></div>
      ) : filtered.length === 0 ? (
        <div className="card-base p-8 text-center">
          <p className="text-neutral-400">Nenhuma despesa encontrada</p>
          <p className="text-neutral-300 text-sm mt-1">Clique em &quot;Nova Despesa&quot; ou &quot;Importar Comprovante&quot;</p>
        </div>
      ) : (
        <div className="card-base overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-surface-border bg-neutral-50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase">Data</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase">Categoria</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase">Descrição</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase hidden md:table-cell">Fornecedor</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-neutral-500 uppercase">Valor</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-neutral-500 uppercase hidden sm:table-cell">Info</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-neutral-500 uppercase hidden lg:table-cell">Pagamento</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-neutral-500 uppercase">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((exp) => (
                <tr key={exp.id} className="border-b border-surface-border hover:bg-neutral-50 transition-colors">
                  <td className="px-4 py-3 text-sm">{formatDate(exp.expenseDate)}</td>
                  <td className="px-4 py-3 text-sm">
                    <span className="inline-flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: exp.categoryColor ?? '#999' }} />
                      {exp.categoryName ?? '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-neutral-700 max-w-[200px] truncate">{exp.description}</td>
                  <td className="px-4 py-3 text-sm text-neutral-500 hidden md:table-cell">{exp.supplierName || '—'}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-error text-right">{formatCurrency(exp.amount)}</td>
                  <td className="px-4 py-3 text-center hidden sm:table-cell">
                    <div className="flex items-center justify-center gap-1">
                      {exp.isRecurring && (
                        <span title={'Recorrente: ' + (exp.recurrenceRule || 'mensal')} className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs bg-blue-50 text-blue-600 border border-blue-200">
                          <RefreshCw className="w-3 h-3" />
                        </span>
                      )}
                      {exp.receiptUrl && (
                        <a href={exp.receiptUrl} target="_blank" rel="noopener noreferrer" title="Ver comprovante" className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs bg-green-50 text-green-600 border border-green-200">
                          <FileText className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center hidden lg:table-cell">
                    {exp.paymentCode ? (
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(exp.paymentCode!);
                          setCopiedId(exp.id);
                          setTimeout(() => setCopiedId(null), 2000);
                        }}
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
                          copiedId === exp.id
                            ? 'bg-green-100 text-green-700 border border-green-300'
                            : 'bg-neutral-100 text-neutral-600 border border-neutral-200 hover:bg-primary-50 hover:text-primary-600 hover:border-primary-200'
                        }`}
                        title={exp.paymentCode}
                      >
                        {copiedId === exp.id ? (
                          <><Check className="w-3 h-3" /> Copiado!</>
                        ) : (
                          <><Copy className="w-3 h-3" /> {exp.paymentCodeType === 'pix' ? 'PIX' : 'Boleto'}</>
                        )}
                      </button>
                    ) : (
                      <span className="text-neutral-300">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => startEdit(exp)} className="text-neutral-400 hover:text-primary-500 transition-colors p-1" title="Editar">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => { if (confirm('Excluir esta despesa?')) deleteMutation.mutate(exp.id); }} className="text-neutral-400 hover:text-error transition-colors p-1" title="Excluir">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {filtered.length > 0 && (
        <div className="flex justify-end">
          <div className="card-base px-4 py-2 text-sm">
            <span className="text-neutral-500">{filtered.length} despesa(s) — Total: </span>
            <span className="font-bold text-error">{formatCurrency(filtered.reduce((s, e) => s + e.amount, 0))}</span>
          </div>
        </div>
      )}
    </div>
  );
}
