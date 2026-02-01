export const formatCurrency = (amount: number, currency: string = 'IDR'): string => {
  const formatter = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
  return formatter.format(amount);
};

export const formatNumber = (amount: number): string => {
  return new Intl.NumberFormat('id-ID').format(amount);
};

export const parseFormattedNumber = (value: string): number => {
  return parseFloat(value.replace(/[^\d.-]/g, '')) || 0;
};
