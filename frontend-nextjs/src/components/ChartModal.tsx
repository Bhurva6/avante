'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
  ComposedChart,
} from 'recharts';
import { X, Maximize2, Settings, ChevronDown, Check, ArrowLeft } from 'lucide-react';

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316', '#eab308', '#84cc16', '#22c55e', '#14b8a6', '#06b6d4'];

const formatIndianNumber = (value: number): string => {
  if (value >= 10000000) return `₹${(value / 10000000).toFixed(2)}Cr`;
  if (value >= 100000) return `₹${(value / 100000).toFixed(2)}L`;
  if (value >= 1000) return `₹${(value / 1000).toFixed(1)}K`;
  return `₹${value.toFixed(0)}`;
};

const formatTooltipValue = (value: number): string => {
  return `₹${value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export type ChartType = 'bar' | 'horizontalBar' | 'line' | 'area' | 'pie' | 'donut' | 'composed';

export interface DrillDownConfig {
  matchKey: string;      // key in drillDownData to filter by (e.g. 'dealer_name')
  matchValueKey: string; // key in main data items holding the full match value (e.g. 'fullName')
  displayKey: string;    // key in drillDownData for bar labels (e.g. 'product_name')
  valueKey: string;      // key in drillDownData for bar value (e.g. 'total_sales')
  quantityKey?: string;  // optional secondary value key (e.g. 'total_quantity')
  childLabel?: string;   // label for drilled-down items shown in breadcrumb (e.g. 'Products', 'Dealers')
  backLabel?: string;    // text for the back button (e.g. 'Back to States', 'Back to Dealers')
}

export interface ChartConfig {
  type: ChartType;
  title: string;
  data: any[];
  xKey: string;
  yKey: string;
  dataKey?: string;
  nameKey?: string;
  barKey?: string;
  lineKey?: string;
  availableKeys?: string[];
  disableFiltering?: boolean; // For time-series charts where filtering doesn't make sense
  legendBelow?: boolean; // Position legend below the chart instead of beside
  drillDownData?: any[];         // raw source data for drill-down (e.g. rawCategoryData)
  drillDownConfig?: DrillDownConfig;
}

interface ChartModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: ChartConfig | null;
}

export const ChartModal: React.FC<ChartModalProps> = ({ isOpen, onClose, config }) => {
  const [selectedXKey, setSelectedXKey] = useState<string>('');
  const [selectedYKey, setSelectedYKey] = useState<string>('');
  const [showSettings, setShowSettings] = useState(false);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [drillDownItem, setDrillDownItem] = useState<{ name: string; matchValue: string } | null>(null);
  const [showTopN, setShowTopN] = useState(false);
  const [isHeaderFilterOpen, setIsHeaderFilterOpen] = useState(false);
  const [headerSearchQuery, setHeaderSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const headerFilterRef = useRef<HTMLDivElement>(null);
  const headerSearchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (config) {
      setSelectedXKey(config.xKey || config.nameKey || '');
      setSelectedYKey(config.yKey || config.dataKey || config.barKey || '');
      setSearchQuery('');
      setHeaderSearchQuery('');
      setDrillDownItem(null);
      setShowTopN(false);
      setIsHeaderFilterOpen(false);
      // Reset selected items when config changes - select all by default (only if filtering is enabled)
      if (!config.disableFiltering) {
        const xKey = config.xKey || config.nameKey || 'name';
        const allItems = config.data.map(item => item[xKey] as string);
        setSelectedItems(allItems);
      }
    }
  }, [config]);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isDropdownOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    } else {
      setSearchQuery('');
    }
  }, [isDropdownOpen]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
      if (headerFilterRef.current && !headerFilterRef.current.contains(event.target as Node)) {
        setIsHeaderFilterOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus header search input when header filter opens
  useEffect(() => {
    if (isHeaderFilterOpen && headerSearchRef.current) {
      setTimeout(() => headerSearchRef.current?.focus(), 50);
    } else {
      setHeaderSearchQuery('');
    }
  }, [isHeaderFilterOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen || !config) return null;

  // Get available keys from data
  const availableKeys = config.data.length > 0 
    ? Object.keys(config.data[0]).filter(key => key !== 'id' && key !== '_id')
    : [];

  const numericKeys = availableKeys.filter(key => 
    typeof config.data[0][key] === 'number'
  );

  const stringKeys = availableKeys.filter(key => 
    typeof config.data[0][key] === 'string'
  );

  // Get all unique item names based on x-axis key (for filtering dropdown)
  const xKey = selectedXKey || config.xKey || config.nameKey || 'name';
  const allItemNames: string[] = config.data.map(item => item[xKey] as string);
  const filteredItemNames = allItemNames.filter(name =>
    name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  // Filtered names for the header-level filter dropdown (composed chart)
  const headerFilteredItemNames = allItemNames.filter(name =>
    name.toLowerCase().includes(headerSearchQuery.toLowerCase())
  );

  // Filter data based on selected items (only if filtering is not disabled)
  const filteredData = config.disableFiltering
    ? config.data
    : config.data.filter(item => selectedItems.includes(item[xKey]));

  // Compute product-level drill-down data for the selected dealer
  const drillDownChartData: { name: string; revenue: number; quantity: number }[] | null =
    drillDownItem && config.drillDownData && config.drillDownConfig
      ? (() => {
          const { matchKey, displayKey, valueKey, quantityKey } = config.drillDownConfig;
          const rows = config.drillDownData.filter(
            row =>
              row[matchKey] === drillDownItem.matchValue ||
              row[matchKey]?.toLowerCase() === drillDownItem.matchValue?.toLowerCase()
          );
          const agg = new Map<string, { revenue: number; quantity: number }>();
          rows.forEach(row => {
            const label = (row[displayKey] || 'Unknown') as string;
            const existing = agg.get(label) || { revenue: 0, quantity: 0 };
            agg.set(label, {
              revenue: existing.revenue + (row[valueKey] || 0),
              quantity: existing.quantity + (quantityKey ? row[quantityKey] || 0 : 0),
            });
          });
          return Array.from(agg.entries())
            .map(([name, { revenue, quantity }]) => ({ name, revenue, quantity }))
            .sort((a, b) => b.revenue - a.revenue);
        })()
      : null;

  // Helper functions for item selection
  const toggleItem = (item: string) => {
    setSelectedItems(prev => 
      prev.includes(item) 
        ? prev.filter(i => i !== item)
        : [...prev, item]
    );
  };

  const selectAll = () => {
    setSelectedItems(allItemNames);
  };

  const deselectAll = () => {
    setSelectedItems([]);
  };

  // Get a label for what type of items we're filtering
  const getItemTypeLabel = (): string => {
    const title = config.title.toLowerCase();
    if (title.includes('dealer')) return 'Dealers';
    if (title.includes('product')) return 'Products';
    if (title.includes('state')) return 'States';
    if (title.includes('city')) return 'Cities';
    if (title.includes('category')) return 'Categories';
    return 'Items';
  };

  const renderChart = () => {
    const { type } = config;
    const data = filteredData; // Use filtered data
    const xKey = selectedXKey || config.xKey || config.nameKey || 'name';
    const yKey = selectedYKey || config.yKey || config.dataKey || 'value';

    if (data.length === 0) {
      return (
        <div className="h-full flex items-center justify-center">
          <div className="text-center text-gray-500">
            <p className="text-lg font-medium">No data to display</p>
            <p className="text-sm mt-1">Please select at least one item from the dropdown</p>
          </div>
        </div>
      );
    }

    switch (type) {
      case 'bar': {
        // If drilled down, show breakdown as a horizontal bar chart
        if (drillDownItem && drillDownChartData) {
          const ddData = drillDownChartData;
          return (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ddData} layout="vertical" margin={{ top: 20, right: 60, left: 180, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis type="number" tickFormatter={formatIndianNumber} tick={{ fill: '#374151', fontSize: 12 }} />
                <YAxis type="category" dataKey="name" tick={{ fill: '#374151', fontSize: 12 }} width={170} />
                <Tooltip
                  formatter={(value: number, name: string) =>
                    name === 'revenue'
                      ? [formatTooltipValue(value), 'Revenue']
                      : [value.toLocaleString('en-IN'), 'Quantity']
                  }
                />
                <Legend />
                <Bar dataKey="revenue" radius={[0, 4, 4, 0]} name="Revenue">
                  {ddData.map((_, index) => (
                    <Cell key={`dd-cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          );
        }

        // Normal bar view — bars are clickable when drillDownData is configured
        const canDrillDown = !!(config.drillDownData && config.drillDownConfig);
        const handleBarClick = (barData: any) => {
          if (!canDrillDown || !config.drillDownConfig) return;
          const matchValue = barData[config.drillDownConfig.matchValueKey];
          if (matchValue) setDrillDownItem({ name: barData[xKey], matchValue });
        };

        return (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 100 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey={xKey}
                tick={{ fill: '#374151', fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                interval={0}
              />
              <YAxis tickFormatter={formatIndianNumber} tick={{ fill: '#374151', fontSize: 12 }} />
              <Tooltip formatter={(value: number) => formatTooltipValue(value)} />
              <Legend />
              <Bar
                dataKey={yKey}
                fill="#6366f1"
                radius={[4, 4, 0, 0]}
                name={yKey}
                onClick={canDrillDown ? handleBarClick : undefined}
                style={{ cursor: canDrillDown ? 'pointer' : 'default' }}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        );
      }

      case 'horizontalBar': {
        // If drilled down, show product breakdown for the selected dealer
        if (drillDownItem && drillDownChartData) {
          const ddData = drillDownChartData;
          return (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ddData} layout="vertical" margin={{ top: 20, right: 60, left: 180, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis type="number" tickFormatter={formatIndianNumber} tick={{ fill: '#374151', fontSize: 12 }} />
                <YAxis type="category" dataKey="name" tick={{ fill: '#374151', fontSize: 12 }} width={170} />
                <Tooltip
                  formatter={(value: number, name: string) =>
                    name === 'revenue'
                      ? [formatTooltipValue(value), 'Revenue']
                      : [value.toLocaleString('en-IN'), 'Quantity']
                  }
                />
                <Legend />
                <Bar dataKey="revenue" radius={[0, 4, 4, 0]} name="Revenue">
                  {ddData.map((_, index) => (
                    <Cell key={`dd-cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          );
        }

        // Normal dealer view — bars are clickable when drillDownData is configured
        const canDrillDown = !!(config.drillDownData && config.drillDownConfig);
        const handleBarClick = (barData: any) => {
          if (!canDrillDown) return;
          const matchValue = barData[config.drillDownConfig!.matchValueKey];
          if (matchValue) setDrillDownItem({ name: barData[xKey], matchValue });
        };

        // Apply Top 10 filter: sort by yKey desc, take first 10
        const displayData = showTopN
          ? [...data].sort((a, b) => (b[yKey] || 0) - (a[yKey] || 0)).slice(0, 10)
          : data;

        return (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={displayData} layout="vertical" margin={{ top: 20, right: 30, left: 150, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis type="number" tickFormatter={formatIndianNumber} tick={{ fill: '#374151', fontSize: 12 }} />
              <YAxis type="category" dataKey={xKey} tick={{ fill: '#374151', fontSize: 12 }} width={140} />
              <Tooltip formatter={(value: number) => formatTooltipValue(value)} />
              <Legend />
              <Bar
                dataKey={yKey}
                fill="#6366f1"
                radius={[0, 4, 4, 0]}
                name={yKey}
                onClick={canDrillDown ? handleBarClick : undefined}
                style={{ cursor: canDrillDown ? 'pointer' : 'default' }}
              >
                {displayData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        );
      }

      case 'line':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey={xKey} tick={{ fill: '#374151', fontSize: 12 }} />
              <YAxis tickFormatter={formatIndianNumber} tick={{ fill: '#374151', fontSize: 12 }} />
              <Tooltip formatter={(value: number) => formatTooltipValue(value)} />
              <Legend />
              <Line type="monotone" dataKey={yKey} stroke="#6366f1" strokeWidth={3} dot={{ r: 5 }} name={yKey} />
            </LineChart>
          </ResponsiveContainer>
        );

      case 'area':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey={xKey} tick={{ fill: '#374151', fontSize: 12 }} />
              <YAxis tickFormatter={formatIndianNumber} tick={{ fill: '#374151', fontSize: 12 }} />
              <Tooltip formatter={(value: number) => formatTooltipValue(value)} />
              <Legend />
              <defs>
                <linearGradient id="fullscreenGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <Area type="monotone" dataKey={yKey} stroke="#6366f1" fill="url(#fullscreenGradient)" strokeWidth={2} name={yKey} />
            </AreaChart>
          </ResponsiveContainer>
        );

      case 'pie':
      case 'donut': {
        const canDrillDown = !!(config.drillDownData && config.drillDownConfig);

        // If drilled down, show product breakdown as a horizontal bar chart
        if (drillDownItem && drillDownChartData) {
          const ddData = drillDownChartData;
          return (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ddData} layout="vertical" margin={{ top: 20, right: 60, left: 200, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis type="number" tickFormatter={formatIndianNumber} tick={{ fill: '#374151', fontSize: 12 }} />
                <YAxis type="category" dataKey="name" tick={{ fill: '#374151', fontSize: 12 }} width={190} />
                <Tooltip
                  formatter={(value: number, name: string) =>
                    name === 'revenue'
                      ? [formatTooltipValue(value), 'Revenue']
                      : [value.toLocaleString('en-IN'), 'Quantity']
                  }
                />
                <Legend />
                <Bar dataKey="revenue" radius={[0, 4, 4, 0]} name="Revenue">
                  {ddData.map((_, index) => (
                    <Cell key={`dd-cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          );
        }

        // Normal pie view — slices clickable when drillDownData is configured
        const handlePieSliceClick = (sliceData: any) => {
          if (!canDrillDown || !config.drillDownConfig) return;
          const matchValue = sliceData[config.drillDownConfig.matchValueKey] ?? sliceData[xKey];
          if (matchValue) setDrillDownItem({ name: sliceData[xKey] ?? matchValue, matchValue });
        };

        return (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey={yKey}
                nameKey={xKey}
                cx="50%"
                cy={config.legendBelow ? "45%" : "50%"}
                innerRadius={type === 'donut' ? 80 : 0}
                outerRadius={180}
                paddingAngle={2}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                labelLine={{ stroke: '#374151' }}
                onClick={canDrillDown ? handlePieSliceClick : undefined}
                style={{ cursor: canDrillDown ? 'pointer' : 'default' }}
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                    style={{ cursor: canDrillDown ? 'pointer' : 'default' }}
                  />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => formatTooltipValue(value)} />
              <Legend
                layout={config.legendBelow ? "horizontal" : "vertical"}
                align={config.legendBelow ? "center" : "right"}
                verticalAlign={config.legendBelow ? "bottom" : "middle"}
                wrapperStyle={config.legendBelow ? { paddingTop: '20px' } : {}}
              />
            </PieChart>
          </ResponsiveContainer>
        );
      }

      case 'composed':
        const barKey = config.barKey || selectedYKey || 'revenue';
        const lineKey = config.lineKey || 'quantity';
        return (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 20, right: 60, left: 20, bottom: 100 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey={xKey} tick={{ fill: '#374151', fontSize: 12 }} angle={-45} textAnchor="end" />
              <YAxis yAxisId="left" tickFormatter={formatIndianNumber} tick={{ fill: '#374151', fontSize: 12 }} />
              <YAxis yAxisId="right" orientation="right" tick={{ fill: '#374151', fontSize: 12 }} />
              <Tooltip formatter={(value: number, name: string) => [name === barKey ? formatTooltipValue(value) : value.toLocaleString(), name]} />
              <Legend />
              <Bar yAxisId="left" dataKey={barKey} fill="#6366f1" radius={[4, 4, 0, 0]} name="Revenue" />
              <Line yAxisId="right" type="monotone" dataKey={lineKey} stroke="#f97316" strokeWidth={3} name="Quantity" />
            </ComposedChart>
          </ResponsiveContainer>
        );

      default:
        return <div className="text-center text-gray-500">Unsupported chart type</div>;
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl w-[95vw] h-[90vh] max-w-7xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Maximize2 className="w-5 h-5 text-indigo-600" />
            {drillDownItem ? (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">{config.title}</span>
                <span className="text-sm text-gray-400">/</span>
                <h2 className="text-xl font-bold text-gray-900">{drillDownItem.name} — {config.drillDownConfig?.childLabel || 'Details'}</h2>
              </div>
            ) : (
              <h2 className="text-xl font-bold text-gray-900">{config.title}</h2>
            )}
          </div>
          <div className="flex items-center gap-2">
            {/* Back button when drilled down */}
            {drillDownItem && (
              <button
                onClick={() => setDrillDownItem(null)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                {config.drillDownConfig?.backLabel || 'Back'}
              </button>
            )}
            {/* Top 10 toggle — only for horizontal bar charts with more than 10 items */}
            {!drillDownItem && config.type === 'horizontalBar' && allItemNames.length > 10 && (
              <button
                onClick={() => setShowTopN(prev => !prev)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border ${
                  showTopN
                    ? 'bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700'
                    : 'bg-white text-indigo-600 border-indigo-300 hover:bg-indigo-50'
                }`}
                title={showTopN ? `Show all ${allItemNames.length} ${getItemTypeLabel().toLowerCase()}` : `Show top 10 ${getItemTypeLabel().toLowerCase()} only`}
              >
                {showTopN ? `Show All (${allItemNames.length})` : `Top 10 ${getItemTypeLabel()}`}
              </button>
            )}
            {/* Inline filter — bar, horizontalBar, and composed charts */}
            {!drillDownItem && (config.type === 'composed' || config.type === 'bar' || config.type === 'horizontalBar') && !config.disableFiltering && (
              <div className="relative" ref={headerFilterRef}>
                <button
                  onClick={() => setIsHeaderFilterOpen(prev => !prev)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border ${
                    isHeaderFilterOpen
                      ? 'bg-indigo-50 text-indigo-700 border-indigo-400'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <span>
                    {selectedItems.length === allItemNames.length
                      ? `All ${getItemTypeLabel()} (${allItemNames.length})`
                      : selectedItems.length === 0
                      ? `Select ${getItemTypeLabel()}`
                      : `${selectedItems.length} of ${allItemNames.length} ${getItemTypeLabel().toLowerCase()}`}
                  </span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${isHeaderFilterOpen ? 'rotate-180' : ''}`} />
                </button>

                {isHeaderFilterOpen && (
                  <div className="absolute right-0 top-full mt-1 w-80 bg-white border border-gray-200 rounded-lg shadow-xl z-50 overflow-hidden">
                    {/* Search */}
                    <div className="p-2 border-b border-gray-100">
                      <input
                        ref={headerSearchRef}
                        type="text"
                        value={headerSearchQuery}
                        onChange={(e) => setHeaderSearchQuery(e.target.value)}
                        placeholder={`Search ${getItemTypeLabel().toLowerCase()}...`}
                        className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                    {/* Select All / Deselect All */}
                    <div className="px-2 py-1.5 border-b border-gray-100 flex gap-2">
                      <button
                        onClick={selectAll}
                        className="flex-1 px-2 py-1 text-xs font-medium text-indigo-600 hover:bg-indigo-50 rounded"
                      >
                        Select All
                      </button>
                      <button
                        onClick={deselectAll}
                        className="flex-1 px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 rounded"
                      >
                        Deselect All
                      </button>
                    </div>
                    {/* Items list */}
                    <div className="max-h-64 overflow-y-auto">
                      {headerFilteredItemNames.length === 0 ? (
                        <div className="px-3 py-4 text-sm text-gray-400 text-center">No {getItemTypeLabel().toLowerCase()} found</div>
                      ) : (
                        headerFilteredItemNames.map((item, index) => (
                          <div
                            key={index}
                            onClick={() => toggleItem(item)}
                            className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 cursor-pointer"
                          >
                            <div className={`w-4 h-4 border rounded flex items-center justify-center flex-shrink-0 ${
                              selectedItems.includes(item)
                                ? 'bg-indigo-600 border-indigo-600'
                                : 'border-gray-300'
                            }`}>
                              {selectedItems.includes(item) && (
                                <Check className="w-3 h-3 text-white" />
                              )}
                            </div>
                            <span className="text-sm text-gray-700 truncate flex-1">{item}</span>
                          </div>
                        ))
                      )}
                    </div>
                    {/* Count footer */}
                    <div className="px-3 py-2 border-t border-gray-100 text-xs text-gray-500 text-center">
                      {selectedItems.length} of {allItemNames.length} {getItemTypeLabel().toLowerCase()} selected
                    </div>
                  </div>
                )}
              </div>
            )}
            {/* Settings Toggle — hidden in drill-down mode */}
            {!drillDownItem && (
              <button
                onClick={() => setShowSettings(!showSettings)}
                className={`p-2 rounded-lg transition-colors ${showSettings ? 'bg-indigo-100 text-indigo-600' : 'hover:bg-gray-100 text-gray-600'}`}
                title="Chart Settings"
              >
                <Settings className="w-5 h-5" />
              </button>
            )}
            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-2 hover:bg-red-100 rounded-lg transition-colors text-red-600"
              title="Close (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Settings Panel — hidden in drill-down mode */}
        {showSettings && !config.disableFiltering && !drillDownItem && (
          <div className="p-4 bg-gray-50 border-b border-gray-200">
            <div className="flex flex-wrap gap-4 items-start">
              {/* Item Selection Dropdown */}
              <div className="flex items-start gap-2" ref={dropdownRef}>
                <label className="text-sm font-medium text-gray-700 mt-2">
                  Select {getItemTypeLabel()}:
                </label>
                <div className="relative">
                  <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white flex items-center gap-2 min-w-[200px] justify-between"
                  >
                    <span className="truncate">
                      {selectedItems.length === allItemNames.length 
                        ? `All ${getItemTypeLabel()} (${allItemNames.length})`
                        : selectedItems.length === 0
                        ? `Select ${getItemTypeLabel()}`
                        : `${selectedItems.length} of ${allItemNames.length} selected`}
                    </span>
                    <ChevronDown className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {isDropdownOpen && (
                    <div className="absolute top-full left-0 mt-1 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden">
                      {/* Search Input */}
                      <div className="p-2 border-b border-gray-100">
                        <input
                          ref={searchInputRef}
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder={`Search ${getItemTypeLabel().toLowerCase()}...`}
                          className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>

                      {/* Select All / Deselect All */}
                      <div className="px-2 py-1.5 border-b border-gray-100 flex gap-2">
                        <button
                          onClick={selectAll}
                          className="flex-1 px-2 py-1 text-xs font-medium text-indigo-600 hover:bg-indigo-50 rounded"
                        >
                          Select All
                        </button>
                        <button
                          onClick={deselectAll}
                          className="flex-1 px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 rounded"
                        >
                          Deselect All
                        </button>
                      </div>

                      {/* Items List */}
                      <div className="max-h-56 overflow-y-auto">
                        {filteredItemNames.length === 0 ? (
                          <div className="px-3 py-4 text-sm text-gray-400 text-center">No results found</div>
                        ) : (
                          filteredItemNames.map((item, index) => (
                            <div
                              key={index}
                              onClick={() => toggleItem(item)}
                              className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 cursor-pointer"
                            >
                              <div className={`w-4 h-4 border rounded flex items-center justify-center flex-shrink-0 ${
                                selectedItems.includes(item)
                                  ? 'bg-indigo-600 border-indigo-600'
                                  : 'border-gray-300'
                              }`}>
                                {selectedItems.includes(item) && (
                                  <Check className="w-3 h-3 text-white" />
                                )}
                              </div>
                              <span className="text-sm text-gray-700 truncate flex-1">{item}</span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* X-Axis / Name Key Selector */}
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">
                  {config.type === 'pie' || config.type === 'donut' ? 'Category Field:' : 'X-Axis:'}
                </label>
                <select
                  value={selectedXKey}
                  onChange={(e) => {
                    setSelectedXKey(e.target.value);
                    // Reset selected items when changing x-axis
                    const newItems = config.data.map(item => item[e.target.value] as string);
                    setSelectedItems(newItems);
                  }}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  {stringKeys.map(key => (
                    <option key={key} value={key}>{key}</option>
                  ))}
                </select>
              </div>

              {/* Y-Axis / Value Key Selector */}
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">
                  {config.type === 'pie' || config.type === 'donut' ? 'Value Field:' : 'Y-Axis:'}
                </label>
                <select
                  value={selectedYKey}
                  onChange={(e) => setSelectedYKey(e.target.value)}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  {numericKeys.map(key => (
                    <option key={key} value={key}>{key}</option>
                  ))}
                </select>
              </div>

              {/* Data Count Info */}
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <span>📊 Showing {filteredData.length} of {config.data.length} {getItemTypeLabel().toLowerCase()}</span>
              </div>
            </div>
          </div>
        )}

        {/* Chart Area */}
        <div className="flex-1 p-6 min-h-0">
          {renderChart()}
        </div>

        {/* Footer with instructions */}
        <div className="p-3 border-t border-gray-200 bg-gray-50 text-center">
          <span className="text-xs text-gray-500">
            Press <kbd className="px-1.5 py-0.5 bg-gray-200 rounded text-gray-700 font-mono">Esc</kbd> or click outside to close
            {!drillDownItem && config.drillDownData && config.type === 'pie' && (
              <> • 💡 Click any slice to see {(config.drillDownConfig?.childLabel || 'details').toLowerCase()}</>
            )}
            {!drillDownItem && config.drillDownData && config.type !== 'pie' && (
              <> • 💡 Click any bar to see {(config.drillDownConfig?.childLabel || 'details').toLowerCase()}</>
            )}
            {!drillDownItem && !config.drillDownData && (
              <> • Click <Settings className="w-3 h-3 inline mx-1" /> to change chart variables</>
            )}
          </span>
        </div>
      </div>
    </div>
  );
};

// Clickable wrapper for charts
export const ClickableChartWrapper: React.FC<{
  children: React.ReactNode;
  onClick: () => void;
  title?: string;
}> = ({ children, onClick, title }) => {
  const handleClick = (event: React.MouseEvent) => {
    // Don't trigger modal if clicking on interactive chart elements
    const target = event.target as HTMLElement;
    const isInteractiveElement = target.closest('[data-interactive="true"]') || 
                                target.closest('.recharts-pie-sector') ||
                                target.closest('.recharts-bar') ||
                                target.closest('button');
    
    if (!isInteractiveElement) {
      onClick();
    }
  };

  return (
    <div 
      className="relative cursor-pointer group"
      onClick={handleClick}
      title={title || 'Click to expand'}
    >
      {children}
      {/* Expand overlay on hover */}
      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-5 transition-all duration-200 rounded-lg pointer-events-none flex items-center justify-center">
        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-white px-3 py-1.5 rounded-full shadow-lg flex items-center gap-2 text-sm font-medium text-indigo-600">
          <Maximize2 className="w-4 h-4" />
          Click to expand
        </div>
      </div>
    </div>
  );
};

export default ChartModal;
