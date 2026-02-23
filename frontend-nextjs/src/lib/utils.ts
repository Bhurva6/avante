import { format, addDays, startOfMonth, endOfMonth } from 'date-fns';

export const formatDate = (date: Date | string): string => {
  return format(new Date(date), 'dd-MM-yyyy');
};

export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

export const formatIndianNumber = (value: number): string => {
  return new Intl.NumberFormat('en-IN').format(Math.round(value));
};

export const getQuickDateRange = (period: string): [string, string] => {
  const today = new Date();
  const start = new Date();

  switch (period) {
    case 'week':
      start.setDate(today.getDate() - 7);
      break;
    case 'month':
      start.setMonth(today.getMonth() - 1);
      break;
    case 'quarter':
      start.setMonth(today.getMonth() - 3);
      break;
    case 'year':
      start.setFullYear(today.getFullYear() - 1);
      break;
    default:
      start.setDate(today.getDate() - 30);
  }

  return [formatDate(start), formatDate(today)];
};
