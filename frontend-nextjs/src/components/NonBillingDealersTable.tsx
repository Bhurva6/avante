'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Search, Filter, Calendar, MapPin, TrendingDown } from 'lucide-react';

interface NonBillingDealer {
  dealer_name: string;
  city?: string;
  state?: string;
  last_billing_date?: string;
  previous_period_sales?: number;
  current_period_sales?: number;
  decline_percentage?: number;
  days_since_last_billing?: number;
}

interface NonBillingDealersTableProps {
  title?: string;
  loading?: boolean;
  dashboardMode?: 'avante' | 'iospl';
  hideInnovative?: boolean;
  hideAvante?: boolean;
}

type TimeFilter = 'week' | 'month' | 'quarter' | 'year';

// Helper functions for dealer filtering
const isInnovativeDealer = (dealerName: string): boolean => {
  return dealerName?.toLowerCase().includes('innovative');
};

const isAvanteDealer = (dealerName: string): boolean => {
  return dealerName?.toLowerCase().includes('avante');
};

const NonBillingDealersTable: React.FC<NonBillingDealersTableProps> = ({
  title = "🚫 Non-Billing Dealers",
  loading = false,
  dashboardMode = 'iospl',
  hideInnovative = false,
  hideAvante = false
}) => {
  const [dealers, setDealers] = useState<NonBillingDealer[]>([]);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('month');
  const [searchTerm, setSearchTerm] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [stateFilter, setStateFilter] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'decline' | 'days' | 'city'>('decline');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // Local date range state
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Mock data for demonstration - in real app, this would come from API
  useEffect(() => {
    if (loading) return;

    // TODO: Replace with API call when endpoint is available
    // For now, fetch from API or display empty state
    const loadData = async () => {
      try {
        // Format dates for API call if available
        const formattedStartDate = startDate || '';
        const formattedEndDate = endDate || '';
        
        // This would be the API call when available
        const API_BASE = typeof window !== 'undefined' && window.location.hostname === 'localhost' 
          ? 'http://localhost:5000' 
          : '';
        
        const apiEndpoint = dashboardMode === 'avante' ? 'avante' : 'iospl';
        
        if (formattedStartDate && formattedEndDate && API_BASE) {
          const response = await fetch(`${API_BASE}/api/${apiEndpoint}/non-billing-dealers?start_date=${formattedStartDate}&end_date=${formattedEndDate}&period=${timeFilter}`);
          if (response.ok) {
            const data = await response.json();
            setDealers(data || []);
          }
        } else {
          setDealers([]);
        }
      } catch (error) {
        console.error('Error loading non-billing dealers:', error);
        setDealers([]);
      }
    };

    loadData();
  }, [loading, timeFilter, dashboardMode, hideInnovative, hideAvante, startDate, endDate]);

  // Get unique cities and states for filter dropdowns
  const uniqueCities = useMemo(() => {
    const cities = dealers.map(d => d.city).filter(Boolean);
    return [...new Set(cities)].sort();
  }, [dealers]);

  const uniqueStates = useMemo(() => {
    const states = dealers.map(d => d.state).filter(Boolean);
    return [...new Set(states)].sort();
  }, [dealers]);

  // Filter and sort dealers
  const filteredAndSortedDealers = useMemo(() => {
    let filtered = dealers.filter(dealer => {
      const matchesSearch = dealer.dealer_name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCity = !cityFilter || dealer.city === cityFilter;
      const matchesState = !stateFilter || dealer.state === stateFilter;

      return matchesSearch && matchesCity && matchesState;
    });

    // Sort
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortBy) {
        case 'name':
          aValue = a.dealer_name.toLowerCase();
          bValue = b.dealer_name.toLowerCase();
          break;
        case 'decline':
          aValue = a.decline_percentage || 0;
          bValue = b.decline_percentage || 0;
          break;
        case 'days':
          aValue = a.days_since_last_billing || 0;
          bValue = b.days_since_last_billing || 0;
          break;
        case 'city':
          aValue = a.city || '';
          bValue = b.city || '';
          break;
        default:
          return 0;
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [dealers, searchTerm, cityFilter, stateFilter, sortBy, sortOrder]);

  const formatIndianCurrency = (num: number): string => {
    if (num >= 10000000) return `₹${(num / 10000000).toFixed(2)} Cr`;
    if (num >= 100000) return `₹${(num / 100000).toFixed(2)} L`;
    if (num >= 1000) return `₹${(num / 1000).toFixed(2)} K`;
    return `₹${num.toFixed(2)}`;
  };

  const getDeclineColor = (percentage: number): string => {
    if (percentage >= 90) return 'text-red-600 bg-red-50';
    if (percentage >= 75) return 'text-orange-600 bg-orange-50';
    if (percentage >= 50) return 'text-yellow-600 bg-yellow-50';
    return 'text-gray-600 bg-gray-50';
  };

  const getDaysColor = (days: number): string => {
    if (days >= 60) return 'text-red-600';
    if (days >= 30) return 'text-orange-600';
    if (days >= 14) return 'text-yellow-600';
    return 'text-gray-600';
  };

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-gray-200 rounded"></div>
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <p className="text-sm text-gray-600 mt-1">Dealers with no recent billing activity</p>
        </div>
        <div className="flex items-end gap-4">
          {/* Date Range Pickers */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 hover:border-gray-400 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 hover:border-gray-400 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          
          {/* Period Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Period</label>
            <select
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value as TimeFilter)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="week">Last Week</option>
              <option value="month">Last Month</option>
              <option value="quarter">Last Quarter</option>
              <option value="year">Last Year</option>
            </select>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search dealers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <select
            value={cityFilter}
            onChange={(e) => setCityFilter(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="">All Cities</option>
            {uniqueCities.map(city => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>
        </div>

        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <select
            value={stateFilter}
            onChange={(e) => setStateFilter(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="">All States</option>
            {uniqueStates.map(state => (
              <option key={state} value={state}>{state}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="decline">Decline %</option>
            <option value="days">Days Since Billing</option>
            <option value="name">Dealer Name</option>
            <option value="city">City</option>
          </select>
          <button
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            {sortOrder === 'asc' ? '↑' : '↓'}
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Dealer
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Location
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Last Billing
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Days Since
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Previous Sales
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Current Sales
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Decline %
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredAndSortedDealers.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                  No non-billing dealers found for the selected filters.
                </td>
              </tr>
            ) : (
              filteredAndSortedDealers.map((dealer, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {dealer.dealer_name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {dealer.city && dealer.state ? `${dealer.city}, ${dealer.state}` : 'Unknown'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {dealer.last_billing_date ? new Date(dealer.last_billing_date).toLocaleDateString() : 'Never'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`text-sm font-medium ${getDaysColor(dealer.days_since_last_billing || 0)}`}>
                      {dealer.days_since_last_billing || 0} days
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {formatIndianCurrency(dealer.previous_period_sales || 0)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {formatIndianCurrency(dealer.current_period_sales || 0)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getDeclineColor(dealer.decline_percentage || 0)}`}>
                      <TrendingDown className="w-3 h-3 mr-1" />
                      {dealer.decline_percentage?.toFixed(1) || 0}%
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Summary */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>
            Showing {filteredAndSortedDealers.length} of {dealers.length} non-billing dealers
          </span>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <div className="w-3 h-3 bg-red-100 border border-red-300 rounded"></div>
              Critical (90%+ decline)
            </span>
            <span className="flex items-center gap-1">
              <div className="w-3 h-3 bg-orange-100 border border-orange-300 rounded"></div>
              High (75-89% decline)
            </span>
            <span className="flex items-center gap-1">
              <div className="w-3 h-3 bg-yellow-100 border border-yellow-300 rounded"></div>
              Medium (50-74% decline)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NonBillingDealersTable;
