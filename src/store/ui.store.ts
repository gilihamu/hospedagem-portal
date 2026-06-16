import { create } from 'zustand';
import type { ToastItem } from '../types';

type Theme = 'light' | 'dark';

const initialTheme: Theme =
  typeof localStorage !== 'undefined' && localStorage.getItem('hbs_theme') === 'dark' ? 'dark' : 'light';

interface UIState {
  toasts: ToastItem[];
  modalOpen: boolean;
  isSidebarOpen: boolean;
  commandOpen: boolean;
  theme: Theme;
}

interface UIActions {
  addToast: (toast: Omit<ToastItem, 'id'>) => void;
  removeToast: (id: string) => void;
  openModal: () => void;
  closeModal: () => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  openCommand: () => void;
  closeCommand: () => void;
  toggleTheme: () => void;
}

export const useUIStore = create<UIState & UIActions>((set) => ({
  toasts: [],
  modalOpen: false,
  isSidebarOpen: false,
  commandOpen: false,
  theme: initialTheme,

  addToast: (toast) => {
    const id = `toast_${Date.now()}_${Math.random()}`;
    set((state) => ({ toasts: [...state.toasts, { ...toast, id }] }));
  },

  removeToast: (id) => {
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
  },

  openModal: () => set({ modalOpen: true }),
  closeModal: () => set({ modalOpen: false }),

  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  setSidebarOpen: (open) => set({ isSidebarOpen: open }),

  openCommand: () => set({ commandOpen: true }),
  closeCommand: () => set({ commandOpen: false }),

  toggleTheme: () =>
    set((state) => {
      const theme: Theme = state.theme === 'dark' ? 'light' : 'dark';
      if (typeof localStorage !== 'undefined') localStorage.setItem('hbs_theme', theme);
      return { theme };
    }),
}));
