import { ArrowRight, Check, CirclePlus, MessageSquareText, RefreshCw, Sparkles } from 'lucide-react';
import { Link } from 'react-router';
import type { Activity, Employee } from '../../types/domain';

interface RecentActivityProps {
  activities: Activity[];
  employees: Employee[];
}

const activityIcon = {
  created: CirclePlus,
  updated: RefreshCw,
  completed: Check,
  commented: MessageSquareText,
  status_changed: Sparkles,
} as const;

function relativeTime(value: string): string {
  const minutes = Math.max(0, Math.floor((Date.now() - Date.parse(value)) / 60_000));
  if (minutes < 60) return `${minutes} мин. назад`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ч. назад`;
  const days = Math.floor(hours / 24);
  return `${days} дн. назад`;
}

export function RecentActivity({ activities, employees }: RecentActivityProps) {
  const employeesById = new Map(employees.map((employee) => [employee.id, employee]));

  return (
    <section className="panel activity-panel" aria-labelledby="recent-activity-title">
      <div className="panel-heading">
        <div><span className="eyebrow">Команда</span><h2 id="recent-activity-title">Последние события</h2></div>
        <Link className="icon-link" to="/reports" aria-label="Открыть отчёты"><ArrowRight size={17} /></Link>
      </div>
      {activities.length === 0 ? (
        <div className="empty-state"><span>Событий пока нет</span><small>История действий команды появится здесь.</small></div>
      ) : (
        <ul className="activity-list">
          {activities.map((activity) => {
            const Icon = activityIcon[activity.type];
            const employee = employeesById.get(activity.employeeId);
            return (
              <li className="activity-row" key={activity.id}>
                <span className={`activity-icon activity-icon--${activity.type}`}><Icon size={15} aria-hidden="true" /></span>
                <div className="activity-row__body"><strong>{activity.description}</strong><span>{employee?.fullName ?? 'Команда'} · {relativeTime(activity.createdAt)}</span></div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
