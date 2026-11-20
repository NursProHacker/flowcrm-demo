import { ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router';
import type { DealStage } from '../../types/domain';
import type { RecentDealItem } from '../../services/dashboard-service';
import { formatCurrency } from '../../utils/currency';

interface RecentDealsProps {
  deals: RecentDealItem[];
}

const stageLabels: Record<DealStage, string> = {
  new: 'Новая',
  qualification: 'Квалификация',
  proposal: 'Предложение',
  negotiation: 'Переговоры',
  won: 'Успешно',
  lost: 'Закрыта',
};

const dateFormat = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short' });

export function RecentDeals({ deals }: RecentDealsProps) {
  return (
    <section className="panel deals-panel" aria-labelledby="recent-deals-title">
      <div className="panel-heading">
        <div><span className="eyebrow">В работе</span><h2 id="recent-deals-title">Последние сделки</h2></div>
        <Link className="text-link" to="/deals">Все сделки <ArrowUpRight size={15} aria-hidden="true" /></Link>
      </div>
      {deals.length === 0 ? (
        <div className="empty-state"><span>Пока нет сделок</span><small>Новые сделки появятся здесь.</small></div>
      ) : (
        <div className="table-scroll">
          <table className="deals-table">
            <thead><tr><th>Сделка</th><th>Контакт</th><th>Сумма</th><th>Этап</th><th>Обновлена</th><th><span className="sr-only">Действие</span></th></tr></thead>
            <tbody>
              {deals.map(({ deal, contact, employee }) => (
                <tr key={deal.id}>
                  <td><div className="deal-title-cell"><span className="deal-avatar">{deal.title.slice(0, 1).toLocaleUpperCase('ru-RU')}</span><strong>{deal.title}</strong></div></td>
                  <td><div className="contact-cell"><strong>{contact?.fullName ?? 'Без контакта'}</strong><small>{contact?.company ?? '—'}</small></div></td>
                  <td className="amount-cell">{formatCurrency(deal.amount)}</td>
                  <td><span className={`stage-badge stage-badge--${deal.stageId}`}><i />{stageLabels[deal.stageId]}</span></td>
                  <td className="date-cell">{dateFormat.format(new Date(deal.updatedAt))}</td>
                  <td><span className="table-avatar" title={employee?.fullName ?? 'Ответственный'}>{employee?.fullName.slice(0, 1) ?? '—'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
