import { AdminView } from "@/components/dashboard/admin-view";
import { EmployeeView } from "@/components/dashboard/employee-view";
import { createClient } from "@/utils/supabase/server";
import { fetchEnrichedComplaints } from "@/utils/fetch-complaints";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("users")
    .select("role, nama, nik, email, jabatan, departemen, foto_url")
    .eq("id", user.id)
    .single();

  const isAdmin = profile?.role === "admin_ga" || profile?.role === "GA";
  const userRole = isAdmin ? "ADMIN" : "KARYAWAN";

  const currentUser = {
    name: profile?.nama || user.user_metadata?.nama || "Pengguna",
    nik: profile?.nik || user.user_metadata?.nik || "-",
    position: profile?.jabatan || (isAdmin ? "Admin GA" : "Karyawan"),
    department: profile?.departemen || (isAdmin ? "General Affairs" : "Divisi"),
    email: profile?.email || user.email || "-",
    foto_url: profile?.foto_url || null,
  };

  const { complaints: mappedComplaints } = await fetchEnrichedComplaints(
    supabase,
    isAdmin ? undefined : user.id
  );

  return userRole === "KARYAWAN" ? (
    <EmployeeView currentUser={currentUser} complaints={mappedComplaints} />
  ) : (
    <AdminView currentUser={currentUser} complaints={mappedComplaints} />
  );
}
