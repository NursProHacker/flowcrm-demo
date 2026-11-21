import { createContext } from 'react';
import type { AppSettings } from '../types/settings';

export interface SettingsContextValue { settings: AppSettings; updateSettings: (changes: Partial<AppSettings>) => void; t: (text: string) => string; }
export const SettingsContext = createContext<SettingsContextValue | null>(null);
