-- Migration script to sync database schema with the new ERD

-- 1. Update Table: users
ALTER TABLE public.users RENAME COLUMN nama_lengkap TO nama;
ALTER TABLE public.users RENAME COLUMN no_wa TO no_hp;

ALTER TABLE public.users 
  ADD COLUMN email text,
  ADD COLUMN username text,
  ADD COLUMN password text,
  ADD COLUMN status_akun text DEFAULT 'Aktif' CHECK (status_akun IN ('Aktif', 'Nonaktif')),
  ADD COLUMN updated_at timestamp with time zone DEFAULT timezone('utc'::text, now());

-- Update role check constraint
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE public.users ADD CONSTRAINT users_role_check CHECK (role IN ('Karyawan', 'GA', 'karyawan', 'admin_ga'));

-- 2. Create Table: kategori_pengaduan
CREATE TABLE public.kategori_pengaduan (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    nama_kategori text NOT NULL,
    deskripsi text,
    created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT kategori_pengaduan_pkey PRIMARY KEY (id)
);

-- 3. Update Table: pengaduan
ALTER TABLE public.pengaduan
  DROP COLUMN pihak_penanganan,
  DROP COLUMN nama_vendor,
  DROP COLUMN estimasi_mulai,
  DROP COLUMN estimasi_selesai,
  DROP COLUMN durasi_pengerjaan,
  DROP COLUMN bukti_selesai_url,
  DROP COLUMN foto_bukti_url,
  DROP COLUMN kategori; -- Dropping text kategori as we replace it with kategori_id

ALTER TABLE public.pengaduan RENAME COLUMN no_pengaduan TO nomor_pengaduan;
ALTER TABLE public.pengaduan RENAME COLUMN detail_permasalahan TO detail_pengaduan;

ALTER TABLE public.pengaduan
  ADD COLUMN kategori_id uuid,
  ADD COLUMN informasi_tambahan text,
  ADD COLUMN tanggal_pengaduan date DEFAULT CURRENT_DATE;

ALTER TABLE public.pengaduan 
  ADD CONSTRAINT pengaduan_kategori_id_fkey FOREIGN KEY (kategori_id) REFERENCES public.kategori_pengaduan(id);

ALTER TABLE public.pengaduan DROP CONSTRAINT IF EXISTS pengaduan_status_check;
ALTER TABLE public.pengaduan ADD CONSTRAINT pengaduan_status_check CHECK (status IN ('DIAJUKAN', 'DIVERIFIKASI', 'DIPROSES', 'SELESAI'));

-- 4. Create Table: bukti_pengaduan
CREATE TABLE public.bukti_pengaduan (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    pengaduan_id uuid NOT NULL,
    nama_file text,
    path_file text NOT NULL,
    jenis_file text,
    tanggal_upload timestamp with time zone DEFAULT timezone('utc'::text, now()),
    keterangan text,
    CONSTRAINT bukti_pengaduan_pkey PRIMARY KEY (id),
    CONSTRAINT bukti_pengaduan_pengaduan_id_fkey FOREIGN KEY (pengaduan_id) REFERENCES public.pengaduan(id) ON DELETE CASCADE
);

-- 5. Create Table: verifikasi_pengaduan
CREATE TABLE public.verifikasi_pengaduan (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    pengaduan_id uuid NOT NULL,
    user_id uuid NOT NULL,
    hasil_verifikasi text CHECK (hasil_verifikasi IN ('Lengkap', 'Tidak Lengkap')),
    catatan_verifikasi text,
    tanggal_verifikasi timestamp with time zone DEFAULT timezone('utc'::text, now()),
    created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT verifikasi_pengaduan_pkey PRIMARY KEY (id),
    CONSTRAINT verifikasi_pengaduan_pengaduan_id_fkey FOREIGN KEY (pengaduan_id) REFERENCES public.pengaduan(id) ON DELETE CASCADE,
    CONSTRAINT verifikasi_pengaduan_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);

-- 6. Create Table: penanganan
CREATE TABLE public.penanganan (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    pengaduan_id uuid NOT NULL,
    user_id uuid NOT NULL,
    jenis_penanganan text CHECK (jenis_penanganan IN ('GA', 'VENDOR')),
    tanggal_mulai date,
    estimasi_selesai date,
    tanggal_selesai date,
    status_penanganan text CHECK (status_penanganan IN ('DIPROSES', 'SELESAI')),
    catatan text,
    created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT penanganan_pkey PRIMARY KEY (id),
    CONSTRAINT penanganan_pengaduan_id_fkey FOREIGN KEY (pengaduan_id) REFERENCES public.pengaduan(id) ON DELETE CASCADE,
    CONSTRAINT penanganan_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);

-- 7. Update Table: tindak_lanjut
ALTER TABLE public.tindak_lanjut DROP CONSTRAINT IF EXISTS tindak_lanjut_pengaduan_id_fkey;
ALTER TABLE public.tindak_lanjut RENAME COLUMN pengaduan_id TO penanganan_id;
ALTER TABLE public.tindak_lanjut ADD CONSTRAINT tindak_lanjut_penanganan_id_fkey FOREIGN KEY (penanganan_id) REFERENCES public.penanganan(id) ON DELETE CASCADE;

ALTER TABLE public.tindak_lanjut RENAME COLUMN created_by TO user_id;

ALTER TABLE public.tindak_lanjut
  ADD COLUMN tanggal_tindak_lanjut timestamp with time zone DEFAULT timezone('utc'::text, now()),
  ADD COLUMN pekerjaan_dilakukan text,
  ADD COLUMN updated_at timestamp with time zone DEFAULT timezone('utc'::text, now());

-- 8. Create Table: bukti_penyelesaian
CREATE TABLE public.bukti_penyelesaian (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    tindak_lanjut_id uuid NOT NULL,
    nama_file text,
    path_file text NOT NULL,
    jenis_file text,
    tanggal_upload timestamp with time zone DEFAULT timezone('utc'::text, now()),
    keterangan text,
    CONSTRAINT bukti_penyelesaian_pkey PRIMARY KEY (id),
    CONSTRAINT bukti_penyelesaian_tindak_lanjut_id_fkey FOREIGN KEY (tindak_lanjut_id) REFERENCES public.tindak_lanjut(id) ON DELETE CASCADE
);
