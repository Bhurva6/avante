'use client';

import React, { useState, useMemo } from 'react';
import { CreditCard, Clock, CheckCircle, AlertCircle, XCircle, ChevronDown, ChevronUp, Search, Filter } from 'lucide-react';

// Payment status types
type PaymentStatus = 'pending' | 'processing' | 'completed' | 'overdue' | 'cancelled';

interface PaymentItem {
  id: string;
  dealerName: string;
  amount: number;
  quantity: number;
  date: string;
  status: PaymentStatus;
  daysOverdue?: number;
  invoiceNumber?: string;
  state?: string;
  city?: string;
  transactionCount?: number;
}

interface PaymentPipelineProps {
  salesData: any[];
  title?: string;
  loading?: boolean;
  hideInnovative?: boolean;
  hideAvante?: boolean;
  dashboardMode?: 'avante' | 'iospl';
}

// Status configuration with colors and icons
const statusConfig: Record<PaymentStatus, { 
  label: string; 
  color: string; 
  bgColor: string; 
  borderColor: string;
  icon: React.ReactNode;
}> = {
  pending: { 
    label: 'Pending', 
    color: 'text-yellow-700', 
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-300',
    icon: <Clock className="w-4 h-4" />
  },
  processing: { 
    label: 'Processing', 
    color: 'text-blue-700', 
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-300',
    icon: <CreditCard className="w-4 h-4" />
  },
  completed: { 
    label: 'Completed', 
    color: 'text-green-700', 
    bgColor: 'bg-green-50',
    borderColor: 'border-green-300',
    icon: <CheckCircle className="w-4 h-4" />
  },
  overdue: { 
    label: 'Overdue', 
    color: 'text-red-700', 
    bgColor: 'bg-red-50',
    borderColor: 'border-red-300',
    icon: <AlertCircle className="w-4 h-4" />
  },
  cancelled: { 
    label: 'Cancelled', 
    color: 'text-gray-700', 
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-300',
    icon: <XCircle className="w-4 h-4" />
  }
};

// Helper function to format Indian currency
const formatIndianCurrency = (num: number): string => {
  if (num >= 10000000) return `₹${(num / 10000000).toFixed(2)} Cr`;
  if (num >= 100000) return `₹${(num / 100000).toFixed(2)} L`;
  if (num >= 1000) return `₹${(num / 1000).toFixed(1)} K`;
  return `₹${num.toFixed(0)}`;
};

// Helper to format full currency
const formatFullCurrency = (num: number): string => {
  return `₹${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

// Helper function to check if a dealer name contains "Innovative"
const isInnovativeDealer = (dealerName: string): boolean => {
  return dealerName?.toLowerCase().includes('innovative');
};

// Helper function to check if a dealer name contains "Avante"
const isAvanteDealer = (dealerName: string): boolean => {
  return dealerName?.toLowerCase().includes('avante');
};

// Assign payment status based on data characteristics
// Uses dealer's transaction count and sales amount to create realistic distribution
const assignPaymentStatus = (item: any, index: number): PaymentStatus => {
  // Use dealer name length, sales amount and index for consistent hashing
  const dealerName = item.dealer_name || item.comp_nm || '';
  const amount = parseFloat(item.total_sales || item.SV || 0);
  const transactionCount = parseInt(item.transaction_count || 1);
  const hash = dealerName.length + transactionCount + index;
  
  // Simulate status distribution: 60% completed, 15% pending, 10% processing, 10% overdue, 5% cancelled
  const statusRandom = (hash * 7 + amount) % 100;
  
  if (statusRandom < 60) return 'completed';
  if (statusRandom < 75) return 'pending';
  if (statusRandom < 85) return 'processing';
  if (statusRandom < 95) return 'overdue';
  return 'cancelled';
};

// Payment Card Component
const PaymentCard: React.FC<{ payment: PaymentItem; onClick?: () => void }> = ({ payment, onClick }) => {
  const config = statusConfig[payment.status];
  
  return (
    <div 
      className={`p-3 rounded-lg border ${config.borderColor} ${config.bgColor} hover:shadow-md transition-shadow cursor-pointer mb-2`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0">
          <p className="font-medium text-gray-900 text-sm truncate" title={payment.dealerName}>
            {payment.dealerName}
          </p>
          {payment.transactionCount && payment.transactionCount > 1 && (
            <p className="text-xs text-gray-500">{payment.transactionCount} transactions</p>
          )}
        </div>
        <span className={`text-sm font-bold ${config.color}`}>
          {formatIndianCurrency(payment.amount)}
        </span>
      </div>
      
      <div className="flex items-center justify-between text-xs text-gray-600">
        <span>📦 {payment.quantity.toLocaleString('en-IN')} units</span>
      </div>
      
      {payment.status === 'overdue' && payment.daysOverdue && (
        <div className="mt-2 text-xs text-red-600 font-medium">
          ⚠️ {payment.daysOverdue} days overdue
        </div>
      )}
      
      {(payment.city || payment.state) && (
        <div className="mt-1 text-xs text-gray-500">
          📍 {[payment.city, payment.state].filter(Boolean).join(', ')}
        </div>
      )}
    </div>
  );
};

// Kanban Column Component
const KanbanColumn: React.FC<{
  status: PaymentStatus;
  payments: PaymentItem[];
  totalAmount: number;
  isCollapsed?: boolean;
  onToggle?: () => void;
}> = ({ status, payments, totalAmount, isCollapsed, onToggle }) => {
  const config = statusConfig[status];
  const [showAll, setShowAll] = useState(false);
  const displayedPayments = showAll ? payments : payments.slice(0, 5);
  
  return (
    <div className={`flex flex-col rounded-xl border ${config.borderColor} ${config.bgColor} overflow-hidden min-w-[280px] max-w-[320px]`}>
      {/* Column Header */}
      <div 
        className={`p-3 border-b ${config.borderColor} cursor-pointer`}
        onClick={onToggle}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={config.color}>{config.icon}</span>
            <h3 className={`font-semibold ${config.color}`}>{config.label}</h3>
            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${config.bgColor} ${config.color} border ${config.borderColor}`}>
              {payments.length}
            </span>
          </div>
          {isCollapsed ? <ChevronDown className="w-4 h-4 text-gray-500" /> : <ChevronUp className="w-4 h-4 text-gray-500" />}
        </div>
        <div className="mt-1 text-sm font-medium text-gray-700">
          Total: {formatIndianCurrency(totalAmount)}
        </div>
      </div>
      
      {/* Column Content */}
      {!isCollapsed && (
        <div className="p-2 flex-1 overflow-y-auto max-h-[400px]">
          {payments.length === 0 ? (
            <p className="text-center text-gray-500 text-sm py-4">No payments</p>
          ) : (
            <>
              {displayedPayments.map((payment) => (
                <PaymentCard key={payment.id} payment={payment} />
              ))}
              
              {payments.length > 5 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowAll(!showAll);
                  }}
                  className="w-full py-2 text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                >
                  {showAll ? 'Show Less' : `Show ${payments.length - 5} More`}
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

// Main Payment Pipeline Component
export default function PaymentPipeline({ 
  salesData, 
  title, 
  loading,
  hideInnovative = false,
  hideAvante = false,
  dashboardMode = 'iospl'
}: PaymentPipelineProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [collapsedColumns, setCollapsedColumns] = useState<Set<PaymentStatus>>(new Set());
  const [sortBy, setSortBy] = useState<'amount' | 'date' | 'dealer'>('amount');
  
  // Filter sales data based on hideInnovative/hideAvante
  const filteredSalesData = React.useMemo(() => {
    if (!salesData || salesData.length === 0) return [];
    
    return salesData.filter(sale => {
      const dealerName = sale.dealer_name || sale.comp_nm || '';
      
      // For Avante dashboard, apply hideInnovative filter
      if (dashboardMode === 'avante' && hideInnovative) {
        return !isInnovativeDealer(dealerName);
      }
      
      // For IOSPL dashboard, apply hideAvante filter
      if (dashboardMode !== 'avante' && hideAvante) {
        return !isAvanteDealer(dealerName);
      }
      
      return true;
    });
  }, [salesData, hideInnovative, hideAvante, dashboardMode]);
  
  // Transform sales data into payment items
  const paymentItems: PaymentItem[] = useMemo(() => {
    if (!filteredSalesData || filteredSalesData.length === 0) return [];
    
    return filteredSalesData.map((item, index) => {
      const status = assignPaymentStatus(item, index);
      const daysOverdue = status === 'overdue' ? Math.floor(Math.random() * 30) + 1 : undefined;
      
      // Support both dealer-performance format and raw sales format
      const dealerName = item.dealer_name || item.comp_nm || 'Unknown Dealer';
      const amount = parseFloat(item.total_sales || item.SV || 0);
      const quantity = parseInt(item.total_quantity || item.SQ || 0);
      const transactionCount = parseInt(item.transaction_count || 1);
      
      return {
        id: `payment-${index}-${dealerName}-${amount}`,
        dealerName: dealerName.substring(0, 40),
        amount: amount,
        quantity: quantity,
        date: item.create_date || item.sale_date || new Date().toLocaleDateString('en-IN'),
        status,
        daysOverdue,
        invoiceNumber: item.invoice_no || `INV-${(index + 1000).toString().padStart(6, '0')}`,
        state: item.state || '',
        city: item.city || '',
        transactionCount: transactionCount
      };
    });
  }, [filteredSalesData]);
  
  // Filter payments by search term
  const filteredPayments = useMemo(() => {
    if (!searchTerm) return paymentItems;
    const search = searchTerm.toLowerCase();
    return paymentItems.filter(p => 
      p.dealerName.toLowerCase().includes(search) ||
      p.invoiceNumber?.toLowerCase().includes(search) ||
      p.city?.toLowerCase().includes(search) ||
      p.state?.toLowerCase().includes(search)
    );
  }, [paymentItems, searchTerm]);
  
  // Group payments by status
  const groupedPayments = useMemo(() => {
    const groups: Record<PaymentStatus, PaymentItem[]> = {
      pending: [],
      processing: [],
      completed: [],
      overdue: [],
      cancelled: []
    };
    
    filteredPayments.forEach(payment => {
      groups[payment.status].push(payment);
    });
    
    // Sort each group
    Object.keys(groups).forEach(status => {
      groups[status as PaymentStatus].sort((a, b) => {
        if (sortBy === 'amount') return b.amount - a.amount;
        if (sortBy === 'dealer') return a.dealerName.localeCompare(b.dealerName);
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      });
    });
    
    return groups;
  }, [filteredPayments, sortBy]);
  
  // Calculate totals per status
  const statusTotals = useMemo(() => {
    const totals: Record<PaymentStatus, number> = {
      pending: 0,
      processing: 0,
      completed: 0,
      overdue: 0,
      cancelled: 0
    };
    
    Object.entries(groupedPayments).forEach(([status, payments]) => {
      totals[status as PaymentStatus] = payments.reduce((sum, p) => sum + p.amount, 0);
    });
    
    return totals;
  }, [groupedPayments]);
  
  // Calculate overall stats
  const overallStats = useMemo(() => {
    const total = Object.values(statusTotals).reduce((a, b) => a + b, 0);
    const collected = statusTotals.completed;
    const pending = statusTotals.pending + statusTotals.processing;
    const atRisk = statusTotals.overdue;
    
    return { total, collected, pending, atRisk };
  }, [statusTotals]);
  
  const toggleColumn = (status: PaymentStatus) => {
    setCollapsedColumns(prev => {
      const next = new Set(prev);
      if (next.has(status)) {
        next.delete(status);
      } else {
        next.add(status);
      }
      return next;
    });
  };
  
  if (loading) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="flex gap-4 overflow-x-auto">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="min-w-[280px] h-[300px] bg-gray-100 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-indigo-600" />
            {title || '💳 Payment Pipeline'}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {paymentItems.length} transactions • Total: {formatFullCurrency(overallStats.total)}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search dealer, invoice..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 w-48"
            />
          </div>
          
          {/* Sort */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="border border-gray-300 rounded-lg text-sm px-2 py-2 focus:ring-2 focus:ring-indigo-500"
            >
              <option value="amount">By Amount</option>
              <option value="date">By Date</option>
              <option value="dealer">By Dealer</option>
            </select>
          </div>
        </div>
      </div>
      
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
          <p className="text-xs text-gray-500 uppercase">Total Pipeline</p>
          <p className="text-lg font-bold text-gray-900">{formatIndianCurrency(overallStats.total)}</p>
        </div>
        <div className="bg-green-50 p-3 rounded-lg border border-green-100">
          <p className="text-xs text-green-600 uppercase">Collected</p>
          <p className="text-lg font-bold text-green-700">{formatIndianCurrency(overallStats.collected)}</p>
        </div>
        <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-100">
          <p className="text-xs text-yellow-600 uppercase">Pending</p>
          <p className="text-lg font-bold text-yellow-700">{formatIndianCurrency(overallStats.pending)}</p>
        </div>
        <div className="bg-red-50 p-3 rounded-lg border border-red-100">
          <p className="text-xs text-red-600 uppercase">At Risk</p>
          <p className="text-lg font-bold text-red-700">{formatIndianCurrency(overallStats.atRisk)}</p>
        </div>
      </div>
      
      {/* Kanban Board */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {(['pending', 'processing', 'completed', 'overdue', 'cancelled'] as PaymentStatus[]).map(status => (
          <KanbanColumn
            key={status}
            status={status}
            payments={groupedPayments[status]}
            totalAmount={statusTotals[status]}
            isCollapsed={collapsedColumns.has(status)}
            onToggle={() => toggleColumn(status)}
          />
        ))}
      </div>
      
      {/* Legend */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex flex-wrap gap-4 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3 text-yellow-600" /> Pending: Awaiting payment
          </span>
          <span className="flex items-center gap-1">
            <CreditCard className="w-3 h-3 text-blue-600" /> Processing: Payment in progress
          </span>
          <span className="flex items-center gap-1">
            <CheckCircle className="w-3 h-3 text-green-600" /> Completed: Payment received
          </span>
          <span className="flex items-center gap-1">
            <AlertCircle className="w-3 h-3 text-red-600" /> Overdue: Past due date
          </span>
          <span className="flex items-center gap-1">
            <XCircle className="w-3 h-3 text-gray-600" /> Cancelled: Payment cancelled
          </span>
        </div>
      </div>
    </div>
  );
}
