import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Briefcase,
  Building,
  CalendarDays,
  FileText,
  IdCard,
  Mail,
  Pencil,
  Phone,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function ProfilPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single();

  const { data: complaints } = await supabase
    .from("pengaduan")
    .select("status")
    .eq("user_id", user.id);

  const complaintsList = complaints || [];
  const total = complaintsList.length;
  const diproses = complaintsList.filter((c) => c.status === "DIPROSES").length;
  const selesai = complaintsList.filter((c) => c.status === "SELESAI").length;

  const currentUser = {
    name: profile?.nama || user.user_metadata?.nama || "Pengguna",
    nik: profile?.nik || user.user_metadata?.nik || "-",
    email: user.email || "-",
    phone: profile?.no_hp || "+62 812-3456-7890",
    position: profile?.jabatan || "Karyawan",
    department: profile?.departemen || "Divisi",
    joinDate: profile?.tanggal_bergabung 
      ? new Date(profile.tanggal_bergabung).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })
      : "Belum diketahui",
  };

  const profileFields = [
    { icon: IdCard, label: "NIK", value: currentUser.nik },
    { icon: Mail, label: "Email", value: currentUser.email },
    { icon: Phone, label: "Telepon", value: currentUser.phone },
    { icon: Briefcase, label: "Jabatan", value: currentUser.position },
    { icon: Building, label: "Departemen", value: currentUser.department },
    { icon: CalendarDays, label: "Bergabung Sejak", value: currentUser.joinDate },
  ];

  return (
    <div className="flex flex-col gap-6">
      <Card className="overflow-hidden rounded-2xl border-slate-200/80 shadow-sm">
        <div className="h-28 bg-gradient-to-r from-sidebar-brand to-sidebar-brand-hover" />
        <CardContent className="relative flex flex-col gap-5 p-6 pt-0 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <Avatar className="-mt-12 h-24 w-24 shrink-0 border-4 border-white shadow-lg">
              <AvatarImage src={"https://github.com/shadcn.png"} alt={currentUser.name} />
              <AvatarFallback className="bg-sidebar-brand text-2xl font-semibold text-white">
                {currentUser.name.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 sm:pb-1">
              <h1 className="truncate text-2xl font-bold text-slate-900">
                {currentUser.name}
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                {currentUser.position} · {currentUser.department}
              </p>
            </div>
          </div>
          {profile?.role === "admin_ga" || profile?.role === "GA" ? (
            <Button
              variant="outline"
              className="w-fit shrink-0 rounded-full border-slate-200 font-semibold text-slate-700 hover:bg-slate-100"
            >
              <Pencil className="h-4 w-4 mr-2" />
              Edit Profil
            </Button>
          ) : null}
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
            <CardDescription>Aktivitas pengajuan Anda</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
              <span className="text-sm text-slate-500">Total Pengajuan</span>
              <span className="text-lg font-bold text-slate-900">{total}</span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
              <span className="text-sm text-slate-500">Sedang Diproses</span>
              <span className="text-lg font-bold text-status-diproses">
                {diproses}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
              <span className="text-sm text-slate-500">Selesai</span>
              <span className="text-lg font-bold text-status-selesai">
                {selesai}
              </span>
            </div>
            <Link href="/dashboard/pengaduan">
              <Button
                className="mt-2 w-full rounded-full bg-sidebar-brand font-semibold text-white shadow-lg shadow-sidebar-brand/25 hover:bg-sidebar-brand-hover"
              >
                <FileText className="h-4 w-4 mr-2" />
                Lihat Pengaduan Saya
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
