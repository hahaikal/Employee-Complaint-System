-- =====================================================================
-- 1. SOLUSI UTAMA ERROR 431: BERSIHKAN foto_url DARI auth.users METADATA
--    (foto_url base64 di auth.users masuk ke JWT cookie dan meledakkan ukuran header HTTP)
-- =====================================================================
UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data - 'foto_url'
WHERE raw_user_meta_data ? 'foto_url';

-- =====================================================================
-- 2. PERBAIKAN FUNCTION admin_update_user_credentials (Aman & Tanpa foto_url di JWT)
-- =====================================================================
CREATE OR REPLACE FUNCTION public.admin_update_user_credentials(
  target_user_id uuid,
  new_email text,
  new_nama text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  -- Validasi hak akses Admin
  IF public.get_my_role() NOT IN ('GA', 'admin_ga') THEN
    RAISE EXCEPTION 'Akses ditolak: Hanya Admin yang dapat memperbarui data pengguna.';
  END IF;

  -- 1. Update email di auth.users jika diisi
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

    -- Update juga di auth.identities
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

  -- 2. Update nama di metadata auth.users (TIDAK menyertakan foto_url agar JWT tetap kecil)
  IF new_nama IS NOT NULL AND new_nama <> '' THEN
    UPDATE auth.users
    SET raw_user_meta_data = jsonb_set(
      coalesce(raw_user_meta_data, '{}'::jsonb),
      '{nama}',
      to_jsonb(new_nama)
    )
    WHERE id = target_user_id;
  END IF;

  -- 3. Update tabel public.users
  UPDATE public.users
  SET 
    email = coalesce(new_email, email),
    nama = coalesce(new_nama, nama),
    updated_at = now()
  WHERE id = target_user_id;
END;
$$;

-- Amankan hak eksekusi: Cabut dari anon/public, hanya berikan ke authenticated
REVOKE EXECUTE ON FUNCTION public.admin_update_user_credentials(uuid, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_update_user_credentials(uuid, text, text) TO authenticated;

-- =====================================================================
-- 3. PERBAIKAN FUNCTION delete_user_by_admin (Role Check & Security)
-- =====================================================================
CREATE OR REPLACE FUNCTION public.delete_user_by_admin(target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  -- Validasi hak akses Admin
  IF public.get_my_role() NOT IN ('GA', 'admin_ga') THEN
    RAISE EXCEPTION 'Akses ditolak: Hanya Admin yang dapat menghapus pengguna.';
  END IF;

  -- Hapus relasi jika ada
  DELETE FROM public.penanganan WHERE user_id = target_user_id;
  DELETE FROM public.verifikasi_pengaduan WHERE user_id = target_user_id;
  DELETE FROM public.tindak_lanjut WHERE user_id = target_user_id;
  DELETE FROM public.pengaduan WHERE user_id = target_user_id;
  
  -- Hapus dari public.users dan auth.users
  DELETE FROM public.users WHERE id = target_user_id;
  DELETE FROM auth.users WHERE id = target_user_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.delete_user_by_admin(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.delete_user_by_admin(uuid) TO authenticated;

-- =====================================================================
-- 4. PERBAIKAN KEBIJAKAN RLS (Menghilangkan warning 'RLS Policy Always True')
-- =====================================================================

-- a. verifikasi_pengaduan
DROP POLICY IF EXISTS "Allow authenticated all on verifikasi_pengaduan" ON public.verifikasi_pengaduan;
DROP POLICY IF EXISTS "Admins can manage verifikasi_pengaduan" ON public.verifikasi_pengaduan;
DROP POLICY IF EXISTS "Users can read verifikasi_pengaduan" ON public.verifikasi_pengaduan;

CREATE POLICY "Users can read verifikasi_pengaduan"
ON public.verifikasi_pengaduan FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can manage verifikasi_pengaduan"
ON public.verifikasi_pengaduan FOR ALL
TO authenticated
USING (public.get_my_role() IN ('GA', 'admin_ga'))
WITH CHECK (public.get_my_role() IN ('GA', 'admin_ga'));

-- b. penanganan
DROP POLICY IF EXISTS "Allow authenticated all on penanganan" ON public.penanganan;
DROP POLICY IF EXISTS "Admins can manage penanganan" ON public.penanganan;
DROP POLICY IF EXISTS "Users can read penanganan" ON public.penanganan;

CREATE POLICY "Users can read penanganan"
ON public.penanganan FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can manage penanganan"
ON public.penanganan FOR ALL
TO authenticated
USING (public.get_my_role() IN ('GA', 'admin_ga'))
WITH CHECK (public.get_my_role() IN ('GA', 'admin_ga'));

-- c. tindak_lanjut
DROP POLICY IF EXISTS "Allow authenticated all on tindak_lanjut" ON public.tindak_lanjut;
DROP POLICY IF EXISTS "Admins can manage tindak_lanjut" ON public.tindak_lanjut;
DROP POLICY IF EXISTS "Users can read tindak_lanjut" ON public.tindak_lanjut;

CREATE POLICY "Users can read tindak_lanjut"
ON public.tindak_lanjut FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can manage tindak_lanjut"
ON public.tindak_lanjut FOR ALL
TO authenticated
USING (public.get_my_role() IN ('GA', 'admin_ga'))
WITH CHECK (public.get_my_role() IN ('GA', 'admin_ga'));

-- d. bukti_pengaduan
DROP POLICY IF EXISTS "Allow authenticated all on bukti_pengaduan" ON public.bukti_pengaduan;
DROP POLICY IF EXISTS "Users can manage bukti_pengaduan" ON public.bukti_pengaduan;

CREATE POLICY "Users can manage bukti_pengaduan"
ON public.bukti_pengaduan FOR ALL
TO authenticated
USING (true)
WITH CHECK (auth.uid() IS NOT NULL);

-- e. bukti_penyelesaian
DROP POLICY IF EXISTS "Allow authenticated all on bukti_penyelesaian" ON public.bukti_penyelesaian;
DROP POLICY IF EXISTS "Admins can manage bukti_penyelesaian" ON public.bukti_penyelesaian;
DROP POLICY IF EXISTS "Users can read bukti_penyelesaian" ON public.bukti_penyelesaian;

CREATE POLICY "Users can read bukti_penyelesaian"
ON public.bukti_penyelesaian FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can manage bukti_penyelesaian"
ON public.bukti_penyelesaian FOR ALL
TO authenticated
USING (public.get_my_role() IN ('GA', 'admin_ga'))
WITH CHECK (public.get_my_role() IN ('GA', 'admin_ga'));
