import type { AppCurrency } from '../types/settings';

export const DEFAULT_CURRENCY: AppCurrency = 'KZT';
let displayCurrency: AppCurrency = DEFAULT_CURRENCY;
let displayLocale = 'ru-KZ';

export function configureCurrency(currency: AppCurrency, locale = 'ru-KZ'): void {
  displayCurrency = currency;
  displayLocale = locale;
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat(displayLocale, {
    style: 'currency', currency: displayCurrency, maximumFractionDigits: 0,
  }).format(amount);
}

export function getCurrencySymbol(currency: AppCurrency): string {
  return new Intl.NumberFormat('ru-KZ', { style: 'currency', currency, maximumFractionDigits: 0 })
    .formatToParts(0).find((part) => part.type === 'currency')?.value ?? currency;
}
