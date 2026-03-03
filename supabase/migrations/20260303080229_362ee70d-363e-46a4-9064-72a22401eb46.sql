
-- 1. Create wallet_transfers table
CREATE TABLE public.wallet_transfers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  from_wallet_id UUID NOT NULL REFERENCES public.wallets(id) ON DELETE CASCADE,
  to_wallet_id UUID NOT NULL REFERENCES public.wallets(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  note TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.wallet_transfers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transfers" ON public.wallet_transfers FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own transfers" ON public.wallet_transfers FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own transfers" ON public.wallet_transfers FOR DELETE USING (auth.uid() = user_id);

-- 2. Add dashboard_layout to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS dashboard_layout JSONB DEFAULT '{"widgets":["budget","goals","recurring","wallets","debts"],"visible":{"budget":true,"goals":true,"recurring":true,"wallets":true,"debts":true}}'::jsonb;
