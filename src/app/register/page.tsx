'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { createClient } from '@/utils/supabase/client';
import { toast } from 'sonner';

export default function RegisterPage() {
  const router = useRouter();
  const supabase = createClient();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    nama: '',
    username: '',
    nik: '',
    no_hp: '',
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.id]: e.target.value,
    }));
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        data: {
          nama: formData.nama,
          username: formData.username,
          nik: formData.nik,
          no_hp: formData.no_hp,
          role: 'Karyawan',
        },
      },
    });

    if (error) {
      let errorMessage = error.message;
      
      const lowerError = errorMessage.toLowerCase();
      if (lowerError.includes('user already registered')) {
        errorMessage = 'Email ini sudah terdaftar. Silakan gunakan email lain atau langsung login.';
      } else if (lowerError.includes('password should be at least')) {
        errorMessage = 'Password minimal harus terdiri dari 6 karakter.';
      } else if (lowerError.includes('rate limit') || errorMessage.includes('429') || lowerError.includes('too many requests')) {
        errorMessage = 'Terlalu banyak percobaan pendaftaran. Silakan tunggu beberapa saat lagi.';
      } else if (lowerError.includes('duplicate key value') || lowerError.includes('unique constraint')) {
        errorMessage = 'Data NIK atau Username ini sudah digunakan oleh akun lain.';
      } else if (lowerError.includes('database error')) {
        errorMessage = 'Terjadi kesalahan sistem saat menyimpan data (Pastikan Trigger di Supabase sudah benar).';
      }

      toast.error(errorMessage);
      setLoading(false);
      return;
    }

    if (data.user) {
      toast.success('Registrasi berhasil! Silakan login.');
      router.push('/login');
    }

    setLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-muted/50">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Daftar Akun</CardTitle>
          <CardDescription className="text-center">
            Sistem Informasi Pengaduan Karyawan
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleRegister}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nama">Nama Lengkap</Label>
              <Input
                id="nama"
                required
                value={formData.nama}
                onChange={handleChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                required
                value={formData.username}
                onChange={handleChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nik">NIK Karyawan</Label>
              <Input
                id="nik"
                required
                value={formData.nik}
                onChange={handleChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="no_hp">Nomor WhatsApp / HP</Label>
              <Input
                id="no_hp"
                type="tel"
                required
                value={formData.no_hp}
                onChange={handleChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                required
                value={formData.password}
                onChange={handleChange}
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Memproses...' : 'Daftar'}
            </Button>
            <div className="text-sm text-center text-muted-foreground">
              Sudah punya akun?{' '}
              <Link href="/login" className="text-primary hover:underline">
                Masuk di sini
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
