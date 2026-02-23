'use client';

import React, { useState, useMemo } from 'react';
import { AlertTriangle, Search, Filter, Download, Eye, Calendar, MapPin, Package } from 'lucide-react';

interface OverduePayment {
  id: string;
  dealerName: string;
  amount: number;
  quantity: number;
  date: string;
  daysOverdue: number;
  invoiceNumber?: string;
  state?: string;
  city?: string;
  transactionCount?: number;
  lastPaymentDate?: string;
  contactInfo?: string;
}

interface OverduePaymentsTableProps {
  salesData: any[];
  title?: string;
  loading?: boolean;
}

// Helper function to format Indian currency
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

// Helper to format numbers with commas
const formatNumber = (num: number): string => {
  return num.toLocaleString('en-IN');
};

// Generate mock overdue payment data from sales data
const generateOverduePayments = (salesData: any[]): OverduePayment[] => {
  if (!salesData || salesData.length === 0) {
    // Return mock data for testing
    return [
      {
        id: '1',
        dealerName: 'MedTech Solutions Pvt Ltd',
        amount: 250000,
        quantity: 150,
        date: '2024-01-15',
        daysOverdue: 32,
        invoiceNumber: 'INV-2024-001',
        state: 'Maharashtra',
        city: 'Mumbai',
        transactionCount: 3,
        lastPaymentDate: '2024-01-10',
        contactInfo: '+91-9876543210'
      },
      {
        id: '2',
        dealerName: 'OrthoCare Distributors',
        amount: 180000,
        quantity: 95,
        date: '2024-01-08',
        daysOverdue: 39,
        invoiceNumber: 'INV-2024-002',
        state: 'Delhi',
        city: 'New Delhi',
        transactionCount: 2,
        lastPaymentDate: '2024-01-05',
        contactInfo: '+91-9876543211'
      },
      {
        id: '3',
        dealerName: 'Surgical Supplies Co',
        amount: 320000,
        quantity: 200,
        date: '2024-01-20',
        daysOverdue: 27,
        invoiceNumber: 'INV-2024-003',
        state: 'Karnataka',
        city: 'Bangalore',
        transactionCount: 4,
        lastPaymentDate: '2024-01-15',
        contactInfo: '+91-9876543212'
      },
      {
        id: '4',
        dealerName: 'BoneCare Medical',
        amount: 95000,
        quantity: 60,
        date: '2024-01-12',
        daysOverdue: 35,
        invoiceNumber: 'INV-2024-004',
        state: 'Tamil Nadu',
        city: 'Chennai',
        transactionCount: 1,
        lastPaymentDate: '2024-01-08',
        contactInfo: '+91-9876543213'
      },
      {
        id: '5',
        dealerName: 'Implant Systems Ltd',
        amount: 410000,
        quantity: 280,
        date: '2024-01-25',
        daysOverdue: 22,
        invoiceNumber: 'INV-2024-005',
        state: 'Gujarat',
        city: 'Ahmedabad',
        transactionCount: 5,
        lastPaymentDate: '2024-01-20',
        contactInfo: '+91-9876543214'
      }
    ];
  }

  // Generate overdue payments from actual sales data
  return salesData
    .filter((dealer, index) => {
      // Only create overdue payments for some dealers (simulate real scenario)
      return index % 3 === 0 && dealer.total_sales > 50000;
    })
    .map((dealer, index) => {
      const baseAmount = dealer.total_sales * 0.3; // Assume 30% is overdue
      const daysOverdue = Math.floor(Math.random() * 60) + 15; // 15-75 days overdue

      return {
        id: `overdue-${index}`,
        dealerName: dealer.dealer_name?.substring(0, 30) || 'Unknown Dealer',
        amount: Math.round(baseAmount),
        quantity: Math.round(dealer.total_quantity * 0.3) || Math.floor(Math.random() * 100) + 20,
        date: new Date(Date.now() - (daysOverdue * 24 * 60 * 60 * 1000)).toISOString().split('T')[0],
        daysOverdue,
        invoiceNumber: `INV-2024-${String(index + 1).padStart(3, '0')}`,
        state: dealer.state || 'Unknown',
        city: dealer.city || 'Unknown',
        transactionCount: Math.floor(Math.random() * 5) + 1,
        lastPaymentDate: new Date(Date.now() - ((daysOverdue + 7) * 24 * 60 * 60 * 1000)).toISOString().split('T')[0],
        contactInfo: `+91-${Math.floor(Math.random() * 9000000000) + 1000000000}`
      };
    })
    .sort((a, b) => b.daysOverdue - a.daysOverdue); // Sort by days overdue descending
};

export default function OverduePaymentsTable({ salesData, title = "💰 Overdue Payments", loading = false }: OverduePaymentsTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'daysOverdue' | 'amount' | 'dealerName' | 'date'>('daysOverdue');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [statusFilter, setStatusFilter] = useState<'all' | 'critical' | 'high' | 'medium'>('all');
  const [selectedPayment, setSelectedPayment] = useState<OverduePayment | null>(null);

  // Generate overdue payments data
  const overduePayments = useMemo(() => generateOverduePayments(salesData), [salesData]);

  // Filter and sort data
  const filteredAndSortedPayments = useMemo(() => {
    let filtered = overduePayments.filter(payment => {
      // Search filter
      const matchesSearch = payment.dealerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           payment.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           payment.state?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           payment.city?.toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchesSearch) return false;

      // Status filter
      if (statusFilter === 'critical') return payment.daysOverdue >= 45;
      if (statusFilter === 'high') return payment.daysOverdue >= 30 && payment.daysOverdue < 45;
      if (statusFilter === 'medium') return payment.daysOverdue >= 15 && payment.daysOverdue < 30;

      return true;
    });

    // Sort
    filtered.sort((a, b) => {
      let aValue: any = a[sortBy];
      let bValue: any = b[sortBy];

      if (sortBy === 'amount') {
        aValue = a.amount;
        bValue = b.amount;
      }

      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [overduePayments, searchTerm, sortBy, sortOrder, statusFilter]);

  // Calculate summary stats
  const summaryStats = useMemo(() => {
    const totalAmount = filteredAndSortedPayments.reduce((sum, payment) => sum + payment.amount, 0);
    const totalQuantity = filteredAndSortedPayments.reduce((sum, payment) => sum + payment.quantity, 0);
    const avgDaysOverdue = filteredAndSortedPayments.length > 0
      ? Math.round(filteredAndSortedPayments.reduce((sum, payment) => sum + payment.daysOverdue, 0) / filteredAndSortedPayments.length)
      : 0;

    return { totalAmount, totalQuantity, avgDaysOverdue };
  }, [filteredAndSortedPayments]);

  const handleSort = (column: typeof sortBy) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  const getSeverityColor = (days: number) => {
    if (days >= 45) return 'text-red-700 bg-red-50 border-red-200';
    if (days >= 30) return 'text-orange-700 bg-orange-50 border-orange-200';
    return 'text-yellow-700 bg-yellow-50 border-yellow-200';
  };

  const getSeverityLabel = (days: number) => {
    if (days >= 45) return 'Critical';
    if (days >= 30) return 'High';
    return 'Medium';
  };

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-100 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            {title}
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            {filteredAndSortedPayments.length} overdue payments • {formatIndianCurrency(summaryStats.totalAmount)} total
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-red-50 p-4 rounded-lg border border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-red-700">Total Overdue</p>
              <p className="text-xl font-bold text-red-800">{formatIndianCurrency(summaryStats.totalAmount)}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
        </div>
        <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-orange-700">Avg Days Overdue</p>
              <p className="text-xl font-bold text-orange-800">{summaryStats.avgDaysOverdue} days</p>
            </div>
            <Calendar className="w-8 h-8 text-orange-500" />
          </div>
        </div>
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-700">Total Quantity</p>
              <p className="text-xl font-bold text-blue-800">{formatNumber(summaryStats.totalQuantity)} units</p>
            </div>
            <Package className="w-8 h-8 text-blue-500" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by dealer, invoice, or location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
        >
          <option value="all">All Overdue</option>
          <option value="critical">Critical (45+ days)</option>
          <option value="high">High (30-44 days)</option>
          <option value="medium">Medium (15-29 days)</option>
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('dealerName')}
              >
                Dealer
                {sortBy === 'dealerName' && (
                  <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                )}
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('amount')}
              >
                Amount
                {sortBy === 'amount' && (
                  <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                )}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Quantity
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('daysOverdue')}
              >
                Days Overdue
                {sortBy === 'daysOverdue' && (
                  <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                )}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Location
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Invoice
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredAndSortedPayments.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                  <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                  <p>No overdue payments found</p>
                  <p className="text-sm">Try adjusting your filters</p>
                </td>
              </tr>
            ) : (
              filteredAndSortedPayments.map((payment) => (
                <tr key={payment.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{payment.dealerName}</div>
                      {payment.transactionCount && payment.transactionCount > 1 && (
                        <div className="text-sm text-gray-500">{payment.transactionCount} transactions</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{formatIndianCurrency(payment.amount)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{formatNumber(payment.quantity)} units</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getSeverityColor(payment.daysOverdue)}`}>
                      {payment.daysOverdue} days ({getSeverityLabel(payment.daysOverdue)})
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-900">
                      <MapPin className="w-4 h-4 mr-1 text-gray-400" />
                      {[payment.city, payment.state].filter(Boolean).join(', ')}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{payment.invoiceNumber}</div>
                    <div className="text-sm text-gray-500">{payment.date}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => setSelectedPayment(payment)}
                      className="text-indigo-600 hover:text-indigo-900 mr-3"
                    >
                      <Eye className="w-4 h-4 inline mr-1" />
                      View
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Payment Detail Modal */}
      {selectedPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Payment Details</h3>
              <button
                onClick={() => setSelectedPayment(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-500">Dealer</label>
                <p className="text-sm text-gray-900">{selectedPayment.dealerName}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Amount</label>
                  <p className="text-sm font-semibold text-red-600">{formatIndianCurrency(selectedPayment.amount)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Quantity</label>
                  <p className="text-sm text-gray-900">{formatNumber(selectedPayment.quantity)} units</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Days Overdue</label>
                  <p className="text-sm font-semibold text-red-600">{selectedPayment.daysOverdue} days</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Invoice</label>
                  <p className="text-sm text-gray-900">{selectedPayment.invoiceNumber}</p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">Location</label>
                <p className="text-sm text-gray-900">{[selectedPayment.city, selectedPayment.state].filter(Boolean).join(', ')}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">Last Payment Date</label>
                <p className="text-sm text-gray-900">{selectedPayment.lastPaymentDate}</p>
              </div>

              {selectedPayment.contactInfo && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Contact</label>
                  <p className="text-sm text-gray-900">{selectedPayment.contactInfo}</p>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors">
                Send Reminder
              </button>
              <button className="flex-1 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors">
                Call Dealer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
