-- Add foto_url column to users table if not exists
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS foto_url text;
