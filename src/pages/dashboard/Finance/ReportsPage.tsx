import { useState } from "react";
import { FileText, Download, BarChart3 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useFinanceReport } from "../../../hooks/useFinance";
import { financeService } from "../../../services/finance.service";
import { StatCard } from "../../../components/shared/StatCard";
import { Spinner } from "../../../components/ui/Spinner";
import { Button } from "../../../components/ui/Button";
import { formatCurrency } from "../../../utils/formatters";

export function ReportsPage() {
  const now = new Date();
  const [startDate, setStartDate] = useState(`${now.getFullYear()}-01-01`);
  const [endDate, setEndDate] = useState(`${now.getFullYear()}-12-31`);

  const { data: report, isLoading } = useFinanceReport({ startDate, endDate });

  const handleExportPdf = () => {
    const token = JSON.parse(localStorage.getItem("hbs_auth") || "{}").token;
    const url = financeService.getReportPdfUrl(startDate, endDate);
    window.open(`${url}&token=${token}`, "_blank");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Relatórios</h1>
          <p className="text-neutral-500">Análise financeira detalhada</p>
        </div>
        <Button size="sm" leftIcon={<Download className="w-4 h-4" />} onClick={handleExportPdf}>
          Exportar PDF
        </Button>
      </div>

      {/* Period Filter */}
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

      {isLoading ? (
        <div className="flex justify-center py-8"><Spinner /></div>
      ) : report ? (
        <>
          {/* Summary KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <StatCard icon={BarChart3} label="Receita Total" value={formatCurrency(report.summary.totalRevenue)} iconColor="text-success" />
            <StatCard icon={FileText} label="Despesas Totais" value={formatCurrency(report.summary.totalExpenses)} iconColor="text-error" />
            <StatCard icon={BarChart3} label="Lucro Líquido" value={formatCurrency(report.summary.netProfit)} iconColor="text-primary" />
            <StatCard icon={BarChart3} label="Margem" value={`${report.summary.profitMargin.toFixed(1)}%`} iconColor="text-info" />
          </div>

          {/* Monthly Chart */}
          <div className="card-base p-5">
            <h2 className="text-lg font-semibold text-neutral-800 mb-4">Evolução Mensal</h2>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={report.monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                <Bar dataKey="revenue" name="Receita" fill="#10B981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expenses" name="Despesas" fill="#EF4444" radius={[4, 4, 0, 0]} />
                <Bar dataKey="profit" name="Lucro" fill="#6366F1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Expenses by Category */}
          <div className="card-base p-5">
            <h2 className="text-lg font-semibold text-neutral-800 mb-4">Despesas por Categoria</h2>
            <div className="space-y-3">
              {report.expensesByCategory.map((cat) => (
                <div key={cat.categoryName} className="flex items-center gap-3">
                  <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
                  <span className="flex-1 text-sm text-neutral-700">{cat.categoryName}</span>
                  <div className="w-32 h-2 bg-neutral-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${cat.percentage}%`, backgroundColor: cat.color }} />
                  </div>
                  <span className="text-sm font-medium text-neutral-800 w-24 text-right">{formatCurrency(cat.amount)}</span>
                  <span className="text-xs text-neutral-400 w-12 text-right">{cat.percentage.toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        <div className="card-base p-8 text-center"><p className="text-neutral-400">Selecione um período para gerar o relatório</p></div>
      )}
    </div>
  );
}