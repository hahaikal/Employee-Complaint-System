CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.users WHERE id = auth.uid();
$$;

DO $$
DECLARE
  pol record;
BEGIN
  FOR pol IN 
    SELECT policyname 
    FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'users'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.users', pol.policyname);
  END LOOP;
END
$$;

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own data" 
ON public.users 
FOR SELECT 
USING ( auth.uid() = id );

CREATE POLICY "Admins can view all users" 
ON public.users 
FOR SELECT 
USING ( public.get_my_role() IN ('GA', 'admin_ga') );

CREATE POLICY "Users can update own data" 
ON public.users 
FOR UPDATE 
USING ( auth.uid() = id );

CREATE POLICY "Admins can update all users" 
ON public.users 
FOR UPDATE 
USING ( public.get_my_role() IN ('GA', 'admin_ga') );
