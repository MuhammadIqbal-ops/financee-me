DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['transactions','categories','budgets','wallets','wallet_transfers','debts','goals','recurring_transactions','notifications','profiles','activity_logs']
  LOOP
    EXECUTE format('ALTER TABLE public.%I REPLICA IDENTITY FULL', t);
    BEGIN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', t);
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
  END LOOP;
END $$;