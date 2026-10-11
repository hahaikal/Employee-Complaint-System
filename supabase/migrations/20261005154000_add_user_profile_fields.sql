-- Add position, department, and join_date columns to users table
ALTER TABLE public.users 
ADD COLUMN jabatan text,
ADD COLUMN departemen text,
ADD COLUMN tanggal_bergabung date DEFAULT CURRENT_DATE;
