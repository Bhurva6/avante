'use client';

import React, { useState, useEffect } from 'react';
import { useDashboardStore } from '@/lib/store';
import Layout from '@/components/Layout';
import DataTable from '@/components/DataTable';
import { formatIndianNumber } from '@/lib/utils';

export default function TablesPage() {
  const { dashboardMode, startDate, endDate, hideInnovative, hideAvante } = useDashboardStore();
  const [loading, setLoading] = useState(false);
  const [salesData, setSalesData] = useState<any[]>([]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // TODO: Replace with actual API call when endpoint is available
        // Example:
        // const response = await fetch(`/api/sales-data?start_date=${startDate}&end_date=${endDate}`);
        // const data = await response.json();
        // setSalesData(data);
        
        // For now, show empty state since no mock data should be used
        setSalesData([]);
      } catch (error) {
        console.error('Error loading data:', error);
        setSalesData([]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [startDate, endDate, dashboardMode, hideInnovative, hideAvante]);

  const columns = [
    { key: 'date', label: 'Date' },
    { key: 'dealer', label: 'Dealer Name' },
    { key: 'state', label: 'State' },
    { key: 'city', label: 'City' },
    { key: 'product', label: 'Product' },
    { key: 'category', label: 'Category' },
    { key: 'quantity', label: 'Quantity' },
    { key: 'value', label: 'Value (₹)' },
  ];

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Sales Data Tables</h1>
          <p className="text-gray-600 mt-2">Comprehensive view of all transactions</p>
        </div>

        <DataTable
          columns={columns}
          data={salesData}
          loading={loading}
          title="Sales Transactions"
        />
      </div>
    </Layout>
  );
}
