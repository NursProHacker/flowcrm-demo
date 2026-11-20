import { useEffect, useState } from 'react';
import { getDashboardSnapshot, type DashboardSnapshot } from '../services/dashboard-service';
import { services } from '../services/repositories';

export type DashboardState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; snapshot: DashboardSnapshot };

export function useDashboardSnapshot(): DashboardState {
  const [state, setState] = useState<DashboardState>({ status: 'loading' });

  useEffect(() => {
    let active = true;

    getDashboardSnapshot(services)
      .then((snapshot) => {
        if (active) setState({ status: 'ready', snapshot });
      })
      .catch(() => {
        if (active) {
          setState({
            status: 'error',
            message: 'Не удалось загрузить данные. Проверьте локальное хранилище и обновите страницу.',
          });
        }
      });

    return () => {
      active = false;
    };
  }, []);

  return state;
}
