-- Block all user-facing INSERT on user_roles (only service_role/triggers can insert)
CREATE POLICY "Block user insert on user_roles"
ON public.user_roles FOR INSERT
TO authenticated
WITH CHECK (false);

-- Block all user-facing DELETE on user_roles
CREATE POLICY "Block user delete on user_roles"
ON public.user_roles FOR DELETE
TO authenticated
USING (false);

-- Block all user-facing UPDATE on user_roles
CREATE POLICY "Block user update on user_roles"
ON public.user_roles FOR UPDATE
TO authenticated
USING (false);