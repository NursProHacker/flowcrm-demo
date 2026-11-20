import { CalendarDays, MapPin } from 'lucide-react';
import { Link } from 'react-router';
import type { CalendarEvent, Employee } from '../../types/domain';

export function UpcomingEvents({ events, employees }: { events: CalendarEvent[]; employees: Employee[] }) {
  const employeesById = new Map(employees.map((employee) => [employee.id, employee]));
  const dateFormat = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  return <section className="panel upcoming-events-panel" aria-labelledby="upcoming-events-title">
    <div className="panel-heading"><div><span className="eyebrow"><CalendarDays size={14} aria-hidden="true"/> В расписании</span><h2 id="upcoming-events-title">Ближайшие события</h2></div><Link className="icon-link" to="/calendar" aria-label="Открыть календарь"><CalendarDays size={16}/></Link></div>
    {events.length === 0 ? <div className="empty-state"><span>Нет запланированных событий</span><small>Создайте событие в календаре.</small></div> : <ul className="upcoming-events-list">{events.map((event) => <li key={event.id}><span className={`upcoming-event-mark upcoming-event-mark--${event.type ?? 'other'}`} aria-hidden="true"/><div><strong>{event.title}</strong><small>{dateFormat.format(new Date(event.startAt))} · {employeesById.get(event.assignedEmployeeId ?? '')?.fullName ?? 'Ответственный не назначен'}</small>{event.location && <small><MapPin size={12}/>{event.location}</small>}</div></li>)}</ul>}
  </section>;
}
