import { ProgresClient, type ProgresComplaint } from "./progres-client";
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

  if (profile?.role !== "admin_ga" && profile?.role !== "GA") {
    redirect("/dashboard");
  }

  const { data: rawComplaints } = await supabase
    .from("pengaduan")
    .select(`
      id,
      nomor_pengaduan,
      judul,
      lokasi,
      detail_pengaduan,
      status,
      tanggal_pengaduan,
      informasi_tambahan,
      kategori_pengaduan (nama_kategori),
      users (nama)
    `)
    .order("created_at", { ascending: false });

  const mappedComplaints: ProgresComplaint[] = (rawComplaints || []).map((c: any) => {
    let categoryName = c.kategori_pengaduan?.nama_kategori;
    if (!categoryName && c.informasi_tambahan?.startsWith("Kategori: ")) {
      categoryName = c.informasi_tambahan.replace("Kategori: ", "");
    }
    return {
      id: c.id,
      nomor_pengaduan: c.nomor_pengaduan,
      judul: c.judul,
      lokasi: c.lokasi || "-",
      detail_pengaduan: c.detail_pengaduan,
      status: c.status,
      tanggal_pengaduan: c.tanggal_pengaduan ? new Date(c.tanggal_pengaduan).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : "-",
      kategori: categoryName || "Umum",
      nama_pelapor: c.users?.nama || "Karyawan",
    };
  });

  return (
    <ProgresClient 
      initialComplaints={mappedComplaints} 
      currentUserId={user.id} 
    />
  );
}
