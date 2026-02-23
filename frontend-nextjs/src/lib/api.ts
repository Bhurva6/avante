import axios, { AxiosInstance } from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface SalesData {
  'Date': string;
  'Dealer Name': string;
  'State': string;
  'City': string;
  'Category': string;
  'Product': string;
  'Value': number;
  'Qty': number;
}

export interface DashboardStats {
  total_revenue: number;
  total_quantity: number;
  total_dealers: number;
  total_products: number;
  revenue_trend: Array<{ date: string; revenue: number }>;
}

export const dashboardAPI = {
  // Authentication
  login: async (username: string, password: string) => {
    const response = await apiClient.post('/api/login', { username, password });
    return response.data;
  },

  // Sales data
  getSalesReport: async (startDate: string, endDate: string, useIOSPL: boolean = false) => {
    const endpoint = useIOSPL ? '/api/iospl/sales' : '/api/avante/sales';
    const response = await apiClient.get(endpoint, {
      params: { start_date: startDate, end_date: endDate },
    });
    return response.data as SalesData[];
  },

  getDashboardStats: async (startDate: string, endDate: string, useIOSPL: boolean = false) => {
    const endpoint = useIOSPL ? '/api/iospl/stats' : '/api/avante/stats';
    const response = await apiClient.get(endpoint, {
      params: { start_date: startDate, end_date: endDate },
    });
    return response.data as DashboardStats;
  },

  // Chart data
  getDealerPerformance: async (startDate: string, endDate: string, useIOSPL: boolean = false) => {
    const endpoint = useIOSPL ? '/api/iospl/dealer-performance' : '/api/avante/dealer-performance';
    const response = await apiClient.get(endpoint, {
      params: { start_date: startDate, end_date: endDate },
    });
    return response.data;
  },

  getStatePerformance: async (startDate: string, endDate: string, useIOSPL: boolean = false) => {
    const endpoint = useIOSPL ? '/api/iospl/state-performance' : '/api/avante/state-performance';
    const response = await apiClient.get(endpoint, {
      params: { start_date: startDate, end_date: endDate },
    });
    return response.data;
  },

  getCategoryPerformance: async (startDate: string, endDate: string, useIOSPL: boolean = false) => {
    const endpoint = useIOSPL ? '/api/iospl/category-performance' : '/api/avante/category-performance';
    const response = await apiClient.get(endpoint, {
      params: { start_date: startDate, end_date: endDate },
    });
    return response.data;
  },

  getCityPerformance: async (startDate: string, endDate: string, useIOSPL: boolean = false) => {
    const endpoint = useIOSPL ? '/api/iospl/city-performance' : '/api/avante/city-performance';
    const response = await apiClient.get(endpoint, {
      params: { start_date: startDate, end_date: endDate },
    });
    return response.data;
  },

  getRevenueComparison: async (period: string, useIOSPL: boolean = false) => {
    const endpoint = useIOSPL ? '/api/iospl/comparison' : '/api/avante/comparison';
    const response = await apiClient.get(endpoint, {
      params: { period },
    });
    return response.data;
  },
};

export default dashboardAPI;
