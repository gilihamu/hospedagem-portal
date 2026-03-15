import { useState } from 'react';
import { CreditCard, RefreshCcw, DollarSign, TrendingUp } from 'lucide-react';
import { useAuthStore } from '../../../store/auth.store';
import { usePaymentHistory, useRefund } from '../../../hooks/usePayments';
import { Badge } from '../../../components/ui/Badge';
import { Tabs } from '../../../components/ui/Tabs';
import { EmptyState } from '../../../components/ui/EmptyState';
import { ConfirmDialog } from '../../../components/shared/ConfirmDialog';
import { StatCard } from '../../../components/shared/StatCard';
import { Spinner } from '../../../components/ui/Spinner';
import { useToast } from '../../../hooks/useToast';
import { formatCurrency, formatDate } from '../../../utils/formatters';
import type { Payment, PaymentStatus } from '../../../types';

const tabs = [
  { id: 'all', label: 'Todos' },
  { id: 'completed', label: 'Concluídos' },
  { id: 'pending', label: 'Pendentes' },
  { id: 'refunded', label: 'Reembolsados' },
  { id: 'failed', label: 'Falhos' },
];

const statusConfig: Record<PaymentStatus, { label: string; variant: 'success' | 'warning' | 'error' | 'info' | 'default' }> = {
  completed: { label: 'Concluído', variant: 'success' },
  pending: { label: 'Pendente', variant: 'warning' },
  processing: { label: 'Processando', variant: 'info' },
  failed: { label: 'Falhou', variant: 'error' },
  refunded: { label: 'Reembolsado', variant: 'default' },
};

const methodLabels: Record<string, string> = {
  credit_card: 'Cartão de Crédito',
  debit_card: 'Cartão de Débito',
  pix: 'PIX',
  boleto: 'Boleto',
  bank_transfer: 'Transferência',
};

export function PaymentsPage() {
  const { user } = useAuthStore();
  const hostId = user?.role === 'host' ? user.id : undefined;
  const { data: payments, isLoading } = usePaymentHistory(hostId);
  const refundMutation = useRefund();
  const { success, error: showError } = useToast();
  const [activeTab, setActiveTab] = useState('all');
  const [refundTarget, setRefundTarget] = useState<Payment | null>(null);

  const filtered = (payments || []).filter(p => activeTab === 'all' || p.status === activeTab);

  const totalReceived = (payments || [])
    .filter(p => p.status === 'completed')
    .reduce((sum, p) => sum + p.amount, 0);
  const totalPending = (payments || [])
    .filter(p => p.status === 'pending' || p.status === 'processing')
    .reduce((sum, p) => sum + p.amount, 0);
  const totalRefunded = (payments || [])
    .filter(p => p.status === 'refunded')
    .reduce((sum, p) => sum + p.amount, 0);

  const tabsWithCount = tabs.map(tab => ({
    ...tab,
    count: tab.id === 'all'
      ? payments?.length
      : payments?.filter(p => p.status === tab.id).length,
  }));

  const handleRefund = async () => {
    if (!refundTarget) return;
    try {
      await refundMutation.mutateAsync(refundTarget.id);
      success('Reembolso processado com sucesso!');
      setRefundTarget(null);
    } catch {
      showError('Erro ao processar reembolso');
    }
  };

  if (isLoading) {
    return <div className="flex justify-center py-16"><Spinner size="lg" /></div>;
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-neutral-900">Pagamentos</h1>
        <p className="text-sm text-neutral-500">Gerencie os pagamentos das suas reservas</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          icon={DollarSign}
          label="Total Recebido"
          value={formatCurrency(totalReceived)}
          iconColor="text-success"
        />
        <StatCard
          icon={TrendingUp}
          label="Pendente"
          value={formatCurrency(totalPending)}
          iconColor="text-warning"
        />
        <StatCard
          icon={RefreshCcw}
          label="Reembolsado"
          value={formatCurrency(totalRefunded)}
          iconColor="text-neutral-400"
        />
      </div>

      {/* Tabs */}
      <Tabs tabs={tabsWithCount} activeTab={activeTab} onChange={setActiveTab} />

      {/* Table */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={CreditCard}
          title="Nenhum pagamento encontrado"
          description="Os pagamentos aparecerão aqui quando houver reservas processadas."
        />
      ) : (
        <div className="card-base overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-surface-border bg-surface-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">ID</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider hidden md:table-cell">Hóspede</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider hidden lg:table-cell">Propriedade</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider hidden sm:table-cell">Método</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">Valor</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider hidden lg:table-cell">Data</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-neutral-500 uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(payment => {
                  const statusCfg = statusConfig[payment.status];
                  return (
                    <tr key={payment.id} className="border-b border-surface-border hover:bg-surface-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <span className="text-xs font-mono text-neutral-500">{payment.transactionId || payment.id.slice(0, 12)}</span>
                      </td>
                      <td className="px-4 py-3 text-neutral-700 hidden md:table-cell">{payment.guestName}</td>
                      <td className="px-4 py-3 text-neutral-600 hidden lg:table-cell">
                        <span className="truncate max-w-32 block">{payment.propertyName}</span>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <span className="text-xs text-neutral-600">{methodLabels[payment.method] || payment.method}</span>
                      </td>
                      <td className="px-4 py-3 font-semibold text-primary">{formatCurrency(payment.amount)}</td>
                      <td className="px-4 py-3">
                        <Badge variant={statusCfg.variant}>{statusCfg.label}</Badge>
                      </td>
                      <td className="px-4 py-3 text-neutral-500 text-xs hidden lg:table-cell">{formatDate(payment.createdAt)}</td>
                      <td className="px-4 py-3 text-right">
                        {payment.status === 'completed' && (
                          <button
                            onClick={() => setRefundTarget(payment)}
                            className="text-xs text-neutral-500 hover:text-error transition-colors px-2 py-1 rounded hover:bg-error-light"
                          >
                            Reembolsar
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={!!refundTarget}
        onClose={() => setRefundTarget(null)}
        onConfirm={handleRefund}
        title="Processar reembolso"
        description={`Tem certeza que deseja reembolsar ${refundTarget ? formatCurrency(refundTarget.amount) : ''} para ${refundTarget?.guestName}? Esta ação não pode ser desfeita.`}
        confirmLabel="Reembolsar"
        loading={refundMutation.isPending}
      />
    </div>
  );
}
