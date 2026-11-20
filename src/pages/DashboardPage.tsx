import { CalendarDays, CircleAlert, ContactRound, TrendingUp, UsersRound, WalletCards } from 'lucide-react';
import { useOutletContext } from 'react-router';
import { DealsStatusChart } from '../components/dashboard/DealsStatusChart';
import { RecentActivity } from '../components/dashboard/RecentActivity';
import { RecentDeals } from '../components/dashboard/RecentDeals';
import { SalesChart } from '../components/dashboard/SalesChart';
import { UpcomingTasks } from '../components/dashboard/UpcomingTasks';
import { StatCard } from '../components/ui/StatCard';
import type { DashboardState } from '../hooks/useDashboardSnapshot';
import { formatCurrency } from '../utils/currency';

const amountFormat = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 });
const dateFormat = new Intl.DateTimeFormat('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' });

export function DashboardPage() {
  const { state } = useOutletContext<{ state: DashboardState }>();

  if (state.status === 'loading') {
    return <main className="main-content"><div className="loading-state" role="status"><span className="loading-spinner" />Загружаем обзор…</div></main>;
  }
  if (state.status === 'error') {
    return <main className="main-content"><div className="state-message state-message--error" role="alert"><CircleAlert size={21} />{state.message}</div></main>;
  }

  const { snapshot } = state;
  const todayTasksLabel = snapshot.tasksDueTodayCount === 1 ? 'задача сегодня' : snapshot.tasksDueTodayCount < 5 ? 'задачи сегодня' : 'задач сегодня';

  return (
    <main className="main-content dashboard-page">
      <div className="page-intro">
        <div>
          <p className="page-date">{dateFormat.format(new Date())}</p>
          <h2>Добрый день, Мария</h2>
          <p className="page-intro__description">Вот что происходит в вашей команде сегодня.</p>
        </div>
        <div className="demo-badge"><span />Демонстрационные данные</div>
      </div>

      <section className="stats-grid" aria-label="Ключевые показатели">
        <StatCard label="Всего контактов" value={amountFormat.format(snapshot.contactsCount)} note="В базе клиентов" icon={UsersRound} iconTone="blue" />
        <StatCard label="Активные сделки" value={amountFormat.format(snapshot.activeDealsCount)} note="В работе команды" icon={ContactRound} iconTone="blue" />
        <StatCard label="Выручка" value={formatCurrency(snapshot.revenue)} note="По успешным сделкам" icon={WalletCards} iconTone="green" />
        <StatCard label="Задачи на сегодня" value={amountFormat.format(snapshot.tasksDueTodayCount)} note={todayTasksLabel} icon={CalendarDays} iconTone="amber" />
      </section>

      <section className="dashboard-charts" aria-label="Аналитика продаж">
        <SalesChart data={snapshot.sales} />
        <DealsStatusChart data={snapshot.dealStatuses} />
      </section>

      <section className="dashboard-bottom" aria-label="Сводка команды">
        <RecentDeals deals={snapshot.recentDeals} />
        <div className="dashboard-side-column">
          <UpcomingTasks tasks={snapshot.upcomingTasks} employees={snapshot.employees} />
          <RecentActivity activities={snapshot.recentActivities} employees={snapshot.employees} />
        </div>
      </section>

      <div className="dashboard-note"><TrendingUp size={15} aria-hidden="true" /> Показатели и карточки на этой странице — вымышленные демонстрационные данные.</div>
    </main>
  );
}
