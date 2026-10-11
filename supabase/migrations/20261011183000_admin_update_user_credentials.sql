-- Migration: Function to update user credentials (email & metadata) in both auth.users, auth.identities, and public.users
CREATE OR REPLACE FUNCTION public.admin_update_user_credentials(
  target_user_id uuid,
  new_email text,
  new_nama text DEFAULT NULL,
  new_foto_url text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  -- 1. Update email di auth.users jika diisi dan valid
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
    WHERE id = target_user_id;

    -- Update juga tabel auth.identities agar login provider email mengenali email baru
    UPDATE auth.identities
    SET 
      identity_data = jsonb_set(
        coalesce(identity_data, '{}'::jsonb),
        '{email}',
        to_jsonb(new_email)
      ),
      updated_at = now()
    WHERE user_id = target_user_id AND provider = 'email';
  END IF;

  -- 2. Update nama di metadata auth.users
  IF new_nama IS NOT NULL AND new_nama <> '' THEN
    UPDATE auth.users
    SET raw_user_meta_data = jsonb_set(
      coalesce(raw_user_meta_data, '{}'::jsonb),
      '{nama}',
      to_jsonb(new_nama)
    )
    WHERE id = target_user_id;
  END IF;

  -- 3. Update foto_url di metadata auth.users
  IF new_foto_url IS NOT NULL THEN
    UPDATE auth.users
    SET raw_user_meta_data = jsonb_set(
      coalesce(raw_user_meta_data, '{}'::jsonb),
      '{foto_url}',
      to_jsonb(new_foto_url)
    )
    WHERE id = target_user_id;
  END IF;

  -- 4. Update tabel public.users
  UPDATE public.users
  SET 
    email = coalesce(new_email, email),
    nama = coalesce(new_nama, nama),
    foto_url = new_foto_url,
    updated_at = now()
  WHERE id = target_user_id;
END;
$$;

-- Berikan izin akses RPC ke authenticated
GRANT EXECUTE ON FUNCTION public.admin_update_user_credentials(uuid, text, text, text) TO authenticated;
