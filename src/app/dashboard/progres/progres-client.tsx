"use client";

import { useState, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  CalendarDays,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileText,
  Filter,
  ImageIcon,
  ImagePlus,
  Loader2,
  MapPin,
  Paperclip,
  Printer,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
  User,
  Wrench,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/utils/supabase/client";
import { StatusBadge } from "@/components/dashboard/status-badge";
import {
  ComplaintDetailModal,
  EvidenceGallery,
} from "@/components/dashboard/complaint-detail-modal";
import { uploadEvidenceFile } from "@/utils/file-upload";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { ComplaintStatus, EvidenceFile } from "@/components/dashboard/data";
import {
  DateFilter,
  useDateFilter,
  isWithinDateRange,
} from "@/components/dashboard/date-filter";
import { printComplaintReport } from "@/utils/print-report";

export type ProgresComplaint = {
  id: string;
  nomor_pengaduan: string;
  judul: string;
  lokasi: string;
  detail_pengaduan: string;
  status: ComplaintStatus;
  tanggal_pengaduan: string;
  raw_date?: string;
  kategori: string;
  nama_pelapor: string;
  bukti_pengaduan?: EvidenceFile[];
  bukti_penyelesaian?: EvidenceFile[];
  hasil_verifikasi?: string;
  catatan_verifikasi?: string;
  jenis_penanganan?: string;
  estimasi_selesai?: string;
  catatan_penanganan?: string;
  catatan_selesai?: string;
  tanggal_selesai?: string;
};

type SelectedFilePreview = {
  file: File;
  previewUrl: string | null;
};

function ProgresClientInner({
  initialComplaints,
  currentUserId,
}: {
  initialComplaints: ProgresComplaint[];
  currentUserId: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const globalQuery = (searchParams.get("q") || "").trim();

  const supabase = createClient();

  const [activeTab, setActiveTab] = useState<"SEMUA" | ComplaintStatus>("SEMUA");
  const [localSearch, setLocalSearch] = useState("");
  const [selectedComplaint, setSelectedComplaint] = useState<ProgresComplaint | null>(null);
  const [modalType, setModalType] = useState<"verifikasi" | "penanganan" | "selesai" | "detail" | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form states for modals
  const [hasilVerifikasi, setHasilVerifikasi] = useState<"Lengkap" | "Tidak Lengkap">("Lengkap");
  const [catatanVerifikasi, setCatatanVerifikasi] = useState("");

  const [jenisPenanganan, setJenisPenanganan] = useState<"GA" | "VENDOR">("GA");
  const [estimasiSelesai, setEstimasiSelesai] = useState("");
  const [catatanPenanganan, setCatatanPenanganan] = useState("");

  const [catatanSelesai, setCatatanSelesai] = useState("");
  const [completionFiles, setCompletionFiles] = useState<SelectedFilePreview[]>([]);
  const completionFileInputRef = useRef<HTMLInputElement>(null);

  // Combine global navbar search and local search
  const effectiveSearch = (localSearch || globalQuery).toLowerCase();
  const { startDate, endDate } = useDateFilter();

  // Complaints filtered by date period
  const dateFilteredComplaints = initialComplaints.filter((c) =>
    isWithinDateRange(c.raw_date, startDate, endDate)
  );

  const filteredComplaints = dateFilteredComplaints.filter((c) => {
    const matchTab = activeTab === "SEMUA" || c.status === activeTab;
    const matchSearch =
      !effectiveSearch ||
      c.nomor_pengaduan.toLowerCase().includes(effectiveSearch) ||
      c.judul.toLowerCase().includes(effectiveSearch) ||
      c.kategori.toLowerCase().includes(effectiveSearch) ||
      c.nama_pelapor.toLowerCase().includes(effectiveSearch) ||
      c.lokasi.toLowerCase().includes(effectiveSearch) ||
      c.detail_pengaduan.toLowerCase().includes(effectiveSearch);
    return matchTab && matchSearch;
  });

  const countByStatus = {
    SEMUA: dateFilteredComplaints.length,
    DIAJUKAN: dateFilteredComplaints.filter((c) => c.status === "DIAJUKAN").length,
    DIVERIFIKASI: dateFilteredComplaints.filter((c) => c.status === "DIVERIFIKASI").length,
    DIPROSES: dateFilteredComplaints.filter((c) => c.status === "DIPROSES").length,
    SELESAI: dateFilteredComplaints.filter((c) => c.status === "SELESAI").length,
  };

  const handleOpenAction = (complaint: ProgresComplaint) => {
    setSelectedComplaint(complaint);
    if (complaint.status === "DIAJUKAN") {
      setHasilVerifikasi("Lengkap");
      setCatatanVerifikasi("");
      setModalType("verifikasi");
    } else if (complaint.status === "DIVERIFIKASI") {
      setJenisPenanganan("GA");
      setEstimasiSelesai("");
      setCatatanPenanganan("");
      setModalType("penanganan");
    } else if (complaint.status === "DIPROSES") {
      setCatatanSelesai("");
      setCompletionFiles([]);
      setModalType("selesai");
    } else {
      setModalType("detail");
    }
  };

  const handleCloseModal = () => {
    for (const item of completionFiles) {
      if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
    }
    setCompletionFiles([]);
    setModalType(null);
    setSelectedComplaint(null);
  };

  const handleCompletionFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const validFiles: SelectedFilePreview[] = [];
    for (const file of files) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`Ukuran file ${file.name} terlalu besar (maksimal 10MB).`);
        continue;
      }
      const isImg = file.type.startsWith("image/");
      const previewUrl = isImg ? URL.createObjectURL(file) : null;
      validFiles.push({ file, previewUrl });
    }
    setCompletionFiles((prev) => [...prev, ...validFiles]);
    e.target.value = "";
  };

  const handleRemoveCompletionFile = (index: number) => {
    setCompletionFiles((prev) => {
      const target = prev[index];
      if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((_, i) => i !== index);
    });
  };

  // 1. Verifikasi submission
  const handleSubmitVerifikasi = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedComplaint) return;
    setSubmitting(true);

    try {
      try {
        await supabase.from("verifikasi_pengaduan").insert({
          pengaduan_id: selectedComplaint.id,
          user_id: currentUserId,
          hasil_verifikasi: hasilVerifikasi,
          catatan_verifikasi: catatanVerifikasi,
        });
      } catch (logErr) {
        console.warn("Catatan verifikasi fallback:", logErr);
      }

      const { error } = await supabase
        .from("pengaduan")
        .update({ status: "DIVERIFIKASI", updated_at: new Date().toISOString() })
        .eq("id", selectedComplaint.id);

      if (error) throw error;

      toast.success(`Pengaduan ${selectedComplaint.nomor_pengaduan} berhasil diverifikasi!`);
      handleCloseModal();
      router.refresh();
    } catch (err: unknown) {
      toast.error(`Gagal memverifikasi: ${(err as Error).message}`);
    } finally {
      setSubmitting(false);
    }
  };

  // 2. Penanganan submission
  const handleSubmitPenanganan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedComplaint) return;
    setSubmitting(true);

    try {
      try {
        await supabase.from("penanganan").insert({
          pengaduan_id: selectedComplaint.id,
          user_id: currentUserId,
          jenis_penanganan: jenisPenanganan,
          tanggal_mulai: new Date().toISOString().split("T")[0],
          estimasi_selesai: estimasiSelesai || null,
          status_penanganan: "DIPROSES",
          catatan: catatanPenanganan,
        });
      } catch (logErr) {
        console.warn("Catatan penanganan fallback:", logErr);
      }

      const { error } = await supabase
        .from("pengaduan")
        .update({ status: "DIPROSES", updated_at: new Date().toISOString() })
        .eq("id", selectedComplaint.id);

      if (error) throw error;

      toast.success(`Penanganan untuk tiket ${selectedComplaint.nomor_pengaduan} berhasil ditentukan!`);
      handleCloseModal();
      router.refresh();
    } catch (err: unknown) {
      toast.error(`Gagal memulai penanganan: ${(err as Error).message}`);
    } finally {
      setSubmitting(false);
    }
  };

  // 3. Selesai submission (with completion evidence upload)
  const handleSubmitSelesai = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedComplaint) return;
    setSubmitting(true);

    try {
      const todayDate = new Date().toISOString().split("T")[0];

      // 1. Upload completion files if any
      const uploadedItems: { url: string; fileName: string; fileType: string }[] = [];
      for (const item of completionFiles) {
        const uploaded = await uploadEvidenceFile(supabase, item.file, "penyelesaian");
        uploadedItems.push(uploaded);
      }

      // 2. Ensure penanganan row exists and is marked SELESAI
      let penangananId: string | null = null;
      try {
        const { data: existingPenanganan } = await supabase
          .from("penanganan")
          .select("id")
          .eq("pengaduan_id", selectedComplaint.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (existingPenanganan?.id) {
          penangananId = existingPenanganan.id;
          await supabase
            .from("penanganan")
            .update({
              status_penanganan: "SELESAI",
              tanggal_selesai: todayDate,
              updated_at: new Date().toISOString(),
            })
            .eq("id", penangananId);
        } else {
          const { data: newPenanganan } = await supabase
            .from("penanganan")
            .insert({
              pengaduan_id: selectedComplaint.id,
              user_id: currentUserId,
              jenis_penanganan: "GA",
              tanggal_mulai: todayDate,
              tanggal_selesai: todayDate,
              status_penanganan: "SELESAI",
              catatan: catatanSelesai || "Diselesaikan oleh Admin GA",
            })
            .select("id")
            .single();
          penangananId = newPenanganan?.id || null;
        }

        // 3. Insert tindak_lanjut & bukti_penyelesaian
        if (penangananId) {
          const { data: tindakLanjutRow } = await supabase
            .from("tindak_lanjut")
            .insert({
              penanganan_id: penangananId,
              user_id: currentUserId,
              pekerjaan_dilakukan: catatanSelesai || "Perbaikan telah diselesaikan.",
            })
            .select("id")
            .single();

          if (tindakLanjutRow?.id && uploadedItems.length > 0) {
            for (const up of uploadedItems) {
              await supabase.from("bukti_penyelesaian").insert({
                tindak_lanjut_id: tindakLanjutRow.id,
                nama_file: up.fileName,
                path_file: up.url,
                jenis_file: up.fileType,
                keterangan: catatanSelesai || "Bukti Penyelesaian",
              });
            }
          }
        }
      } catch (relErr) {
        console.warn("Relasi tindak_lanjut / bukti_penyelesaian fallback:", relErr);
      }

      // 4. Also store completion evidence in bukti_pengaduan with keterangan = 'BUKTI_PENYELESAIAN'
      //    so it is 100% guaranteed to be linked directly to pengaduan_id
      for (const up of uploadedItems) {
        await supabase.from("bukti_pengaduan").insert({
          pengaduan_id: selectedComplaint.id,
          nama_file: up.fileName,
          path_file: up.url,
          jenis_file: up.fileType,
          keterangan: "BUKTI_PENYELESAIAN",
        });
      }

      // 5. Update pengaduan status to SELESAI
      const { error } = await supabase
        .from("pengaduan")
        .update({ status: "SELESAI", updated_at: new Date().toISOString() })
        .eq("id", selectedComplaint.id);

      if (error) throw error;

      toast.success(`Tiket ${selectedComplaint.nomor_pengaduan} dinyatakan selesai!`);
      handleCloseModal();
      router.refresh();
    } catch (err: unknown) {
      toast.error(`Gagal menyelesaikan tiket: ${(err as Error).message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header Banner */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            Pusat Pemrosesan Pengaduan
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Eksekusi verifikasi, alokasi teknisi/vendor, dan selesaikan tiket aduan fasilitas kerja.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <DateFilter />
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              placeholder={globalQuery ? `Filter: ${globalQuery}` : "Cari tiket, judul, pelapor..."}
              className="h-10 rounded-full border-slate-200 bg-white pl-10 text-sm focus-visible:ring-sidebar-brand"
            />
          </div>
        </div>
      </div>

      {/* Tabs Filter Bar */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
        <button
          type="button"
          onClick={() => setActiveTab("SEMUA")}
          className={cn(
            "flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-xs font-semibold transition-all shadow-sm",
            activeTab === "SEMUA"
              ? "bg-slate-900 text-white"
              : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
          )}
        >
          <Filter className="h-3.5 w-3.5" />
          Semua Tiket
          <span
            className={cn(
              "ml-1 rounded-full px-2 py-0.5 text-[10px]",
              activeTab === "SEMUA" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-700"
            )}
          >
            {countByStatus.SEMUA}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("DIAJUKAN")}
          className={cn(
            "flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-xs font-semibold transition-all shadow-sm",
            activeTab === "DIAJUKAN"
              ? "bg-amber-600 text-white"
              : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
          )}
        >
          <Clock className="h-3.5 w-3.5" />
          Perlu Verifikasi (Diajukan)
          <span
            className={cn(
              "ml-1 rounded-full px-2 py-0.5 text-[10px]",
              activeTab === "DIAJUKAN" ? "bg-white/20 text-white" : "bg-amber-100 text-amber-800"
            )}
          >
            {countByStatus.DIAJUKAN}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("DIVERIFIKASI")}
          className={cn(
            "flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-xs font-semibold transition-all shadow-sm",
            activeTab === "DIVERIFIKASI"
              ? "bg-blue-600 text-white"
              : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
          )}
        >
          <ShieldCheck className="h-3.5 w-3.5" />
          Diverifikasi (Tindak Lanjut)
          <span
            className={cn(
              "ml-1 rounded-full px-2 py-0.5 text-[10px]",
              activeTab === "DIVERIFIKASI" ? "bg-white/20 text-white" : "bg-blue-100 text-blue-800"
            )}
          >
            {countByStatus.DIVERIFIKASI}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("DIPROSES")}
          className={cn(
            "flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-xs font-semibold transition-all shadow-sm",
            activeTab === "DIPROSES"
              ? "bg-purple-600 text-white"
              : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
          )}
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Sedang Diproses
          <span
            className={cn(
              "ml-1 rounded-full px-2 py-0.5 text-[10px]",
              activeTab === "DIPROSES" ? "bg-white/20 text-white" : "bg-purple-100 text-purple-800"
            )}
          >
            {countByStatus.DIPROSES}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("SELESAI")}
          className={cn(
            "flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-xs font-semibold transition-all shadow-sm",
            activeTab === "SELESAI"
              ? "bg-emerald-600 text-white"
              : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
          )}
        >
          <CheckCircle2 className="h-3.5 w-3.5" />
          Selesai
          <span
            className={cn(
              "ml-1 rounded-full px-2 py-0.5 text-[10px]",
              activeTab === "SELESAI" ? "bg-white/20 text-white" : "bg-emerald-100 text-emerald-800"
            )}
          >
            {countByStatus.SELESAI}
          </span>
        </button>
      </div>

      {/* Main Processing List */}
      <div className="flex flex-col gap-4">
        {filteredComplaints.map((item) => (
          <Card
            key={item.id}
            className="rounded-2xl border-slate-200/80 bg-white shadow-sm transition-all hover:border-sidebar-brand/40 hover:shadow-md"
          >
            <CardContent className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between">
              {/* Left Info */}
              <div className="flex-1 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs font-bold text-sidebar-brand">
                    {item.nomor_pengaduan}
                  </span>
                  <span className="text-slate-300">·</span>
                  <span className="rounded-md bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                    {item.kategori}
                  </span>
                  <StatusBadge status={item.status} />
                  {item.bukti_pengaduan && item.bukti_pengaduan.length > 0 && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 border border-blue-200/60 px-2.5 py-0.5 text-[11px] font-semibold text-blue-700">
                      <Paperclip className="h-3 w-3" />
                      {item.bukti_pengaduan.length} Bukti Pengaduan
                    </span>
                  )}
                  {item.bukti_penyelesaian && item.bukti_penyelesaian.length > 0 && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200/60 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700">
                      <CheckCircle2 className="h-3 w-3" />
                      {item.bukti_penyelesaian.length} Bukti Selesai
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {item.judul}
                  </h3>
                  <p className="mt-1 text-sm text-slate-600 line-clamp-2 leading-relaxed">
                    {item.detail_pengaduan}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-slate-500 pt-1">
                  <div className="flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5 text-slate-400" />
                    <span>
                      Pelapor: <strong className="text-slate-700">{item.nama_pelapor}</strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-slate-400" />
                    <span>
                      Lokasi: <strong className="text-slate-700">{item.lokasi}</strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CalendarDays className="h-3.5 w-3.5 text-slate-400" />
                    <span>{item.tanggal_pengaduan}</span>
                  </div>
                </div>
              </div>

              {/* Right Action Button */}
              <div className="flex shrink-0 items-center gap-2 pt-3 sm:pt-0 sm:border-l sm:border-slate-100 sm:pl-6">
                {item.status === "DIAJUKAN" && (
                  <Button
                    onClick={() => handleOpenAction(item)}
                    className="w-full sm:w-auto rounded-full bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs px-5 shadow-sm"
                  >
                    <ShieldCheck className="h-4 w-4 mr-1.5" />
                    Verifikasi Laporan
                  </Button>
                )}

                {item.status === "DIVERIFIKASI" && (
                  <Button
                    onClick={() => handleOpenAction(item)}
                    className="w-full sm:w-auto rounded-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-5 shadow-sm"
                  >
                    <Wrench className="h-4 w-4 mr-1.5" />
                    Tentukan Penanganan
                  </Button>
                )}

                {item.status === "DIPROSES" && (
                  <Button
                    onClick={() => handleOpenAction(item)}
                    className="w-full sm:w-auto rounded-full bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs px-5 shadow-sm"
                  >
                    <CheckCircle2 className="h-4 w-4 mr-1.5" />
                    Selesaikan Tiket
                  </Button>
                )}

                {item.status === "SELESAI" && (
                  <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                    <Button
                      variant="outline"
                      onClick={() => handleOpenAction(item)}
                      className="w-full sm:w-auto rounded-full border-slate-200 text-slate-700 hover:bg-slate-50 text-xs px-3.5"
                    >
                      <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                      Detail Selesai
                    </Button>
                    <Button
                      type="button"
                      onClick={() =>
                        printComplaintReport({
                          id: item.id,
                          nomor_pengaduan: item.nomor_pengaduan,
                          title: item.judul,
                          category: item.kategori,
                          description: item.detail_pengaduan,
                          location: item.lokasi,
                          date: item.tanggal_pengaduan,
                          raw_date: item.raw_date,
                          status: item.status,
                          employee: item.nama_pelapor,
                          bukti_pengaduan: item.bukti_pengaduan,
                          bukti_penyelesaian: item.bukti_penyelesaian,
                          hasil_verifikasi: item.hasil_verifikasi,
                          catatan_verifikasi: item.catatan_verifikasi,
                          jenis_penanganan: item.jenis_penanganan,
                          estimasi_selesai: item.estimasi_selesai,
                          catatan_penanganan: item.catatan_penanganan,
                          catatan_selesai: item.catatan_selesai,
                          tanggal_selesai: item.tanggal_selesai,
                        })
                      }
                      className="w-full sm:w-auto rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-3.5 shadow-2xs"
                      title="Cetak Laporan / Simpan PDF"
                    >
                      <Printer className="h-3.5 w-3.5 mr-1.5" />
                      Cetak PDF
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredComplaints.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-white py-14 text-center">
            <FileText className="h-10 w-10 text-slate-300 mb-3" />
            <h4 className="text-base font-semibold text-slate-700">Tidak ada pengaduan</h4>
            <p className="mt-1 text-xs text-slate-400 max-w-sm">
              Tidak ada data pengaduan yang cocok dengan filter atau kata kunci pencarian Anda.
            </p>
          </div>
        )}
      </div>

      {/* MODAL 1: VERIFIKASI PENGADUAN (MENAMPILKAN BUKTI FOTO/FILE KARYAWAN) */}
      {modalType === "verifikasi" && selectedComplaint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-3 sm:p-4">
          <div className="flex max-h-[88vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl animate-in fade-in-0 zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 shrink-0">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Verifikasi Pengaduan</h3>
                <p className="text-xs text-slate-500">
                  {selectedComplaint.nomor_pengaduan} · {selectedComplaint.judul}
                </p>
              </div>
              <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitVerifikasi} className="flex flex-col flex-1 overflow-hidden">
              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                <div className="rounded-xl bg-slate-50 p-3.5 text-xs text-slate-600 space-y-1 border border-slate-100">
                  <p>
                    <strong>Pelapor:</strong> {selectedComplaint.nama_pelapor}
                  </p>
                  <p>
                    <strong>Kategori:</strong> {selectedComplaint.kategori}
                  </p>
                  <p>
                    <strong>Lokasi:</strong> {selectedComplaint.lokasi}
                  </p>
                  <p className="pt-1">
                    <strong>Deskripsi:</strong> {selectedComplaint.detail_pengaduan}
                  </p>
                </div>

                {/* Bukti Foto / File Pengaduan dari Karyawan */}
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <ImageIcon className="h-3.5 w-3.5 text-sidebar-brand" />
                    Bukti Foto / File Pengaduan Karyawan
                  </Label>
                  <EvidenceGallery
                    files={selectedComplaint.bukti_pengaduan}
                    emptyText="Tidak ada foto/file bukti yang dilampirkan pelapor."
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <Label>Hasil Kelengkapan Data</Label>
                  <Select
                    value={hasilVerifikasi}
                    onValueChange={(val) =>
                      setHasilVerifikasi(val === "Tidak Lengkap" ? "Tidak Lengkap" : "Lengkap")
                    }
                  >
                    <SelectTrigger className="w-full h-10 border-slate-200 bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="w-[var(--anchor-width)]">
                      <SelectItem value="Lengkap">
                        Lengkap (Terima & Lanjutkan ke Verifikasi)
                      </SelectItem>
                      <SelectItem value="Tidak Lengkap">
                        Tidak Lengkap (Butuh konfirmasi pelapor)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col gap-2">
                  <Label>Catatan Verifikasi</Label>
                  <Textarea
                    value={catatanVerifikasi}
                    onChange={(e) => setCatatanVerifikasi(e.target.value)}
                    placeholder="Tambahkan catatan kelayakan fasilitas atau tindak lanjut awal..."
                    rows={3}
                    className="resize-none border-slate-200"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 px-6 py-3.5 border-t border-slate-100 bg-slate-50/60 shrink-0">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCloseModal}
                  className="rounded-full"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="rounded-full bg-amber-500 hover:bg-amber-600 text-white"
                >
                  {submitting ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                  ) : (
                    <ShieldCheck className="h-4 w-4 mr-1.5" />
                  )}
                  Konfirmasi Verifikasi
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: TENTUKAN PENANGANAN (MENAMPILKAN BUKTI FOTO/FILE KARYAWAN) */}
      {modalType === "penanganan" && selectedComplaint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-3 sm:p-4">
          <div className="flex max-h-[88vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl animate-in fade-in-0 zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 shrink-0">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Tentukan Pihak Penanganan</h3>
                <p className="text-xs text-slate-500">
                  {selectedComplaint.nomor_pengaduan} · {selectedComplaint.judul}
                </p>
              </div>
              <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitPenanganan} className="flex flex-col flex-1 overflow-hidden">
              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                <div className="rounded-xl bg-slate-50 p-3.5 text-xs text-slate-600 space-y-1 border border-slate-100">
                  <p>
                    <strong>Pelapor:</strong> {selectedComplaint.nama_pelapor} ·{" "}
                    <strong>Lokasi:</strong> {selectedComplaint.lokasi}
                  </p>
                  <p>
                    <strong>Deskripsi:</strong> {selectedComplaint.detail_pengaduan}
                  </p>
                </div>

                {/* Bukti Foto / File Pengaduan dari Karyawan */}
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <ImageIcon className="h-3.5 w-3.5 text-sidebar-brand" />
                    Bukti Foto / File Pengaduan Karyawan
                  </Label>
                  <EvidenceGallery
                    files={selectedComplaint.bukti_pengaduan}
                    emptyText="Tidak ada foto/file bukti yang dilampirkan pelapor."
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <Label>Pihak yang Menangani</Label>
                  <Select
                    value={jenisPenanganan}
                    onValueChange={(val) => setJenisPenanganan(val === "VENDOR" ? "VENDOR" : "GA")}
                  >
                    <SelectTrigger className="w-full h-10 border-slate-200 bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="w-[var(--anchor-width)]">
                      <SelectItem value="GA">Tim GA Internal (Teknisi Kantor)</SelectItem>
                      <SelectItem value="VENDOR">Vendor Eksternal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col gap-2">
                  <Label>Estimasi Tanggal Pengerjaan Selesai</Label>
                  <Input
                    type="date"
                    value={estimasiSelesai}
                    onChange={(e) => setEstimasiSelesai(e.target.value)}
                    className="border-slate-200"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <Label>Catatan Penanganan / Instruksi Kerja</Label>
                  <Textarea
                    value={catatanPenanganan}
                    onChange={(e) => setCatatanPenanganan(e.target.value)}
                    placeholder="Contoh: Mengganti sparepart kompresor, hubungi vendor AC PT Sumber Sejuk..."
                    rows={3}
                    className="resize-none border-slate-200"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 px-6 py-3.5 border-t border-slate-100 bg-slate-50/60 shrink-0">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCloseModal}
                  className="rounded-full"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="rounded-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {submitting ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                  ) : (
                    <Wrench className="h-4 w-4 mr-1.5" />
                  )}
                  Mulai Pengerjaan (Set Diproses)
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: SELESAIKAN TIKET (DENGAN UPLOAD FOTO/FILE BUKTI PENYELESAIAN) */}
      {modalType === "selesai" && selectedComplaint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-3 sm:p-4">
          <div className="flex max-h-[88vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl animate-in fade-in-0 zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 shrink-0">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Selesaikan Tiket Pengaduan</h3>
                <p className="text-xs text-slate-500">
                  {selectedComplaint.nomor_pengaduan} · {selectedComplaint.judul}
                </p>
              </div>
              <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitSelesai} className="flex flex-col flex-1 overflow-hidden">
              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-3 text-xs text-emerald-800">
                  Pastikan perbaikan fasilitas telah dicek dan berfungsi dengan baik. Unggah foto atau bukti penyelesaian di bawah ini.
                </div>

                {/* Bukti Foto / File Pengaduan Awal */}
                {selectedComplaint.bukti_pengaduan &&
                  selectedComplaint.bukti_pengaduan.length > 0 && (
                    <div className="flex flex-col gap-1.5">
                      <Label className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                        <ImageIcon className="h-3.5 w-3.5 text-slate-500" />
                        Foto Pengaduan Awal (Dari Pelapor)
                      </Label>
                      <EvidenceGallery files={selectedComplaint.bukti_pengaduan} />
                    </div>
                  )}

                <div className="flex flex-col gap-2">
                  <Label>Catatan Hasil Perbaikan</Label>
                  <Textarea
                    value={catatanSelesai}
                    onChange={(e) => setCatatanSelesai(e.target.value)}
                    placeholder="Tuliskan ringkasan pekerjaan yang telah dirampungkan..."
                    rows={3}
                    required
                    className="resize-none border-slate-200"
                  />
                </div>

                {/* Upload Foto / Bukti Penyelesaian */}
                <div className="flex flex-col gap-2">
                  <Label className="text-slate-700">
                    Upload Foto / File Bukti Penyelesaian
                  </Label>
                  <input
                    ref={completionFileInputRef}
                    type="file"
                    accept="image/*,application/pdf"
                    multiple
                    onChange={handleCompletionFileChange}
                    className="hidden"
                  />
                  <div
                    onClick={() => completionFileInputRef.current?.click()}
                    className="flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-emerald-200 bg-emerald-50/40 px-4 py-4 text-center transition-colors hover:border-emerald-500/60 hover:bg-emerald-50"
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                      <ImagePlus className="h-4 w-4" />
                    </div>
                    <p className="text-xs font-semibold text-emerald-900">
                      Klik untuk unggah foto atau file bukti penyelesaian
                    </p>
                    <p className="text-[11px] text-emerald-700/70">
                      Format: JPG, PNG, WEBP, atau PDF (Maks. 10MB)
                    </p>
                  </div>

                  {completionFiles.length > 0 && (
                    <div className="grid grid-cols-1 gap-2 pt-1">
                      {completionFiles.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-white p-2.5 shadow-2xs"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            {item.previewUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={item.previewUrl}
                                alt={item.file.name}
                                className="h-11 w-11 shrink-0 rounded-lg object-cover border border-slate-100"
                              />
                            ) : (
                              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                                <FileText className="h-5 w-5" />
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="truncate text-xs font-semibold text-slate-800">
                                {item.file.name}
                              </p>
                              <p className="text-[11px] text-slate-400">
                                {(item.file.size / 1024).toFixed(0)} KB
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveCompletionFile(idx)}
                            className="rounded-lg p-1.5 text-red-500 hover:bg-red-50 transition-colors shrink-0"
                            title="Hapus bukti"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3 px-6 py-3.5 border-t border-slate-100 bg-slate-50/60 shrink-0">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCloseModal}
                  className="rounded-full"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="rounded-full bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {submitting ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4 mr-1.5" />
                  )}
                  Tandai Selesai
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: DETAIL SELESAI (MENAMPILKAN BUKTI PENGADUAN & BUKTI PENYELESAIAN) */}
      <ComplaintDetailModal
        complaint={
          modalType === "detail" && selectedComplaint
            ? {
                id: selectedComplaint.id,
                nomor_pengaduan: selectedComplaint.nomor_pengaduan,
                title: selectedComplaint.judul,
                category: selectedComplaint.kategori,
                description: selectedComplaint.detail_pengaduan,
                location: selectedComplaint.lokasi,
                date: selectedComplaint.tanggal_pengaduan,
                raw_date: selectedComplaint.raw_date,
                status: selectedComplaint.status,
                employee: selectedComplaint.nama_pelapor,
                bukti_pengaduan: selectedComplaint.bukti_pengaduan,
                bukti_penyelesaian: selectedComplaint.bukti_penyelesaian,
                hasil_verifikasi: selectedComplaint.hasil_verifikasi,
                catatan_verifikasi: selectedComplaint.catatan_verifikasi,
                jenis_penanganan: selectedComplaint.jenis_penanganan,
                estimasi_selesai: selectedComplaint.estimasi_selesai,
                catatan_penanganan: selectedComplaint.catatan_penanganan,
                catatan_selesai: selectedComplaint.catatan_selesai,
                tanggal_selesai: selectedComplaint.tanggal_selesai,
              }
            : null
        }
        onClose={handleCloseModal}
      />
    </div>
  );
}

export function ProgresClient(props: {
  initialComplaints: ProgresComplaint[];
  currentUserId: string;
}) {
  return (
    <Suspense fallback={<div className="py-10 text-center text-sm text-slate-400">Memuat progres...</div>}>
      <ProgresClientInner {...props} />
    </Suspense>
  );
}
