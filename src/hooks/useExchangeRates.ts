import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ExchangeRate {
  base_currency: string;
  target_currency: string;
  rate: number;
  fetched_at: string;
}

export const SUPPORTED_CURRENCIES = [
  { code: 'IDR', name: 'Rupiah Indonesia', symbol: 'Rp' },
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$' },
  { code: 'MYR', name: 'Malaysian Ringgit', symbol: 'RM' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
  { code: 'THB', name: 'Thai Baht', symbol: '฿' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
];

export function useExchangeRates(baseCurrency: string = 'USD') {
  return useQuery({
    queryKey: ['exchangeRates', baseCurrency],
    queryFn: async () => {
      // First try cache from DB
      const { data: cached } = await supabase
        .from('exchange_rates')
        .select('*')
        .eq('base_currency', baseCurrency);

      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      const isFresh = cached && cached.length > 0 && cached[0].fetched_at > oneHourAgo;

      if (isFresh) {
        return cached as ExchangeRate[];
      }

      // Fetch fresh rates via edge function
      const { data, error } = await supabase.functions.invoke('exchange-rates', {
        body: { base: baseCurrency },
      });

      if (error) throw error;

      // Re-read from cache
      const { data: fresh } = await supabase
        .from('exchange_rates')
        .select('*')
        .eq('base_currency', baseCurrency);

      return (fresh || []) as ExchangeRate[];
    },
    staleTime: 60 * 60 * 1000, // 1 hour
    refetchInterval: 60 * 60 * 1000,
  });
}

export function convertAmount(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  rates: ExchangeRate[]
): number {
  if (fromCurrency === toCurrency) return amount;
  const rate = rates.find(
    r => r.base_currency === fromCurrency && r.target_currency === toCurrency
  );
  if (rate) return amount * Number(rate.rate);
  // Try reverse
  const reverseRate = rates.find(
    r => r.base_currency === toCurrency && r.target_currency === fromCurrency
  );
  if (reverseRate) return amount / Number(reverseRate.rate);
  return amount; // fallback
}
