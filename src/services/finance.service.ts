import { api } from '../lib/api';

export interface ExpenseCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
  isTaxDeductible: boolean;
  sortOrder: number;
  isGlobal: boolean;
}

export interface Expense {
  id: string;
  categoryId: string;
  categoryName?: string;
  categoryColor?: string;
  categoryIcon?: string;
  propertyId?: string;
  propertyName?: string;
  description: string;
  amount: number;
  expenseDate: string;
  paymentDate?: string;
  paymentMethod?: string;
  receiptUrl?: string;
  isRecurring: boolean;
  recurrenceRule?: string;
  supplierName?: string;
  notes?: string;
  paymentCode?: string;
  paymentCodeType?: string;
  createdAt: string;
}

export interface CreateExpenseData {
  propertyId?: string | null;
  categoryId: string;
  description: string;
  amount: number;
  expenseDate: string;
  supplierName?: string;
  paymentMethod?: string;
  notes?: string;
  isRecurring?: boolean;
  recurrenceRule?: string;
}

export interface OcrResult {
  success: boolean;
  amount?: number;
  date?: string;
  supplierName?: string;
  supplierCnpj?: string;
  invoiceNumber?: string;
  description?: string;
  suggestedCategory?: string;
  paymentCode?: string;
  paymentCodeType?: string;
  confidence: number;
  errorMessage?: string;
}

export interface CashFlowEntry {
  id: string;
  entryType: string;
  amount: number;
  entryDate: string;
  description?: string;
  propertyName?: string;
  referenceType?: string;
}

export interface CashFlowResponse {
  entries: CashFlowEntry[];
  totalIncome: number;
  totalExpense: number;
  netCashFlow: number;
}

export interface CashFlowBalance {
  totalIncome: number;
  totalExpense: number;
  balance: number;
}

export interface DashboardData {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  profitMargin: number;
  revenueGrowth?: number;
  expenseGrowth?: number;
  topCategories: { name: string; amount: number; color: string }[];
  monthlyData: { month: string; revenue: number; expenses: number }[];
  insights?: { type: string; title: string; description: string; severity: string }[];
}

const MONTH_LABELS = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
const INSIGHT_SEVERITY: Record<number, string> = { 1: 'low', 2: 'high', 3: 'medium' };

export interface FinancialReport {
  summary: {
    totalRevenue: number;
    totalExpenses: number;
    netProfit: number;
    profitMargin: number;
  };
  monthlyData: { month: string; revenue: number; expenses: number; profit: number }[];
  expensesByCategory: { categoryName: string; amount: number; percentage: number; color: string }[];
}

export interface SimpleProperty {
  id: string;
  name: string;
}

export const financeService = {
  async getCategories(): Promise<ExpenseCategory[]> {
    return api.get<ExpenseCategory[]>('/finance/categories/');
  },

  async getExpenses(params?: Record<string, string>): Promise<Expense[]> {
    return api.get<Expense[]>('/finance/expenses/', params);
  },
  async createExpense(data: CreateExpenseData): Promise<Expense> {
    return api.post<Expense>('/finance/expenses/', data);
  },
  async updateExpense(id: string, data: Partial<Expense> | CreateExpenseData): Promise<void> {
    return api.put<void>('/finance/expenses/' + id, data);
  },
  async deleteExpense(id: string): Promise<void> {
    return api.delete<void>('/finance/expenses/' + id);
  },

  async uploadReceipt(expenseId: string, file: File): Promise<OcrResult> {
    const fd = new FormData();
    fd.append('file', file);
    return api.postForm<OcrResult>('/finance/expenses/' + expenseId + '/receipt', fd);
  },

  async processOcr(file: File): Promise<OcrResult> {
    const fd = new FormData();
    fd.append('file', file);
    return api.postForm<OcrResult>('/finance/expenses/ocr', fd);
  },

  async getDashboard(params?: Record<string, string>): Promise<DashboardData> {
    const raw = await api.get<Record<string, unknown>>('/finance/dashboard/', params);

    // Map expensesByCategory → topCategories
    const cats = (raw.expensesByCategory ?? raw.topCategories ?? []) as { categoryName?: string; name?: string; amount: number; color: string }[];
    const topCategories = cats.map(c => ({ name: c.categoryName ?? c.name ?? '', amount: c.amount, color: c.color }));

    // Map monthlyTrend → monthlyData
    const trend = (raw.monthlyTrend ?? raw.monthlyData ?? []) as { year?: number; month: number | string; revenue: number; expenses: number }[];
    const monthlyData = trend.map(m => ({
      month: typeof m.month === 'number' ? MONTH_LABELS[m.month - 1] || String(m.month) : m.month,
      revenue: m.revenue,
      expenses: m.expenses,
    }));

    // Map insights
    const rawInsights = (raw.insights ?? []) as { type?: number | string; title: string; message?: string; description?: string; severity?: string; value?: number }[];
    const insights = rawInsights.map(i => ({
      type: String(i.type ?? ''),
      title: i.title,
      description: i.message ?? i.description ?? '',
      severity: i.severity ?? (typeof i.type === 'number' ? INSIGHT_SEVERITY[i.type] ?? 'low' : 'low'),
    }));

    return {
      totalRevenue: (raw.totalRevenue as number) ?? 0,
      totalExpenses: (raw.totalExpenses as number) ?? 0,
      netProfit: (raw.netProfit as number) ?? 0,
      profitMargin: (raw.profitMargin as number) ?? 0,
      revenueGrowth: (raw.revenueChange ?? raw.revenueGrowth) as number | undefined,
      expenseGrowth: (raw.expenseChange ?? raw.expenseGrowth) as number | undefined,
      topCategories,
      monthlyData,
      insights,
    };
  },

  async getCashFlow(params?: Record<string, string>): Promise<CashFlowResponse> {
    return api.get<CashFlowResponse>('/finance/cashflow/', params);
  },
  async getBalance(): Promise<CashFlowBalance> {
    return api.get<CashFlowBalance>('/finance/cashflow/balance/');
  },

  async getReport(params: Record<string, string>): Promise<FinancialReport> {
    return api.get<FinancialReport>('/finance/reports/', params);
  },
  getReportPdfUrl(startDate: string, endDate: string): string {
    const baseUrl = import.meta.env.VITE_API_URL || '/api';
    return baseUrl + '/finance/reports/pdf/?startDate=' + startDate + '&endDate=' + endDate;
  },

  async getProperties(): Promise<SimpleProperty[]> {
    const res = await api.get<{ items: { id: string; name: string }[] }>('/properties/');
    return (res.items || []).map((p) => ({ id: p.id, name: p.name }));
  },
};
