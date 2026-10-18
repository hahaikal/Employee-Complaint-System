import { SupabaseClient } from "@supabase/supabase-js";
import type { Complaint, ComplaintStatus, EvidenceFile } from "@/components/dashboard/data";
import type { ProgresComplaint } from "@/app/dashboard/progres/progres-client";

export async function fetchEnrichedComplaints(
  supabase: SupabaseClient,
  filterUserId?: string
): Promise<{ complaints: Complaint[]; progresComplaints: ProgresComplaint[] }> {
  let query = supabase
    .from("pengaduan")
    .select(`
      id,
      user_id,
      nomor_pengaduan,
      judul,
      lokasi,
      detail_pengaduan,
      status,
      tanggal_pengaduan,
      informasi_tambahan,
      created_at,
      kategori_pengaduan (nama_kategori),
      users (nama, departemen)
    `)
    .order("created_at", { ascending: false });

  if (filterUserId) {
    query = query.eq("user_id", filterUserId);
  }

  const { data: rawComplaints, error } = await query;

  if (error || !rawComplaints) {
    console.error("Error fetching complaints:", error);
    return { complaints: [], progresComplaints: [] };
  }

  const complaintIds = rawComplaints.map((c: any) => c.id);

  // Fetch related tables in parallel (non-blocking if any table is empty or restricted)
  const [buktiRes, verifRes, penangananRes] = await Promise.all([
    complaintIds.length > 0
      ? supabase
          .from("bukti_pengaduan")
          .select("id, pengaduan_id, nama_file, path_file, jenis_file, keterangan")
          .in("pengaduan_id", complaintIds)
      : Promise.resolve({ data: [] as any[] }),
    complaintIds.length > 0
      ? supabase
          .from("verifikasi_pengaduan")
          .select("id, pengaduan_id, hasil_verifikasi, catatan_verifikasi, created_at")
          .in("pengaduan_id", complaintIds)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [] as any[] }),
    complaintIds.length > 0
      ? supabase
          .from("penanganan")
          .select(`
            id,
            pengaduan_id,
            jenis_penanganan,
            tanggal_mulai,
            estimasi_selesai,
            tanggal_selesai,
            status_penanganan,
            catatan,
            created_at,
            tindak_lanjut (
              id,
              pekerjaan_dilakukan,
              tanggal_tindak_lanjut,
              bukti_penyelesaian (
                id,
                nama_file,
                path_file,
                jenis_file,
                keterangan
              )
            )
          `)
          .in("pengaduan_id", complaintIds)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [] as any[] }),
  ]);

  const allBukti = buktiRes.data || [];
  const allVerif = verifRes.data || [];
  const allPenanganan = penangananRes.data || [];

  const complaints: Complaint[] = [];
  const progresComplaints: ProgresComplaint[] = [];

  for (const c of rawComplaints as any[]) {
    let categoryName = c.kategori_pengaduan?.nama_kategori;
    if (!categoryName && c.informasi_tambahan?.startsWith("Kategori: ")) {
      categoryName = c.informasi_tambahan.split("\n")[0].replace("Kategori: ", "").trim();
    }

    // Separate initial complaint evidence vs completion evidence stored in bukti_pengaduan
    const itemBuktiRows = allBukti.filter((b: any) => b.pengaduan_id === c.id);
    const buktiPengaduanList: EvidenceFile[] = itemBuktiRows
      .filter((b: any) => b.keterangan !== "BUKTI_PENYELESAIAN")
      .map((b: any) => ({
        id: b.id,
        nama_file: b.nama_file,
        path_file: b.path_file,
        jenis_file: b.jenis_file,
        keterangan: b.keterangan,
      }));

    const buktiPenyelesaianFromBuktiTable: EvidenceFile[] = itemBuktiRows
      .filter((b: any) => b.keterangan === "BUKTI_PENYELESAIAN")
      .map((b: any) => ({
        id: b.id,
        nama_file: b.nama_file,
        path_file: b.path_file,
        jenis_file: b.jenis_file,
        keterangan: b.keterangan,
      }));

    // Verification info
    const latestVerif = allVerif.find((v: any) => v.pengaduan_id === c.id);

    // Penanganan & Tindak Lanjut & Bukti Penyelesaian info
    const itemPenangananList = allPenanganan.filter((p: any) => p.pengaduan_id === c.id);
    const latestPenanganan = itemPenangananList[0];

    let catatanSelesai = "";
    const buktiPenyelesaianFromRel: EvidenceFile[] = [];

    for (const p of itemPenangananList) {
      const tlList = Array.isArray(p.tindak_lanjut) ? p.tindak_lanjut : p.tindak_lanjut ? [p.tindak_lanjut] : [];
      for (const tl of tlList) {
        if (tl.pekerjaan_dilakukan && !catatanSelesai) {
          catatanSelesai = tl.pekerjaan_dilakukan;
        }
        const bpList = Array.isArray(tl.bukti_penyelesaian)
          ? tl.bukti_penyelesaian
          : tl.bukti_penyelesaian
          ? [tl.bukti_penyelesaian]
          : [];
        for (const bp of bpList) {
          buktiPenyelesaianFromRel.push({
            id: bp.id,
            nama_file: bp.nama_file,
            path_file: bp.path_file,
            jenis_file: bp.jenis_file,
            keterangan: bp.keterangan,
          });
        }
      }
    }

    // Deduplicate completion evidence by path_file
    const combinedBuktiPenyelesaian: EvidenceFile[] = [...buktiPenyelesaianFromRel];
    for (const bp of buktiPenyelesaianFromBuktiTable) {
      if (!combinedBuktiPenyelesaian.some((existing) => existing.path_file === bp.path_file)) {
        combinedBuktiPenyelesaian.push(bp);
      }
    }

    const formattedDate = c.tanggal_pengaduan
      ? new Date(c.tanggal_pengaduan).toLocaleDateString("id-ID", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : "-";

    const formattedEstimasi = latestPenanganan?.estimasi_selesai
      ? new Date(latestPenanganan.estimasi_selesai).toLocaleDateString("id-ID", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : undefined;

    const formattedTanggalSelesai = latestPenanganan?.tanggal_selesai
      ? new Date(latestPenanganan.tanggal_selesai).toLocaleDateString("id-ID", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : undefined;

    const status = (c.status as ComplaintStatus) || "DIAJUKAN";

    complaints.push({
      id: c.id,
      nomor_pengaduan: c.nomor_pengaduan,
      title: c.judul,
      category: categoryName || "Umum",
      description: c.detail_pengaduan,
      location: c.lokasi || "-",
      date: formattedDate,
      status,
      employee: c.users?.nama || "Karyawan",
      department: c.users?.departemen || "Divisi",
      bukti_pengaduan: buktiPengaduanList,
      bukti_penyelesaian: combinedBuktiPenyelesaian,
      hasil_verifikasi: latestVerif?.hasil_verifikasi,
      catatan_verifikasi: latestVerif?.catatan_verifikasi,
      jenis_penanganan: latestPenanganan?.jenis_penanganan,
      estimasi_selesai: formattedEstimasi,
      catatan_penanganan: latestPenanganan?.catatan,
      catatan_selesai: catatanSelesai || undefined,
      tanggal_selesai: formattedTanggalSelesai,
    });

    progresComplaints.push({
      id: c.id,
      nomor_pengaduan: c.nomor_pengaduan,
      judul: c.judul,
      lokasi: c.lokasi || "-",
      detail_pengaduan: c.detail_pengaduan,
      status,
      tanggal_pengaduan: formattedDate,
      kategori: categoryName || "Umum",
      nama_pelapor: c.users?.nama || "Karyawan",
      bukti_pengaduan: buktiPengaduanList,
      bukti_penyelesaian: combinedBuktiPenyelesaian,
      hasil_verifikasi: latestVerif?.hasil_verifikasi,
      catatan_verifikasi: latestVerif?.catatan_verifikasi,
      jenis_penanganan: latestPenanganan?.jenis_penanganan,
      estimasi_selesai: formattedEstimasi,
      catatan_penanganan: latestPenanganan?.catatan,
      catatan_selesai: catatanSelesai || undefined,
      tanggal_selesai: formattedTanggalSelesai,
    });
  }

  return { complaints, progresComplaints };
}
