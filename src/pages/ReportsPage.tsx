import { useCallback, useEffect, useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { AlertCircle, BarChart3, Download, RefreshCw, TrendingUp } from 'lucide-react';
import { StatCard } from '../components/ui/StatCard';
import { services } from '../services/repositories';
import { getReportsData, type ReportPeriodData, type ReportRange } from '../services/reports-service';
import type { DealStage } from '../types/domain';
import { formatCurrency } from '../utils/currency';

type Preset = '7' | '30' | '90' | 'year' | 'custom';
const stageColors: Record<DealStage, string> = { new: '#93c5fd', qualification: '#60a5fa', proposal: '#3b82f6', negotiation: '#2563eb', won: '#16a34a', lost: '#cbd5e1' };
const dateInput = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
const startForDays = (days: number, now: Date) => { const result = new Date(now); result.setHours(0, 0, 0, 0); result.setDate(result.getDate() - (days - 1)); return result; };
const defaultRange = (preset: Preset, now: Date): ReportRange => {
  const end = new Date(now); end.setHours(23, 59, 59, 999);
  if (preset === 'year') return { start: new Date(now.getFullYear(), 0, 1), end };
  const days = Number(preset);
  return { start: startForDays(Number.isFinite(days) ? days : 30, now), end };
};
const number = new Intl.NumberFormat('ru-KZ', { maximumFractionDigits: 0 });
const percent = (value: number) => `${new Intl.NumberFormat('ru-KZ', { maximumFractionDigits: 1 }).format(value)}%`;
const csvCell = (value: string | number) => `"${String(value).replaceAll('"', '""')}"`;

function downloadCsv(data: ReportPeriodData) {
  const rows: Array<Array<string | number>> = [
    ['Сводка продаж'], ['Показатель', 'Значение'],
    ['Выручка по выигранным сделкам', formatCurrency(data.summary.revenue)], ['Успешные сделки', data.summary.wonDeals], ['Активные сделки', data.summary.activeDeals], ['Средний чек', formatCurrency(data.summary.averageCheck)], ['Конверсия закрытых сделок', percent(data.summary.conversion)], [],
    ['Воронка сделок'], ['Этап', 'Количество', 'Сумма', 'Доля'], ...data.funnel.map((item) => [item.label, item.count, formatCurrency(item.amount), percent(item.share)]), [],
    ['Результаты сотрудников'], ['Сотрудник', 'Сделки', 'Успешные сделки', 'Выручка', 'Задачи', 'Выполнено задач', 'Выполнение'], ...data.employees.map((item) => [item.name, item.deals, item.wins, formatCurrency(item.revenue), item.tasks, item.completedTasks, percent(item.completionRate)]), [],
    ['Задачи'], ['Показатель', 'Значение'], ['Всего задач', data.tasks.total], ['Выполнено', data.tasks.completed], ['Ожидает или в работе', data.tasks.pending], ['Просрочено', data.tasks.overdue], ['Доля выполнения', percent(data.tasks.completionRate)], [],
    ['Задачи по приоритетам'], ['Приоритет', 'Количество'], ...data.tasks.priorities.map((item) => [item.label, item.count]),
  ];
  const csv = `\uFEFF${rows.map((row) => row.map(csvCell).join(';')).join('\r\n')}`;
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = `flowcrm-otchet-${dateInput(data.range.start)}-${dateInput(data.range.end)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

function Comparison({ current, previous, available, format = formatCurrency }: { current: number; previous: number; available: boolean; format?: (value: number) => string }) {
  if (!available) return <small className="report-comparison">Недостаточно данных для сравнения</small>;
  const delta = current - previous;
  const change = previous ? delta / Math.abs(previous) * 100 : null;
  return <small className={`report-comparison ${delta > 0 ? 'report-comparison--positive' : delta < 0 ? 'report-comparison--negative' : ''}`}>{delta > 0 ? '+' : ''}{format(delta)}{change === null ? '' : ` · ${change > 0 ? '+' : ''}${percent(change)}`} к прошлому периоду</small>;
}

export function ReportsPage() {
  const [preset, setPreset] = useState<Preset>('30');
  const [customStart, setCustomStart] = useState(() => dateInput(defaultRange('30', new Date()).start));
  const [customEnd, setCustomEnd] = useState(() => dateInput(new Date()));
  const [data, setData] = useState<ReportPeriodData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const range = useMemo(() => {
    if (preset !== 'custom') return defaultRange(preset, new Date());
    const start = new Date(`${customStart}T00:00:00`);
    const end = new Date(`${customEnd}T23:59:59.999`);
    return { start, end };
  }, [preset, customStart, customEnd]);
  const load = useCallback(async () => {
    if (!Number.isFinite(range.start.getTime()) || !Number.isFinite(range.end.getTime()) || range.start > range.end) {
      setError('Укажите корректный период отчёта.'); setLoading(false); return;
    }
    setLoading(true); setError(null);
    try { setData(await getReportsData(services, range)); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Не удалось загрузить отчёты.'); }
    finally { setLoading(false); }
  }, [range]);
  useEffect(() => {
    const timer = window.setTimeout(() => { void load(); }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const funnelTotal = data?.funnel.reduce((sum, item) => sum + item.count, 0) ?? 0;
  return <main className="main-content reports-page">
    <div className="reports-heading">
      <div><p className="eyebrow"><BarChart3 size={14} /> Аналитика команды</p><h2>Отчёты и аналитика</h2><p>Продажи, воронка и загрузка команды за выбранный период.</p></div>
      <button className="secondary-button" type="button" onClick={() => data && downloadCsv(data)} disabled={!data || loading}><Download size={16} />Экспорт CSV</button>
    </div>
    <section className="reports-toolbar" aria-label="Период отчёта">
      <div className="reports-presets">{([['7', '7 дней'], ['30', '30 дней'], ['90', '90 дней'], ['year', 'С начала года'], ['custom', 'Свой период']] as const).map(([value, label]) => <button type="button" key={value} className={preset === value ? 'reports-preset reports-preset--active' : 'reports-preset'} aria-pressed={preset === value} onClick={() => setPreset(value)}>{label}</button>)}</div>
      {preset === 'custom' && <div className="reports-custom-range"><label>С <input type="date" value={customStart} onChange={(event) => setCustomStart(event.target.value)} /></label><label>По <input type="date" value={customEnd} onChange={(event) => setCustomEnd(event.target.value)} /></label></div>}
      <button className="icon-button reports-refresh" type="button" aria-label="Обновить отчёты" onClick={() => void load()} disabled={loading}><RefreshCw size={16} /></button>
    </section>
    {error && <div className="state-message state-message--error" role="alert"><AlertCircle size={19} />{error}<button className="secondary-button" type="button" onClick={() => void load()}>Повторить</button></div>}
    {loading && <div className="loading-state" role="status"><span className="loading-spinner" />Собираем показатели…</div>}
    {!loading && data && <>
      <section className="stats-grid reports-stats" aria-label="Показатели продаж">
        <StatCard label="Выручка" value={formatCurrency(data.summary.revenue)} note="Успешные сделки периода" icon={TrendingUp} iconTone="green" />
        <StatCard label="Успешные сделки" value={number.format(data.summary.wonDeals)} note="Закрыто с результатом" icon={BarChart3} iconTone="blue" />
        <StatCard label="Активные сделки" value={number.format(data.summary.activeDeals)} note="В работе за период" icon={BarChart3} iconTone="blue" />
        <StatCard label="Средний чек" value={formatCurrency(data.summary.averageCheck)} note="По успешным сделкам" icon={TrendingUp} iconTone="amber" />
      </section>
      <section className="reports-comparisons" aria-label="Сравнение с предыдущим периодом">
        <div><span>Выручка</span><Comparison current={data.summary.revenue} previous={data.previous.revenue} available={data.comparisonAvailable} /></div>
        <div><span>Успешные сделки</span><Comparison current={data.summary.wonDeals} previous={data.previous.wonDeals} available={data.comparisonAvailable} /></div>
        <div><span>Конверсия</span><Comparison current={data.summary.conversion} previous={data.previous.conversion} available={data.comparisonAvailable} format={(value) => `${new Intl.NumberFormat('ru-KZ', { maximumFractionDigits: 1 }).format(value)} п.п.`} /></div>
      </section>
      <section className="reports-charts">
        <article className="report-panel report-revenue"><header><div><span>Динамика продаж</span><h3>Выручка по периодам</h3></div><strong>{formatCurrency(data.summary.revenue)}</strong></header>
          {data.revenue.some((point) => point.amount > 0) ? <div className="report-chart"><ResponsiveContainer width="100%" height="100%"><BarChart data={data.revenue} margin={{ top: 12, right: 8, left: 8, bottom: 2 }}><CartesianGrid stroke="#edf0f5" strokeDasharray="3 4" vertical={false} /><XAxis dataKey="label" tick={{ fill: '#738096', fontSize: 10 }} axisLine={false} tickLine={false} /><YAxis width={76} tickFormatter={(value: number) => formatCurrency(value)} tick={{ fill: '#738096', fontSize: 9 }} axisLine={false} tickLine={false} /><Tooltip formatter={(value) => [formatCurrency(Number(value)), 'Выручка']} labelStyle={{ color: '#27354a' }} contentStyle={{ border: '1px solid #e6eaf0', borderRadius: 9, fontSize: 11 }} /><Bar dataKey="amount" fill="#3778ed" radius={[5, 5, 0, 0]} maxBarSize={32} /></BarChart></ResponsiveContainer></div> : <div className="report-empty">За выбранный период успешных сделок пока нет.</div>}
        </article>
        <article className="report-panel report-funnel"><header><div><span>Этапы продаж</span><h3>Воронка сделок</h3></div><strong>{funnelTotal} сделок</strong></header>
          {funnelTotal ? <div className="funnel-content"><div className="funnel-chart"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={data.funnel.filter((item) => item.count > 0)} dataKey="count" nameKey="label" innerRadius="58%" outerRadius="82%" paddingAngle={3}>{data.funnel.filter((item) => item.count > 0).map((item) => <Cell key={item.stage} fill={stageColors[item.stage]} />)}</Pie><Tooltip formatter={(value, _name, props) => [`${value} · ${formatCurrency(Number(props.payload.amount))}`, 'Сделок']} /></PieChart></ResponsiveContainer><div className="funnel-center"><strong>{funnelTotal}</strong><span>сделок</span></div></div><div className="funnel-legend">{data.funnel.map((item) => <div key={item.stage}><i style={{ background: stageColors[item.stage] }} /><span>{item.label}</span><strong>{item.count}</strong><small>{formatCurrency(item.amount)}</small></div>)}</div></div> : <div className="report-empty">Нет сделок, созданных в выбранный период.</div>}
        </article>
      </section>
      <section className="report-panel report-team"><header><div><span>Результаты команды</span><h3>Эффективность сотрудников</h3></div><small>Сортировка по выручке</small></header>
        {data.employees.length ? <div className="report-table-wrap"><table><thead><tr><th>Сотрудник</th><th>Сделки</th><th>Успешно</th><th>Выручка</th><th>Задачи</th><th>Выполнено</th><th>Доля выполнения</th></tr></thead><tbody>{data.employees.map((employee) => <tr key={employee.id}><td>{employee.name}</td><td>{employee.deals}</td><td>{employee.wins}</td><td>{formatCurrency(employee.revenue)}</td><td>{employee.tasks}</td><td>{employee.completedTasks}</td><td>{percent(employee.completionRate)}</td></tr>)}</tbody></table></div> : <div className="report-empty">Нет данных по сотрудникам.</div>}
      </section>
      <section className="reports-task-grid">
        <article className="report-panel report-task-summary"><header><div><span>Рабочая нагрузка</span><h3>Задачи</h3></div><strong>{percent(data.tasks.completionRate)}</strong></header><div className="task-metric-grid"><div><strong>{data.tasks.total}</strong><span>Всего</span></div><div><strong>{data.tasks.completed}</strong><span>Выполнено</span></div><div><strong>{data.tasks.pending}</strong><span>Ожидают / в работе</span></div><div><strong>{data.tasks.overdue}</strong><span>Просрочено</span></div></div><div className="task-progress"><span style={{ width: `${Math.min(data.tasks.completionRate, 100)}%` }} /></div><small>Доля выполненных задач за период</small></article>
        <article className="report-panel report-priorities"><header><div><span>Распределение</span><h3>Задачи по приоритету</h3></div></header>{data.tasks.priorities.map((item) => <div className="priority-row" key={item.priority}><span>{item.label}</span><div><i style={{ width: `${data.tasks.total ? item.count / data.tasks.total * 100 : 0}%` }} /></div><strong>{item.count}</strong></div>)}</article>
      </section>
      <p className="reports-method"><strong>Как считаются показатели:</strong> выручка, успешные сделки и конверсия относятся к сделкам, обновлённым (закрытым) в периоде; выручка учитывает только успешные. Конверсия = успешные сделки / (успешные + закрытые без результата). Воронка, активные сделки и число назначенных сделок относятся к сделкам, созданным в периоде. Для сотрудника выручка учитывает успешные сделки, закрытые в периоде. Дата обновления используется как дата закрытия, так как отдельного поля закрытия в модели нет. Задачи относятся к периоду по дате создания.</p>
    </>}
  </main>;
}
