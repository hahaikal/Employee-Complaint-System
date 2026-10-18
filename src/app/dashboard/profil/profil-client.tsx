"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Briefcase,
  Building,
  CalendarDays,
  Camera,
  FileText,
  IdCard,
  Loader2,
  Mail,
  Pencil,
  Phone,
  Trash2,
  User as UserIcon,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/utils/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ImageCropModal } from "@/app/dashboard/users/image-crop-modal";

export type UserProfileData = {
  id: string;
  name: string;
  username: string;
  nik: string;
  email: string;
  foto_url: string | null;
  phone: string;
  position: string;
  department: string;
  joinDate: string;
  role: string;
};

export function ProfilClient({
  initialUser,
  stats,
}: {
  initialUser: UserProfileData;
  stats: { total: number; diproses: number; selesai: number };
}) {
  const router = useRouter();
  const supabase = createClient();

  const [userProfile, setUserProfile] = useState<UserProfileData>(initialUser);
  const [isEditing, setIsEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<UserProfileData>(initialUser);

  const [cropRawImage, setCropRawImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleOpenEdit = () => {
    setFormData({ ...userProfile });
    setIsEditing(true);
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Format file harus berupa gambar.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setCropRawImage(reader.result as string);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // 1. Try syncing email/nama in auth.users via RPC if available
      try {
        await supabase.rpc("update_own_profile_credentials", {
          new_email: formData.email.trim(),
          new_nama: formData.name.trim(),
        });
      } catch {
        // Fallback: update user metadata via standard auth client
        await supabase.auth.updateUser({
          data: {
            nama: formData.name.trim(),
            nik: formData.nik.trim(),
          },
        });
      }

      // 2. Update public.users table
      let { error } = await supabase
        .from("users")
        .update({
          nama: formData.name.trim(),
          username: formData.username.trim() || null,
          nik: formData.nik.trim(),
          email: formData.email.trim(),
          no_hp: formData.phone.trim() || null,
          jabatan: formData.position.trim() || null,
          departemen: formData.department.trim() || null,
          foto_url: formData.foto_url || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userProfile.id);

      // Fallback if custom columns are missing
      if (
        error &&
        (error.message?.includes("does not exist") ||
          error.code === "42703" ||
          error.code === "PGRST204")
      ) {
        const fallback = await supabase
          .from("users")
          .update({
            nama: formData.name.trim(),
            username: formData.username.trim() || null,
            nik: formData.nik.trim(),
            email: formData.email.trim(),
            no_hp: formData.phone.trim() || null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", userProfile.id);
        error = fallback.error;
      }

      if (error) throw error;

      setUserProfile({ ...formData });
      setIsEditing(false);
      toast.success("Profil Anda berhasil diperbarui!");
      router.refresh();
    } catch (err: unknown) {
      toast.error(`Gagal memperbarui profil: ${(err as Error).message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const profileFields = [
    { icon: IdCard, label: "NIK", value: userProfile.nik || "-" },
    { icon: UserIcon, label: "Username", value: userProfile.username ? `@${userProfile.username}` : "-" },
    { icon: Mail, label: "Email", value: userProfile.email || "-" },
    { icon: Phone, label: "Telepon", value: userProfile.phone || "-" },
    { icon: Briefcase, label: "Jabatan", value: userProfile.position || "-" },
    { icon: Building, label: "Departemen", value: userProfile.department || "-" },
    { icon: CalendarDays, label: "Bergabung Sejak", value: userProfile.joinDate || "-" },
  ];

  const isAdmin = userProfile.role === "admin_ga" || userProfile.role === "GA";

  return (
    <div className="flex flex-col gap-6">
      <Card className="overflow-hidden rounded-2xl border-slate-200/80 shadow-sm">
        <div className="h-28 bg-gradient-to-r from-sidebar-brand to-sidebar-brand-hover" />
        <CardContent className="relative flex flex-col gap-5 p-6 pt-0 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <Avatar className="-mt-12 h-24 w-24 shrink-0 border-4 border-white shadow-lg">
              {userProfile.foto_url ? (
                <AvatarImage src={userProfile.foto_url} alt={userProfile.name} />
              ) : null}
              <AvatarFallback className="bg-sidebar-brand text-2xl font-semibold text-white">
                {(userProfile.name || "U").substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 sm:pb-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="truncate text-2xl font-bold text-slate-900">
                  {userProfile.name}
                </h1>
                <span className="rounded-full bg-sidebar-brand/10 px-2.5 py-0.5 text-xs font-semibold text-sidebar-brand">
                  {isAdmin ? "Admin GA" : "Karyawan"}
                </span>
              </div>
              <p className="mt-1 text-sm text-slate-500">
                {userProfile.position} · {userProfile.department}
              </p>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={handleOpenEdit}
            className="w-fit shrink-0 rounded-full border-slate-200 font-semibold text-slate-700 hover:bg-slate-100"
          >
            <Pencil className="h-4 w-4 mr-2" />
            Edit Profil
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="rounded-2xl border-slate-200/80 shadow-sm lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg text-slate-900">
              Informasi Pribadi
            </CardTitle>
            <CardDescription>
              Data identitas Anda yang terdaftar di perusahaan
            </CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
              {profileFields.map((field) => (
                <div key={field.label} className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sidebar-brand/10">
                    <field.icon className="h-4 w-4 text-sidebar-brand" />
                  </div>
                  <div className="min-w-0">
                    <dt className="text-xs font-medium uppercase tracking-wider text-slate-400">
                      {field.label}
                    </dt>
                    <dd className="mt-0.5 truncate text-sm font-medium text-slate-900">
                      {field.value}
                    </dd>
                  </div>
                </div>
              ))}
            </dl>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-200/80 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg text-slate-900">
              Ringkasan Pengaduan
            </CardTitle>
            <CardDescription>
              {isAdmin ? "Ringkasan laporan fasilitas sistem" : "Aktivitas pengajuan Anda"}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
              <span className="text-sm text-slate-500">Total Pengajuan</span>
              <span className="text-lg font-bold text-slate-900">{stats.total}</span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
              <span className="text-sm text-slate-500">Sedang Diproses</span>
              <span className="text-lg font-bold text-status-diproses">
                {stats.diproses}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
              <span className="text-sm text-slate-500">Selesai</span>
              <span className="text-lg font-bold text-status-selesai">
                {stats.selesai}
              </span>
            </div>
            <Link href={isAdmin ? "/dashboard/progres" : "/dashboard/pengaduan"}>
              <Button className="mt-2 w-full rounded-full bg-sidebar-brand font-semibold text-white shadow-lg shadow-sidebar-brand/25 hover:bg-sidebar-brand-hover">
                <FileText className="h-4 w-4 mr-2" />
                {isAdmin ? "Kelola Progres Pengaduan" : "Lihat Pengaduan Saya"}
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* MODAL EDIT PROFIL PRIBADI (UNTUK ADMIN/GA & KARYAWAN) */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4">
          <div className="flex flex-col w-full max-w-lg max-h-[85vh] rounded-2xl bg-white shadow-2xl overflow-hidden animate-in fade-in-0 zoom-in-95">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 shrink-0 bg-white">
              <div>
                <h3 className="text-base font-bold text-slate-900">Edit Profil Saya</h3>
                <p className="text-xs text-slate-500">
                  Perbarui foto profil dan informasi identitas akun Anda.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSaveProfile} className="flex flex-col flex-1 overflow-hidden">
              <div className="overflow-y-auto px-6 py-4 space-y-4 flex-1">
                {/* Foto Profil Section */}
                <div className="flex items-center gap-4 rounded-xl bg-slate-50 p-3.5 border border-slate-100">
                  <Avatar className="h-16 w-16 border-2 border-white shadow-md ring-2 ring-sidebar-brand/20 shrink-0">
                    {formData.foto_url ? (
                      <AvatarImage src={formData.foto_url} alt={formData.name} />
                    ) : null}
                    <AvatarFallback className="bg-sidebar-brand text-base font-bold text-white">
                      {(formData.name || "U").substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex flex-col gap-1.5 min-w-0">
                    <span className="text-xs font-semibold text-slate-700">Foto Profil</span>
                    <div className="flex flex-wrap gap-2">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoSelect}
                        className="hidden"
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        className="h-8 rounded-full border-slate-200 text-xs font-medium"
                      >
                        <Camera className="h-3.5 w-3.5 mr-1.5" />
                        {formData.foto_url ? "Ganti Foto" : "Unggah Foto"}
                      </Button>
                      {formData.foto_url && (
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => setFormData((prev) => ({ ...prev, foto_url: null }))}
                          className="h-8 rounded-full text-xs text-red-600 hover:bg-red-50 hover:text-red-700"
                        >
                          <Trash2 className="h-3.5 w-3.5 mr-1" />
                          Hapus Foto
                        </Button>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-400">
                      Foto dapat digeser dan di-crop menjadi bulat.
                    </span>
                  </div>
                </div>

                {/* Fields Grid */}
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="prof-nama" className="text-xs">Nama Lengkap</Label>
                    <Input
                      id="prof-nama"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      className="border-slate-200 text-sm h-9"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="prof-username" className="text-xs">Username</Label>
                    <Input
                      id="prof-username"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      placeholder="username"
                      className="border-slate-200 text-sm h-9"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="prof-nik" className="text-xs">NIK (Nomor Induk Karyawan)</Label>
                    <Input
                      id="prof-nik"
                      value={formData.nik}
                      onChange={(e) => setFormData({ ...formData, nik: e.target.value })}
                      required
                      className="border-slate-200 text-sm h-9"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="prof-email" className="text-xs">Email</Label>
                    <Input
                      id="prof-email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                      className="border-slate-200 text-sm h-9"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="prof-phone" className="text-xs">No. Telepon / WhatsApp</Label>
                    <Input
                      id="prof-phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="0812..."
                      className="border-slate-200 text-sm h-9"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="prof-jabatan" className="text-xs">Jabatan</Label>
                    <Input
                      id="prof-jabatan"
                      value={formData.position}
                      onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                      placeholder="Staff IT, Admin GA, dll"
                      className="border-slate-200 text-sm h-9"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5 sm:col-span-2">
                    <Label htmlFor="prof-departemen" className="text-xs">Departemen / Divisi</Label>
                    <Input
                      id="prof-departemen"
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      placeholder="General Affairs, Operasional, dll"
                      className="border-slate-200 text-sm h-9"
                    />
                  </div>
                </div>
              </div>

              {/* Sticky Footer */}
              <div className="flex justify-end gap-2.5 px-6 py-3.5 border-t border-slate-100 bg-slate-50/60 shrink-0">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditing(false)}
                  className="rounded-full h-9"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="rounded-full bg-sidebar-brand hover:bg-sidebar-brand-hover text-white font-semibold h-9"
                >
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
                  Simpan Profil
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CROP FOTO PROFIL */}
      {cropRawImage && (
        <ImageCropModal
          imageSrc={cropRawImage}
          onCancel={() => setCropRawImage(null)}
          onCropComplete={(croppedDataUrl) => {
            setFormData((prev) => ({ ...prev, foto_url: croppedDataUrl }));
            setCropRawImage(null);
          }}
        />
      )}
    </div>
  );
}
