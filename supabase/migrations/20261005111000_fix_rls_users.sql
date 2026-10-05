-- 1. Membuat fungsi yang aman (Security Definer) agar tidak terjadi loop saat mengecek role admin
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.users WHERE id = auth.uid();
$$;

-- 2. Hapus semua Policy RLS yang lama pada tabel users yang menyebabkan error
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

-- 3. Pastikan RLS menyala
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 4. Buat ulang Policy yang benar dan bebas dari Infinite Recursion

-- Karyawan bisa melihat datanya sendiri
CREATE POLICY "Users can view own data" 
ON public.users 
FOR SELECT 
USING ( auth.uid() = id );

-- Admin / GA bisa melihat semua data (tanpa infinite loop karena pakai get_my_role)
CREATE POLICY "Admins can view all users" 
ON public.users 
FOR SELECT 
USING ( public.get_my_role() IN ('GA', 'admin_ga') );

-- Karyawan bisa mengupdate profilnya sendiri
CREATE POLICY "Users can update own data" 
ON public.users 
FOR UPDATE 
USING ( auth.uid() = id );

-- Admin / GA bisa mengupdate semua data (termasuk verifikasi akun)
CREATE POLICY "Admins can update all users" 
ON public.users 
FOR UPDATE 
USING ( public.get_my_role() IN ('GA', 'admin_ga') );
