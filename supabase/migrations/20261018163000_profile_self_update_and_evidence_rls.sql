-- Migration: Allow users (Admin & Karyawan) to update their own profile credentials
-- and ensure storage/table RLS policies allow uploading & reading complaint/completion evidence.

-- 1. Function for logged-in user to sync their own email & name in auth.users
CREATE OR REPLACE FUNCTION public.update_own_profile_credentials(
  new_email text,
  new_nama text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  current_uid uuid := auth.uid();
BEGIN
  IF current_uid IS NULL THEN
    RAISE EXCEPTION 'Tidak terautentikasi.';
  END IF;

  -- Update email in auth.users & auth.identities if provided
  IF new_email IS NOT NULL AND new_email <> '' THEN
    UPDATE auth.users
    SET 
      email = new_email,
      email_confirmed_at = COALESCE(email_confirmed_at, now()),
      raw_user_meta_data = jsonb_set(
        coalesce(raw_user_meta_data, '{}'::jsonb),
        '{email}',
        to_jsonb(new_email)
      ),
      updated_at = now()
    WHERE id = current_uid;

    UPDATE auth.identities
    SET 
      identity_data = jsonb_set(
        coalesce(identity_data, '{}'::jsonb),
        '{email}',
        to_jsonb(new_email)
      ),
      updated_at = now()
    WHERE user_id = current_uid AND provider = 'email';
  END IF;

  -- Update nama in auth.users metadata
  IF new_nama IS NOT NULL AND new_nama <> '' THEN
    UPDATE auth.users
    SET raw_user_meta_data = jsonb_set(
      coalesce(raw_user_meta_data, '{}'::jsonb),
      '{nama}',
      to_jsonb(new_nama)
    )
    WHERE id = current_uid;
  END IF;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.update_own_profile_credentials(text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.update_own_profile_credentials(text, text) TO authenticated;

-- 2. Ensure users can update their own row in public.users
DROP POLICY IF EXISTS "Users can update own data" ON public.users;
CREATE POLICY "Users can update own data"
ON public.users
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 3. Ensure bukti_pengaduan & bukti_penyelesaian policies allow reading and inserting
ALTER TABLE public.bukti_pengaduan ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage bukti_pengaduan" ON public.bukti_pengaduan;
CREATE POLICY "Users can manage bukti_pengaduan"
ON public.bukti_pengaduan
FOR ALL
TO authenticated
USING (true)
WITH CHECK (auth.uid() IS NOT NULL);

ALTER TABLE public.bukti_penyelesaian ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can read bukti_penyelesaian" ON public.bukti_penyelesaian;
CREATE POLICY "Users can read bukti_penyelesaian"
ON public.bukti_penyelesaian
FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Admins can manage bukti_penyelesaian" ON public.bukti_penyelesaian;
CREATE POLICY "Admins can manage bukti_penyelesaian"
ON public.bukti_penyelesaian
FOR ALL
TO authenticated
USING (public.get_my_role() IN ('GA', 'admin_ga'))
WITH CHECK (public.get_my_role() IN ('GA', 'admin_ga'));
