import { create } from 'zustand';

export interface AuthState {
  username: string;
  password: string;
  isAuthenticated: boolean;
  userRole: 'superadmin' | 'admin' | 'user';
  allowedStates: string[];
  allowedDashboards: string[];
  setCredentials: (username: string, password: string, role?: 'superadmin' | 'admin' | 'user', states?: string[], dashboards?: string[]) => void;
  logout: () => void;
  setAllowedStates: (states: string[]) => void;
  loadFromStorage: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  username: '',
  password: '',
  isAuthenticated: false,
  userRole: 'user',
  allowedStates: [],
  allowedDashboards: [],
  setCredentials: (username: string, password: string, role = 'user', states = [], dashboards = []) => {
    const newState = { username, password, isAuthenticated: true, userRole: role as 'superadmin' | 'admin' | 'user', allowedStates: states, allowedDashboards: dashboards };
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_state', JSON.stringify({
        username,
        userRole: role,
        allowedStates: states,
        allowedDashboards: dashboards,
      }));
    }
    set(newState);
  },
  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_state');
    }
    set({ username: '', password: '', isAuthenticated: false, userRole: 'user', allowedStates: [], allowedDashboards: [] });
  },
  setAllowedStates: (states: string[]) => set({ allowedStates: states }),
  loadFromStorage: () => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('auth_state');
      if (stored) {
        try {
          const auth = JSON.parse(stored);
          set({
            username: auth.username || '',
            isAuthenticated: !!auth.username,
            userRole: auth.userRole || 'user',
            allowedStates: auth.allowedStates || [],
            allowedDashboards: auth.allowedDashboards || [],
          });
        } catch (e) {
          console.error('Failed to load auth from storage:', e);
        }
      }
    }
  },
}));

export interface DashboardState {
  dashboardMode: 'avante' | 'iospl';
  hideInnovative: boolean;
  hideAvante: boolean;
  startDate: string;
  endDate: string;
  setSidebarOpen: (open: boolean) => void;
  setDashboardMode: (mode: 'avante' | 'iospl') => void;
  setHideInnovative: (hide: boolean) => void;
  setHideAvante: (hide: boolean) => void;
  setDateRange: (start: string, end: string) => void;
  sidebarOpen: boolean;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  dashboardMode: 'avante',
  hideInnovative: false,
  hideAvante: false,
  startDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
  endDate: new Date().toISOString().split('T')[0],
  sidebarOpen: true,
  setSidebarOpen: (open: boolean) => set({ sidebarOpen: open }),
  setDashboardMode: (mode: 'avante' | 'iospl') => set({ dashboardMode: mode }),
  setHideInnovative: (hide: boolean) => set({ hideInnovative: hide }),
  setHideAvante: (hide: boolean) => set({ hideAvante: hide }),
  setDateRange: (start: string, end: string) => set({ startDate: start, endDate: end }),
}));
