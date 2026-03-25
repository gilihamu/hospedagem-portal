import { useState, useRef, useCallback } from 'react';
import { Upload, FileSpreadsheet, CheckCircle, XCircle, SkipForward, Loader2, AlertCircle, Building2, User, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../../lib/api';

interface ImportRowResult {
  row: number;
  reservationNumber: string;
  guestName: string;
  propertyName: string;
  status: string;
  message: string;
  bookingId?: string;
  propertyCreated: boolean;
  guestCreated: boolean;
}

interface ImportResult {
  total: number;
  imported: number;
  skipped: number;
  errors: number;
  rows: ImportRowResult[];
}

type ImportState = 'idle' | 'uploading' | 'done';

export function ImportBookingComPage() {
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [state, setState] = useState<ImportState>('idle');
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFile = useCallback((f: File | null) => {
    if (!f) return;
    if (!f.name.endsWith('.xlsx')) {
      setError('Formato inválido. Envie um arquivo .xlsx');
      return;
    }
    setFile(f);
    setError(null);
    setResult(null);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    handleFile(f);
  }, [handleFile]);

  const handleUpload = async () => {
    if (!file) return;
    setState('uploading');
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      const data = await api.postForm<ImportResult>('/bookings/import/booking-com', formData);
      setResult(data);
      setState('done');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao importar';
      setError(msg);
      setState('idle');
    }
  };

  const statusIcon = (status: string) => {
    if (status === 'success') return <CheckCircle className="w-4 h-4 text-emerald-500" />;
    if (status === 'skipped') return <SkipForward className="w-4 h-4 text-amber-500" />;
    return <XCircle className="w-4 h-4 text-red-500" />;
  };

  const statusBg = (status: string) => {
    if (status === 'success') return 'bg-emerald-50 border-emerald-200';
    if (status === 'skipped') return 'bg-amber-50 border-amber-200';
    return 'bg-red-50 border-red-200';
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 rounded-xl hover:bg-neutral-100 transition-colors">
          <ArrowLeft className="w-5 h-5 text-neutral-500" />
        </button>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
            <FileSpreadsheet className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-neutral-800">Importar Reservas do Booking.com</h1>
            <p className="text-sm text-neutral-400">Envie a planilha Excel exportada do Booking.com</p>
          </div>
        </div>
      </div>

      {/* Upload area */}
      {state !== 'done' && (
        <div className="card-base overflow-hidden">
          <div className="p-6">
            <div
              onDrop={handleDrop}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onClick={() => fileRef.current?.click()}
              className={'border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all ' +
                (dragOver ? 'border-blue-400 bg-blue-50' : file ? 'border-emerald-300 bg-emerald-50/50' : 'border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50')}
            >
              <input ref={fileRef} type="file" accept=".xlsx" className="hidden" onChange={(e) => handleFile(e.target.files?.[0] ?? null)} />
              {file ? (
                <div className="flex flex-col items-center gap-2">
                  <FileSpreadsheet className="w-12 h-12 text-emerald-500" />
                  <p className="text-sm font-semibold text-emerald-700">{file.name}</p>
                  <p className="text-xs text-neutral-400">{(file.size / 1024).toFixed(1)} KB — Clique para trocar</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <Upload className="w-12 h-12 text-neutral-300" />
                  <p className="text-sm font-medium text-neutral-600">Arraste a planilha aqui ou clique para selecionar</p>
                  <p className="text-xs text-neutral-400">Apenas arquivos .xlsx (Excel)</p>
                </div>
              )}
            </div>

            {/* Expected format */}
            <div className="mt-4 p-4 rounded-xl bg-neutral-50 border border-neutral-100">
              <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Formato esperado das colunas:</p>
              <div className="flex flex-wrap gap-1.5">
                {['Nome da propriedade', 'Localização', 'Nome de quem fez a reserva', 'Cliente Genius', 'Chegada', 'Saída', 'Status', 'Pagamento total', 'Comissão', 'Moeda', 'Número da reserva'].map(col => (
                  <span key={col} className="text-[10px] px-2 py-1 rounded-lg bg-white border border-neutral-200 text-neutral-600 font-medium">{col}</span>
                ))}
              </div>
            </div>

            {error && (
              <div className="mt-4 flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <button
              onClick={handleUpload}
              disabled={!file || state === 'uploading'}
              className="mt-4 w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {state === 'uploading' ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Importando...</>
              ) : (
                <><Upload className="w-4 h-4" /> Importar Reservas</>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-4">
          {/* Summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="card-base p-4 text-center">
              <p className="text-2xl font-black text-neutral-800">{result.total}</p>
              <p className="text-xs text-neutral-400 font-medium">Total</p>
            </div>
            <div className="card-base p-4 text-center border-l-4 border-l-emerald-400">
              <p className="text-2xl font-black text-emerald-600">{result.imported}</p>
              <p className="text-xs text-neutral-400 font-medium">Importadas</p>
            </div>
            <div className="card-base p-4 text-center border-l-4 border-l-amber-400">
              <p className="text-2xl font-black text-amber-600">{result.skipped}</p>
              <p className="text-xs text-neutral-400 font-medium">Ignoradas</p>
            </div>
            <div className="card-base p-4 text-center border-l-4 border-l-red-400">
              <p className="text-2xl font-black text-red-600">{result.errors}</p>
              <p className="text-xs text-neutral-400 font-medium">Erros</p>
            </div>
          </div>

          {/* Detail table */}
          <div className="card-base overflow-hidden">
            <div className="px-4 py-3 border-b border-surface-border bg-gradient-to-r from-neutral-50 to-white flex items-center justify-between">
              <h3 className="font-bold text-sm text-neutral-700">Relatório detalhado</h3>
              <div className="flex items-center gap-2">
                <button onClick={() => { setState('idle'); setFile(null); setResult(null); }} className="text-xs px-3 py-1.5 rounded-lg border border-surface-border hover:bg-neutral-50 text-neutral-600 font-medium transition-colors">Nova importação</button>
                <button onClick={() => navigate('/dashboard/bookings')} className="text-xs px-3 py-1.5 rounded-lg bg-primary text-white font-medium hover:bg-primary/90 transition-colors">Ver reservas</button>
              </div>
            </div>
            <div className="divide-y divide-surface-border/60 max-h-[500px] overflow-y-auto">
              {result.rows.map((row, i) => (
                <div key={i} className={'flex items-center gap-3 px-4 py-3 ' + statusBg(row.status)}>
                  <div className="flex-shrink-0">{statusIcon(row.status)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-neutral-700">#{row.reservationNumber}</span>
                      <span className="text-xs text-neutral-500">{row.guestName}</span>
                      <span className="text-[10px] text-neutral-400">• {row.propertyName}</span>
                    </div>
                    <p className="text-xs text-neutral-500 mt-0.5">{row.message}</p>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {row.propertyCreated && (
                      <span className="flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 font-medium" title="Propriedade criada">
                        <Building2 className="w-3 h-3" /> Nova
                      </span>
                    )}
                    {row.guestCreated && (
                      <span className="flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 font-medium" title="Hóspede criado">
                        <User className="w-3 h-3" /> Novo
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
