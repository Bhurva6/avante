'use client';

import React, { useState, useEffect, useRef } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { ArrowLeft, X, Maximize2, ChevronDown, Search, Check, SlidersHorizontal } from 'lucide-react';

const COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316',
  '#eab308', '#84cc16', '#22c55e', '#14b8a6', '#06b6d4',
  '#3b82f6', '#a855f7', '#fb7185', '#fb923c', '#facc15',
];

const fmt = (num: number): string => {
  if (num >= 10000000) return `₹${(num / 10000000).toFixed(2)} Cr`;
  if (num >= 100000)   return `₹${(num / 100000).toFixed(2)} L`;
  if (num >= 1000)     return `₹${(num / 1000).toFixed(1)} K`;
  return `₹${num.toFixed(0)}`;
};

const trunc = (s: string, n: number) => s.length > n ? s.substring(0, n) + '…' : s;

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
  isFullscreen = false,
}) => {
  const [drillDownDealer, setDrillDownDealer] = useState<string | null>(null);
  const [selectedDealers, setSelectedDealers] = useState<string[]>([]);
  const [searchQuery, setSearchQuery]         = useState('');
  const [isDropdownOpen, setIsDropdownOpen]   = useState(false);
  const [showAllLegend, setShowAllLegend]     = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  /* ─── All dealers from raw data ──────────────────────────── */
  const allDealers = dealerData.map(d => ({
    name:  d.dealer_name || 'Unknown',
    value: d.total_sales || 0,
  }));
  const totalSales = allDealers.reduce((s, d) => s + d.value, 0);

  /* ─── Re-initialise on data change ───────────────────────── */
  useEffect(() => {
    setSelectedDealers(allDealers.map(d => d.name));
    setDrillDownDealer(null);
    setShowAllLegend(false);
    setSearchQuery('');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dealerData.length, categoryData.length]);

  /* ─── Close dropdown on outside click ────────────────────── */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
        setSearchQuery('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  /* ─── Dealer pie data (respects filter) ──────────────────── */
  const dealerPieData = allDealers
    .filter(d => selectedDealers.includes(d.name))
    .map(d => ({
      name:     trunc(d.name, isFullscreen ? 24 : 18),
      fullName: d.name,
      value:    d.value,
      percentage: totalSales > 0 ? (d.value / totalSales) * 100 : 0,
    }))
    .sort((a, b) => b.value - a.value);

  /* ─── Product data for drilled-down dealer ──────────────── */
  const getDealerProductData = (dealerName: string) => {
    const rows = categoryData.filter(c =>
      c.dealer_name === dealerName ||
      c.dealer_name?.toLowerCase() === dealerName.toLowerCase()
    );
    const total = rows.reduce((s, r) => s + (r.total_sales || 0), 0);
    // aggregate duplicates
    const agg = new Map<string, number>();
    rows.forEach(r => {
      const key = r.product_name || 'Unknown';
      agg.set(key, (agg.get(key) || 0) + (r.total_sales || 0));
    });
    return Array.from(agg.entries())
      .map(([name, value]) => ({
        name:     trunc(name, isFullscreen ? 28 : 22),
        fullName: name,
        value,
        percentage: total > 0 ? (value / total) * 100 : 0,
      }))
      .sort((a, b) => b.value - a.value);
  };

  const currentData = drillDownDealer
    ? getDealerProductData(drillDownDealer)
    : dealerPieData;

  /* ─── Dropdown search filter ──────────────────────────────── */
  const filteredDealerList = allDealers.filter(d =>
    d.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  /* ─── Toggle helpers ──────────────────────────────────────── */
  const toggleDealer = (name: string) => {
    setSelectedDealers(prev =>
      prev.includes(name)
        ? prev.length > 1 ? prev.filter(n => n !== name) : prev  // keep ≥1
        : [...prev, name]
    );
  };

  /* ─── Slice click → drill-down ────────────────────────────── */
  const handleSliceClick = (data: any) => {
    if (!drillDownDealer && data?.fullName) {
      setDrillDownDealer(data.fullName);
      setShowAllLegend(false);
    }
  };

  /* ─── Percentage label on pie ─────────────────────────────── */
  const renderLabel = ({ percentage, cx, cy, midAngle, outerRadius }: any) => {
    if (percentage < 5) return null;
    const RADIAN = Math.PI / 180;
    const r = outerRadius + (isFullscreen ? 28 : 20);
    const x = cx + r * Math.cos(-midAngle * RADIAN);
    const y = cy + r * Math.sin(-midAngle * RADIAN);
    return (
      <text
        x={x} y={y}
        fill="#4b5563"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        fontSize={isFullscreen ? 12 : 10}
        fontWeight="600"
      >
        {`${percentage.toFixed(1)}%`}
      </text>
    );
  };

  /* ─── Sizing ──────────────────────────────────────────────── */
  const outerRadius  = isFullscreen ? 155 : 82;
  const chartHeight  = isFullscreen ? 420 : 230;
  const LEGEND_LIMIT = isFullscreen ? 18 : 6;
  const legendItems  = showAllLegend ? currentData : currentData.slice(0, LEGEND_LIMIT);

  const isFiltered = selectedDealers.length < allDealers.length;

  /* ─── Loading state ───────────────────────────────────────── */
  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="h-4 w-40 bg-gray-200 animate-pulse rounded" />
          <div className="h-7 w-20 bg-gray-100 animate-pulse rounded-lg" />
        </div>
        <div className="flex items-center justify-center" style={{ height: chartHeight }}>
          <div className="relative">
            <div className="animate-spin rounded-full border-4 border-gray-100 border-t-indigo-500"
              style={{ width: outerRadius * 1.6, height: outerRadius * 1.6 }} />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs text-gray-400">Loading…</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ─── Main render ─────────────────────────────────────────── */
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-visible flex flex-col">

      {/* ── HEADER ──────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-gray-100 rounded-t-xl bg-gradient-to-r from-slate-50 to-white flex-shrink-0">

        {drillDownDealer ? (
          /* Drill-down breadcrumb */
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <button
              onClick={(e) => { e.stopPropagation(); setDrillDownDealer(null); setShowAllLegend(false); }}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-semibold rounded-lg transition-colors flex-shrink-0 shadow-sm"
            >
              <ArrowLeft className="w-3 h-3" />
              All Dealers
            </button>
            <div className="flex items-center gap-1 text-xs min-w-0">
              <span className="text-gray-400 flex-shrink-0">/</span>
              <span
                className="font-semibold text-indigo-700 truncate"
                title={drillDownDealer}
              >
                {trunc(drillDownDealer, 30)}
              </span>
              <span className="text-gray-400 flex-shrink-0 hidden sm:inline">— Products</span>
            </div>
          </div>
        ) : (
          /* Normal title + badge */
          <div className="flex items-center gap-2 min-w-0">
            <h3 className="text-sm font-semibold text-gray-900 truncate">{title}</h3>
            {allDealers.length > 0 && (
              <span className={`flex-shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full ${
                isFiltered
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-indigo-100 text-indigo-700'
              }`}>
                {isFiltered
                  ? `${dealerPieData.length} / ${allDealers.length}`
                  : `${allDealers.length} dealers`}
              </span>
            )}
          </div>
        )}

        {/* ── Filter dropdown — top-level view only ─── */}
        {!drillDownDealer && allDealers.length > 0 && (
          <div className="relative flex-shrink-0" ref={dropdownRef} data-interactive="true">
            <button
              onClick={() => setIsDropdownOpen(prev => !prev)}
              className={`flex items-center gap-1.5 pl-2.5 pr-2 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                isDropdownOpen
                  ? 'bg-indigo-600 border-indigo-600 text-white shadow-md'
                  : isFiltered
                  ? 'bg-amber-50 border-amber-300 text-amber-700 hover:bg-amber-100'
                  : 'bg-white border-gray-200 text-gray-600 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50'
              }`}
            >
              <SlidersHorizontal className="w-3 h-3" />
              <span>{isFiltered ? `${selectedDealers.length} / ${allDealers.length}` : 'Filter'}</span>
              <ChevronDown className={`w-3 h-3 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* ── Dropdown panel ─────────────────────── */}
            {isDropdownOpen && (
              <div className="absolute right-0 top-full mt-2 w-76 bg-white rounded-xl shadow-2xl border border-gray-200 z-[200] overflow-hidden flex flex-col"
                style={{ width: 300, maxHeight: 420 }}>

                {/* Search */}
                <div className="p-3 border-b border-gray-100 flex-shrink-0">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search dealers…"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:bg-white transition-colors"
                      autoFocus
                    />
                  </div>
                </div>

                {/* Select / Deselect all */}
                <div className="flex items-center border-b border-gray-100 flex-shrink-0">
                  <button
                    onClick={() => setSelectedDealers(allDealers.map(d => d.name))}
                    className="flex-1 py-2 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 transition-colors"
                  >
                    Select All
                  </button>
                  <div className="w-px h-4 bg-gray-200" />
                  <button
                    onClick={() => allDealers.length > 0 && setSelectedDealers([allDealers[0].name])}
                    className="flex-1 py-2 text-xs font-semibold text-gray-500 hover:bg-gray-50 transition-colors"
                  >
                    Deselect All
                  </button>
                </div>

                {/* List */}
                <div className="overflow-y-auto flex-1">
                  {filteredDealerList.length === 0 ? (
                    <div className="py-8 text-center">
                      <Search className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                      <p className="text-xs text-gray-400">No dealers match "{searchQuery}"</p>
                    </div>
                  ) : (
                    filteredDealerList.map((dealer, i) => {
                      const colorIdx = allDealers.findIndex(d => d.name === dealer.name);
                      const selected = selectedDealers.includes(dealer.name);
                      const pct = totalSales > 0
                        ? ((dealer.value / totalSales) * 100).toFixed(1)
                        : '0.0';
                      return (
                        <button
                          key={i}
                          onClick={() => toggleDealer(dealer.name)}
                          className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-left border-b border-gray-50 last:border-0 transition-colors ${
                            selected ? 'bg-indigo-50/70' : 'hover:bg-gray-50'
                          }`}
                        >
                          {/* Checkbox */}
                          <div className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                            selected ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300 bg-white'
                          }`}>
                            {selected && <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />}
                          </div>
                          {/* Colour dot */}
                          <div
                            className="w-2.5 h-2.5 rounded-sm flex-shrink-0 ring-1 ring-black/5"
                            style={{ backgroundColor: COLORS[colorIdx % COLORS.length] }}
                          />
                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-gray-800 truncate leading-tight">
                              {dealer.name}
                            </p>
                            <p className="text-xs text-gray-400 mt-0.5">{pct}% of total</p>
                          </div>
                          {/* Value */}
                          <span className="text-xs font-semibold text-gray-700 flex-shrink-0 tabular-nums">
                            {fmt(dealer.value)}
                          </span>
                        </button>
                      );
                    })
                  )}
                </div>

                {/* Footer */}
                <div className="px-3 py-2 bg-gray-50 border-t border-gray-100 flex-shrink-0 flex items-center justify-between">
                  <span className="text-xs text-gray-500">
                    {selectedDealers.length} of {allDealers.length} selected
                  </span>
                  <button
                    onClick={() => { setIsDropdownOpen(false); setSearchQuery(''); }}
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 px-2 py-0.5 rounded hover:bg-indigo-50 transition-colors"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── CHART ───────────────────────────────────────────── */}
      <div style={{ height: chartHeight }} className="flex-shrink-0">
        {currentData.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center gap-3 text-gray-300">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
              </svg>
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-gray-400">No data to display</p>
              <p className="text-xs text-gray-300 mt-0.5">Try selecting more dealers</p>
            </div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={currentData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={outerRadius}
                innerRadius={0}
                paddingAngle={2}
                label={renderLabel}
                labelLine={{ stroke: '#d1d5db', strokeWidth: 1 }}
                onClick={!drillDownDealer ? handleSliceClick : undefined}
                style={{ cursor: !drillDownDealer ? 'pointer' : 'default' }}
              >
                {currentData.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                    stroke="white"
                    strokeWidth={1.5}
                    style={{ cursor: !drillDownDealer ? 'pointer' : 'default' }}
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number, _name: string, props: any) => [fmt(value), props?.payload?.fullName || _name]}
                contentStyle={{
                  background: 'rgba(255,255,255,0.97)',
                  border: '1px solid #e5e7eb',
                  borderRadius: '12px',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.12)',
                  padding: '10px 14px',
                  fontSize: '12px',
                  fontWeight: 500,
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* ── LEGEND ──────────────────────────────────────────── */}
      {currentData.length > 0 && (
        <div className="px-4 pb-3 border-t border-gray-100 flex-shrink-0">
          <div className={`grid gap-x-3 gap-y-1.5 mt-3 ${isFullscreen ? 'grid-cols-3' : 'grid-cols-2'}`}>
            {legendItems.map((item, i) => (
              <div key={i} className="flex items-center gap-1.5 min-w-0">
                <div
                  className="w-2.5 h-2.5 rounded-sm flex-shrink-0 ring-1 ring-black/5"
                  style={{ backgroundColor: COLORS[i % COLORS.length] }}
                />
                <span
                  className="text-xs text-gray-600 truncate flex-1 leading-tight"
                  title={item.fullName || item.name}
                >
                  {item.name}
                </span>
                <span className="text-xs font-semibold text-gray-800 flex-shrink-0 tabular-nums">
                  {fmt(item.value)}
                </span>
              </div>
            ))}
          </div>

          {currentData.length > LEGEND_LIMIT && (
            <button
              onClick={(e) => { e.stopPropagation(); setShowAllLegend(prev => !prev); }}
              className="mt-2.5 w-full py-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition-colors text-center"
            >
              {showAllLegend
                ? '↑ Show less'
                : `↓ Show ${currentData.length - LEGEND_LIMIT} more`}
            </button>
          )}
        </div>
      )}

      {/* ── HINT ────────────────────────────────────────────── */}
      {!drillDownDealer && currentData.length > 0 && (
        <div className="px-4 pb-4 flex-shrink-0">
          <div className="flex items-center justify-center gap-2 py-2 px-3 bg-indigo-50 rounded-lg border border-indigo-100">
            <span className="text-base leading-none">💡</span>
            <p className="text-xs font-medium text-indigo-600">
              Click any slice to see that dealer's product breakdown
            </p>
          </div>
        </div>
      )}
    </div>
  );
};


/* ══════════════════════════════════════════════════════════════
   FULLSCREEN MODAL
══════════════════════════════════════════════════════════════ */
interface DealerDrillDownModalProps {
  isOpen: boolean;
  onClose: () => void;
  dealerData: any[];
  categoryData: any[];
  title: string;
}

export const DealerDrillDownModal: React.FC<DealerDrillDownModalProps> = ({
  isOpen, onClose, dealerData, categoryData, title,
}) => {
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (isOpen) document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-[95vw] h-[92vh] max-w-6xl flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-white flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">{title}</h2>
              <p className="text-xs text-gray-500 mt-0.5">Click any slice to drill into product breakdown</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-500 hover:text-gray-700"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal content */}
        <div className="flex-1 overflow-auto p-6">
          <DealerDrillDownChart
            dealerData={dealerData}
            categoryData={categoryData}
            title={title}
            isFullscreen={true}
          />
        </div>
      </div>
    </div>
  );
};


/* ══════════════════════════════════════════════════════════════
   WRAPPER (preview card + expand-to-modal)
══════════════════════════════════════════════════════════════ */
interface DealerDrillDownWrapperProps {
  dealerData: any[];
  categoryData: any[];
  title: string;
  loading?: boolean;
}

export const DealerDrillDownWrapper: React.FC<DealerDrillDownWrapperProps> = ({
  dealerData, categoryData, title, loading,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleClick = (event: React.MouseEvent) => {
    const target = event.target as HTMLElement;
    // Don't open modal when clicking interactive chart elements
    const isInteractive =
      target.closest('[data-interactive="true"]') ||
      target.closest('.recharts-pie-sector') ||
      target.closest('button') ||
      target.closest('input');

    if (!isInteractive) {
      setIsModalOpen(true);
    }
  };

  return (
    <>
      <div
        className="relative cursor-pointer group"
        onClick={handleClick}
        title="Click background to expand"
      >
        <DealerDrillDownChart
          dealerData={dealerData}
          categoryData={categoryData}
          title={title}
          loading={loading}
          isFullscreen={false}
        />
        {/* Subtle expand cue on hover — only visible over non-interactive area */}
        <div className="absolute top-3 right-14 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
          <div className="flex items-center gap-1.5 bg-white/90 backdrop-blur-sm border border-gray-200 px-2.5 py-1.5 rounded-full shadow-md text-xs font-medium text-indigo-600">
            <Maximize2 className="w-3 h-3" />
            Expand
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
