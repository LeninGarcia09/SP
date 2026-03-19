import { useTranslation } from 'react-i18next';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { BurnChartData } from '@bizops/shared';

interface BurnChartProps {
  data: BurnChartData;
  metric: 'hours' | 'cost';
  onMetricChange: (m: 'hours' | 'cost') => void;
}

export function BurnChart({ data, metric, onMetricChange }: BurnChartProps) {
  const { t } = useTranslation();

  const chartData = data.dates.map((date, i) => ({
    date,
    ideal: data.ideal[i],
    actual: data.actual[i],
    scope: data.scope[i],
  }));

  const unit = metric === 'hours' ? 'h' : '$';

  return (
    <div className="rounded-lg border p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold">{t('burnChart.title')}</h4>
        <div className="flex gap-1 rounded-lg border p-0.5">
          <button
            className={`px-2 py-1 text-xs rounded ${metric === 'hours' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            onClick={() => onMetricChange('hours')}
          >
            {t('burnChart.hours')}
          </button>
          <button
            className={`px-2 py-1 text-xs rounded ${metric === 'cost' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            onClick={() => onMetricChange('cost')}
          >
            {t('burnChart.cost')}
          </button>
        </div>
      </div>

      {chartData.length > 1 ? (
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11 }}
              tickFormatter={(v: string) => {
                const d = new Date(v);
                return `${d.getMonth() + 1}/${d.getDate()}`;
              }}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fontSize: 11 }}
              tickFormatter={(v: number) => metric === 'cost' ? `$${v.toLocaleString()}` : `${v}h`}
            />
            <Tooltip
              formatter={(value: number, name: string) => [
                metric === 'cost' ? `$${value.toLocaleString()}` : `${value}${unit}`,
                t(`burnChart.${name}`),
              ]}
              labelFormatter={(label: string) => new Date(label).toLocaleDateString()}
            />
            <Legend formatter={(value: string) => t(`burnChart.${value}`)} />
            <Line
              type="monotone"
              dataKey="ideal"
              stroke="#94a3b8"
              strokeDasharray="5 5"
              dot={false}
              strokeWidth={2}
            />
            <Line
              type="monotone"
              dataKey="actual"
              stroke="#3b82f6"
              dot={false}
              strokeWidth={2}
            />
            <Line
              type="monotone"
              dataKey="scope"
              stroke="#e2e8f0"
              dot={false}
              strokeWidth={1}
              strokeDasharray="2 2"
            />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <div className="h-[280px] flex items-center justify-center text-sm text-muted-foreground">
          {t('burnChart.noData')}
        </div>
      )}
    </div>
  );
}
