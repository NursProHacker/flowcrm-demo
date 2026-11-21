import { defaultAppSettings, type AppSettings } from '../types/settings';

const settingsKey = 'flowcrm:app-settings:v1';

export const settingsService = {
  get(): AppSettings {
    try {
      const stored = window.localStorage.getItem(settingsKey);
      if (!stored) return structuredClone(defaultAppSettings);
      const parsed: unknown = JSON.parse(stored);
      if (!parsed || typeof parsed !== 'object') return structuredClone(defaultAppSettings);
      const saved = parsed as Partial<AppSettings>;
      const language = saved.language === 'kk' || saved.language === 'en' ? saved.language : 'ru';
      const allowedZones = ['Asia/Qyzylorda', 'Asia/Almaty', 'Asia/Aqtobe', 'Asia/Atyrau', 'Asia/Oral', 'Asia/Aqtau'];
      const timeZone = allowedZones.includes(saved.timeZone ?? '') ? saved.timeZone! : defaultAppSettings.timeZone;
      return {
        ...defaultAppSettings,
        ...saved,
        language,
        locale: language === 'kk' ? 'kk-KZ' : language === 'en' ? 'en-KZ' : 'ru-KZ',
        timeZone,
        dateFormat: saved.dateFormat === 'dd.MM.yyyy' || saved.dateFormat === 'yyyy-MM-dd' ? saved.dateFormat : 'locale',
        profile: { ...defaultAppSettings.profile, ...saved.profile },
        notifications: { ...defaultAppSettings.notifications, ...saved.notifications },
      };
    } catch {
      return structuredClone(defaultAppSettings);
    }
  },
  save(settings: AppSettings): AppSettings {
    window.localStorage.setItem(settingsKey, JSON.stringify(settings));
    return settings;
  },
  reset(): void {
    window.localStorage.removeItem(settingsKey);
  },
};
