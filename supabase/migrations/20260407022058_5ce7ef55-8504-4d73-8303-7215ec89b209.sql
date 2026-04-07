
-- Remove redundant email column from profiles
ALTER TABLE public.profiles DROP COLUMN IF EXISTS email;

-- Update handle_new_user to not insert email
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  
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
