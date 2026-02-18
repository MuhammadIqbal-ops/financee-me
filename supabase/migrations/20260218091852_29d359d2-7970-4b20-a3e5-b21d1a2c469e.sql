
ALTER TABLE public.profiles
ADD COLUMN push_enabled boolean NOT NULL DEFAULT true,
ADD COLUMN notify_budget_alert boolean NOT NULL DEFAULT true,
ADD COLUMN notify_recurring boolean NOT NULL DEFAULT true,
ADD COLUMN notify_goal_reached boolean NOT NULL DEFAULT true;
