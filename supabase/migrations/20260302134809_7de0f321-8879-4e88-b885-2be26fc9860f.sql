
-- 1. Wallets table
CREATE TABLE public.wallets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  icon TEXT DEFAULT 'wallet',
  color TEXT DEFAULT '#3b82f6',
  initial_balance NUMERIC NOT NULL DEFAULT 0,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own wallets" ON public.wallets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own wallets" ON public.wallets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own wallets" ON public.wallets FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own wallets" ON public.wallets FOR DELETE USING (auth.uid() = user_id);

-- 2. Add wallet_id to transactions
ALTER TABLE public.transactions ADD COLUMN wallet_id UUID REFERENCES public.wallets(id) ON DELETE SET NULL;

-- 3. Add receipt_url to transactions
ALTER TABLE public.transactions ADD COLUMN receipt_url TEXT;

-- 4. Debts table
CREATE TABLE public.debts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  person_name TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  type TEXT NOT NULL DEFAULT 'receivable', -- 'payable' (hutang) or 'receivable' (piutang)
  status TEXT NOT NULL DEFAULT 'unpaid', -- 'unpaid', 'partial', 'paid'
  paid_amount NUMERIC NOT NULL DEFAULT 0,
  due_date DATE,
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.debts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own debts" ON public.debts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own debts" ON public.debts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own debts" ON public.debts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own debts" ON public.debts FOR DELETE USING (auth.uid() = user_id);

-- 5. Receipt storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('receipts', 'receipts', true);

CREATE POLICY "Users can upload receipts" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'receipts' AND auth.role() = 'authenticated');
CREATE POLICY "Anyone can view receipts" ON storage.objects FOR SELECT USING (bucket_id = 'receipts');
CREATE POLICY "Users can delete own receipts" ON storage.objects FOR DELETE USING (bucket_id = 'receipts' AND auth.uid()::text = (storage.foldername(name))[1]);

-- 6. Add default wallet in handle_new_user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');

  INSERT INTO public.wallets (user_id, name, icon, color, is_default)
  VALUES (NEW.id, 'Kas', 'wallet', '#10b981', true);
  
  INSERT INTO public.categories (user_id, name, icon, color, type) VALUES
    (NEW.id, 'Gaji', 'wallet', '#10b981', 'income'),
    (NEW.id, 'Bonus', 'gift', '#f59e0b', 'income'),
    (NEW.id, 'Investasi', 'trending-up', '#3b82f6', 'income'),
    (NEW.id, 'Lainnya', 'plus-circle', '#6b7280', 'income'),
    (NEW.id, 'Makanan', 'utensils', '#ef4444', 'expense'),
    (NEW.id, 'Transportasi', 'car', '#f97316', 'expense'),
    (NEW.id, 'Belanja', 'shopping-bag', '#ec4899', 'expense'),
    (NEW.id, 'Tagihan', 'receipt', '#8b5cf6', 'expense'),
    (NEW.id, 'Hiburan', 'gamepad-2', '#06b6d4', 'expense'),
    (NEW.id, 'Kesehatan', 'heart-pulse', '#14b8a6', 'expense'),
    (NEW.id, 'Pendidikan', 'graduation-cap', '#6366f1', 'expense'),
    (NEW.id, 'Lainnya', 'more-horizontal', '#6b7280', 'expense');
  
  RETURN NEW;
END;
$function$;
