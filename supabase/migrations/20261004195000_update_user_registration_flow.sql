ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_status_akun_check;
ALTER TABLE public.users ADD CONSTRAINT users_status_akun_check CHECK (status_akun IN ('Aktif', 'Nonaktif', 'Menunggu Persetujuan', 'Ditolak'));
ALTER TABLE public.users ALTER COLUMN status_akun SET DEFAULT 'Menunggu Persetujuan';
ALTER TABLE public.users ALTER COLUMN role SET DEFAULT 'Karyawan';
