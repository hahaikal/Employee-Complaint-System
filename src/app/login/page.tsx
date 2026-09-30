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

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      let errorMessage = error.message;
      if (errorMessage.toLowerCase().includes('invalid login credentials')) {
        errorMessage = 'Email atau password salah.';
      } else if (errorMessage.toLowerCase().includes('email not confirmed')) {
        errorMessage = 'Email belum diverifikasi. Silakan cek kotak masuk email Anda.';
      }
      toast.error(errorMessage);
      setLoading(false);
      return;
    }

    if (data.user) {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('role')
        .eq('id', data.user.id)
        .single();

      if (userError) {
        toast.error('Gagal mengambil data user');
      } else {
        toast.success('Login berhasil!');
        if (userData.role === 'admin_ga') {
          router.push('/admin/dashboard');
        } else {
          router.push('/dashboard');
        }
        router.refresh();
      }
    }

    setLoading(false);
  };

  return (
    <AuthLayout quote="Kenyamanan tempat kerja adalah fondasi dari produktivitas yang berkelanjutan.">
      <Card className="rounded-2xl border-border shadow-lift">
        <CardHeader className="space-y-1.5">
          <CardTitle className="text-2xl text-heading">Masuk</CardTitle>
          <CardDescription className="text-body">
            Gunakan akun karyawan Anda untuk melanjutkan.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleLogin}>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-heading">
                Email
              </Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="nama@perusahaan.co.id" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-heading">
                  Kata Sandi
                </Label>
                <span className="text-xs text-brand cursor-pointer hover:underline">Lupa kata sandi?</span>
              </div>
              <Input 
                id="password" 
                type="password" 
                placeholder="••••••••" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-brand text-brand-foreground hover:bg-brand-dark"
            >
              {loading ? 'Memproses...' : 'Masuk'}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-body">
            Belum punya akun?{" "}
            <Link href="/register" className="font-semibold text-brand hover:underline">
              Buat Akun
            </Link>
          </p>
        </CardContent>
      </Card>
    </AuthLayout>
  );
}
