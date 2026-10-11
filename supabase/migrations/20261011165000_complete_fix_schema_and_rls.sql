ALTER TABLE public.users 
  ADD COLUMN IF NOT EXISTS jabatan text,
  ADD COLUMN IF NOT EXISTS departemen text,
  ADD COLUMN IF NOT EXISTS tanggal_bergabung date DEFAULT CURRENT_DATE,
  ADD COLUMN IF NOT EXISTS foto_url text;

ALTER TABLE public.verifikasi_pengaduan ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow authenticated all on verifikasi_pengaduan" ON public.verifikasi_pengaduan;
CREATE POLICY "Allow authenticated all on verifikasi_pengaduan" 
ON public.verifikasi_pengaduan FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

ALTER TABLE public.penanganan ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow authenticated all on penanganan" ON public.penanganan;
CREATE POLICY "Allow authenticated all on penanganan" 
ON public.penanganan FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

ALTER TABLE public.tindak_lanjut ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow authenticated all on tindak_lanjut" ON public.tindak_lanjut;
CREATE POLICY "Allow authenticated all on tindak_lanjut" 
ON public.tindak_lanjut FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

ALTER TABLE public.bukti_pengaduan ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow authenticated all on bukti_pengaduan" ON public.bukti_pengaduan;
CREATE POLICY "Allow authenticated all on bukti_pengaduan" 
ON public.bukti_pengaduan FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

ALTER TABLE public.bukti_penyelesaian ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow authenticated all on bukti_penyelesaian" ON public.bukti_penyelesaian;
CREATE POLICY "Allow authenticated all on bukti_penyelesaian" 
ON public.bukti_penyelesaian FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

ALTER TABLE public.kategori_pengaduan ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read access on kategori_pengaduan" ON public.kategori_pengaduan;
CREATE POLICY "Allow public read access on kategori_pengaduan" 
ON public.kategori_pengaduan FOR SELECT 
USING (true);

INSERT INTO public.kategori_pengaduan (nama_kategori, deskripsi)
VALUES 
  ('Fasilitas', 'Kerusakan atau kendala pada fasilitas umum gedung'),
  ('Elektronik', 'Kendala pada perangkat elektronik dan komputer'),
  ('Kelistrikan', 'Masalah kelistrikan, lampu, colokan'),
  ('Furniture', 'Kerusakan pada meja, kursi, lemari'),
  ('Kebersihan', 'Laporan terkait kebersihan ruangan atau toilet'),
  ('Lainnya', 'Kendala lainnya yang tidak masuk kategori di atas')
ON CONFLICT DO NOTHING;
