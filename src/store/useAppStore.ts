import { create } from 'zustand';

export type AuthType = 'none' | 'basic' | 'bearer';

export interface CheckResult {
  url: string;
  status: number;
  duration: number;
  category: string;
  destination: string | null;
  error?: string;
  seoScore?: number | null;
  responsiveScore?: number | null;
}

interface AppState {
  urlsInput: string;
  authType: AuthType;
  basicUsername: string;
  basicPassword: string;
  bearerToken: string;
  checkSeo: boolean;
  checkResponsive: boolean;
  isChecking: boolean;
  results: CheckResult[];
  globalError: string | null;

  setUrlsInput: (input: string) => void;
  setAuthType: (type: AuthType) => void;
  setBasicUsername: (username: string) => void;
  setBasicPassword: (password: string) => void;
  setBearerToken: (token: string) => void;
  setCheckSeo: (check: boolean) => void;
  setCheckResponsive: (check: boolean) => void;
  checkUrls: () => Promise<void>;
  resetResults: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  urlsInput: '',
  authType: 'none',
  basicUsername: '',
  basicPassword: '',
  bearerToken: '',
  checkSeo: false,
  checkResponsive: false,
  isChecking: false,
  results: [],
  globalError: null,

  setUrlsInput: (input) => set({ urlsInput: input }),
  setAuthType: (type) => set({ authType: type }),
  setBasicUsername: (username) => set({ basicUsername: username }),
  setBasicPassword: (password) => set({ basicPassword: password }),
  setBearerToken: (token) => set({ bearerToken: token }),
  setCheckSeo: (check) => set({ checkSeo: check }),
  setCheckResponsive: (check) => set({ checkResponsive: check }),
  
  resetResults: () => set({ results: [], globalError: null }),

  checkUrls: async () => {
    const state = get();
    set({ isChecking: true, globalError: null, results: [] });

    const rawUrls = state.urlsInput.split('\n').map(u => u.trim()).filter(Boolean);
    
    if (rawUrls.length === 0) {
      set({ isChecking: false, globalError: 'Please enter at least one URL.' });
      return;
    }
    

    let auth: any = undefined;
    if (state.authType === 'basic') {
      auth = { type: 'basic', username: state.basicUsername, password: state.basicPassword };
    } else if (state.authType === 'bearer') {
      auth = { type: 'bearer', token: state.bearerToken };
    }

    try {
      const response = await fetch('/api/check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ urls: rawUrls, auth, checkSeo: state.checkSeo, checkResponsive: state.checkResponsive }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to check URLs.');
      }

      set({ results: data.results, isChecking: false });
    } catch (error: any) {
      set({ globalError: error.message || 'An unexpected error occurred.', isChecking: false });
    }
  },
}));
