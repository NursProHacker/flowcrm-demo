import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import type { DealStatusSummary } from '../../services/dashboard-service';

interface DealsStatusChartProps {
  data: DealStatusSummary[];
}

function StatusTooltip({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number }> }) {
  const item = payload?.[0];
  if (!active || !item) return null;
  return <div className="chart-tooltip"><span>{item.name}</span><strong>{item.value} сделок</strong></div>;
}

export function DealsStatusChart({ data }: DealsStatusChartProps) {
  const total = data.reduce((sum, item) => sum + item.count, 0);
  const chartData = data.map((item) => ({ name: item.label, value: item.count, color: item.color }));

  return (
    <section className="panel status-panel" aria-labelledby="status-chart-title">
      <div className="panel-heading panel-heading--compact">
        <div><span className="eyebrow">Воронка</span><h2 id="status-chart-title">Сделки по этапам</h2></div>
        <span className="panel-period">Всего: {total}</span>
      </div>
      <div className="status-chart-wrap">
        <div className="status-chart" role="img" aria-label="Распределение сделок по этапам">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={chartData} dataKey="value" nameKey="name" innerRadius={57} outerRadius={78} paddingAngle={3} stroke="none">
                {chartData.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
              </Pie>
              <Tooltip content={<StatusTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="status-chart-center"><strong>{total}</strong><span>сделок</span></div>
        </div>
        <ul className="status-legend">
          {data.map((item) => (
            <li key={item.stage}>
              <span className="status-legend__name"><i style={{ backgroundColor: item.color }} />{item.label}</span>
              <strong>{item.count}</strong>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
