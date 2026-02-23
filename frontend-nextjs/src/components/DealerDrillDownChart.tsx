'use client';

import React, { useState, useEffect, useRef } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { ArrowLeft, X, Maximize2, ChevronDown, Search, Check } from 'lucide-react';

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316', '#eab308', '#84cc16', '#22c55e', '#14b8a6', '#06b6d4'];

const formatIndianCurrency = (num: number): string => {
  if (num >= 10000000) return `₹${(num / 10000000).toFixed(2)} Cr`;
  if (num >= 100000) return `₹${(num / 100000).toFixed(2)} L`;
  if (num >= 1000) return `₹${(num / 1000).toFixed(2)} K`;
  return `₹${num.toFixed(2)}`;
};

interface DealerDrillDownChartProps {
  dealerData: any[];
  categoryData: any[];
  title: string;
  loading?: boolean;
  isFullscreen?: boolean;
}

export const DealerDrillDownChart: React.FC<DealerDrillDownChartProps> = ({
  dealerData,
  categoryData,
  title,
  loading,
  isFullscreen = false
}) => {
  const [drillDownDealer, setDrillDownDealer] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Calculate total sales for percentage calculation
  const totalSales = dealerData.reduce((sum, dealer) => sum + (dealer.total_sales || 0), 0);

  // Prepare dealer distribution data
  const dealerDistributionData = dealerData.map(dealer => ({
    name: dealer.dealer_name?.substring(0, 20) || 'Unknown',
    value: dealer.total_sales || 0,
    percentage: totalSales > 0 ? ((dealer.total_sales || 0) / totalSales) * 100 : 0,
    dealerId: dealer.dealer_name
  }));

  // Get product distribution for selected dealer
  const getDealerProductData = (dealerName: string) => {
    const dealerProducts = categoryData.filter(cat =>
      cat.dealer_name === dealerName || cat.dealer_name?.toLowerCase() === dealerName?.toLowerCase()
    );

    const dealerTotalSales = dealerProducts.reduce((sum, product) => sum + (product.total_sales || 0), 0);

    return dealerProducts.map(product => ({
      name: product.product_name?.substring(0, 25) || 'Unknown',
      value: product.total_sales || 0,
      percentage: dealerTotalSales > 0 ? ((product.total_sales || 0) / dealerTotalSales) * 100 : 0
    })).sort((a, b) => b.value - a.value);
  };

  const currentData = drillDownDealer
    ? getDealerProductData(drillDownDealer)
    : dealerDistributionData;

  // Initialize selected items when data changes or drill-down state changes
  useEffect(() => {
    const allItemNames = currentData.map(item => item.name);
    setSelectedItems(allItemNames);
    setSearchQuery('');
  }, [drillDownDealer, dealerData.length, categoryData.length]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter current data based on selected items
  const filteredData = isFullscreen 
    ? currentData.filter(item => selectedItems.includes(item.name))
    : currentData;

  // Get available items for dropdown (with search filtering)
  const availableItems = currentData.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleToggleItem = (itemName: string) => {
    setSelectedItems(prev => {
      if (prev.includes(itemName)) {
        // Don't allow deselecting if it's the last item
        if (prev.length === 1) return prev;
        return prev.filter(name => name !== itemName);
      } else {
        return [...prev, itemName];
      }
    });
  };

  const handleSelectAll = () => {
    setSelectedItems(currentData.map(item => item.name));
  };

  const handleDeselectAll = () => {
    // Keep at least one item selected
    if (currentData.length > 0) {
      setSelectedItems([currentData[0].name]);
    }
  };

  const handlePieClick = (data: any) => {
    console.log('Pie clicked:', data);
    // Only allow drill-down in fullscreen mode
    if (isFullscreen && !drillDownDealer && data && data.dealerId) {
      console.log('Drilling down to dealer:', data.dealerId);
      // Drill down to dealer products
      setDrillDownDealer(data.dealerId);
    }
  };

  const handleBackClick = () => {
    setDrillDownDealer(null);
  };

  const formatTooltipValue = (value: number, name: string) => {
    return [formatIndianCurrency(value), name];
  };

  const renderCustomLabel = ({ name, percentage, cx, cy, midAngle, innerRadius, outerRadius }: any) => {
    // Only show label if percentage is significant enough (> 3%)
    if (percentage < 3) return null;
    
    const RADIAN = Math.PI / 180;
    const radius = outerRadius + 25;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    
    return (
      <text 
        x={x} 
        y={y} 
        fill="#374151" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        className="text-xs font-medium"
      >
        {`${percentage.toFixed(1)}%`}
      </text>
    );
  };

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
        <div className={`${isFullscreen ? 'h-[600px]' : 'h-80'} flex items-center justify-center`}>
          <div className="animate-pulse bg-gray-200 rounded-full h-40 w-40"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200" data-interactive={isFullscreen ? "true" : "false"}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">
          {drillDownDealer ? `${drillDownDealer} - Product Distribution` : title}
        </h3>
        <div className="flex items-center gap-3">
          {isFullscreen && (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg text-sm font-medium text-gray-700 transition-colors"
              >
                <span>Filter {drillDownDealer ? 'Products' : 'Dealers'} ({selectedItems.length}/{currentData.length})</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-96 overflow-hidden flex flex-col">
                  {/* Search Box */}
                  <div className="p-3 border-b border-gray-200">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder={`Search ${drillDownDealer ? 'products' : 'dealers'}...`}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  {/* Select/Deselect All */}
                  <div className="p-2 border-b border-gray-200 flex gap-2">
                    <button
                      onClick={handleSelectAll}
                      className="flex-1 px-3 py-1.5 text-xs font-medium text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                    >
                      Select All
                    </button>
                    <button
                      onClick={handleDeselectAll}
                      className="flex-1 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 rounded transition-colors"
                    >
                      Deselect All
                    </button>
                  </div>

                  {/* Items List */}
                  <div className="overflow-y-auto max-h-64">
                    {availableItems.length === 0 ? (
                      <div className="p-4 text-center text-sm text-gray-500">
                        No {drillDownDealer ? 'products' : 'dealers'} found
                      </div>
                    ) : (
                      availableItems.map((item, index) => (
                        <label
                          key={index}
                          className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 cursor-pointer transition-colors"
                        >
                          <div className="relative flex items-center">
                            <input
                              type="checkbox"
                              checked={selectedItems.includes(item.name)}
                              onChange={() => handleToggleItem(item.name)}
                              className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                            />
                            {selectedItems.includes(item.name) && (
                              <Check className="absolute w-3 h-3 text-white pointer-events-none left-0.5" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-sm font-medium text-gray-900 truncate">
                                {item.name}
                              </span>
                              <span className="text-xs text-gray-500 whitespace-nowrap">
                                {formatIndianCurrency(item.value)}
                              </span>
                            </div>
                            <div className="text-xs text-gray-500">
                              {item.percentage.toFixed(1)}%
                            </div>
                          </div>
                        </label>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
          {drillDownDealer && isFullscreen && (
            <button
              onClick={handleBackClick}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-sm font-medium text-white transition-colors shadow-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dealers
            </button>
          )}
        </div>
      </div>

      <div className={isFullscreen ? 'h-[600px]' : 'h-80'}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={filteredData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy={isFullscreen ? "45%" : "40%"}
              outerRadius={isFullscreen ? 140 : 90}
              innerRadius={0}
              paddingAngle={2}
              label={renderCustomLabel}
              labelLine={{ stroke: '#374151', strokeWidth: 1 }}
              onClick={isFullscreen && !drillDownDealer ? handlePieClick : undefined}
              style={{ cursor: isFullscreen && !drillDownDealer ? 'pointer' : 'default' }}
            >
              {filteredData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                  style={{ cursor: isFullscreen && !drillDownDealer ? 'pointer' : 'default' }}
                />
              ))}
            </Pie>
            <Tooltip 
              formatter={formatTooltipValue}
              contentStyle={{
                backgroundColor: 'rgba(255, 255, 255, 0.96)',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              }}
            />
            {isFullscreen && (
              <Legend 
                layout="horizontal" 
                align="center" 
                verticalAlign="bottom"
                wrapperStyle={{
                  paddingTop: '20px',
                  fontSize: '14px',
                }}
              />
            )}
          </PieChart>
        </ResponsiveContainer>
      </div>

      {!drillDownDealer && isFullscreen && (
        <div className="mt-4 pt-4 border-t border-gray-200 text-center">
          <p className="text-sm text-gray-600 font-medium">
            💡 Click on any dealer slice to see their product distribution
          </p>
        </div>
      )}
    </div>
  );
};

// Modal Component for Fullscreen Drill-Down
interface DealerDrillDownModalProps {
  isOpen: boolean;
  onClose: () => void;
  dealerData: any[];
  categoryData: any[];
  title: string;
}

export const DealerDrillDownModal: React.FC<DealerDrillDownModalProps> = ({
  isOpen,
  onClose,
  dealerData,
  categoryData,
  title
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-[95vw] h-[90vh] max-w-7xl flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close modal"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-auto p-6">
          <DealerDrillDownChart
            dealerData={dealerData}
            categoryData={categoryData}
            title=""
            isFullscreen={true}
          />
        </div>
      </div>
    </div>
  );
};

// Clickable Wrapper Component
interface DealerDrillDownWrapperProps {
  dealerData: any[];
  categoryData: any[];
  title: string;
  loading?: boolean;
}

export const DealerDrillDownWrapper: React.FC<DealerDrillDownWrapperProps> = ({
  dealerData,
  categoryData,
  title,
  loading
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleClick = (event: React.MouseEvent) => {
    // Don't trigger modal if clicking on interactive chart elements
    const target = event.target as HTMLElement;
    const isInteractiveElement = target.closest('[data-interactive="true"]') || 
                                target.closest('.recharts-pie-sector') ||
                                target.closest('button');
    
    if (!isInteractiveElement) {
      setIsModalOpen(true);
    }
  };

  return (
    <>
      <div 
        className="relative cursor-pointer group"
        onClick={handleClick}
        title="Click to expand"
      >
        <DealerDrillDownChart
          dealerData={dealerData}
          categoryData={categoryData}
          title={title}
          loading={loading}
          isFullscreen={false}
        />
        {/* Expand overlay on hover */}
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-5 transition-all duration-200 rounded-lg pointer-events-none flex items-center justify-center">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-white px-3 py-1.5 rounded-full shadow-lg flex items-center gap-2 text-sm font-medium text-indigo-600">
            <Maximize2 className="w-4 h-4" />
            Click to expand
          </div>
        </div>
      </div>

      <DealerDrillDownModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        dealerData={dealerData}
        categoryData={categoryData}
        title={title}
      />
    </>
  );
};

export default DealerDrillDownChart;
