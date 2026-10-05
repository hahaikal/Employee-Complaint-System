import { AppHeader } from "@/components/dashboard/app-header";
import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { AdminView } from "@/components/dashboard/admin-view";
import { EmployeeView } from "@/components/dashboard/employee-view";
import { Metadata } from "next";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Dashboard — Sistem Informasi Pengaduan Karyawan",
  description: "Dashboard pelaporan dan pemantauan pengaduan fasilitas karyawan kepada General Affairs.",
};

export default async function DashboardPage() {
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

  // Map the profile to the expected format
  const currentUser = {
    name: profile?.nama || user.user_metadata?.nama || "Pengguna",
    nik: profile?.nik || user.user_metadata?.nik || "-",
    position: "Karyawan", // Dummy
    department: "Divisi", // Dummy
    email: user.email || "-",
  };

  const { data: rawComplaints, error: complaintsError } = await supabase
    .from("pengaduan")
    .select(`
      id,
      nomor_pengaduan,
      judul,
      detail_pengaduan,
      status,
      tanggal_pengaduan,
      kategori_pengaduan (nama_kategori),
      users (nama)
    `)
    .order("created_at", { ascending: false });

  if (complaintsError) {
    console.error("Error fetching complaints:", complaintsError);
  }

  const mappedComplaints = (rawComplaints || []).map((c: any) => ({
    id: c.id,
    nomor_pengaduan: c.nomor_pengaduan,
    title: c.judul,
    category: c.kategori_pengaduan?.nama_kategori || "Umum",
    description: c.detail_pengaduan,
    date: c.tanggal_pengaduan ? new Date(c.tanggal_pengaduan).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : "-",
    status: c.status,
    employee: c.users?.nama || "Unknown",
    department: "Divisi",
  }));

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="sticky top-0 hidden h-screen shrink-0 lg:block">
        <AppSidebar />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <AppHeader role={userRole} currentUser={currentUser} />
        <main className="mx-auto w-full max-w-7xl flex-1 p-4 sm:p-6 lg:p-8">
          {userRole === "ADMIN" ? (
            <AdminView currentUser={currentUser} complaints={mappedComplaints} />
          ) : (
            <EmployeeView currentUser={currentUser} complaints={mappedComplaints} />
          )}
        </main>
      </div>
    </div>
  );
}
