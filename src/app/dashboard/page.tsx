import { AppHeader } from "@/components/dashboard/app-header";
import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { AdminView } from "@/components/dashboard/admin-view";
import { EmployeeView } from "@/components/dashboard/employee-view";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard — Sistem Informasi Pengaduan Karyawan",
  description: "Dashboard pelaporan dan pemantauan pengaduan fasilitas karyawan kepada General Affairs.",
};

export default function DashboardPage() {
  // Ganti ke "ADMIN" untuk menguji tampilan admin (General Affairs).
  const userRole: string = "KARYAWAN";

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="sticky top-0 hidden h-screen shrink-0 lg:block">
        <AppSidebar />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <AppHeader role={userRole} />
        <main className="mx-auto w-full max-w-7xl flex-1 p-4 sm:p-6 lg:p-8">
          {userRole === "ADMIN" ? <AdminView /> : <EmployeeView />}
        </main>
      </div>
    </div>
  );
}
