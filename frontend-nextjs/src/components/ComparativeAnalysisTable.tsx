'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Search, ChevronDown, ChevronUp, ArrowUpDown, Calendar, Filter, X } from 'lucide-react';
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
  const [searchQuery, setSearchQuery] = useState('');
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [selectedYears, setSelectedYears] = useState<string[]>([]);
  const [availableYears, setAvailableYears] = useState<string[]>([]);
  const [isYearDropdownOpen, setIsYearDropdownOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  
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

  // Sync local dates with props
  useEffect(() => {
    setLocalStartDate(startDate);
    setLocalEndDate(endDate);
  }, [startDate, endDate]);

  // Load data from API
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const apiEndpoint = dashboardMode === 'avante' ? 'avante' : 'iospl';
        const formattedStartDate = formatDateForAPI(localStartDate);
        const formattedEndDate = formatDateForAPI(localEndDate);
        
        // Determine available years based on date range
        const currentYear = new Date().getFullYear();
        const startYear = startDate ? new Date(startDate).getFullYear() : currentYear - 4;
        const endYearDate = endDate ? new Date(endDate).getFullYear() : currentYear;
        
        const years: string[] = [];
        for (let year = endYearDate; year >= Math.max(startYear, endYearDate - 4); year--) {
          years.push(year.toString());
        }
        
        setAvailableYears(years);
        setSelectedYears(years.slice(0, Math.min(2, years.length))); // Default to first 2 years
        
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
          
          // Extract year from current date or use current year
          const year = new Date().getFullYear().toString();
          
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
        
        setData(transformedData);
        setFilteredData(transformedData);
        
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
    
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(row => 
        row.dealer_name.toLowerCase().includes(query) ||
        row.city.toLowerCase().includes(query) ||
        row.state.toLowerCase().includes(query) ||
        row.category.toLowerCase().includes(query) ||
        row.sub_category.toLowerCase().includes(query) ||
        row.product_code.toLowerCase().includes(query)
      );
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
  }, [data, searchQuery, filterState, filterCity, filterCategory, sortColumn, sortDirection]);

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

  const clearFilters = () => {
    setSearchQuery('');
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

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by dealer, city, state, category, sub-category, or product code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Results Info */}
        <div className="flex items-center justify-between mt-4 text-sm text-gray-600">
          <span>
            Showing {startIndex + 1}-{Math.min(endIndex, filteredData.length)} of {filteredData.length} records
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
