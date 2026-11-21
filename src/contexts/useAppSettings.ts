import { useContext } from 'react';
import { SettingsContext } from './settings-context';

export function useAppSettings() {
  const value = useContext(SettingsContext);
  if (!value) throw new Error('SettingsProvider не подключён.');
  return value;
}
