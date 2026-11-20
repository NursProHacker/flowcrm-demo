export const DEFAULT_CURRENCY = 'KZT' as const;

const formatter = new Intl.NumberFormat('ru-KZ', {
  style: 'currency',
  currency: DEFAULT_CURRENCY,
  maximumFractionDigits: 0,
});

export function formatCurrency(amount: number): string {
  return formatter.format(amount);
}
