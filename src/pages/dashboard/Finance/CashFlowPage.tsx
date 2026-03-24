import { useState } from "react";
import { ArrowDownUp, TrendingUp, TrendingDown } from "lucide-react";
import { useFinanceCashFlow, useFinanceBalance } from "../../../hooks/useFinance";
import { StatCard } from "../../../components/shared/StatCard";
import { Spinner } from "../../../components/ui/Spinner";
import { formatCurrency, formatDate } from "../../../utils/formatters";
import { cn } from "../../../utils/cn";

export function CashFlowPage() {
  const now = new Date();
  const [startDate, setStartDate] = useState(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`);
  const [endDate, setEndDate] = useState(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()}`);

  const { data: cashflow, isLoading } = useFinanceCashFlow({ startDate, endDate });
  const { data: balance } = useFinanceBalance();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Fluxo de Caixa</h1>
        <p className="text-neutral-500">Acompanhe entradas e saídas</p>
      </div>

      {/* Balance */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard icon={TrendingUp} label="Receitas" value={formatCurrency(balance?.totalIncome ?? 0)} iconColor="text-success" />
        <StatCard icon={TrendingDown} label="Despesas" value={formatCurrency(balance?.totalExpense ?? 0)} iconColor="text-error" />
        <StatCard icon={ArrowDownUp} label="Saldo" value={formatCurrency(balance?.balance ?? 0)} iconColor="text-primary" />
      </div>

      {/* Filters */}
      <div className="flex gap-3 items-end">
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">De</label>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="input-base" />
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">Até</label>
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="input-base" />
        </div>
      </div>

      {/* Entries */}
      {isLoading ? (
        <div className="flex justify-center py-8"><Spinner /></div>
      ) : !cashflow?.entries?.length ? (
        <div className="card-base p-8 text-center"><p className="text-neutral-400">Nenhuma movimentação no período</p></div>
      ) : (
        <div className="card-base overflow-hidden">
          <div className="px-5 py-3 border-b border-surface-border bg-neutral-50 flex justify-between text-sm font-semibold text-neutral-600">
            <span>Receitas: <span className="text-success">{formatCurrency(cashflow.totalIncome)}</span></span>
            <span>Despesas: <span className="text-error">{formatCurrency(cashflow.totalExpense)}</span></span>
            <span>Líquido: <span className={cashflow.netCashFlow >= 0 ? "text-success" : "text-error"}>{formatCurrency(cashflow.netCashFlow)}</span></span>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-surface-border">
                <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase">Data</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase">Tipo</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase">Descrição</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-neutral-500 uppercase">Valor</th>
              </tr>
            </thead>
            <tbody>
              {cashflow.entries.map((e) => (
                <tr key={e.id} className="border-b border-surface-border hover:bg-neutral-50">
                  <td className="px-4 py-3 text-sm">{formatDate(e.entryDate)}</td>
                  <td className="px-4 py-3 text-sm">
                    <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium", e.entryType === "Income" ? "bg-success-light text-success" : "bg-error/10 text-error")}>
                      {e.entryType === "Income" ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      {e.entryType === "Income" ? "Receita" : "Despesa"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-neutral-700">
                    {e.description}
                    {e.propertyName && <span className="text-xs text-neutral-400 ml-2">({e.propertyName})</span>}
                  </td>
                  <td className={cn("px-4 py-3 text-sm font-semibold text-right", e.amount >= 0 ? "text-success" : "text-error")}>
                    {e.amount >= 0 ? "+" : ""}{formatCurrency(Math.abs(e.amount))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}