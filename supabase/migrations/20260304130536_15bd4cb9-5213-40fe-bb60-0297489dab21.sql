
-- Add currency column to transactions (defaults to NULL meaning user's primary currency)
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT NULL;

-- Create exchange_rates cache table
CREATE TABLE IF NOT EXISTS public.exchange_rates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  base_currency TEXT NOT NULL,
  target_currency TEXT NOT NULL,
  rate NUMERIC NOT NULL,
  fetched_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(base_currency, target_currency)
);

-- Public read for exchange rates (no auth needed)
ALTER TABLE public.exchange_rates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read exchange rates" ON public.exchange_rates FOR SELECT TO authenticated USING (true);
