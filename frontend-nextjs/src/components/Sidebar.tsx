'use client';

import React from 'react';
import { useDashboardStore, useAuthStore } from '@/lib/store';
import { getQuickDateRange } from '@/lib/utils';
import { Calendar, Settings, RefreshCw, User } from 'lucide-react';

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
  const { username, userRole } = useAuthStore();

  const handleQuickDate = (period: string) => {
    const [start, end] = getQuickDateRange(period);
    setDateRange(start, end);
  };

  const handleRefresh = () => {
    // Force re-fetch by nudging the date range (same values trigger the effect)
    const { startDate: s, endDate: e } = useDashboardStore.getState();
    useDashboardStore.getState().setDateRange(s, e);
  };

  return (
    <div className={`h-screen overflow-y-auto transition-all ${isOpen ? 'opacity-100' : 'opacity-0'}`}>
      <div className="p-6 space-y-6">
        {/* User Info */}
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-4 rounded-lg border border-indigo-200">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center flex-shrink-0">
              <User className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">{username || 'User'}</p>
              <p className="text-xs text-indigo-600 capitalize">{userRole}</p>
            </div>
          </div>
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

        {/* Filters */}
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
                  Excludes dealers with &quot;Innovative&quot; in their name
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
                  Excludes dealers with &quot;Avante&quot; in their name
                </p>
              </>
            )}
          </div>
        </div>

        {/* Refresh */}
        <div className="space-y-2 pt-4 border-t border-gray-200">
          <button
            onClick={handleRefresh}
            className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh Data
          </button>
        </div>
      </div>
    </div>
  );
}
