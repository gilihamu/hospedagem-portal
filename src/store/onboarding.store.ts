import { create } from 'zustand';
import type { Business, ChannelSlug } from '../types';

const STORAGE_KEY = 'hbs_onboarding';

interface OnboardingState {
  currentStep: number;
  businessData: Partial<Business>;
  selectedChannels: ChannelSlug[];
  importedPropertyIds: string[];
  manualPropertyId?: string;
}

interface OnboardingActions {
  setStep: (step: number) => void;
  setBusinessData: (data: Partial<Business>) => void;
  setSelectedChannels: (channels: ChannelSlug[]) => void;
  addImportedPropertyIds: (ids: string[]) => void;
  setManualPropertyId: (id: string) => void;
  reset: () => void;
}

const defaults: OnboardingState = {
  currentStep: 1,
  businessData: {},
  selectedChannels: [],
  importedPropertyIds: [],
};

function hydrate(): OnboardingState {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? { ...defaults, ...JSON.parse(raw) } : { ...defaults };
  } catch {
    return { ...defaults };
  }
}

function persist(state: OnboardingState) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}

export const useOnboardingStore = create<OnboardingState & OnboardingActions>((set, get) => ({
  ...hydrate(),

  setStep: (step) => {
    set({ currentStep: step });
    persist({ ...get(), currentStep: step });
  },

  setBusinessData: (data) => {
    const merged = { ...get().businessData, ...data };
    set({ businessData: merged });
    persist({ ...get(), businessData: merged });
  },

  setSelectedChannels: (channels) => {
    set({ selectedChannels: channels });
    persist({ ...get(), selectedChannels: channels });
  },

  addImportedPropertyIds: (ids) => {
    const merged = [...new Set([...get().importedPropertyIds, ...ids])];
    set({ importedPropertyIds: merged });
    persist({ ...get(), importedPropertyIds: merged });
  },

  setManualPropertyId: (id) => {
    set({ manualPropertyId: id });
    persist({ ...get(), manualPropertyId: id });
  },

  reset: () => {
    set({ ...defaults });
    sessionStorage.removeItem(STORAGE_KEY);
  },
}));
