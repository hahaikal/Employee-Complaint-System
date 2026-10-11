import { AdminView } from "@/components/dashboard/admin-view";
import { EmployeeView } from "@/components/dashboard/employee-view";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("users")
    .select("role, nama, nik, email, jabatan, departemen, foto_url")
    .eq("id", user.id)
    .single();

  const userRole = profile?.role === "admin_ga" ? "ADMIN" : "KARYAWAN";

  const currentUser = {
    name: profile?.nama || user.user_metadata?.nama || "Pengguna",
    nik: profile?.nik || user.user_metadata?.nik || "-",
    position: profile?.jabatan || "Karyawan",
    department: profile?.departemen || "Divisi",
    email: profile?.email || user.email || "-",
    foto_url: profile?.foto_url || user.user_metadata?.foto_url || null,
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
      informasi_tambahan,
      kategori_pengaduan (nama_kategori),
      users (nama)
    `)
    .order("created_at", { ascending: false });

  if (complaintsError) {
    console.error("Error fetching complaints:", complaintsError);
  }

  const mappedComplaints = (rawComplaints || []).map((c: any) => {
    let categoryName = c.kategori_pengaduan?.nama_kategori;
    if (!categoryName && c.informasi_tambahan?.startsWith("Kategori: ")) {
      categoryName = c.informasi_tambahan.replace("Kategori: ", "");
    }
    return {
      id: c.id,
      nomor_pengaduan: c.nomor_pengaduan,
      title: c.judul,
      category: categoryName || "Umum",
      description: c.detail_pengaduan,
      date: c.tanggal_pengaduan ? new Date(c.tanggal_pengaduan).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : "-",
      status: c.status,
      employee: c.users?.nama || "Unknown",
      department: "Divisi",
    };
  });

  if (userRole === "ADMIN") {
    return <AdminView currentUser={currentUser} complaints={mappedComplaints} />;
  }

  return <EmployeeView currentUser={currentUser} complaints={mappedComplaints} />;
}
