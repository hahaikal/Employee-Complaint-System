import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { PengaduanClient } from "./pengaduan-client";
import { fetchEnrichedComplaints } from "@/utils/fetch-complaints";

export default async function PengaduanSayaPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

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

  const categories =
    dbCategories && dbCategories.length > 0 ? dbCategories : defaultCategories;

  // Fetch enriched complaints with evidence & handling details
  const { complaints } = await fetchEnrichedComplaints(supabase, user.id);

  return (
    <div className="flex flex-col gap-6">
      <PengaduanClient
        initialComplaints={complaints}
        categories={categories}
        userId={user.id}
      />
    </div>
  );
}
