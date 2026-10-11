-- 1. Pastikan kolom default status_akun adalah 'Menunggu Persetujuan' jika ada pendaftaran baru langsung ke table users
ALTER TABLE IF EXISTS public.users 
  ALTER COLUMN status_akun SET DEFAULT 'Menunggu Persetujuan';

-- 2. Kebijakan DELETE untuk admin pada tabel public.users
DROP POLICY IF EXISTS "Admins can delete users" ON public.users;
CREATE POLICY "Admins can delete users" ON public.users FOR DELETE 
USING ( public.get_my_role() IN ('GA', 'admin_ga') );

-- 3. Function RPC SECURITY DEFINER untuk menghapus user secara menyeluruh
CREATE OR REPLACE FUNCTION public.delete_user_by_admin(target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  DELETE FROM public.penanganan WHERE user_id = target_user_id;
  DELETE FROM public.verifikasi_pengaduan WHERE user_id = target_user_id;
  DELETE FROM public.tindak_lanjut WHERE user_id = target_user_id;
  DELETE FROM public.pengaduan WHERE user_id = target_user_id;
  
  DELETE FROM public.users WHERE id = target_user_id;
  
  DELETE FROM auth.users WHERE id = target_user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.delete_user_by_admin(uuid) TO authenticated;
