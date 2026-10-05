import { AppHeader } from "@/components/dashboard/app-header";
import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { Metadata } from "next";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Dashboard — Sistem Informasi Pengaduan Karyawan",
  description: "Dashboard pelaporan dan pemantauan pengaduan fasilitas karyawan kepada General Affairs.",
};

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
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

  const userRole = profile?.role === "admin_ga" ? "ADMIN" : "KARYAWAN";

  const currentUser = {
    name: profile?.nama || user.user_metadata?.nama || "Pengguna",
    nik: profile?.nik || user.user_metadata?.nik || "-",
    position: "Karyawan",
    department: "Divisi",
    email: user.email || "-",
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="sticky top-0 hidden h-screen shrink-0 lg:block">
        <AppSidebar role={userRole} />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <AppHeader role={userRole} currentUser={currentUser} />
        <main className="mx-auto w-full max-w-7xl flex-1 p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
