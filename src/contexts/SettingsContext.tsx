import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { configureCurrency } from '../utils/currency';
import { settingsService } from '../services/settings-service';
import type { AppSettings } from '../types/settings';
import { SettingsContext } from './settings-context';
import { configureRegionFormat } from '../utils/region-format';

const english: Record<string, string> = {
  'Обзор': 'Overview', 'Сделки': 'Deals', 'Контакты': 'Contacts', 'Задачи': 'Tasks', 'Календарь': 'Calendar', 'Отчёты': 'Reports', 'Настройки': 'Settings',
  'Рабочее пространство': 'Workspace', 'Поиск по CRM': 'Search CRM', 'Поиск по контактам и сделкам': 'Search contacts and deals', 'Ничего не найдено': 'No results found', 'Уведомления': 'Notifications', 'Последние события': 'Recent activity', 'Новых уведомлений нет': 'No new notifications', 'Закрыть меню': 'Close menu', 'Открыть меню': 'Open menu',
  'Добрый день, Мария': 'Good day, Maria', 'Вот что происходит в вашей команде сегодня.': 'Here is what is happening with your team today.', 'Всего контактов': 'Total contacts', 'Активные сделки': 'Active deals', 'Выручка': 'Revenue', 'Задачи на сегодня': 'Tasks due today', 'Динамика выручки': 'Revenue trend', 'Сделки по этапам': 'Deals by stage', 'Последние сделки': 'Recent deals', 'Ближайшие задачи': 'Upcoming tasks', 'Последняя активность': 'Recent activity', 'Демонстрационные данные': 'Demo data', 'Все сделки': 'All deals',
  'Отмена': 'Cancel', 'Сохранить': 'Save', 'Удалить': 'Delete', 'Создать': 'Create', 'Редактировать': 'Edit', 'Поиск': 'Search', 'Сбросить': 'Reset', 'Загрузка…': 'Loading…', 'Повторить': 'Retry',
  'Добрый день': 'Good day', 'В базе клиентов': 'In the client database', 'В работе команды': 'In progress', 'По успешным сделкам': 'From won deals', 'задача сегодня': 'task today', 'задачи сегодня': 'tasks today', 'задач сегодня': 'tasks today', 'Показатели и карточки на этой странице — вымышленные демонстрационные данные.': 'Metrics and cards on this page use fictional demo data.',
  'Профиль': 'Profile', 'Организация': 'Organization', 'Внешний вид': 'Appearance', 'Язык и регион': 'Language and region', 'Команда и доступ': 'Team and access', 'Данные и резервные копии': 'Data and backups', 'Сохранить профиль': 'Save profile', 'Сохранить организацию': 'Save organization',
  'Язык интерфейса': 'Interface language', 'Региональные форматы': 'Regional formats', 'Формат даты': 'Date format', 'Формат времени': 'Time format', 'Часовой пояс Казахстана': 'Kazakhstan time zone', 'Валюта отображения': 'Display currency', 'По региону': 'Regional default', '24 часа': '24-hour', '12 часов': '12-hour', 'Казахстан (русский)': 'Kazakhstan (Russian)', 'Қазақстан (қазақша)': 'Kazakhstan (Kazakh)', 'Қазақстан (English)': 'Kazakhstan (English)',
  'Регион': 'Region', 'Казахстан': 'Kazakhstan', 'Региональные форматы используют часовой пояс и форматы Казахстана.': 'Regional formats use Kazakhstan time zones and conventions.', 'Настройте рабочее пространство под себя и команду.': 'Configure your workspace for you and your team.',
  'Кызылорда (UTC+5)': 'Kyzylorda (UTC+5)', 'Астана, Алматы, Шымкент (UTC+5)': 'Astana, Almaty, Shymkent (UTC+5)', 'Актобе (UTC+5)': 'Aktobe (UTC+5)', 'Атырау (UTC+5)': 'Atyrau (UTC+5)', 'Актау (UTC+5)': 'Aktau (UTC+5)', 'Уральск (UTC+5)': 'Oral (UTC+5)',
};
const kazakh: Record<string, string> = {
  'Обзор': 'Шолу', 'Сделки': 'Мәмілелер', 'Контакты': 'Байланыстар', 'Задачи': 'Тапсырмалар', 'Календарь': 'Күнтізбе', 'Отчёты': 'Есептер', 'Настройки': 'Баптаулар',
  'Рабочее пространство': 'Жұмыс кеңістігі', 'Поиск по CRM': 'CRM ішінен іздеу', 'Поиск по контактам и сделкам': 'Байланыстар мен мәмілелерді іздеу', 'Ничего не найдено': 'Ештеңе табылмады', 'Уведомления': 'Хабарландырулар', 'Последние события': 'Соңғы оқиғалар', 'Новых уведомлений нет': 'Жаңа хабарландыру жоқ', 'Закрыть меню': 'Мәзірді жабу', 'Открыть меню': 'Мәзірді ашу',
  'Добрый день': 'Қайырлы күн', 'Вот что происходит в вашей команде сегодня.': 'Бүгін командаңызда болып жатқан жағдай.', 'Всего контактов': 'Барлық байланыстар', 'Активные сделки': 'Белсенді мәмілелер', 'Выручка': 'Түсім', 'Задачи на сегодня': 'Бүгінгі тапсырмалар', 'Динамика выручки': 'Түсім динамикасы', 'Сделки по этапам': 'Кезеңдер бойынша мәмілелер', 'Последние сделки': 'Соңғы мәмілелер', 'Ближайшие задачи': 'Алдағы тапсырмалар', 'Последняя активность': 'Соңғы әрекеттер', 'Демонстрационные данные': 'Демонстрациялық деректер', 'Все сделки': 'Барлық мәмілелер',
  'Отмена': 'Болдырмау', 'Сохранить': 'Сақтау', 'Удалить': 'Жою', 'Создать': 'Жасау', 'Редактировать': 'Өңдеу', 'Поиск': 'Іздеу', 'Сбросить': 'Қалпына келтіру', 'Загрузка…': 'Жүктелуде…', 'Повторить': 'Қайталау',
  'В базе клиентов': 'Клиенттер базасында', 'В работе команды': 'Команда жұмысында', 'По успешным сделкам': 'Сәтті мәмілелер бойынша', 'задача сегодня': 'бүгінгі тапсырма', 'задачи сегодня': 'бүгінгі тапсырма', 'задач сегодня': 'бүгінгі тапсырма',
  'Профиль': 'Профиль', 'Организация': 'Ұйым', 'Внешний вид': 'Сыртқы көрініс', 'Язык и регион': 'Тіл және аймақ', 'Команда и доступ': 'Команда және қолжетімділік', 'Данные и резервные копии': 'Деректер және сақтық көшірмелер', 'Сохранить профиль': 'Профильді сақтау', 'Сохранить организацию': 'Ұйымды сақтау',
  'Язык интерфейса': 'Интерфейс тілі', 'Региональные форматы': 'Аймақтық пішімдер', 'Формат даты': 'Күн пішімі', 'Формат времени': 'Уақыт пішімі', 'Часовой пояс Казахстана': 'Қазақстанның уақыт белдеуі', 'Валюта отображения': 'Көрсетілетін валюта', 'По региону': 'Аймақ бойынша', '24 часа': '24 сағат', '12 часов': '12 сағат', 'Казахстан (русский)': 'Қазақстан (орысша)', 'Қазақстан (қазақша)': 'Қазақстан (қазақша)', 'Қазақстан (English)': 'Қазақстан (ағылшынша)',
  'Регион': 'Өңір', 'Казахстан': 'Қазақстан', 'Региональные форматы используют часовой пояс и форматы Казахстана.': 'Аймақтық пішімдер Қазақстанның уақыт белдеуі мен пішімдерін қолданады.', 'Настройте рабочее пространство под себя и команду.': 'Жұмыс кеңістігін өзіңізге және командаңызға баптаңыз.',
  'Кызылорда (UTC+5)': 'Қызылорда (UTC+5)', 'Астана, Алматы, Шымкент (UTC+5)': 'Астана, Алматы, Шымкент (UTC+5)', 'Актобе (UTC+5)': 'Ақтөбе (UTC+5)', 'Атырау (UTC+5)': 'Атырау (UTC+5)', 'Актау (UTC+5)': 'Ақтау (UTC+5)', 'Уральск (UTC+5)': 'Орал (UTC+5)',
};

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState(() => {
    const initial = settingsService.get();
    configureCurrency(initial.currency, initial.locale);
    configureRegionFormat(initial);
    return initial;
  });
  const updateSettings = useCallback((changes: Partial<AppSettings>) => {
    const next = { ...settings, ...changes,
      profile: changes.profile ? { ...settings.profile, ...changes.profile } : settings.profile,
      notifications: changes.notifications ? { ...settings.notifications, ...changes.notifications } : settings.notifications,
    };
    settingsService.save(next);
    configureCurrency(next.currency, next.locale);
    configureRegionFormat(next);
    setSettings(next);
  }, [settings]);
  useEffect(() => {
    configureCurrency(settings.currency, settings.locale);
    configureRegionFormat({ locale: settings.locale, dateFormat: settings.dateFormat, timeFormat: settings.timeFormat, timeZone: settings.timeZone });
    document.documentElement.lang = settings.language;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const applyTheme = () => {
      const dark = settings.theme === 'dark' || (settings.theme === 'system' && media.matches);
      document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    };
    applyTheme();
    if (settings.theme !== 'system') return;
    media.addEventListener('change', applyTheme);
    return () => media.removeEventListener('change', applyTheme);
  }, [settings.currency, settings.dateFormat, settings.language, settings.locale, settings.theme, settings.timeFormat, settings.timeZone]);
  const value = useMemo(() => ({ settings, updateSettings, t: (text: string) => settings.language === 'en' ? english[text] ?? text : settings.language === 'kk' ? kazakh[text] ?? text : text }), [settings, updateSettings]);
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}
