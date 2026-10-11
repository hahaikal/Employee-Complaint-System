"use client";

import { useState } from "react";
import { CalendarDays, Send, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { createClient } from "@/utils/supabase/client";

import type { Complaint, ComplaintStatus } from "@/components/dashboard/data";
import { StatusBadge } from "@/components/dashboard/status-badge";
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
import { useRouter } from "next/navigation";

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
    .min(20, "Deskripsi minimal 20 karakter")
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

export function PengaduanClient({
  initialComplaints,
  categories,
  userId
}: {
  initialComplaints: Complaint[];
  categories: { id: string; nama_kategori: string }[];
  userId: string;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [form, setForm] = useState<ComplaintForm>(initialForm);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const setField = (field: keyof ComplaintForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
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
    
    const nomorPengaduan = `PGD-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    const { error } = await supabase.from("pengaduan").insert({
      nomor_pengaduan: nomorPengaduan,
      user_id: userId,
      judul: result.data.title,
      kategori_id: result.data.category,
      lokasi: result.data.location,
      detail_pengaduan: result.data.description,
      status: "DIAJUKAN",
    });

    if (error) {
      toast.error(`Gagal mengirim pengaduan: ${error.message}`);
    } else {
      setForm(initialForm);
      setErrors({});
      toast.success("Pengaduan berhasil dikirim ke General Affairs.");
      router.refresh();
    }
    
    setIsSubmitting(false);
  };

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
          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
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

            <div className="flex flex-col gap-2">
              <Label htmlFor="category" className="text-slate-700">
                Kategori
              </Label>
              <Select
                value={form.category}
                onValueChange={(value) => setField("category", value)}
              >
                <SelectTrigger
                  id="category"
                  aria-invalid={Boolean(errors.category)}
                  className="border-slate-200"
                >
                  <SelectValue placeholder="Pilih kategori" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
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

            <div className="flex flex-col gap-2">
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

            <div className="flex flex-col gap-2">
              <Label htmlFor="description" className="text-slate-700">
                Deskripsi Kendala
              </Label>
              <Textarea
                id="description"
                value={form.description}
                onChange={(e) => setField("description", e.target.value)}
                placeholder="Jelaskan kendala secara detail agar tim GA dapat menindaklanjuti dengan cepat..."
                rows={5}
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

            <Button
              type="submit"
              size="lg"
              disabled={isSubmitting}
              className="rounded-full bg-sidebar-brand font-semibold text-white shadow-lg shadow-sidebar-brand/25 hover:bg-sidebar-brand-hover disabled:opacity-70"
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
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
              Semua pengajuan yang pernah Anda buat
            </CardDescription>
          </div>
          <span className="shrink-0 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
            {initialComplaints.length} pengajuan
          </span>
        </CardHeader>
        <CardContent>
          <ul className="flex flex-col gap-3">
            {initialComplaints.map((item) => (
              <li
                key={item.id}
                className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 transition-all hover:border-slate-200 hover:bg-white hover:shadow-md sm:p-5"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
                  <div className="min-w-0">
                    <h3 className="truncate font-semibold text-slate-900">
                      {item.title}
                    </h3>
                    <p className="mt-1 line-clamp-2 text-sm text-slate-500">
                      {item.category} · {item.description}
                    </p>
                    <p className="mt-1.5 flex items-center gap-1.5 text-xs text-slate-400">
                      <CalendarDays className="h-3.5 w-3.5" />
                      {item.date} · {item.nomor_pengaduan}
                    </p>
                  </div>
                  <StatusBadge
                    status={item.status}
                    className="shrink-0 self-start sm:self-center"
                  />
                </div>
              </li>
            ))}
            {initialComplaints.length === 0 && (
              <div className="py-8 text-center text-sm text-slate-500">
                Belum ada riwayat pengaduan.
              </div>
            )}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
