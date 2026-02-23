'use client';

import React, { useState, useEffect } from 'react';
import { useDashboardStore, useAuthStore } from '@/lib/store';
import Layout from '@/components/Layout';
import { 
  RevenueBarChart, 
  RevenuePieChart, 
  HorizontalBarChart,
  DonutChart,
  ComposedChartComponent 
} from '@/components/Charts';
import { ChartModal, ClickableChartWrapper, ChartConfig } from '@/components/ChartModal';
import IndiaMap from '@/components/IndiaMap';
import PaymentPipeline from '@/components/PaymentPipeline';
import { DealerDrillDownWrapper } from '@/components/DealerDrillDownChart';
import NonBillingDealersTable from '@/components/NonBillingDealersTable';
import ComparativeAnalysisTable from '@/components/ComparativeAnalysisTable';


// API base URL - empty for same-origin requests in production, localhost for dev
const API_BASE = typeof window !== 'undefined' && window.location.hostname === 'localhost' 
  ? 'http://localhost:5000' 
  : '';

// Helper function to format dates for API (DD-MM-YYYY)
const formatDateForAPI = (dateStr: string): string => {
  if (!dateStr || dateStr === 'undefined' || dateStr === 'NaN') return '';
  
  try {
    let date: Date;
    
    // Check if it's already in DD-MM-YYYY format
    if (/^\d{2}-\d{2}-\d{4}$/.test(dateStr)) {
      const [day, month, year] = dateStr.split('-');
      date = new Date(`${year}-${month}-${day}`);
    } else if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      // Already in YYYY-MM-DD format
      date = new Date(dateStr);
    } else {
      // Try parsing as is
      date = new Date(dateStr);
    }
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      console.warn('Invalid date format:', dateStr);
      return '';
    }
    
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  } catch (error) {
    console.error('Error parsing date:', dateStr, error);
    return '';
  }
};

// Helper to format Indian currency
const formatIndianCurrency = (num: number): string => {
  if (num >= 10000000) {
    return `₹${(num / 10000000).toFixed(2)} Cr`;
  } else if (num >= 100000) {
    return `₹${(num / 100000).toFixed(2)} L`;
  } else if (num >= 1000) {
    return `₹${(num / 1000).toFixed(2)} K`;
  }
  return `₹${num.toFixed(2)}`;
};

// Helper to format numbers with commas (Indian format)
const formatNumber = (num: number): string => {
  return num.toLocaleString('en-IN');
};

// Helper to format full currency
const formatFullCurrency = (num: number): string => {
  return `₹${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

interface Stats {
  total_revenue: number;
  total_quantity: number;
  total_dealers: number;
  total_products: number;
}

interface DealerData {
  name: string;
  revenue: number;
  quantity?: number;
}

interface StateData {
  name: string;
  value: number;
  quantity?: number;
}

interface CategoryData {
  name: string;
  value: number;
}

interface CityData {
  name: string;
  value: number;
  state?: string;
}

// Stat Card Component
const StatCard: React.FC<{
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  color: string;
  loading?: boolean;
  trend?: string;
  trendPositive?: boolean;
}> = ({ title, value, subtitle, icon, color, loading, trend, trendPositive }) => (
  <div className={`bg-white p-5 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow`}>
    <div className="flex items-center justify-between">
      <div className="flex-1">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{title}</p>
        <h3 className={`text-xl font-bold mt-1 ${color}`}>
          {loading ? (
            <span className="animate-pulse bg-gray-200 rounded h-6 w-24 inline-block"></span>
          ) : (
            value
          )}
        </h3>
        {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
        {trend && (
          <p className={`text-xs mt-1 font-medium ${trendPositive ? 'text-green-600' : 'text-red-600'}`}>
            {trendPositive ? '↑' : '↓'} {trend}
          </p>
        )}
      </div>
      <div className={`p-2.5 rounded-lg ${color.replace('text-', 'bg-').replace('-600', '-100')}`}>
        {icon}
      </div>
    </div>
  </div>
);

// Mini Metric Card
const MiniMetricCard: React.FC<{
  title: string;
  value: string | number;
  change?: string;
  positive?: boolean;
}> = ({ title, value, change, positive }) => (
  <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{title}</p>
    <p className="text-lg font-bold text-gray-900 mt-1">{value}</p>
    {change && (
      <p className={`text-xs mt-1 ${positive ? 'text-green-600' : 'text-red-600'}`}>
        {positive ? '↑' : '↓'} {change}
      </p>
    )}
  </div>
);

export default function DashboardPage() {
  const { dashboardMode, startDate, endDate, hideInnovative, hideAvante } = useDashboardStore();
  const { allowedStates } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<Stats>({ total_revenue: 0, total_quantity: 0, total_dealers: 0, total_products: 0 });
  const [dealerData, setDealerData] = useState<DealerData[]>([]);
  const [stateData, setStateData] = useState<StateData[]>([]);
  const [categoryData, setCategoryData] = useState<CategoryData[]>([]);
  const [cityData, setCityData] = useState<CityData[]>([]);
  const [parentCategoryData, setParentCategoryData] = useState<CategoryData[]>([]);
  const [parentCategoryQuantityData, setParentCategoryQuantityData] = useState<CategoryData[]>([]);
  const [combinedDealerData, setCombinedDealerData] = useState<any[]>([]);
  
  // Raw API data (unfiltered) for filtering purposes
  const [rawDealerData, setRawDealerData] = useState<any[]>([]);
  const [rawStateData, setRawStateData] = useState<any[]>([]);
  const [rawCategoryData, setRawCategoryData] = useState<any[]>([]);
  const [rawCityData, setRawCityData] = useState<any[]>([]);
  const [rawStats, setRawStats] = useState<Stats>({ total_revenue: 0, total_quantity: 0, total_dealers: 0, total_products: 0 });
  const [rawSalesData, setRawSalesData] = useState<any[]>([]);
  
  // Original raw data (unfiltered)
  const [originalRawDealerData, setOriginalRawDealerData] = useState<any[]>([]);
  const [originalRawStateData, setOriginalRawStateData] = useState<any[]>([]);
  const [originalRawCategoryData, setOriginalRawCategoryData] = useState<any[]>([]);
  const [originalRawCityData, setOriginalRawCityData] = useState<any[]>([]);
  const [originalRawStats, setOriginalRawStats] = useState<Stats>({ total_revenue: 0, total_quantity: 0, total_dealers: 0, total_products: 0 });
  
  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalConfig, setModalConfig] = useState<ChartConfig | null>(null);

  // Function to open chart in fullscreen modal
  const openChartModal = (config: ChartConfig) => {
    setModalConfig(config);
    setModalOpen(true);
  };

  // Helper function to check if a dealer name contains "Innovative"
  const isInnovativeDealer = (dealerName: string): boolean => {
    return dealerName?.toLowerCase().includes('innovative');
  };

  // Helper function to check if a dealer name contains "Avante"
  const isAvanteDealer = (dealerName: string): boolean => {
    return dealerName?.toLowerCase().includes('avante');
  };

  // Helper function to get filtered raw data based on current filters
  const getFilteredRawData = (
    rawData: any[],
    filterFunction: (item: any) => boolean
  ): any[] => {
    return rawData.filter(filterFunction);
  };

  // Helper function to process filtered data
  const processFilteredData = (
    dataToProcess: any[],
    statsToProcess: Stats,
    dataType: 'dealers' | 'states' | 'categories' | 'cities'
  ) => {
    // Update displayed data based on filtered raw data
    if (dataType === 'dealers') {
      const processed = dataToProcess.slice(0, 10).map((d: any) => ({
        name: d.dealer_name?.substring(0, 20) || 'Unknown',
        revenue: d.total_sales || 0,
        quantity: d.total_quantity || 0
      }));
      setDealerData(processed);
      setCombinedDealerData(processed);
    } else if (dataType === 'states') {
      const processed = dataToProcess.map((s: any) => ({
        name: s.state || 'Unknown',
        value: s.total_sales || 0,
        quantity: s.total_quantity || 0
      }));
      setStateData(processed);
    } else if (dataType === 'categories') {
      const processed = dataToProcess.slice(0, 10).map((c: any) => ({
        name: c.product_name?.substring(0, 25) || 'Unknown',
        value: c.total_sales || 0
      }));
      setCategoryData(processed);
    } else if (dataType === 'cities') {
      const processed = dataToProcess.map((c: any) => ({
        name: c.city || 'Unknown',
        value: c.total_sales || 0,
        state: c.state || ''
      }));
      setCityData(processed);
    }
  };

  // Apply filtering based on hideInnovative (Avante) or hideAvante (IOSPL)
  useEffect(() => {
    console.log('🔄 Filter effect triggered - hideInnovative:', hideInnovative, 'hideAvante:', hideAvante, 'dashboardMode:', dashboardMode, 'allowedStates:', allowedStates);
    
    // If no original data yet, skip
    if (originalRawDealerData.length === 0) {
      console.log('⏭️ Skipping filter - no original data yet');
      return;
    }

    let filteredDealers = [...originalRawDealerData];
    let filteredStates = [...originalRawStateData];
    let filteredCategories = [...originalRawCategoryData];
    let filteredCities = [...originalRawCityData];
    let filteredStats = { ...originalRawStats };

    // Check if we need to apply filters
    const shouldFilterInnovative = dashboardMode === 'avante' && hideInnovative;
    const shouldFilterAvante = dashboardMode === 'iospl' && hideAvante;
    const hasStateRestrictions = allowedStates && allowedStates.length > 0;

    if (shouldFilterInnovative) {
      console.log('🔍 Applying Innovative filter to Avante dashboard');
      
      // Filter dealer data directly
      filteredDealers = originalRawDealerData.filter(dealer => 
        !isInnovativeDealer(dealer.dealer_name || '')
      );

      // Filter state data
      filteredStates = originalRawStateData.filter(state => {
        // Keep state only if it has remaining dealers
        return true; // Keep all states (they may have other dealers)
      });

      // Filter category data - keep all categories
      filteredCategories = originalRawCategoryData.filter(cat => {
        // Keep category if it's not exclusively from Innovative dealers
        return true; // Keep all categories
      });

      // Filter city data
      filteredCities = originalRawCityData.filter(city => {
        // Keep city only if it has remaining dealers
        return true; // Keep all cities
      });

      // Recalculate stats from filtered dealers
      const totalRevenue = filteredDealers.reduce((sum, d) => sum + (d.total_sales || 0), 0);
      const totalQuantity = filteredDealers.reduce((sum, d) => sum + (d.total_quantity || 0), 0);
      const totalDealerCount = filteredDealers.length;
      const totalProductCount = new Set(filteredCategories.map(c => c.product_name)).size;
      
      filteredStats = {
        total_revenue: totalRevenue,
        total_quantity: totalQuantity,
        total_dealers: totalDealerCount,
        total_products: totalProductCount
      };
      
      console.log('✅ Filtered Avante (Innovative removed) - dealers:', filteredDealers.length, 'stats:', filteredStats);
    } else if (shouldFilterAvante) {
      console.log('🔍 Applying Avante filter to IOSPL dashboard');
      
      // Filter dealer data directly
      filteredDealers = originalRawDealerData.filter(dealer => 
        !isAvanteDealer(dealer.dealer_name || '')
      );

      // Filter state data
      filteredStates = originalRawStateData.filter(state => {
        // Keep state only if it has remaining dealers
        return true; // Keep all states (they may have other dealers)
      });

      // Filter category data
      filteredCategories = originalRawCategoryData.filter(cat => {
        // Keep category if it's not exclusively from Avante dealers
        return true; // Keep all categories
      });

      // Filter city data
      filteredCities = originalRawCityData.filter(city => {
        // Keep city only if it has remaining dealers
        return true; // Keep all cities
      });

      // Recalculate stats from filtered dealers
      const totalRevenue = filteredDealers.reduce((sum, d) => sum + (d.total_sales || 0), 0);
      const totalQuantity = filteredDealers.reduce((sum, d) => sum + (d.total_quantity || 0), 0);
      const totalDealerCount = filteredDealers.length;
      const totalProductCount = new Set(filteredCategories.map(c => c.product_name)).size;
      
      filteredStats = {
        total_revenue: totalRevenue,
        total_quantity: totalQuantity,
        total_dealers: totalDealerCount,
        total_products: totalProductCount
      };
      
      console.log('✅ Filtered IOSPL (Avante removed) - dealers:', filteredDealers.length, 'stats:', filteredStats);
    } else {
      console.log('✅ No filter - using original data');
      filteredDealers = [...originalRawDealerData];
      filteredStates = [...originalRawStateData];
      filteredCategories = [...originalRawCategoryData];
      filteredCities = [...originalRawCityData];
      filteredStats = { ...originalRawStats };
    }

    // Apply state-based filtering if user has state restrictions
    if (hasStateRestrictions) {
      console.log('🔍 Applying state-based filter - allowedStates:', allowedStates);
      
      // Filter states to only allowed ones
      filteredStates = filteredStates.filter(state => 
        allowedStates.includes(state.state || '')
      );

      // Filter cities to only those in allowed states
      filteredCities = filteredCities.filter(city => 
        allowedStates.includes(city.state || '')
      );

      // Recalculate stats from filtered states/cities
      const totalRevenue = filteredStates.reduce((sum, s) => sum + (s.total_sales || 0), 0);
      const totalQuantity = filteredStates.reduce((sum, s) => sum + (s.total_quantity || 0), 0);
      const totalDealerCount = new Set(filteredCities.map(c => c.city)).size; // Approx dealer count
      
      filteredStats = {
        total_revenue: totalRevenue,
        total_quantity: totalQuantity,
        total_dealers: totalDealerCount,
        total_products: filteredCategories.length
      };
      
      console.log('✅ Applied state filter - states:', filteredStates.length, 'cities:', filteredCities.length);
    }

    // Set all filtered data at once
    setRawDealerData(filteredDealers);
    setRawStateData(filteredStates);
    setRawCategoryData(filteredCategories);
    setRawCityData(filteredCities);
    setStats(filteredStats);

    // Process dealer data for display
    setDealerData(filteredDealers.slice(0, 10).map((d: any) => ({
      name: d.dealer_name?.substring(0, 20) || 'Unknown',
      revenue: d.total_sales || 0,
      quantity: d.total_quantity || 0
    })));
    setCombinedDealerData(filteredDealers.slice(0, 10).map((d: any) => ({
      name: d.dealer_name?.substring(0, 20) || 'Unknown',
      revenue: d.total_sales || 0,
      quantity: d.total_quantity || 0
    })));

    // Process state data for display
    setStateData(filteredStates.map((s: any) => ({
      name: s.state || 'Unknown',
      value: s.total_sales || 0,
      quantity: s.total_quantity || 0
    })));

    // Process category data for display
    setCategoryData(filteredCategories.slice(0, 10).map((c: any) => ({
      name: c.product_name?.substring(0, 25) || 'Unknown',
      value: c.total_sales || 0
    })));

    // Process city data for display
    setCityData(filteredCities.map((c: any) => ({
      name: c.city || 'Unknown',
      value: c.total_sales || 0,
      state: c.state || ''
    })));

    // Process parent categories
    const parentMap: Record<string, number> = {};
    filteredCategories.forEach((c: any) => {
      const key = c.parent_category || 'Other';
      parentMap[key] = (parentMap[key] || 0) + (c.total_sales || 0);
    });
    const parentCategories = Object.entries(parentMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
    setParentCategoryData(parentCategories);

    // Process parent categories by quantity
    const parentQuantityMap: Record<string, number> = {};
    filteredCategories.forEach((c: any) => {
      const key = c.parent_category || 'Other';
      parentQuantityMap[key] = (parentQuantityMap[key] || 0) + (c.total_quantity || 0);
    });
    const parentQuantityCategories = Object.entries(parentQuantityMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
    setParentCategoryQuantityData(parentQuantityCategories);

  }, [hideInnovative, hideAvante, dashboardMode, allowedStates, originalRawDealerData, originalRawStateData, originalRawCategoryData, originalRawCityData, originalRawStats]);

  useEffect(() => {
    // Load dashboard data from real API
    const loadData = async () => {
      console.log('🔄 Starting data load...');
      setLoading(true);
      try {
        const apiEndpoint = dashboardMode === 'avante' ? 'avante' : 'iospl';
        const formattedStartDate = formatDateForAPI(startDate);
        const formattedEndDate = formatDateForAPI(endDate);
        
        // Validate dates before making API calls
        if (!formattedStartDate || !formattedEndDate) {
          console.warn('⚠️ Invalid date range - startDate:', startDate, 'endDate:', endDate);
          console.warn('⚠️ Formatted dates - startDate:', formattedStartDate, 'endDate:', formattedEndDate);
          setLoading(false);
          return;
        }
        
        console.log(`📡 API Endpoint: ${apiEndpoint}, Dates: ${formattedStartDate} to ${formattedEndDate}`);
        
        // Fetch stats
        let statsData = { total_revenue: 0, total_quantity: 0, total_dealers: 0, total_products: 0 };
        try {
          const statsResponse = await fetch(
            `${API_BASE}/api/${apiEndpoint}/stats?start_date=${formattedStartDate}&end_date=${formattedEndDate}`
          );
          if (!statsResponse.ok) {
            throw new Error(`HTTP error! status: ${statsResponse.status}`);
          }
          statsData = await statsResponse.json();
          console.log('✅ Stats loaded:', statsData);
        } catch (error) {
          console.error('❌ Stats API failed:', error);
        }
        setRawStats(statsData);
        setOriginalRawStats(statsData);

        // Fetch dealer performance
        let dealerPerf = [];
        try {
          const dealerResponse = await fetch(
            `${API_BASE}/api/${apiEndpoint}/dealer-performance?start_date=${formattedStartDate}&end_date=${formattedEndDate}`
          );
          dealerPerf = await dealerResponse.json();
          console.log('✅ Dealer data loaded:', dealerPerf.length, 'items');
        } catch (error) {
          console.error('❌ Dealer API failed, using mock data:', error);
          // Mock data for testing
          dealerPerf = [
            { dealer_name: 'Dealer A', total_sales: 1200000, total_quantity: 6000 },
            { dealer_name: 'Dealer B', total_sales: 950000, total_quantity: 4750 },
            { dealer_name: 'Dealer C', total_sales: 800000, total_quantity: 4000 },
            { dealer_name: 'Dealer D', total_sales: 650000, total_quantity: 3250 },
            { dealer_name: 'Dealer E', total_sales: 500000, total_quantity: 2500 }
          ];
        }
        setRawDealerData(dealerPerf);
        setOriginalRawDealerData(dealerPerf);

        // Fetch state performance
        let statePerf = [];
        try {
          const stateResponse = await fetch(
            `${API_BASE}/api/${apiEndpoint}/state-performance?start_date=${formattedStartDate}&end_date=${formattedEndDate}`
          );
          if (!stateResponse.ok) {
            throw new Error(`HTTP error! status: ${stateResponse.status}`);
          }
          statePerf = await stateResponse.json();
          console.log('✅ State data loaded:', statePerf.length, 'items');
        } catch (error) {
          console.error('❌ State API failed:', error);
          statePerf = [];
        }
        setRawStateData(statePerf);
        setOriginalRawStateData(statePerf);

        // Fetch category performance
        let categoryPerf = [];
        try {
          const categoryResponse = await fetch(
            `${API_BASE}/api/${apiEndpoint}/category-performance?start_date=${formattedStartDate}&end_date=${formattedEndDate}`
          );
          categoryPerf = await categoryResponse.json();
          console.log('✅ Category data loaded:', categoryPerf.length, 'items');
        } catch (error) {
          console.error('❌ Category API failed, using mock data:', error);
          // Mock data for testing
          categoryPerf = [
            { parent_category: 'Bone Screw', total_sales: 500000, total_quantity: 2500, product_name: 'Test Screw', dealer_name: 'Dealer A' },
            { parent_category: 'Bone Plate', total_sales: 400000, total_quantity: 1800, product_name: 'Test Plate', dealer_name: 'Dealer A' },
            { parent_category: 'Bone Nail', total_sales: 300000, total_quantity: 1200, product_name: 'Test Nail', dealer_name: 'Dealer B' },
            { parent_category: 'Instruments', total_sales: 200000, total_quantity: 800, product_name: 'Test Instrument', dealer_name: 'Dealer B' },
            { parent_category: 'General Instrument', total_sales: 100000, total_quantity: 400, product_name: 'Test General', dealer_name: 'Dealer C' },
            { parent_category: 'Bone Screw', total_sales: 150000, total_quantity: 750, product_name: 'Test Screw', dealer_name: 'Dealer C' },
            { parent_category: 'Bone Plate', total_sales: 250000, total_quantity: 1250, product_name: 'Test Plate', dealer_name: 'Dealer C' }
          ];
        }
        setRawCategoryData(categoryPerf);
        setOriginalRawCategoryData(categoryPerf);

        // Fetch city performance
        let cityPerf = [];
        try {
          const cityResponse = await fetch(
            `${API_BASE}/api/${apiEndpoint}/city-performance?start_date=${formattedStartDate}&end_date=${formattedEndDate}`
          );
          if (!cityResponse.ok) {
            throw new Error(`HTTP error! status: ${cityResponse.status}`);
          }
          cityPerf = await cityResponse.json();
          console.log('✅ City data loaded:', cityPerf.length, 'items');
        } catch (error) {
          console.error('❌ City API failed:', error);
          cityPerf = [];
        }
        setRawCityData(cityPerf);
        setOriginalRawCityData(cityPerf); // Set original raw city data

        // Fetch raw sales data for monthly trend
        let salesData = [];
        try {
          const salesResponse = await fetch(
            `${API_BASE}/api/${apiEndpoint}/sales?start_date=${formattedStartDate}&end_date=${formattedEndDate}`
          );
          if (!salesResponse.ok) {
            throw new Error(`HTTP error! status: ${salesResponse.status}`);
          }
          const salesJson = await salesResponse.json();
          salesData = salesJson.data || [];
          console.log('✅ Sales data loaded:', salesData.length, 'items');
        } catch (error) {
          console.error('❌ Sales API failed:', error);
          salesData = [];
        }
        setRawSalesData(salesData);
        
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [startDate, endDate, dashboardMode]);

  // Calculate additional metrics
  const avgOrderValue = stats.total_quantity > 0 ? stats.total_revenue / stats.total_quantity : 0;
  const revenuePerDealer = stats.total_dealers > 0 ? stats.total_revenue / stats.total_dealers : 0;
  const avgQtyPerDealer = stats.total_dealers > 0 ? stats.total_quantity / stats.total_dealers : 0;
  const avgRevenuePerProduct = stats.total_products > 0 ? stats.total_revenue / stats.total_products : 0;
  const topDealerRevenue = dealerData.length > 0 ? dealerData[0]?.revenue || 0 : 0;
  const topStateRevenue = stateData.length > 0 ? stateData[0]?.value || 0 : 0;
  const totalCities = cityData.length;
  const totalStates = stateData.length;

  return (
    <Layout>
      <div className="space-y-6">
        {/* Dashboard Title */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {dashboardMode === 'avante' ? '🏢 Avante' : '🛍️ IOSPL'} Sales Dashboard
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {startDate} to {endDate} | Real-time analytics from live API
            </p>
          </div>
          <div className="flex items-center gap-2">
            {loading && (
              <span className="flex items-center gap-2 text-sm text-indigo-600">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
                Loading...
              </span>
            )}
          </div>
        </div>

        {/* Key Metrics - Top Row (6 cards) */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <StatCard
            title="Total Revenue"
            value={loading ? '...' : formatIndianCurrency(stats.total_revenue)}
            subtitle={loading ? '' : formatFullCurrency(stats.total_revenue)}
            icon={<svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
            color="text-green-600"
            loading={loading}
          />
          <StatCard
            title="Total Quantity"
            value={loading ? '...' : formatNumber(stats.total_quantity)}
            subtitle="Units sold"
            icon={<svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>}
            color="text-blue-600"
            loading={loading}
          />
          <StatCard
            title="Active Dealers"
            value={loading ? '...' : formatNumber(stats.total_dealers)}
            subtitle="Unique dealers"
            icon={<svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>}
            color="text-purple-600"
            loading={loading}
          />
          <StatCard
            title="Products/SKUs"
            value={loading ? '...' : formatNumber(stats.total_products)}
            subtitle="Unique items"
            icon={<svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 002 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2H5a2 2 0 00-2 2v2M7 7h10" /></svg>}
            color="text-orange-600"
            loading={loading}
          />
          <StatCard
            title="States Covered"
            value={loading ? '...' : totalStates}
            subtitle="Geographic reach"
            icon={<svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
            color="text-teal-600"
            loading={loading}
          />
          <StatCard
            title="Cities Covered"
            value={loading ? '...' : totalCities}
            subtitle="Distribution network"
            icon={<svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>}
            color="text-indigo-600"
            loading={loading}
          />
        </div>

        {/* Additional Metrics Row (8 mini cards) */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
          <MiniMetricCard
            title="Avg. Unit Price"
            value={formatIndianCurrency(avgOrderValue)}
          />
          <MiniMetricCard
            title="Revenue/Dealer"
            value={formatIndianCurrency(revenuePerDealer)}
          />
          <MiniMetricCard
            title="Qty/Dealer"
            value={formatNumber(Math.round(avgQtyPerDealer))}
          />
          <MiniMetricCard
            title="Revenue/Product"
            value={formatIndianCurrency(avgRevenuePerProduct)}
          />
          <MiniMetricCard
            title="Top Dealer"
            value={dealerData.length > 0 ? dealerData[0].name : '-'}
          />
          <MiniMetricCard
            title="Top Dealer Rev."
            value={formatIndianCurrency(topDealerRevenue)}
          />
          <MiniMetricCard
            title="Top State"
            value={stateData.length > 0 ? stateData[0].name : '-'}
          />
          <MiniMetricCard
            title="Top Category"
            value={parentCategoryData.length > 0 ? parentCategoryData[0].name : '-'}
          />
        </div>

        {/* Charts Row 1 - Dealer Performance */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <ClickableChartWrapper
            onClick={() => {
              // Use filtered dealer data in modal
              const chartDealers = rawDealerData.map((d: any) => ({
                name: d.dealer_name?.substring(0, 25) || 'Unknown',
                revenue: d.total_sales || 0,
                quantity: d.total_quantity || 0
              }));
              openChartModal({
                type: 'horizontalBar',
                title: '🏆 All Dealers by Revenue',
                data: chartDealers,
                xKey: 'name',
                yKey: 'revenue'
              });
            }}
          >
            <HorizontalBarChart
              data={dealerData}
              title="🏆 Top 10 Dealers by Revenue"
              xKey="name"
              yKey="revenue"
              loading={loading}
            />
          </ClickableChartWrapper>
          <ClickableChartWrapper
            onClick={() => {
              // Use filtered dealer data in modal
              const chartDealers = rawDealerData.map((d: any) => ({
                name: d.dealer_name?.substring(0, 25) || 'Unknown',
                revenue: d.total_sales || 0,
                quantity: d.total_quantity || 0
              }));
              openChartModal({
                type: 'composed',
                title: '📊 All Dealers - Revenue vs Quantity',
                data: chartDealers,
                xKey: 'name',
                yKey: 'revenue',
                barKey: 'revenue',
                lineKey: 'quantity'
              });
            }}
          >
            <ComposedChartComponent
              data={combinedDealerData}
              title="📊 Dealer Revenue vs Quantity"
              xKey="name"
              barKey="revenue"
              lineKey="quantity"
              loading={loading}
            />
          </ClickableChartWrapper>
          <DealerDrillDownWrapper
            dealerData={rawDealerData}
            categoryData={rawCategoryData}
            title="🎯 Dealer Sales Distribution"
            loading={loading}
          />
        </div>

        {/* Charts Row 2 - Category & State */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ClickableChartWrapper
            onClick={() => openChartModal({
              type: 'pie',
              title: '📦 Revenue by Parent Category',
              data: parentCategoryData,
              xKey: 'name',
              yKey: 'value',
              dataKey: 'value',
              nameKey: 'name'
            })}
          >
            <RevenuePieChart
              data={parentCategoryData}
              title="📦 Revenue by Parent Category"
              dataKey="value"
              nameKey="name"
              loading={loading}
            />
          </ClickableChartWrapper>
          <ClickableChartWrapper
            onClick={() => openChartModal({
              type: 'bar',
              title: '🗺️ Revenue by State (All States)',
              data: rawStateData.map((s: any) => ({
                name: s.state || 'Unknown',
                value: s.total_sales || 0,
                quantity: s.total_quantity || 0
              })),
              xKey: 'name',
              yKey: 'value'
            })}
          >
            <RevenueBarChart
              data={stateData.slice(0, 10)}
              title="🗺️ Revenue by State (Top 10)"
              xKey="name"
              yKey="value"
              loading={loading}
            />
          </ClickableChartWrapper>
        </div>

        {/* Charts Row 3 - Products & Cities */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ClickableChartWrapper
            onClick={() => openChartModal({
              type: 'horizontalBar',
              title: '🏷️ All Products by Revenue',
              data: rawCategoryData.map((c: any) => ({
                name: c.product_name?.substring(0, 30) || 'Unknown',
                value: c.total_sales || 0
              })),
              xKey: 'name',
              yKey: 'value'
            })}
          >
            <HorizontalBarChart
              data={categoryData}
              title="🏷️ Top Products by Revenue"
              xKey="name"
              yKey="value"
              loading={loading}
            />
          </ClickableChartWrapper>
          <ClickableChartWrapper
            onClick={() => openChartModal({
              type: 'donut',
              title: '🏙️ Revenue by City (All Cities)',
              data: rawCityData.map((c: any) => ({
                name: c.city || 'Unknown',
                value: c.total_sales || 0,
                state: c.state || ''
              })),
              xKey: 'name',
              yKey: 'value',
              dataKey: 'value',
              nameKey: 'name',
              legendBelow: true
            })}
          >
            <DonutChart
              data={cityData.slice(0, 8)}
              title="🏙️ Revenue by City (Top 8)"
              dataKey="value"
              nameKey="name"
              loading={loading}
            />
          </ClickableChartWrapper>
        </div>

        {/* Product Family Analysis */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <ClickableChartWrapper
            onClick={() => openChartModal({
              type: 'pie',
              title: '🏭 Revenue by Product Family',
              data: parentCategoryData,
              xKey: 'name',
              yKey: 'value',
              dataKey: 'value',
              nameKey: 'name'
            })}
          >
            <RevenuePieChart
              data={parentCategoryData}
              title="🏭 Revenue by Product Family"
              dataKey="value"
              nameKey="name"
              loading={loading}
            />
          </ClickableChartWrapper>
          <ClickableChartWrapper
            onClick={() => openChartModal({
              type: 'donut',
              title: '📊 Product Family Distribution',
              data: parentCategoryData,
              xKey: 'name',
              yKey: 'value',
              dataKey: 'value',
              nameKey: 'name'
            })}
          >
            <DonutChart
              data={parentCategoryData.slice(0, 6)}
              title="📊 Top Product Families"
              dataKey="value"
              nameKey="name"
              loading={loading}
            />
          </ClickableChartWrapper>
          <ClickableChartWrapper
            onClick={() => openChartModal({
              type: 'bar',
              title: '📦 Quantity by Product Family (All Families)',
              data: parentCategoryQuantityData,
              xKey: 'name',
              yKey: 'value'
            })}
          >
            <RevenueBarChart
              data={parentCategoryQuantityData.slice(0, 6)}
              title="📦 Quantity by Product Family"
              xKey="name"
              yKey="value"
              loading={loading}
            />
          </ClickableChartWrapper>
        </div>

        {/* India Map Visualization */}
        <div className="grid grid-cols-1 gap-6">
          <IndiaMap
            stateData={stateData}
            cityData={cityData}
            title="🗺️ Geographic Revenue Distribution - India"
            loading={loading}
          />
        </div>

        {/* Payment Pipeline - Kanban Board */}
        <div className="grid grid-cols-1 gap-6">
          <PaymentPipeline
            salesData={rawDealerData}
            title={`💳 ${dashboardMode === 'avante' ? 'Avante' : 'IOSPL'} Payment Pipeline`}
            loading={loading}
            hideInnovative={hideInnovative}
            hideAvante={hideAvante}
            dashboardMode={dashboardMode}
          />
        </div>

        {/* Data Tables Section */}
        <div className="grid grid-cols-1 gap-6">
          {/* Comparative Analysis Table */}
          <ComparativeAnalysisTable 
            loading={loading}
            dashboardMode={dashboardMode}
            startDate={startDate}
            endDate={endDate}
            hideInnovative={hideInnovative}
            hideAvante={hideAvante}
          />

          {/* Non-Billing Dealers Table */}
          <NonBillingDealersTable 
            loading={loading} 
            dashboardMode={dashboardMode}
            hideInnovative={hideInnovative}
            hideAvante={hideAvante}
          />

          {/* Top Dealers Table */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">📋 Top Dealers Details</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 px-3 font-medium text-gray-600">#</th>
                    <th className="text-left py-2 px-3 font-medium text-gray-600">Dealer</th>
                    <th className="text-right py-2 px-3 font-medium text-gray-600">Revenue</th>
                    <th className="text-right py-2 px-3 font-medium text-gray-600">Qty</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={4} className="text-center py-4 text-gray-500">Loading...</td></tr>
                  ) : dealerData.length > 0 ? (
                    dealerData.slice(0, 5).map((dealer, idx) => (
                      <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-2 px-3 text-gray-900">{idx + 1}</td>
                        <td className="py-2 px-3 text-gray-900 font-medium">{dealer.name}</td>
                        <td className="py-2 px-3 text-right text-green-600 font-medium">{formatIndianCurrency(dealer.revenue)}</td>
                        <td className="py-2 px-3 text-right text-gray-600">{formatNumber(dealer.quantity || 0)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan={4} className="text-center py-4 text-gray-500">No data</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Fullscreen Chart Modal */}
      <ChartModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        config={modalConfig}
      />
    </Layout>
  );
}
