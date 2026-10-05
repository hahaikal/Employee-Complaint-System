import { AdminView } from "@/components/dashboard/admin-view";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export default async function ProgresPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin_ga") {
    redirect("/dashboard");
  }

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
      <AdminView complaints={mappedComplaints} />
    </div>
  );
}
