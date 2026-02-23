import { create } from 'zustand';

export interface AuthState {
  username: string;
  password: string;
  isAuthenticated: boolean;
  userRole: 'admin' | 'user';
  allowedStates: string[];
  setCredentials: (username: string, password: string, role?: 'admin' | 'user', states?: string[]) => void;
  logout: () => void;
  setAllowedStates: (states: string[]) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  username: '',
  password: '',
  isAuthenticated: false,
  userRole: 'user',
  allowedStates: [],
  setCredentials: (username: string, password: string, role = 'user', states = []) =>
    set({ username, password, isAuthenticated: true, userRole: role, allowedStates: states }),
  logout: () => set({ username: '', password: '', isAuthenticated: false, userRole: 'user', allowedStates: [] }),
  setAllowedStates: (states: string[]) => set({ allowedStates: states }),
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
