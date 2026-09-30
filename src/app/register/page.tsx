'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AuthLayout } from '@/components/auth-layout';
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
    <AuthLayout quote="Ruang kerja yang terawat membuat setiap karyawan bekerja dengan tenang dan fokus.">
      <Card className="rounded-2xl border-border shadow-lift">
        <CardHeader className="space-y-1.5">
          <CardTitle className="text-2xl text-heading">Buat Akun</CardTitle>
          <CardDescription className="text-body">
            Lengkapi data karyawan Anda untuk mendaftar.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleRegister}>
            <div className="space-y-2">
              <Label htmlFor="nama" className="text-heading">
                Nama Lengkap
              </Label>
              <Input id="nama" placeholder="Rina Wijaya" required value={formData.nama} onChange={handleChange} />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="username" className="text-heading">Username</Label>
              <Input id="username" placeholder="rinawijaya" required value={formData.username} onChange={handleChange} />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="nik" className="text-heading">
                  NIK
                </Label>
                <Input id="nik" placeholder="1234567890" required value={formData.nik} onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="no_hp" className="text-heading">
                  WhatsApp
                </Label>
                <Input id="no_hp" type="tel" placeholder="0812xxxxxxx" required value={formData.no_hp} onChange={handleChange} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-heading">
                Email
              </Label>
              <Input id="email" type="email" placeholder="nama@perusahaan.co.id" required value={formData.email} onChange={handleChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-heading">
                Kata Sandi
              </Label>
              <Input id="password" type="password" placeholder="••••••••" required value={formData.password} onChange={handleChange} />
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-brand text-brand-foreground hover:bg-brand-dark"
            >
              {loading ? 'Memproses...' : 'Daftar'}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-body">
            Sudah punya akun?{" "}
            <Link href="/login" className="font-semibold text-brand hover:underline">
              Masuk
            </Link>
          </p>
        </CardContent>
      </Card>
    </AuthLayout>
  );
}
