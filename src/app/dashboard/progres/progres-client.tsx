"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarDays,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileText,
  Filter,
  Loader2,
  MapPin,
  RefreshCw,
  Search,
  ShieldCheck,
  User,
  Wrench,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/utils/supabase/client";
import { StatusBadge } from "@/components/dashboard/status-badge";
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
import type { ComplaintStatus } from "@/components/dashboard/data";

export type ProgresComplaint = {
  id: string;
  nomor_pengaduan: string;
  judul: string;
  lokasi: string;
  detail_pengaduan: string;
  status: ComplaintStatus;
  tanggal_pengaduan: string;
  kategori: string;
  nama_pelapor: string;
};

export function ProgresClient({
  initialComplaints,
  currentUserId,
}: {
  initialComplaints: ProgresComplaint[];
  currentUserId: string;
}) {
  const router = useRouter();
  const supabase = createClient();

  const [activeTab, setActiveTab] = useState<"SEMUA" | ComplaintStatus>("SEMUA");
  const [searchQuery, setSearchQuery] = useState("");
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

  const filteredComplaints = initialComplaints.filter((c) => {
    const matchTab = activeTab === "SEMUA" || c.status === activeTab;
    const matchSearch =
      c.nomor_pengaduan.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.judul.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.nama_pelapor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.lokasi.toLowerCase().includes(searchQuery.toLowerCase());
    return matchTab && matchSearch;
  });

  const countByStatus = {
    SEMUA: initialComplaints.length,
    DIAJUKAN: initialComplaints.filter((c) => c.status === "DIAJUKAN").length,
    DIVERIFIKASI: initialComplaints.filter((c) => c.status === "DIVERIFIKASI").length,
    DIPROSES: initialComplaints.filter((c) => c.status === "DIPROSES").length,
    SELESAI: initialComplaints.filter((c) => c.status === "SELESAI").length,
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
      setModalType("selesai");
    } else {
      setModalType("detail");
    }
  };

  const handleCloseModal = () => {
    setModalType(null);
    setSelectedComplaint(null);
  };

  // 1. Verifikasi submission
  const handleSubmitVerifikasi = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedComplaint) return;
    setSubmitting(true);

    try {
      // Record verification
      await supabase.from("verifikasi_pengaduan").insert({
        pengaduan_id: selectedComplaint.id,
        user_id: currentUserId,
        hasil_verifikasi: hasilVerifikasi,
        catatan_verifikasi: catatanVerifikasi,
      });

      // Update status to DIVERIFIKASI
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
      // Record penanganan
      await supabase.from("penanganan").insert({
        pengaduan_id: selectedComplaint.id,
        user_id: currentUserId,
        jenis_penanganan: jenisPenanganan,
        tanggal_mulai: new Date().toISOString().split("T")[0],
        estimasi_selesai: estimasiSelesai || null,
        status_penanganan: "DIPROSES",
        catatan: catatanPenanganan,
      });

      // Update status to DIPROSES
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

  // 3. Selesai submission
  const handleSubmitSelesai = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedComplaint) return;
    setSubmitting(true);

    try {
      // Update status to SELESAI
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

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari tiket, judul, pelapor..."
            className="h-10 rounded-full border-slate-200 bg-white pl-10 text-sm focus-visible:ring-sidebar-brand"
          />
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
          <span className={cn("ml-1 rounded-full px-2 py-0.5 text-[10px]", activeTab === "SEMUA" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-700")}>
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
          <span className={cn("ml-1 rounded-full px-2 py-0.5 text-[10px]", activeTab === "DIAJUKAN" ? "bg-white/20 text-white" : "bg-amber-100 text-amber-800")}>
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
          <span className={cn("ml-1 rounded-full px-2 py-0.5 text-[10px]", activeTab === "DIVERIFIKASI" ? "bg-white/20 text-white" : "bg-blue-100 text-blue-800")}>
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
          <span className={cn("ml-1 rounded-full px-2 py-0.5 text-[10px]", activeTab === "DIPROSES" ? "bg-white/20 text-white" : "bg-purple-100 text-purple-800")}>
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
          <span className={cn("ml-1 rounded-full px-2 py-0.5 text-[10px]", activeTab === "SELESAI" ? "bg-white/20 text-white" : "bg-emerald-100 text-emerald-800")}>
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
                    <span>Pelapor: <strong className="text-slate-700">{item.nama_pelapor}</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-slate-400" />
                    <span>Lokasi: <strong className="text-slate-700">{item.lokasi}</strong></span>
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
                  <Button
                    variant="outline"
                    onClick={() => handleOpenAction(item)}
                    className="w-full sm:w-auto rounded-full border-slate-200 text-slate-700 hover:bg-slate-50 text-xs px-4"
                  >
                    <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                    Detail Selesai
                  </Button>
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

      {/* MODAL 1: VERIFIKASI */}
      {modalType === "verifikasi" && selectedComplaint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl animate-in fade-in-0 zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Verifikasi Pengaduan</h3>
                <p className="text-xs text-slate-500">{selectedComplaint.nomor_pengaduan} · {selectedComplaint.judul}</p>
              </div>
              <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitVerifikasi} className="mt-4 flex flex-col gap-4">
              <div className="rounded-xl bg-slate-50 p-3 text-xs text-slate-600">
                <p><strong>Pelapor:</strong> {selectedComplaint.nama_pelapor}</p>
                <p><strong>Lokasi:</strong> {selectedComplaint.lokasi}</p>
                <p className="mt-1"><strong>Deskripsi:</strong> {selectedComplaint.detail_pengaduan}</p>
              </div>

              <div className="flex flex-col gap-2">
                <Label>Hasil Kelengkapan Data</Label>
                <Select
                  value={hasilVerifikasi}
                  onValueChange={(val) => setHasilVerifikasi(val === "Tidak Lengkap" ? "Tidak Lengkap" : "Lengkap")}
                >
                  <SelectTrigger className="border-slate-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Lengkap">Lengkap (Terima & Lanjutkan ke Verifikasi)</SelectItem>
                    <SelectItem value="Tidak Lengkap">Tidak Lengkap (Butuh konfirmasi pelapor)</SelectItem>
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

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <Button type="button" variant="outline" onClick={handleCloseModal} className="rounded-full">
                  Batal
                </Button>
                <Button type="submit" disabled={submitting} className="rounded-full bg-amber-500 hover:bg-amber-600 text-white">
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <ShieldCheck className="h-4 w-4 mr-1.5" />}
                  Konfirmasi Verifikasi
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: TENTUKAN PENANGANAN */}
      {modalType === "penanganan" && selectedComplaint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl animate-in fade-in-0 zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Tentukan Pihak Penanganan</h3>
                <p className="text-xs text-slate-500">{selectedComplaint.nomor_pengaduan} · {selectedComplaint.judul}</p>
              </div>
              <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitPenanganan} className="mt-4 flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label>Pihak yang Menangani</Label>
                <Select
                  value={jenisPenanganan}
                  onValueChange={(val) => setJenisPenanganan(val === "VENDOR" ? "VENDOR" : "GA")}
                >
                  <SelectTrigger className="border-slate-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
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

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <Button type="button" variant="outline" onClick={handleCloseModal} className="rounded-full">
                  Batal
                </Button>
                <Button type="submit" disabled={submitting} className="rounded-full bg-blue-600 hover:bg-blue-700 text-white">
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <Wrench className="h-4 w-4 mr-1.5" />}
                  Mulai Pengerjaan (Set Diproses)
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: SELESAIKAN TIKET */}
      {modalType === "selesai" && selectedComplaint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl animate-in fade-in-0 zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Selesaikan Tiket Pengaduan</h3>
                <p className="text-xs text-slate-500">{selectedComplaint.nomor_pengaduan} · {selectedComplaint.judul}</p>
              </div>
              <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitSelesai} className="mt-4 flex flex-col gap-4">
              <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-3 text-xs text-emerald-800">
                Pastikan perbaikan fasilitas telah dicek dan berfungsi dengan baik sebelum menutup tiket ini.
              </div>

              <div className="flex flex-col gap-2">
                <Label>Catatan Hasil Perbaikan</Label>
                <Textarea
                  value={catatanSelesai}
                  onChange={(e) => setCatatanSelesai(e.target.value)}
                  placeholder="Tuliskan ringkasan pekerjaan yang telah dirampungkan..."
                  rows={3}
                  className="resize-none border-slate-200"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <Button type="button" variant="outline" onClick={handleCloseModal} className="rounded-full">
                  Batal
                </Button>
                <Button type="submit" disabled={submitting} className="rounded-full bg-emerald-600 hover:bg-emerald-700 text-white">
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <CheckCircle2 className="h-4 w-4 mr-1.5" />}
                  Tandai Selesai
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: DETAIL */}
      {modalType === "detail" && selectedComplaint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl animate-in fade-in-0 zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Rincian Tiket Selesai</h3>
                <p className="text-xs text-slate-500">{selectedComplaint.nomor_pengaduan}</p>
              </div>
              <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 flex flex-col gap-3 text-sm text-slate-700">
              <div className="rounded-xl bg-slate-50 p-4 space-y-2">
                <p><strong>Judul:</strong> {selectedComplaint.judul}</p>
                <p><strong>Kategori:</strong> {selectedComplaint.kategori}</p>
                <p><strong>Lokasi:</strong> {selectedComplaint.lokasi}</p>
                <p><strong>Pelapor:</strong> {selectedComplaint.nama_pelapor}</p>
                <p><strong>Tanggal Masuk:</strong> {selectedComplaint.tanggal_pengaduan}</p>
                <p className="pt-2 border-t border-slate-200/80"><strong>Deskripsi:</strong> {selectedComplaint.detail_pengaduan}</p>
              </div>
              <div className="flex items-center justify-between pt-2">
                <span className="text-xs text-slate-400">Status Saat Ini</span>
                <StatusBadge status={selectedComplaint.status} />
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100 mt-4">
              <Button type="button" variant="outline" onClick={handleCloseModal} className="rounded-full">
                Tutup
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
