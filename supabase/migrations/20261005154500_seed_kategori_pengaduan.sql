-- Enable RLS and allow read access
ALTER TABLE public.kategori_pengaduan ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access on kategori_pengaduan" ON public.kategori_pengaduan;
CREATE POLICY "Allow public read access on kategori_pengaduan" 
ON public.kategori_pengaduan FOR SELECT 
USING (true);

-- Seed kategori pengaduan
INSERT INTO public.kategori_pengaduan (nama_kategori, deskripsi)
VALUES 
  ('Fasilitas', 'Kerusakan atau kendala pada fasilitas umum gedung'),
  ('Elektronik', 'Kendala pada perangkat elektronik dan komputer'),
  ('Kelistrikan', 'Masalah kelistrikan, lampu, colokan'),
  ('Furniture', 'Kerusakan pada meja, kursi, lemari'),
  ('Kebersihan', 'Laporan terkait kebersihan ruangan atau toilet'),
  ('Lainnya', 'Kendala lainnya yang tidak masuk kategori di atas');
