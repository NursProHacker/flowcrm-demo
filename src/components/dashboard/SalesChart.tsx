import { ArrowUpRight, ChartNoAxesCombined } from 'lucide-react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { SalesPoint } from '../../services/dashboard-service';
import { formatCurrency } from '../../utils/currency';

interface SalesChartProps {
  data: SalesPoint[];
}

function SalesTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <span>{label}</span>
      <strong>{formatCurrency(payload[0]?.value ?? 0)}</strong>
    </div>
  );
}

export function SalesChart({ data }: SalesChartProps) {
  const total = data.reduce((sum, point) => sum + point.amount, 0);

  return (
    <section className="panel sales-panel" aria-labelledby="sales-chart-title">
      <div className="panel-heading">
        <div>
          <span className="eyebrow"><ChartNoAxesCombined size={14} aria-hidden="true" /> Продажи</span>
          <h2 id="sales-chart-title">Динамика выручки</h2>
        </div>
        <div className="chart-summary">
          <strong>{formatCurrency(total)}</strong>
          <span className="chart-summary__trend"><ArrowUpRight size={14} aria-hidden="true" /> За 7 дней</span>
        </div>
      </div>
      <div className="sales-chart" role="img" aria-label="График выручки по дням за последние семь дней">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 8, left: -5, bottom: 0 }}>
            <defs>
              <linearGradient id="sales-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3778ed" stopOpacity={0.2} />
                <stop offset="90%" stopColor="#3778ed" stopOpacity={0.01} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="#edf0f5" strokeDasharray="3 4" />
            <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#8b95a7', fontSize: 12 }} dy={11} />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#8b95a7', fontSize: 11 }} tickFormatter={(value: number) => value === 0 ? '0' : `${Math.round(value / 1000)} тыс.`} />
            <Tooltip content={<SalesTooltip />} cursor={{ stroke: '#b8c8e6', strokeDasharray: '4 4' }} />
            <Area type="monotone" dataKey="amount" stroke="#3778ed" strokeWidth={2.5} fill="url(#sales-fill)" activeDot={{ r: 5, fill: '#3778ed', stroke: '#fff', strokeWidth: 3 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="chart-footnote"><span className="chart-legend-dot" /> Успешные сделки по дате закрытия</div>
    </section>
  );
}
