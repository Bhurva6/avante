'use client';

import React from 'react';
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
  ScatterChart,
  Scatter,
  AreaChart,
  Area,
  ComposedChart,
  Treemap,
} from 'recharts';

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316', '#eab308', '#84cc16', '#22c55e', '#14b8a6', '#06b6d4'];

// Format large numbers to Indian format
const formatIndianNumber = (value: number): string => {
  if (value >= 10000000) return `₹${(value / 10000000).toFixed(2)}Cr`;
  if (value >= 100000) return `₹${(value / 100000).toFixed(2)}L`;
  if (value >= 1000) return `₹${(value / 1000).toFixed(1)}K`;
  return `₹${value.toFixed(0)}`;
};

const formatTooltipValue = (value: number): string => {
  return `₹${value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

interface ChartProps {
  data: any[];
  title?: string;
  xKey: string;
  yKey: string;
  loading?: boolean;
}

export const RevenueLineChart: React.FC<ChartProps> = ({
  data,
  title = 'Revenue Trend',
  xKey,
  yKey,
  loading,
}) => {
  if (loading) return <ChartLoader title={title} />;
  if (!data || data.length === 0) return <ChartEmpty title={title} />;

  return (
    <div className="w-full h-80 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
      <h3 className="text-lg font-semibold mb-4 text-gray-900">{title}</h3>
      <ResponsiveContainer width="100%" height="85%">
        <LineChart data={data} margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey={xKey} tick={{ fill: '#374151', fontSize: 12 }} />
          <YAxis tickFormatter={formatIndianNumber} tick={{ fill: '#374151', fontSize: 12 }} />
          <Tooltip formatter={(value: number) => formatTooltipValue(value)} />
          <Legend />
          <Line type="monotone" dataKey={yKey} stroke="#6366f1" strokeWidth={3} dot={{ r: 4, fill: '#6366f1' }} activeDot={{ r: 6 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export const RevenueBarChart: React.FC<ChartProps> = ({
  data,
  title = 'Revenue by Category',
  xKey,
  yKey,
  loading,
}) => {
  if (loading) return <ChartLoader title={title} />;
  if (!data || data.length === 0) return <ChartEmpty title={title} />;

  return (
    <div className="w-full h-80 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
      <h3 className="text-lg font-semibold mb-4 text-gray-900">{title}</h3>
      <ResponsiveContainer width="100%" height="85%">
        <BarChart data={data} margin={{ top: 5, right: 30, left: 10, bottom: 60 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis 
            dataKey={xKey} 
            tick={{ fill: '#374151', fontSize: 10 }} 
            angle={-45} 
            textAnchor="end" 
            interval={0}
            height={60}
          />
          <YAxis tickFormatter={formatIndianNumber} tick={{ fill: '#374151', fontSize: 12 }} />
          <Tooltip formatter={(value: number) => formatTooltipValue(value)} />
          <Bar dataKey={yKey} fill="#6366f1" radius={[4, 4, 0, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export const HorizontalBarChart: React.FC<ChartProps> = ({
  data,
  title = 'Performance',
  xKey,
  yKey,
  loading,
}) => {
  if (loading) return <ChartLoader title={title} />;
  if (!data || data.length === 0) return <ChartEmpty title={title} />;

  return (
    <div className="w-full h-96 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
      <h3 className="text-lg font-semibold mb-4 text-gray-900">{title}</h3>
      <ResponsiveContainer width="100%" height="85%">
        <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 100, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis type="number" tickFormatter={formatIndianNumber} tick={{ fill: '#374151', fontSize: 12 }} />
          <YAxis 
            type="category" 
            dataKey={xKey} 
            tick={{ fill: '#374151', fontSize: 11 }} 
            width={95}
          />
          <Tooltip formatter={(value: number) => formatTooltipValue(value)} />
          <Bar dataKey={yKey} fill="#6366f1" radius={[0, 4, 4, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export const RevenuePieChart: React.FC<{ data: any[]; title?: string; loading?: boolean; dataKey: string; nameKey: string }> = ({
  data,
  title = 'Revenue Distribution',
  loading,
  dataKey,
  nameKey,
}) => {
  if (loading) return <ChartLoader title={title} />;
  if (!data || data.length === 0) return <ChartEmpty title={title} />;

  const total = data.reduce((sum, item) => sum + (item[dataKey] || 0), 0);

  return (
    <div className="w-full h-80 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
      <h3 className="text-lg font-semibold mb-4 text-gray-900">{title}</h3>
      <ResponsiveContainer width="100%" height="85%">
        <PieChart>
          <Pie 
            data={data} 
            dataKey={dataKey} 
            nameKey={nameKey} 
            cx="50%" 
            cy="50%" 
            innerRadius={40}
            outerRadius={80} 
            paddingAngle={2}
            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
            labelLine={{ stroke: '#374151' }}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(value: number) => formatTooltipValue(value)} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export const DonutChart: React.FC<{ data: any[]; title?: string; loading?: boolean; dataKey: string; nameKey: string; centerText?: string; legendBelow?: boolean }> = ({
  data,
  title = 'Distribution',
  loading,
  dataKey,
  nameKey,
  centerText,
  legendBelow = false,
}) => {
  if (loading) return <ChartLoader title={title} />;
  if (!data || data.length === 0) return <ChartEmpty title={title} />;

  // Increase height if legend is below to accommodate it
  const containerHeight = legendBelow ? 'h-auto' : 'h-80';
  const chartHeight = legendBelow ? '500px' : '85%';

  return (
    <div className={`w-full ${containerHeight} bg-white p-4 rounded-lg shadow-sm border border-gray-200`}>
      <h3 className="text-lg font-semibold mb-4 text-gray-900">{title}</h3>
      <ResponsiveContainer width="100%" height={chartHeight}>
        <PieChart>
          <Pie 
            data={data} 
            dataKey={dataKey} 
            nameKey={nameKey} 
            cx="50%" 
            cy={legendBelow ? "45%" : "50%"}
            innerRadius={50}
            outerRadius={80} 
            paddingAngle={3}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(value: number) => formatTooltipValue(value)} />
          <Legend 
            layout={legendBelow ? "horizontal" : "vertical"} 
            align={legendBelow ? "center" : "right"} 
            verticalAlign={legendBelow ? "bottom" : "middle"}
            wrapperStyle={legendBelow ? { paddingTop: '20px' } : {}}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export const AreaChartComponent: React.FC<ChartProps> = ({
  data,
  title = 'Trend Analysis',
  xKey,
  yKey,
  loading,
}) => {
  if (loading) return <ChartLoader title={title} />;
  if (!data || data.length === 0) return <ChartEmpty title={title} />;

  return (
    <div className="w-full h-80 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
      <h3 className="text-lg font-semibold mb-4 text-gray-900">{title}</h3>
      <ResponsiveContainer width="100%" height="85%">
        <AreaChart data={data} margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey={xKey} tick={{ fill: '#374151', fontSize: 12 }} />
          <YAxis tickFormatter={formatIndianNumber} tick={{ fill: '#374151', fontSize: 12 }} />
          <Tooltip formatter={(value: number) => formatTooltipValue(value)} />
          <Area type="monotone" dataKey={yKey} stroke="#6366f1" fill="url(#colorGradient)" strokeWidth={2} />
          <defs>
            <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0.1}/>
            </linearGradient>
          </defs>
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export const ComposedChartComponent: React.FC<{ data: any[]; title?: string; xKey: string; barKey: string; lineKey: string; loading?: boolean }> = ({
  data,
  title = 'Combined Analysis',
  xKey,
  barKey,
  lineKey,
  loading,
}) => {
  if (loading) return <ChartLoader title={title} />;
  if (!data || data.length === 0) return <ChartEmpty title={title} />;

  return (
    <div className="w-full h-80 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
      <h3 className="text-lg font-semibold mb-4 text-gray-900">{title}</h3>
      <ResponsiveContainer width="100%" height="85%">
        <ComposedChart data={data} margin={{ top: 5, right: 30, left: 10, bottom: 60 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey={xKey} tick={{ fill: '#374151', fontSize: 10 }} angle={-45} textAnchor="end" />
          <YAxis yAxisId="left" tickFormatter={formatIndianNumber} tick={{ fill: '#374151', fontSize: 12 }} />
          <YAxis yAxisId="right" orientation="right" tick={{ fill: '#374151', fontSize: 12 }} />
          <Tooltip formatter={(value: number, name: string) => [name === barKey ? formatTooltipValue(value) : value.toLocaleString(), name]} />
          <Legend />
          <Bar yAxisId="left" dataKey={barKey} fill="#6366f1" radius={[4, 4, 0, 0]} name="Revenue" />
          <Line yAxisId="right" type="monotone" dataKey={lineKey} stroke="#f97316" strokeWidth={2} name="Quantity" />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

export const HeatmapChart: React.FC<ChartProps> = ({
  data,
  title = 'Heatmap',
  xKey,
  yKey,
  loading,
}) => {
  if (loading) return <ChartLoader title={title} />;
  if (!data || data.length === 0) return <ChartEmpty title={title} />;

  return (
    <div className="w-full h-80 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
      <h3 className="text-lg font-semibold mb-4 text-gray-900">{title}</h3>
      <ResponsiveContainer width="100%" height="85%">
        <ScatterChart margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey={xKey} tick={{ fill: '#374151', fontSize: 12 }} />
          <YAxis dataKey={yKey} tick={{ fill: '#374151', fontSize: 12 }} />
          <Tooltip formatter={(value: number) => formatTooltipValue(value)} />
          <Scatter data={data} fill="#6366f1" />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
};

// Helper components
const ChartLoader: React.FC<{ title: string }> = ({ title }) => (
  <div className="w-full h-80 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
    <h3 className="text-lg font-semibold mb-4 text-gray-900">{title}</h3>
    <div className="h-64 flex items-center justify-center">
      <div className="flex flex-col items-center gap-2">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        <span className="text-gray-500 text-sm">Loading data...</span>
      </div>
    </div>
  </div>
);

const ChartEmpty: React.FC<{ title: string }> = ({ title }) => (
  <div className="w-full h-80 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
    <h3 className="text-lg font-semibold mb-4 text-gray-900">{title}</h3>
    <div className="h-64 flex items-center justify-center">
      <div className="text-center text-gray-500">
        <svg className="w-12 h-12 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <p>No data available</p>
      </div>
    </div>
  </div>
);

export default {
  RevenueLineChart,
  RevenueBarChart,
  HorizontalBarChart,
  RevenuePieChart,
  DonutChart,
  AreaChartComponent,
  ComposedChartComponent,
  HeatmapChart,
};
