'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { ChevronDown, ChevronUp, ArrowUpDown, Calendar, Filter, X, Check, Users } from 'lucide-react';
import { useDashboardStore } from '@/lib/store';

const formatIndianCurrency = (num: number): string => {
  if (num >= 10000000) return `₹${(num / 10000000).toFixed(2)} Cr`;
  if (num >= 100000) return `₹${(num / 100000).toFixed(2)} L`;
  if (num >= 1000) return `₹${(num / 1000).toFixed(2)} K`;
  return `₹${num.toFixed(2)}`;
};

const formatNumber = (num: number): string => {
  return num.toLocaleString('en-IN');
};

interface ComparativeDataRow {
  dealer_name: string;
  city: string;
  state: string;
  category: string;
  sub_category: string;
  product_code: string;
  year_data: {
    [year: string]: {
      quantity: number;
      value: number;
    };
  };
}

interface ComparativeAnalysisTableProps {
  loading?: boolean;
  dashboardMode?: 'avante' | 'iospl';
  startDate?: string;
  endDate?: string;
  hideInnovative?: boolean;
  hideAvante?: boolean;
}

type SortDirection = 'asc' | 'desc' | null;

// API base URL
const API_BASE = typeof window !== 'undefined' && window.location.hostname === 'localhost'
  ? 'http://localhost:5000'
  : '';

// Helper function to format dates for API (DD-MM-YYYY)
const formatDateForAPI = (dateStr: string): string => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
};

export const ComparativeAnalysisTable: React.FC<ComparativeAnalysisTableProps> = ({
  loading: parentLoading = false,
  dashboardMode = 'iospl',
  startDate = '',
  endDate = '',
  hideInnovative = false,
  hideAvante = false
}) => {
  const [data, setData] = useState<ComparativeDataRow[]>([]);
  const [filteredData, setFilteredData] = useState<ComparativeDataRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [selectedYears, setSelectedYears] = useState<string[]>([]);
  const [availableYears, setAvailableYears] = useState<string[]>([]);
  const [isYearDropdownOpen, setIsYearDropdownOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  // Dealer multiselect
  const [selectedDealers, setSelectedDealers] = useState<string[]>([]);
  const [isDealerDropdownOpen, setIsDealerDropdownOpen] = useState(false);
  const [dealerSearchQuery, setDealerSearchQuery] = useState('');
  const dealerDropdownRef = useRef<HTMLDivElement>(null);
  const dealerSearchRef = useRef<HTMLInputElement>(null);

  // Filter states
  const [filterState, setFilterState] = useState('');
  const [filterCity, setFilterCity] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Local date range state
  const [localStartDate, setLocalStartDate] = useState(startDate);
  const [localEndDate, setLocalEndDate] = useState(endDate);

  // Helper functions for dealer filtering
  const isInnovativeDealer = (dealerName: string): boolean => {
    return dealerName?.toLowerCase().includes('innovative');
  };

  const isAvanteDealer = (dealerName: string): boolean => {
    return dealerName?.toLowerCase().includes('avante');
  };

  // Get unique values for filters
  const uniqueStates = useMemo(() =>
    Array.from(new Set(data.map(row => row.state))).sort(),
    [data]
  );

  const uniqueCities = useMemo(() =>
    Array.from(new Set(data.map(row => row.city))).sort(),
    [data]
  );

  const uniqueCategories = useMemo(() =>
    Array.from(new Set(data.map(row => row.category))).sort(),
    [data]
  );

  const uniqueDealers = useMemo(() =>
    Array.from(new Set(data.map(row => row.dealer_name))).sort(),
    [data]
  );

  const filteredDealerOptions = useMemo(() =>
    uniqueDealers.filter(d => d.toLowerCase().includes(dealerSearchQuery.toLowerCase())),
    [uniqueDealers, dealerSearchQuery]
  );

  // Totals across all filteredData rows for each selected year
  const yearTotals = useMemo(() => {
    const totals: Record<string, { quantity: number; value: number }> = {};
    selectedYears.forEach(year => {
      totals[year] = { quantity: 0, value: 0 };
      filteredData.forEach(row => {
        totals[year].quantity += row.year_data[year]?.quantity || 0;
        totals[year].value += row.year_data[year]?.value || 0;
      });
    });
    return totals;
  }, [filteredData, selectedYears]);

  // Sync local dates with props
  useEffect(() => {
    setLocalStartDate(startDate);
    setLocalEndDate(endDate);
  }, [startDate, endDate]);

  // Close dealer dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dealerDropdownRef.current && !dealerDropdownRef.current.contains(e.target as Node)) {
        setIsDealerDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus dealer search input when dropdown opens
  useEffect(() => {
    if (isDealerDropdownOpen && dealerSearchRef.current) {
      setTimeout(() => dealerSearchRef.current?.focus(), 50);
    } else {
      setDealerSearchQuery('');
    }
  }, [isDealerDropdownOpen]);

  // Load data from API
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const apiEndpoint = dashboardMode === 'avante' ? 'avante' : 'iospl';
        const formattedStartDate = formatDateForAPI(localStartDate);
        const formattedEndDate = formatDateForAPI(localEndDate);

        console.log(`📊 Fetching comparative analysis data for ${apiEndpoint}...`);

        // Fetch comparative analysis data from API
        const response = await fetch(
          `${API_BASE}/api/${apiEndpoint}/comparative-analysis?start_date=${formattedStartDate}&end_date=${formattedEndDate}`
        );

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }

        const apiResponse = await response.json();

        // Handle API response structure
        const apiData = apiResponse.report_data || apiResponse.data || [];
        console.log('✅ Comparative analysis data loaded:', apiData.length, 'records');

        // Group data by dealer and year for year-wise comparison
        const groupedByDealer: { [key: string]: ComparativeDataRow } = {};

        apiData.forEach((row: any) => {
          const dealerName = row.comp_nm || row.dealer_name || 'Unknown';
          const city = row.city || 'Unknown';
          const state = row.state || 'Unknown';
          const category = row.category_name || row.category || row.parent_category || 'Unknown';
          const subCategory = row.meta_keyword || row.product_name || row.sub_category || 'Unknown';
          const productCode = row.meta_keyword || row.item_code || row.product_code || 'N/A';

          // Create unique key for grouping
          const key = `${dealerName}|${city}|${state}|${category}|${subCategory}|${productCode}`;

          if (!groupedByDealer[key]) {
            groupedByDealer[key] = {
              dealer_name: dealerName,
              city,
              state,
              category,
              sub_category: subCategory,
              product_code: productCode,
              year_data: {}
            };
          }

          // Extract year from create_date (DD-MM-YYYY format) or fall back to current year
          const rawDate = (row.create_date || row.sale_date || '').toString().trim();
          let year = new Date().getFullYear().toString();
          if (rawDate) {
            const ddmmyyyy = rawDate.match(/^\d{2}-\d{2}-(\d{4})/);
            if (ddmmyyyy) {
              year = ddmmyyyy[1];
            } else {
              const yyyyMatch = rawDate.match(/^(\d{4})/);
              if (yyyyMatch) year = yyyyMatch[1];
            }
          }

          // Accumulate quantity and value
          const quantity = parseFloat(row.SQ || '0') || 0;
          const value = parseFloat(row.SV || '0') || 0;

          if (!groupedByDealer[key].year_data[year]) {
            groupedByDealer[key].year_data[year] = { quantity: 0, value: 0 };
          }

          groupedByDealer[key].year_data[year].quantity += quantity;
          groupedByDealer[key].year_data[year].value += value;
        });

        // Convert grouped data back to array
        let transformedData: ComparativeDataRow[] = Object.values(groupedByDealer);

        // Apply dealer filters
        if (dashboardMode === 'avante' && hideInnovative) {
          transformedData = transformedData.filter(row => !isInnovativeDealer(row.dealer_name));
        } else if (dashboardMode === 'iospl' && hideAvante) {
          transformedData = transformedData.filter(row => !isAvanteDealer(row.dealer_name));
        }

        // Derive available years from actual data so columns match reality
        const dataYearSet = new Set<string>();
        transformedData.forEach(row => Object.keys(row.year_data).forEach(y => dataYearSet.add(y)));
        const sortedDataYears = Array.from(dataYearSet).sort().reverse();
        if (sortedDataYears.length > 0) {
          setAvailableYears(sortedDataYears);
          setSelectedYears(sortedDataYears);
        }

        setData(transformedData);
        setFilteredData(transformedData);
        setSelectedDealers([]);

      } catch (error) {
        console.error('❌ Error loading comparative analysis data:', error);
        // Don't use mock data - only display error to user
        setData([]);
        setFilteredData([]);
      } finally {
        setLoading(false);
      }
    };

    // Only load if dates are provided
    if (localStartDate && localEndDate) {
      loadData();
    }
  }, [dashboardMode, localStartDate, localEndDate, hideInnovative, hideAvante]);

  // Apply filters and search
  useEffect(() => {
    let filtered = [...data];

    // Dealer multiselect filter
    if (selectedDealers.length > 0) {
      filtered = filtered.filter(row => selectedDealers.includes(row.dealer_name));
    }

    // State filter
    if (filterState) {
      filtered = filtered.filter(row => row.state === filterState);
    }

    // City filter
    if (filterCity) {
      filtered = filtered.filter(row => row.city === filterCity);
    }

    // Category filter
    if (filterCategory) {
      filtered = filtered.filter(row => row.category === filterCategory);
    }

    // Apply sorting
    if (sortColumn && sortDirection) {
      filtered.sort((a, b) => {
        let aVal: any;
        let bVal: any;

        if (sortColumn.startsWith('qty_') || sortColumn.startsWith('val_')) {
          const year = sortColumn.split('_')[1];
          const isQty = sortColumn.startsWith('qty_');
          aVal = a.year_data[year]?.[isQty ? 'quantity' : 'value'] || 0;
          bVal = b.year_data[year]?.[isQty ? 'quantity' : 'value'] || 0;
        } else {
          aVal = (a as any)[sortColumn];
          bVal = (b as any)[sortColumn];
        }

        if (typeof aVal === 'string') {
          return sortDirection === 'asc'
            ? aVal.localeCompare(bVal)
            : bVal.localeCompare(aVal);
        }

        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
      });
    }

    setFilteredData(filtered);
    setCurrentPage(1);
  }, [data, selectedDealers, filterState, filterCity, filterCategory, sortColumn, sortDirection]);

  // Pagination
  const totalPages = useMemo(() => Math.ceil(filteredData.length / itemsPerPage), [filteredData.length, itemsPerPage]);
  const startIndex = useMemo(() => (currentPage - 1) * itemsPerPage, [currentPage, itemsPerPage]);
  const endIndex = useMemo(() => startIndex + itemsPerPage, [startIndex, itemsPerPage]);
  const paginatedData = useMemo(() => filteredData.slice(startIndex, endIndex), [filteredData, startIndex, endIndex]);

  // Reset to page 1 when items per page changes
  useEffect(() => {
    setCurrentPage(1);
  }, [itemsPerPage]);

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(
        sortDirection === 'asc' ? 'desc' : sortDirection === 'desc' ? null : 'asc'
      );
      if (sortDirection === 'desc') {
        setSortColumn(null);
      }
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const toggleYear = (year: string) => {
    setSelectedYears(prev =>
      prev.includes(year)
        ? prev.filter(y => y !== year)
        : [...prev, year].sort().reverse()
    );
  };

  const toggleDealer = (dealer: string) => {
    setSelectedDealers(prev =>
      prev.includes(dealer)
        ? prev.filter(d => d !== dealer)
        : [...prev, dealer]
    );
  };

  const clearFilters = () => {
    setSelectedDealers([]);
    setFilterState('');
    setFilterCity('');
    setFilterCategory('');
    setSortColumn(null);
    setSortDirection(null);
  };

  const SortIcon: React.FC<{ column: string }> = ({ column }) => {
    if (sortColumn !== column) {
      return <ArrowUpDown className="w-4 h-4 text-gray-400" />;
    }
    if (sortDirection === 'asc') {
      return <ChevronUp className="w-4 h-4 text-indigo-600" />;
    }
    return <ChevronDown className="w-4 h-4 text-indigo-600" />;
  };

  const dealerButtonLabel = selectedDealers.length === 0
    ? `All Dealers (${uniqueDealers.length})`
    : selectedDealers.length === 1
    ? selectedDealers[0].length > 22 ? selectedDealers[0].substring(0, 22) + '…' : selectedDealers[0]
    : `${selectedDealers.length} Dealers Selected`;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              📊 Comparative Analysis
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Year-wise comparison of dealer performance across products
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Year Selection */}
            <div className="relative">
              <button
                onClick={() => setIsYearDropdownOpen(!isYearDropdownOpen)}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg text-sm font-medium text-gray-700"
              >
                <Calendar className="w-4 h-4" />
                <span>Years ({selectedYears.length})</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${isYearDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isYearDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 z-50 p-2">
                  {availableYears.map(year => (
                    <label
                      key={year}
                      className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 rounded cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedYears.includes(year)}
                        onChange={() => toggleYear(year)}
                        className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                      />
                      <span className="text-sm font-medium text-gray-700">{year}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Date Range Picker */}
            <div className="flex items-end gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <input
                  type="date"
                  value={localStartDate}
                  onChange={(e) => setLocalStartDate(e.target.value)}
                  className="px-3 py-2 border border-gray-300 hover:border-gray-400 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                <input
                  type="date"
                  value={localEndDate}
                  onChange={(e) => setLocalEndDate(e.target.value)}
                  className="px-3 py-2 border border-gray-300 hover:border-gray-400 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Filter Toggle */}
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={`flex items-center gap-2 px-4 py-2 border rounded-lg text-sm font-medium transition-colors ${
                filterState || filterCity || filterCategory
                  ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Filter className="w-4 h-4" />
              <span>Filters</span>
              {(filterState || filterCity || filterCategory) && (
                <span className="bg-indigo-600 text-white text-xs px-1.5 py-0.5 rounded-full">
                  {[filterState, filterCity, filterCategory].filter(Boolean).length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Filters Panel */}
        {isFilterOpen && (
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                <select
                  value={filterState}
                  onChange={(e) => setFilterState(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">All States</option>
                  {uniqueStates.map(state => (
                    <option key={state} value={state}>{state}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                <select
                  value={filterCity}
                  onChange={(e) => setFilterCity(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">All Cities</option>
                  {uniqueCities.map(city => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">All Categories</option>
                  {uniqueCategories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
            </div>
            {(filterState || filterCity || filterCategory) && (
              <button
                onClick={clearFilters}
                className="mt-3 flex items-center gap-2 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
                Clear all filters
              </button>
            )}
          </div>
        )}

        {/* Dealer Multiselect */}
        <div className="flex items-center gap-3">
          <div className="flex-1 relative" ref={dealerDropdownRef}>
            <button
              onClick={() => setIsDealerDropdownOpen(prev => !prev)}
              className={`w-full flex items-center gap-2 px-4 py-2.5 border rounded-lg text-sm font-medium transition-colors text-left ${
                selectedDealers.length > 0
                  ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Users className="w-4 h-4 flex-shrink-0 text-gray-400" />
              <span className="flex-1 truncate">{dealerButtonLabel}</span>
              {selectedDealers.length > 0 && (
                <span className="bg-indigo-600 text-white text-xs px-1.5 py-0.5 rounded-full flex-shrink-0">
                  {selectedDealers.length}
                </span>
              )}
              <ChevronDown className={`w-4 h-4 flex-shrink-0 transition-transform ${isDealerDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {isDealerDropdownOpen && (
              <div className="absolute left-0 top-full mt-1 w-full min-w-[320px] bg-white border border-gray-200 rounded-lg shadow-xl z-50 overflow-hidden">
                {/* Search inside dropdown */}
                <div className="p-2 border-b border-gray-100">
                  <input
                    ref={dealerSearchRef}
                    type="text"
                    value={dealerSearchQuery}
                    onChange={(e) => setDealerSearchQuery(e.target.value)}
                    placeholder="Search dealers..."
                    className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
                {/* Select All / Deselect All */}
                <div className="px-2 py-1.5 border-b border-gray-100 flex gap-2">
                  <button
                    onClick={() => setSelectedDealers(uniqueDealers)}
                    className="flex-1 px-2 py-1 text-xs font-medium text-indigo-600 hover:bg-indigo-50 rounded"
                  >
                    Select All
                  </button>
                  <button
                    onClick={() => setSelectedDealers([])}
                    className="flex-1 px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 rounded"
                  >
                    Deselect All
                  </button>
                </div>
                {/* Dealer list */}
                <div className="max-h-64 overflow-y-auto">
                  {filteredDealerOptions.length === 0 ? (
                    <div className="px-3 py-4 text-sm text-gray-400 text-center">No dealers found</div>
                  ) : (
                    filteredDealerOptions.map((dealer, index) => (
                      <div
                        key={index}
                        onClick={() => toggleDealer(dealer)}
                        className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 cursor-pointer"
                      >
                        <div className={`w-4 h-4 border rounded flex items-center justify-center flex-shrink-0 ${
                          selectedDealers.includes(dealer)
                            ? 'bg-indigo-600 border-indigo-600'
                            : 'border-gray-300'
                        }`}>
                          {selectedDealers.includes(dealer) && (
                            <Check className="w-3 h-3 text-white" />
                          )}
                        </div>
                        <span className="text-sm text-gray-700 truncate flex-1">{dealer}</span>
                      </div>
                    ))
                  )}
                </div>
                {/* Footer count */}
                <div className="px-3 py-2 border-t border-gray-100 text-xs text-gray-500 text-center">
                  {selectedDealers.length === 0 ? 'All dealers shown' : `${selectedDealers.length} of ${uniqueDealers.length} dealers selected`}
                </div>
              </div>
            )}
          </div>

          {selectedDealers.length > 0 && (
            <button
              onClick={() => setSelectedDealers([])}
              className="flex items-center gap-1 px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 border border-red-200 rounded-lg transition-colors flex-shrink-0"
            >
              <X className="w-4 h-4" />
              Clear
            </button>
          )}
        </div>

        {/* Results Info */}
        <div className="flex items-center justify-between mt-4 text-sm text-gray-600">
          <span>
            Showing {filteredData.length === 0 ? 0 : startIndex + 1}–{Math.min(endIndex, filteredData.length)} of {filteredData.length} records
          </span>
          <div className="flex items-center gap-2">
            <span>Rows per page:</span>
            <select
              value={itemsPerPage}
              onChange={(e) => setItemsPerPage(Number(e.target.value))}
              className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                onClick={() => handleSort('dealer_name')}
                className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              >
                <div className="flex items-center gap-2">
                  Dealer Name
                  <SortIcon column="dealer_name" />
                </div>
              </th>
              <th
                onClick={() => handleSort('city')}
                className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              >
                <div className="flex items-center gap-2">
                  City
                  <SortIcon column="city" />
                </div>
              </th>
              <th
                onClick={() => handleSort('state')}
                className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              >
                <div className="flex items-center gap-2">
                  State
                  <SortIcon column="state" />
                </div>
              </th>
              <th
                onClick={() => handleSort('category')}
                className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              >
                <div className="flex items-center gap-2">
                  Category
                  <SortIcon column="category" />
                </div>
              </th>
              <th
                onClick={() => handleSort('sub_category')}
                className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              >
                <div className="flex items-center gap-2">
                  Sub Category
                  <SortIcon column="sub_category" />
                </div>
              </th>
              <th
                onClick={() => handleSort('product_code')}
                className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              >
                <div className="flex items-center gap-2">
                  Product Code
                  <SortIcon column="product_code" />
                </div>
              </th>
              {selectedYears.map(year => (
                <React.Fragment key={year}>
                  <th
                    onClick={() => handleSort(`qty_${year}`)}
                    className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 bg-blue-50"
                  >
                    <div className="flex items-center justify-end gap-2">
                      Qty {year}
                      <SortIcon column={`qty_${year}`} />
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort(`val_${year}`)}
                    className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 bg-green-50"
                  >
                    <div className="flex items-center justify-end gap-2">
                      Value {year}
                      <SortIcon column={`val_${year}`} />
                    </div>
                  </th>
                </React.Fragment>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading || parentLoading ? (
              <tr>
                <td colSpan={6 + selectedYears.length * 2} className="px-4 py-8 text-center text-gray-500">
                  <div className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600"></div>
                    Loading data...
                  </div>
                </td>
              </tr>
            ) : paginatedData.length === 0 ? (
              <tr>
                <td colSpan={6 + selectedYears.length * 2} className="px-4 py-8 text-center text-gray-500">
                  No data found matching your criteria
                </td>
              </tr>
            ) : (
              paginatedData.map((row, idx) => (
                <tr key={idx} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{row.dealer_name}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{row.city}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{row.state}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{row.category}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{row.sub_category}</td>
                  <td className="px-4 py-3 text-sm font-mono text-gray-900">{row.product_code}</td>
                  {selectedYears.map(year => (
                    <React.Fragment key={year}>
                      <td className="px-4 py-3 text-sm text-right text-blue-600 font-medium bg-blue-50">
                        {formatNumber(row.year_data[year]?.quantity || 0)}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-green-600 font-medium bg-green-50">
                        {formatIndianCurrency(row.year_data[year]?.value || 0)}
                      </td>
                    </React.Fragment>
                  ))}
                </tr>
              ))
            )}
          </tbody>
          {/* Totals footer — only when data is available */}
          {!loading && !parentLoading && filteredData.length > 0 && (
            <tfoot>
              <tr className="bg-gray-100 border-t-2 border-gray-300">
                <td className="px-4 py-3 text-xs font-bold text-gray-800 uppercase tracking-wider" colSpan={6}>
                  Grand Total ({filteredData.length} records)
                </td>
                {selectedYears.map(year => (
                  <React.Fragment key={year}>
                    <td className="px-4 py-3 text-sm text-right font-bold text-blue-800 bg-blue-100">
                      {formatNumber(yearTotals[year]?.quantity || 0)}
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-bold text-green-800 bg-green-100">
                      {formatIndianCurrency(yearTotals[year]?.value || 0)}
                    </td>
                  </React.Fragment>
                ))}
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <div className="flex items-center gap-2">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }

              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`px-3 py-1 text-sm font-medium rounded-lg ${
                    currentPage === pageNum
                      ? 'bg-indigo-600 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>
          <button
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default ComparativeAnalysisTable;
