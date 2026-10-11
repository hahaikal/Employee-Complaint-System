import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { PengaduanClient } from "./pengaduan-client";

export default async function PengaduanSayaPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Fetch categories
  const { data: categories } = await supabase
    .from("kategori_pengaduan")
    .select("id, nama_kategori")
    .order("nama_kategori");

  // Fetch complaints
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
      <PengaduanClient 
        initialComplaints={mappedComplaints} 
        categories={categories || []}
        userId={user.id} 
      />
    </div>
  );
}
