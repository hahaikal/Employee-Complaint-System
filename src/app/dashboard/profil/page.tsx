import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { ProfilClient, type UserProfileData } from "./profil-client";

export default async function ProfilPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single();

  const isAdmin = profile?.role === "admin_ga" || profile?.role === "GA";

  let complaintsQuery = supabase.from("pengaduan").select("status");
  if (!isAdmin) {
    complaintsQuery = complaintsQuery.eq("user_id", user.id);
  }
  const { data: complaints } = await complaintsQuery;

  const complaintsList = complaints || [];
  const total = complaintsList.length;
  const diproses = complaintsList.filter(
    (c) => c.status === "DIPROSES" || c.status === "DIVERIFIKASI"
  ).length;
  const selesai = complaintsList.filter((c) => c.status === "SELESAI").length;

  const initialUser: UserProfileData = {
    id: user.id,
    name: profile?.nama || user.user_metadata?.nama || "Pengguna",
    username: profile?.username || user.user_metadata?.username || "",
    nik: profile?.nik || user.user_metadata?.nik || "-",
    email: profile?.email || user.email || "-",
    foto_url: profile?.foto_url || null,
    phone: profile?.no_hp || user.user_metadata?.no_hp || "",
    position: profile?.jabatan || (isAdmin ? "Admin GA" : "Karyawan"),
    department: profile?.departemen || (isAdmin ? "General Affairs" : "Operasional"),
    joinDate: profile?.tanggal_bergabung
      ? new Date(profile.tanggal_bergabung).toLocaleDateString("id-ID", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })
      : profile?.created_at
      ? new Date(profile.created_at).toLocaleDateString("id-ID", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })
      : "Belum diketahui",
    role: profile?.role || "karyawan",
  };

  return (
    <ProfilClient
      initialUser={initialUser}
      stats={{ total, diproses, selesai }}
    />
  );
}
