-- Seed kategori pengaduan
INSERT INTO public.kategori_pengaduan (nama_kategori, deskripsi)
VALUES 
  ('Fasilitas', 'Kerusakan atau kendala pada fasilitas umum gedung'),
  ('Elektronik', 'Kendala pada perangkat elektronik dan komputer'),
  ('Kelistrikan', 'Masalah kelistrikan, lampu, colokan'),
  ('Furniture', 'Kerusakan pada meja, kursi, lemari'),
  ('Kebersihan', 'Laporan terkait kebersihan ruangan atau toilet'),
  ('Lainnya', 'Kendala lainnya yang tidak masuk kategori di atas')
ON CONFLICT DO NOTHING; -- assuming no unique constraint on nama_kategori, we might insert duplicates if run twice, but this is a simple seed.
