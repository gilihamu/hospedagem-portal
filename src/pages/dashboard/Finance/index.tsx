import { useState } from "react";
import { Link } from "react-router-dom";
import {
  DollarSign, TrendingUp, TrendingDown, Receipt,
  ArrowDownUp, FileText, PieChart, Wallet,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart as RPieChart, Pie, Cell,
} from "recharts";
import { useFinanceDashboard, useFinanceBalance } from "../../../hooks/useFinance";
import { StatCard } from "../../../components/shared/StatCard";
import { Spinner } from "../../../components/ui/Spinner";
import { Button } from "../../../components/ui/Button";
import { formatCurrency } from "../../../utils/formatters";
import { ROUTES } from "../../../router/routes";

export function FinanceDashboardPage() {
  const now = new Date();
  const [month] = useState(now.getMonth() + 1);
  const [year] = useState(now.getFullYear());

  const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
  const endDate = `${year}-${String(month).padStart(2, "0")}-${new Date(year, month, 0).getDate()}`;

  const { data: dashboard, isLoading } = useFinanceDashboard({ startDate, endDate });
  const { data: balance } = useFinanceBalance();

  if (isLoading) {
    return <div className="flex justify-center py-16"><Spinner /></div>;
  }

  const kpis = [
    { icon: DollarSign, label: "Receita", value: formatCurrency(dashboard?.totalRevenue ?? 0), growth: dashboard?.revenueGrowth, iconColor: "text-success" },
    { icon: Receipt, label: "Despesas", value: formatCurrency(dashboard?.totalExpenses ?? 0), growth: dashboard?.expenseGrowth, iconColor: "text-error" },
    { icon: TrendingUp, label: "Lucro Líquido", value: formatCurrency(dashboard?.netProfit ?? 0), iconColor: "text-primary" },
    { icon: Wallet, label: "Saldo Atual", value: formatCurrency(balance?.balance ?? 0), iconColor: "text-info" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Financeiro</h1>
          <p className="text-neutral-500">Visão geral das suas finanças</p>
        </div>
        <div className="flex gap-2">
          <Link to={ROUTES.DASHBOARD_FINANCE_EXPENSES}>
            <Button variant="outline" size="sm" leftIcon={<Receipt className="w-4 h-4" />}>Despesas</Button>
          </Link>
          <Link to={ROUTES.DASHBOARD_FINANCE_CASHFLOW}>
            <Button variant="outline" size="sm" leftIcon={<ArrowDownUp className="w-4 h-4" />}>Fluxo de Caixa</Button>
          </Link>
          <Link to={ROUTES.DASHBOARD_FINANCE_REPORTS}>
            <Button size="sm" leftIcon={<FileText className="w-4 h-4" />}>Relatórios</Button>
          </Link>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <StatCard key={kpi.label} {...kpi} />
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Revenue x Expenses */}
        <div className="lg:col-span-2 card-base p-5">
          <h2 className="text-lg font-semibold text-neutral-800 mb-4">Receita vs Despesas</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={dashboard?.monthlyData ?? []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(v: number) => `R$${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              <Bar dataKey="revenue" name="Receita" fill="#10B981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expenses" name="Despesas" fill="#EF4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Expenses by Category */}
        <div className="card-base p-5">
          <h2 className="text-lg font-semibold text-neutral-800 mb-4">Despesas por Categoria</h2>
          {dashboard?.topCategories?.length ? (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <RPieChart>
                  <Pie data={dashboard.topCategories} dataKey="amount" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80}>
                    {dashboard.topCategories.map((c, i) => (
                      <Cell key={i} fill={c.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                </RPieChart>
              </ResponsiveContainer>
              <ul className="space-y-2 mt-3">
                {dashboard.topCategories.map((c) => (
                  <li key={c.name} className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: c.color }} />
                      {c.name}
                    </span>
                    <span className="font-medium">{formatCurrency(c.amount)}</span>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="text-neutral-400 text-sm text-center py-8">Nenhuma despesa registrada</p>
          )}
        </div>
      </div>

      {/* AI Insights */}
      {dashboard?.insights?.length ? (
        <div className="card-base p-5">
          <h2 className="text-lg font-semibold text-neutral-800 mb-4 flex items-center gap-2">
            <PieChart className="w-5 h-5 text-primary" /> Insights da IA
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {dashboard.insights.map((insight, i) => (
              <div key={i} className={`p-4 rounded-lg border ${
                insight.severity === "high" ? "border-error/30 bg-error/5" :
                insight.severity === "medium" ? "border-warning/30 bg-warning/5" :
                "border-primary/30 bg-primary/5"
              }`}>
                <h3 className="font-semibold text-sm mb-1">{insight.title}</h3>
                <p className="text-xs text-neutral-600">{insight.description}</p>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* Profit Margin */}
      {dashboard && (
        <div className="card-base p-5">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              (dashboard.profitMargin ?? 0) >= 50 ? "bg-success-light" : (dashboard.profitMargin ?? 0) >= 20 ? "bg-warning/10" : "bg-error/10"
            }`}>
              {(dashboard.profitMargin ?? 0) >= 50 ? <TrendingUp className="w-6 h-6 text-success" /> : <TrendingDown className="w-6 h-6 text-error" />}
            </div>
            <div>
              <p className="text-sm text-neutral-500">Margem de Lucro</p>
              <p className="text-3xl font-bold text-neutral-900">{(dashboard.profitMargin ?? 0).toFixed(1)}%</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}