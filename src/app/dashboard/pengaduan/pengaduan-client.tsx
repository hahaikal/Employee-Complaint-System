"use client";

import { useState, useRef, Suspense } from "react";
import {
  CalendarDays,
  ExternalLink,
  FileText,
  ImagePlus,
  Loader2,
  Paperclip,
  Send,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { createClient } from "@/utils/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";

import type { Complaint } from "@/components/dashboard/data";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { ComplaintDetailModal } from "@/components/dashboard/complaint-detail-modal";
import { uploadEvidenceFile } from "@/utils/file-upload";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const complaintSchema = z.object({
  title: z
    .string()
    .trim()
    .min(5, "Judul minimal 5 karakter")
    .max(100, "Judul maksimal 100 karakter"),
  category: z.string().trim().min(1, "Pilih kategori pengaduan"),
  location: z
    .string()
    .trim()
    .min(3, "Lokasi minimal 3 karakter")
    .max(100, "Lokasi maksimal 100 karakter"),
  description: z
    .string()
    .trim()
    .min(10, "Deskripsi minimal 10 karakter")
    .max(1000, "Deskripsi maksimal 1000 karakter"),
});

type ComplaintForm = z.infer<typeof complaintSchema>;
type FormErrors = Partial<Record<keyof ComplaintForm, string>>;

const initialForm: ComplaintForm = {
  title: "",
  category: "",
  location: "",
  description: "",
};

type SelectedFilePreview = {
  file: File;
  previewUrl: string | null;
};

function PengaduanClientInner({
  initialComplaints,
  categories,
  userId,
}: {
  initialComplaints: Complaint[];
  categories: { id: string; nama_kategori: string }[];
  userId: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const globalSearch = (searchParams.get("q") || "").trim().toLowerCase();

  const supabase = createClient();
  const [form, setForm] = useState<ComplaintForm>(initialForm);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Evidence files state
  const [selectedFiles, setSelectedFiles] = useState<SelectedFilePreview[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Detail modal state
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);

  const setField = (field: keyof ComplaintForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

    setSelectedFiles((prev) => [...prev, ...validFiles]);
    e.target.value = "";
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles((prev) => {
      const target = prev[index];
      if (target?.previewUrl) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const result = complaintSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors: FormErrors = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0] as keyof ComplaintForm;
        if (!fieldErrors[field]) fieldErrors[field] = issue.message;
      }
      setErrors(fieldErrors);
      toast.error("Periksa kembali isian form Anda.");
      return;
    }

    setIsSubmitting(true);

    try {
      const nomorPengaduan = `PGD-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        result.data.category
      );

      const { data: insertedPengaduan, error } = await supabase
        .from("pengaduan")
        .insert({
          nomor_pengaduan: nomorPengaduan,
          user_id: userId,
          judul: result.data.title,
          kategori_id: isUUID ? result.data.category : null,
          informasi_tambahan: !isUUID ? `Kategori: ${result.data.category}` : null,
          lokasi: result.data.location,
          detail_pengaduan: result.data.description,
          status: "DIAJUKAN",
        })
        .select("id")
        .single();

      if (error || !insertedPengaduan) {
        throw new Error(error?.message || "Gagal membuat pengaduan.");
      }

      // Upload and save attached evidence files if any
      if (selectedFiles.length > 0) {
        for (const item of selectedFiles) {
          const uploaded = await uploadEvidenceFile(supabase, item.file, "pengaduan");
          const { error: buktiErr } = await supabase.from("bukti_pengaduan").insert({
            pengaduan_id: insertedPengaduan.id,
            nama_file: uploaded.fileName,
            path_file: uploaded.url,
            jenis_file: uploaded.fileType,
            keterangan: "BUKTI_PENGADUAN",
          });
          if (buktiErr) {
            console.warn("Gagal menyimpan bukti_pengaduan:", buktiErr);
          }
          if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
        }
      }

      setForm(initialForm);
      setSelectedFiles([]);
      setErrors({});
      toast.success("Pengaduan beserta lampiran bukti berhasil dikirim ke General Affairs.");
      router.refresh();
    } catch (err: unknown) {
      toast.error(`Gagal mengirim pengaduan: ${(err as Error).message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredComplaints = initialComplaints.filter((item) => {
    if (!globalSearch) return true;
    return (
      item.title.toLowerCase().includes(globalSearch) ||
      item.nomor_pengaduan.toLowerCase().includes(globalSearch) ||
      item.category.toLowerCase().includes(globalSearch) ||
      item.description.toLowerCase().includes(globalSearch) ||
      (item.location && item.location.toLowerCase().includes(globalSearch))
    );
  });

  const uniqueCategories = categories.filter((cat, index, self) => {
    const key = (cat.nama_kategori || "").trim().toLowerCase();
    return index === self.findIndex((c) => (c.nama_kategori || "").trim().toLowerCase() === key);
  });

  // Helper to get selected category display name
  const selectedCategoryName = uniqueCategories.find((c) => c.id === form.category)?.nama_kategori;

  return (
    <div className="grid items-start gap-6 lg:grid-cols-5">
      <Card className="rounded-2xl border-slate-200/80 shadow-sm lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-lg text-slate-900">
            Buat Pengaduan Baru
          </CardTitle>
          <CardDescription>
            Laporkan kendala fasilitas di tempat kerja Anda
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="title" className="text-slate-700">
                Judul Pengaduan
              </Label>
              <Input
                id="title"
                value={form.title}
                onChange={(e) => setField("title", e.target.value)}
                placeholder="Contoh: AC Ruang Kerja Tidak Dingin"
                maxLength={100}
                aria-invalid={Boolean(errors.title)}
                className="border-slate-200"
              />
              {errors.title ? (
                <p className="text-xs text-destructive">{errors.title}</p>
              ) : null}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="category" className="text-slate-700">
                Kategori
              </Label>
              <Select
                value={form.category}
                onValueChange={(value) => setField("category", value ?? "")}
              >
                <SelectTrigger
                  id="category"
                  aria-invalid={Boolean(errors.category)}
                  className="border-slate-200 w-full"
                >
                  <SelectValue placeholder="Pilih kategori">
                    {selectedCategoryName || "Pilih kategori"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {uniqueCategories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.nama_kategori}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.category ? (
                <p className="text-xs text-destructive">{errors.category}</p>
              ) : null}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="location" className="text-slate-700">
                Lokasi
              </Label>
              <Input
                id="location"
                value={form.location}
                onChange={(e) => setField("location", e.target.value)}
                placeholder="Contoh: Lantai 2, Ruang 204"
                maxLength={100}
                aria-invalid={Boolean(errors.location)}
                className="border-slate-200"
              />
              {errors.location ? (
                <p className="text-xs text-destructive">{errors.location}</p>
              ) : null}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="description" className="text-slate-700">
                Deskripsi Kendala
              </Label>
              <Textarea
                id="description"
                value={form.description}
                onChange={(e) => setField("description", e.target.value)}
                placeholder="Jelaskan kendala secara detail agar tim GA dapat menindaklanjuti dengan cepat..."
                rows={4}
                maxLength={1000}
                aria-invalid={Boolean(errors.description)}
                className="resize-none border-slate-200"
              />
              <div className="flex items-center justify-between">
                {errors.description ? (
                  <p className="text-xs text-destructive">{errors.description}</p>
                ) : (
                  <span />
                )}
                <p className="text-xs text-slate-400">
                  {form.description.length}/1000
                </p>
              </div>
            </div>

            {/* Upload Foto / File Bukti Pengaduan */}
            <div className="flex flex-col gap-2">
              <Label className="text-slate-700">
                Upload Foto / File Bukti Pengaduan
              </Label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,application/pdf"
                multiple
                onChange={handleFileChange}
                className="hidden"
              />
              <div
                onClick={() => fileInputRef.current?.click()}
                className="flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/70 px-4 py-4 text-center transition-colors hover:border-sidebar-brand/50 hover:bg-sidebar-brand/5"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sidebar-brand/10 text-sidebar-brand">
                  <ImagePlus className="h-4 w-4" />
                </div>
                <p className="text-xs font-semibold text-slate-700">
                  Klik untuk unggah foto atau dokumen bukti
                </p>
                <p className="text-[11px] text-slate-400">
                  Format: JPG, PNG, WEBP, atau PDF (Maks. 10MB)
                </p>
              </div>

              {selectedFiles.length > 0 && (
                <div className="grid grid-cols-1 gap-2 pt-1">
                  {selectedFiles.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-2.5 shadow-2xs"
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
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-sidebar-brand">
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
                        onClick={() => handleRemoveFile(idx)}
                        className="rounded-lg p-1.5 text-red-500 hover:bg-red-50 transition-colors shrink-0"
                        title="Hapus lampiran"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Button
              type="submit"
              size="lg"
              disabled={isSubmitting}
              className="mt-1 rounded-full bg-sidebar-brand font-semibold text-white shadow-lg shadow-sidebar-brand/25 hover:bg-sidebar-brand-hover disabled:opacity-70"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Kirim Pengaduan
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-slate-200/80 shadow-sm lg:col-span-3">
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-lg text-slate-900">
              Riwayat Pengaduan
            </CardTitle>
            <CardDescription>
              Semua pengajuan yang pernah Anda buat (klik untuk melihat rincian & bukti)
            </CardDescription>
          </div>
          <span className="shrink-0 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
            {filteredComplaints.length} pengajuan
          </span>
        </CardHeader>
        <CardContent>
          <ul className="flex flex-col gap-3">
            {filteredComplaints.map((item) => (
              <li
                key={item.id}
                onClick={() => setSelectedComplaint(item)}
                className="cursor-pointer rounded-2xl border border-slate-100 bg-slate-50/70 p-4 transition-all hover:border-sidebar-brand/30 hover:bg-white hover:shadow-md sm:p-5"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="truncate font-semibold text-slate-900">
                        {item.title}
                      </h3>
                      {item.bukti_pengaduan && item.bukti_pengaduan.length > 0 && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-200/70 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                          <Paperclip className="h-2.5 w-2.5" />
                          {item.bukti_pengaduan.length} Bukti
                        </span>
                      )}
                    </div>
                    <p className="mt-1 line-clamp-2 text-sm text-slate-500">
                      {item.category} · {item.description}
                    </p>
                    <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <CalendarDays className="h-3.5 w-3.5" />
                        {item.date}
                      </span>
                      <span>·</span>
                      <span className="font-mono font-medium text-slate-500">
                        {item.nomor_pengaduan}
                      </span>
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
                    <StatusBadge status={item.status} />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedComplaint(item);
                      }}
                      className="h-8 rounded-full border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                    >
                      <ExternalLink className="h-3.5 w-3.5 mr-1" />
                      {item.status === "SELESAI" ? "Detail Selesai" : "Detail"}
                    </Button>
                  </div>
                </div>
              </li>
            ))}
            {filteredComplaints.length === 0 && (
              <div className="py-8 text-center text-sm text-slate-500">
                {globalSearch
                  ? `Tidak ada pengaduan yang cocok dengan kata kunci "${globalSearch}".`
                  : "Belum ada riwayat pengaduan."}
              </div>
            )}
          </ul>
        </CardContent>
      </Card>

      {/* Modal Detail Pengaduan */}
      <ComplaintDetailModal
        complaint={selectedComplaint}
        onClose={() => setSelectedComplaint(null)}
      />
    </div>
  );
}

export function PengaduanClient(props: {
  initialComplaints: Complaint[];
  categories: { id: string; nama_kategori: string }[];
  userId: string;
}) {
  return (
    <Suspense fallback={<div className="py-10 text-center text-sm text-slate-400">Memuat...</div>}>
      <PengaduanClientInner {...props} />
    </Suspense>
  );
}
