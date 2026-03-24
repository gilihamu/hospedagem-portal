import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { financeService } from '../services/finance.service';
import type { CreateExpenseData } from '../services/finance.service';

export function useFinanceCategories() {
  return useQuery({
    queryKey: ['finance', 'categories'],
    queryFn: () => financeService.getCategories(),
  });
}

export function useFinanceExpenses(params?: Record<string, string>) {
  return useQuery({
    queryKey: ['finance', 'expenses', params],
    queryFn: () => financeService.getExpenses(params),
  });
}

export function useFinanceDashboard(params?: Record<string, string>) {
  return useQuery({
    queryKey: ['finance', 'dashboard', params],
    queryFn: () => financeService.getDashboard(params),
  });
}

export function useFinanceCashFlow(params?: Record<string, string>) {
  return useQuery({
    queryKey: ['finance', 'cashflow', params],
    queryFn: () => financeService.getCashFlow(params),
  });
}

export function useFinanceBalance() {
  return useQuery({
    queryKey: ['finance', 'balance'],
    queryFn: () => financeService.getBalance(),
  });
}

export function useFinanceReport(params: Record<string, string>) {
  return useQuery({
    queryKey: ['finance', 'report', params],
    queryFn: () => financeService.getReport(params),
    enabled: !!params.startDate && !!params.endDate,
  });
}

export function useProperties() {
  return useQuery({
    queryKey: ['properties'],
    queryFn: () => financeService.getProperties(),
  });
}

export function useCreateExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateExpenseData) => financeService.createExpense(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['finance'] });
    },
  });
}

export function useUpdateExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CreateExpenseData }) =>
      financeService.updateExpense(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['finance'] });
    },
  });
}

export function useDeleteExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => financeService.deleteExpense(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['finance'] });
    },
  });
}

export function useUploadReceipt() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ expenseId, file }: { expenseId: string; file: File }) =>
      financeService.uploadReceipt(expenseId, file),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['finance', 'expenses'] });
    },
  });
}

export function useProcessOcr() {
  return useMutation({
    mutationFn: (file: File) => financeService.processOcr(file),
  });
}
