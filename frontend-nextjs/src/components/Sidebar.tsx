'use client';

import React from 'react';
import { useDashboardStore } from '@/lib/store';
import { formatDate, getQuickDateRange } from '@/lib/utils';
import { Calendar, Settings, RefreshCw } from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
}

export default function Sidebar({ isOpen }: SidebarProps) {
  const {
    startDate,
    endDate,
    hideInnovative,
    hideAvante,
    dashboardMode,
    setDateRange,
    setHideInnovative,
    setHideAvante,
  } = useDashboardStore();

  const handleQuickDate = (period: string) => {
    const [start, end] = getQuickDateRange(period);
    setDateRange(start, end);
  };

  return (
    <div className={`h-screen overflow-y-auto transition-all ${isOpen ? 'opacity-100' : 'opacity-0'}`}>
      <div className="p-6 space-y-6">
        {/* Authentication Section */}
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-4 rounded-lg border border-indigo-200">
          <h3 className="font-semibold text-gray-900 mb-3">Authentication</h3>
          <input
            type="text"
            placeholder="Username"
            defaultValue="u2vp8kb"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <input
            type="password"
            placeholder="Password"
            defaultValue="asdftuy#$%78@!"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Quick Date Range */}
        <div>
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Quick Select
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {['week', 'month', 'quarter', 'year'].map((period) => (
              <button
                key={period}
                onClick={() => handleQuickDate(period)}
                className="px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                {period.charAt(0).toUpperCase() + period.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Date Range Picker */}
        <div>
          <h3 className="font-semibold text-gray-900 mb-3">Date Range</h3>
          <div className="space-y-2">
            <div>
              <label className="text-xs text-gray-600">From:</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setDateRange(e.target.value, endDate)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="text-xs text-gray-600">To:</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setDateRange(startDate, e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Controls - Show appropriate filter based on dashboard mode */}
        <div>
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Filters
          </h3>
          <div className="space-y-3">
            {dashboardMode === 'avante' ? (
              <>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hideInnovative}
                    onChange={(e) => setHideInnovative(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600"
                  />
                  <span className="text-sm text-gray-700">Hide Innovative</span>
                </label>
                <p className="text-xs text-gray-500 ml-6">
                  Excludes dealers with "Innovative" in their name
                </p>
              </>
            ) : (
              <>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hideAvante}
                    onChange={(e) => setHideAvante(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600"
                  />
                  <span className="text-sm text-gray-700">Hide Avante</span>
                </label>
                <p className="text-xs text-gray-500 ml-6">
                  Excludes dealers with "Avante" in their name
                </p>
              </>
            )}
          </div>
        </div>

        {/* Buttons */}
        <div className="space-y-2 pt-4 border-t border-gray-200">
          <button className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4" />
            Refresh Data
          </button>
        </div>
      </div>
    </div>
  );
}
