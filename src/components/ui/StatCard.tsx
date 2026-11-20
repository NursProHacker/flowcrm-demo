import { ArrowDownRight, ArrowUpRight, type LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string;
  note: string;
  trend?: string;
  trendDirection?: 'up' | 'down' | 'neutral';
  icon: LucideIcon;
  iconTone?: 'blue' | 'green' | 'amber' | 'violet';
}

export function StatCard({
  label,
  value,
  note,
  trend,
  trendDirection = 'neutral',
  icon: Icon,
  iconTone = 'blue',
}: StatCardProps) {
  const TrendIcon = trendDirection === 'down' ? ArrowDownRight : ArrowUpRight;

  return (
    <article className="stat-card">
      <div className="stat-card__top">
        <span className="stat-card__label">{label}</span>
        <span className={`stat-card__icon stat-card__icon--${iconTone}`}><Icon size={19} strokeWidth={1.9} aria-hidden="true" /></span>
      </div>
      <div className="stat-card__value-row">
        <strong className="stat-card__value">{value}</strong>
        {trend && <span className={`stat-trend stat-trend--${trendDirection}`}><TrendIcon size={14} aria-hidden="true" />{trend}</span>}
      </div>
      <span className="stat-card__note">{note}</span>
    </article>
  );
}
