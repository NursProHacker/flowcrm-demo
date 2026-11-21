import { AlarmClock, ArrowRight, Circle, CircleCheck } from 'lucide-react';
import { Link } from 'react-router';
import type { Task } from '../../types/domain';
import { formatRegionTime, formatRegionDate } from '../../utils/region-format';

interface UpcomingTasksProps {
  tasks: Task[];
  employees: Array<{ id: string; fullName: string }>;
}

const priorityLabel = { urgent: 'Срочно', high: 'Высокий', medium: 'Обычный', low: 'Низкий' } as const;

export function UpcomingTasks({ tasks, employees }: UpcomingTasksProps) {
  const employeesById = new Map(employees.map((employee) => [employee.id, employee]));

  return (
    <section className="panel tasks-panel" aria-labelledby="upcoming-tasks-title">
      <div className="panel-heading">
        <div><span className="eyebrow"><AlarmClock size={14} aria-hidden="true" /> На контроле</span><h2 id="upcoming-tasks-title">Ближайшие задачи</h2></div>
        <Link className="icon-link" to="/tasks" aria-label="Перейти ко всем задачам"><ArrowRight size={17} /></Link>
      </div>
      {tasks.length === 0 ? (
        <div className="empty-state"><span>Нет ближайших задач</span><small>Здесь появятся ваши планы.</small></div>
      ) : (
        <ul className="task-list">
          {tasks.map((task) => {
            const due = new Date(task.dueDate);
            const isToday = due.toDateString() === new Date().toDateString();
            const employee = employeesById.get(task.assignedEmployeeId);
            return (
              <li className="task-row" key={task.id}>
                <span className="task-row__check" aria-hidden="true"><Circle size={17} /></span>
                <div className="task-row__body"><strong>{task.title}</strong><span>{task.description}</span></div>
                <div className="task-row__meta">
                  <span className={`priority priority--${task.priority}`}><i />{priorityLabel[task.priority]}</span>
                  <small>{isToday ? 'Сегодня' : formatRegionDate(due, { month: 'short', year: false })}, {formatRegionTime(due)}</small>
                </div>
                {employee && <span className="task-row__assignee" title={employee.fullName}>{employee.fullName.slice(0, 1)}</span>}
              </li>
            );
          })}
        </ul>
      )}
      <Link className="tasks-footer-link" to="/tasks"><CircleCheck size={15} aria-hidden="true" /> Открыть список задач <ArrowRight size={14} aria-hidden="true" /></Link>
    </section>
  );
}
