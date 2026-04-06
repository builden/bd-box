// =============================================================================
// 测试组件：统计卡片
// Props：title, value, trend, change, period, isLoading
// =============================================================================
export interface StatsCardProps {
  title: string;
  value: string | number;
  trend: 'up' | 'down' | 'neutral';
  change?: number;
  period?: string;
  isLoading?: boolean;
  format?: 'number' | 'currency' | 'percentage';
}

export function StatsCard({ title, value, trend, change, period, format = 'number' }: StatsCardProps) {
  const trendColors = {
    up: 'text-green-500',
    down: 'text-red-500',
    neutral: 'text-gray-500',
  };

  const formattedValue = format === 'currency' ? `¥${value}` : format === 'percentage' ? `${value}%` : value;

  return (
    <div className="card" data-stats-title={title}>
      <p className="text-sm text-gray-500">{title}</p>
      <p className="text-2xl font-bold mt-1">{formattedValue}</p>
      {change !== undefined && (
        <p className={`text-sm ${trendColors[trend]}`}>
          {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'} {change}%
          {period && <span className="text-gray-400"> {period}</span>}
        </p>
      )}
    </div>
  );
}
