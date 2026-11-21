import { CalendarDays, CircleAlert, ContactRound, TrendingUp, UsersRound, WalletCards } from 'lucide-react';
import { useOutletContext } from 'react-router';
import { DealsStatusChart } from '../components/dashboard/DealsStatusChart';
import { RecentActivity } from '../components/dashboard/RecentActivity';
import { RecentDeals } from '../components/dashboard/RecentDeals';
import { SalesChart } from '../components/dashboard/SalesChart';
import { UpcomingTasks } from '../components/dashboard/UpcomingTasks';
import { UpcomingEvents } from '../components/dashboard/UpcomingEvents';
import { StatCard } from '../components/ui/StatCard';
import type { DashboardState } from '../hooks/useDashboardSnapshot';
import { formatCurrency } from '../utils/currency';
import { useAppSettings } from '../contexts/useAppSettings';


export function DashboardPage() {
  const { state } = useOutletContext<{ state: DashboardState }>();
  const { settings, t } = useAppSettings();
  const amountFormat = new Intl.NumberFormat(settings.locale, { maximumFractionDigits: 0 });

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
          <p className="page-date">{new Intl.DateTimeFormat(settings.locale, { weekday: 'long', day: 'numeric', month: 'long', timeZone: settings.timeZone }).format(new Date())}</p>
          <h2>{t('Добрый день')}, {settings.profile.fullName.split(' ')[0]}</h2>
          <p className="page-intro__description">{t('Вот что происходит в вашей команде сегодня.')}</p>
        </div>
        <div className="demo-badge"><span />{t('Демонстрационные данные')}</div>
      </div>

      <section className="stats-grid" aria-label="Ключевые показатели">
        <StatCard label={t('Всего контактов')} value={amountFormat.format(snapshot.contactsCount)} note={t('В базе клиентов')} icon={UsersRound} iconTone="blue" />
        <StatCard label={t('Активные сделки')} value={amountFormat.format(snapshot.activeDealsCount)} note={t('В работе команды')} icon={ContactRound} iconTone="blue" />
        <StatCard label={t('Выручка')} value={formatCurrency(snapshot.revenue)} note={t('По успешным сделкам')} icon={WalletCards} iconTone="green" />
        <StatCard label={t('Задачи на сегодня')} value={amountFormat.format(snapshot.tasksDueTodayCount)} note={t(todayTasksLabel)} icon={CalendarDays} iconTone="amber" />
      </section>

      <section className="task-stats-inline" aria-label="Показатели задач">
        <span>Задач: <strong>{snapshot.tasksCount}</strong></span>
        <span>На сегодня: <strong>{snapshot.tasksDueTodayCount}</strong></span>
        <span>Выполнено: <strong>{snapshot.completedTasksCount}</strong></span>
        <span>Просрочено: <strong>{snapshot.overdueTasksCount}</strong></span>
      </section>

      <section className="dashboard-charts" aria-label="Аналитика продаж">
        <SalesChart data={snapshot.sales} />
        <DealsStatusChart data={snapshot.dealStatuses} />
      </section>

      <section className="dashboard-bottom" aria-label="Сводка команды">
        <RecentDeals deals={snapshot.recentDeals} />
        <div className="dashboard-side-column">
          <UpcomingTasks tasks={snapshot.upcomingTasks} employees={snapshot.employees} />
          <UpcomingEvents events={snapshot.upcomingEvents} employees={snapshot.employees} />
          <RecentActivity activities={snapshot.recentActivities} employees={snapshot.employees} />
        </div>
      </section>

      <div className="dashboard-note"><TrendingUp size={15} aria-hidden="true" /> {t('Показатели и карточки на этой странице — вымышленные демонстрационные данные.')}</div>
    </main>
  );
}
