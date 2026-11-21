export type ThemePreference = 'light' | 'dark' | 'system';
export type AppLanguage = 'ru' | 'kk' | 'en';
export type AppCurrency = 'KZT' | 'USD' | 'EUR' | 'RUB';
export type DateFormatPreference = 'locale' | 'dd.MM.yyyy' | 'MM/dd/yyyy' | 'yyyy-MM-dd';
export type TimeFormatPreference = '24h' | '12h';

export interface ProfileSettings {
  employeeId: string;
  fullName: string;
  jobTitle: string;
  email: string;
  phone: string;
  avatarInitials: string;
}

export interface NotificationPreferences {
  taskDue: boolean;
  overdueTasks: boolean;
  upcomingEvents: boolean;
  dealStageChanges: boolean;
}

export interface AppSettings {
  profile: ProfileSettings;
  theme: ThemePreference;
  language: AppLanguage;
  locale: 'ru-KZ' | 'kk-KZ' | 'en-KZ';
  dateFormat: DateFormatPreference;
  timeFormat: TimeFormatPreference;
  timeZone: string;
  currency: AppCurrency;
  notifications: NotificationPreferences;
}

export const defaultAppSettings: AppSettings = {
  profile: { employeeId: 'employee-1', fullName: 'Мария Смирнова', jobTitle: 'Руководитель продаж', email: 'maria@example.test', phone: '+7 000 100-20-30', avatarInitials: 'МС' },
  theme: 'light', language: 'ru', locale: 'ru-KZ', dateFormat: 'locale', timeFormat: '24h', timeZone: 'Asia/Qyzylorda', currency: 'KZT',
  notifications: { taskDue: true, overdueTasks: true, upcomingEvents: true, dealStageChanges: true },
};
