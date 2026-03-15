import { create } from 'zustand';
import type { SearchFilters } from '../types';

interface SearchState {
  filters: SearchFilters;
}

interface SearchActions {
  setFilter: <K extends keyof SearchFilters>(key: K, value: SearchFilters[K]) => void;
  setFilters: (partial: Partial<SearchFilters>) => void;
  resetFilters: () => void;
}

const defaultFilters: SearchFilters = {};

export const useSearchStore = create<SearchState & SearchActions>((set) => ({
  filters: defaultFilters,

  setFilter: (key, value) => {
    set((state) => ({ filters: { ...state.filters, [key]: value } }));
  },

  setFilters: (partial) => {
    set((state) => ({ filters: { ...state.filters, ...partial } }));
  },

  resetFilters: () => {
    set({ filters: defaultFilters });
  },
}));
