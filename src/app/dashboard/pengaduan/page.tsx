import { EmployeeView } from "@/components/dashboard/employee-view";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export default async function PengaduanSayaPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("users")
    .select("role, nama, nik")
    .eq("id", user.id)
    .single();

  const currentUser = {
    name: profile?.nama || user.user_metadata?.nama || "Pengguna",
    nik: profile?.nik || user.user_metadata?.nik || "-",
    position: "Karyawan",
    department: "Divisi",
    email: user.email || "-",
  };

  const { data: rawComplaints } = await supabase
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
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

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
    <div className="flex flex-col gap-6">
      <EmployeeView currentUser={currentUser} complaints={mappedComplaints} />
    </div>
  );
}
