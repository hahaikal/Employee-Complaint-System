import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { PengaduanClient } from "./pengaduan-client";

export default async function PengaduanSayaPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Fetch categories
  const { data: dbCategories } = await supabase
    .from("kategori_pengaduan")
    .select("id, nama_kategori")
    .order("nama_kategori");

  const defaultCategories = [
    { id: "Fasilitas", nama_kategori: "Fasilitas" },
    { id: "Elektronik", nama_kategori: "Elektronik" },
    { id: "Kelistrikan", nama_kategori: "Kelistrikan" },
    { id: "Furniture", nama_kategori: "Furniture" },
    { id: "Kebersihan", nama_kategori: "Kebersihan" },
    { id: "Lainnya", nama_kategori: "Lainnya" },
  ];

  const categories = (dbCategories && dbCategories.length > 0) ? dbCategories : defaultCategories;

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
      informasi_tambahan,
      kategori_pengaduan (nama_kategori),
      users (nama)
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

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

  return (
    <div className="flex flex-col gap-6">
      <PengaduanClient 
        initialComplaints={mappedComplaints} 
        categories={categories}
        userId={user.id} 
      />
    </div>
  );
}
