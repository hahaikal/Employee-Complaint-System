"use client";

import { useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  ExternalLink,
  FileText,
  ImageIcon,
  MapPin,
  ShieldCheck,
  Tag,
  User,
  Wrench,
  X,
  ZoomIn,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "./status-badge";
import type { Complaint, EvidenceFile } from "./data";

function isImageEvidence(file: EvidenceFile): boolean {
  if (file.jenis_file?.startsWith("image/")) return true;
  if (file.path_file?.startsWith("data:image/")) return true;
  const lower = (file.path_file || file.nama_file || "").toLowerCase();
  return /\.(jpg|jpeg|png|gif|webp|bmp|svg)(\?.*)?$/.test(lower);
}

export function EvidenceGallery({
  files,
  emptyText = "Tidak ada foto atau file bukti yang dilampirkan.",
}: {
  files?: EvidenceFile[];
  emptyText?: string;
}) {
  const [previewImage, setPreviewImage] = useState<{ url: string; name?: string } | null>(null);

  if (!files || files.length === 0) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-dashed border-slate-200 bg-slate-50/70 px-3.5 py-3 text-xs text-slate-400">
        <ImageIcon className="h-4 w-4 shrink-0 text-slate-300" />
        <span>{emptyText}</span>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        {files.map((file, idx) => {
          const isImg = isImageEvidence(file);
          return (
            <div
              key={file.id || idx}
              className="group relative overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs transition-all hover:border-sidebar-brand/40"
            >
              {isImg ? (
                <div
                  onClick={() =>
                    setPreviewImage({
                      url: file.path_file,
                      name: file.nama_file || `Bukti Foto ${idx + 1}`,
                    })
                  }
                  className="relative aspect-video w-full cursor-pointer overflow-hidden bg-slate-100"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={file.path_file}
                    alt={file.nama_file || "Bukti Foto"}
                    className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-slate-900/0 opacity-0 transition-all group-hover:bg-slate-900/35 group-hover:opacity-100">
                    <span className="flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-slate-900 shadow-md">
                      <ZoomIn className="h-3.5 w-3.5" />
                      Perbesar Foto
                    </span>
                  </div>
                </div>
              ) : (
                <a
                  href={file.path_file}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 hover:bg-slate-50"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-sidebar-brand/10 text-sidebar-brand">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold text-slate-800">
                      {file.nama_file || `Lampiran Dokumen ${idx + 1}`}
                    </p>
                    <p className="text-[11px] text-slate-400">Klik untuk membuka file</p>
                  </div>
                  <ExternalLink className="h-4 w-4 shrink-0 text-slate-400" />
                </a>
              )}
              {isImg && (
                <div className="flex items-center justify-between border-t border-slate-100 px-3 py-1.5 bg-white">
                  <span className="truncate text-[11px] font-medium text-slate-600">
                    {file.nama_file || `Bukti Foto ${idx + 1}`}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setPreviewImage({
                        url: file.path_file,
                        name: file.nama_file || `Bukti Foto ${idx + 1}`,
                      })
                    }
                    className="text-[11px] font-semibold text-sidebar-brand hover:underline shrink-0 ml-2"
                  >
                    Lihat Penuh
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Lightbox Full Image Preview */}
      {previewImage && (
        <div
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4 animate-in fade-in-0"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative flex max-h-[90vh] max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
              <span className="truncate text-sm font-bold text-slate-900">
                {previewImage.name || "Pratinjau Bukti Foto"}
              </span>
              <button
                type="button"
                onClick={() => setPreviewImage(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex items-center justify-center overflow-auto bg-slate-900/95 p-4 max-h-[78vh]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewImage.url}
                alt={previewImage.name || "Preview"}
                className="max-h-[72vh] w-auto max-w-full rounded-lg object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export function ComplaintDetailModal({
  complaint,
  onClose,
}: {
  complaint: Complaint | null;
  onClose: () => void;
}) {
  if (!complaint) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4">
      <div className="flex max-h-[88vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl animate-in fade-in-0 zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900">
                {complaint.status === "SELESAI" ? "Rincian Tiket Selesai" : "Rincian Pengaduan"}
              </h3>
              <StatusBadge status={complaint.status} />
            </div>
            <p className="mt-0.5 font-mono text-xs font-semibold text-sidebar-brand">
              {complaint.nomor_pengaduan}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 text-sm text-slate-700">
          {/* Main Info Box */}
          <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-4 space-y-2.5">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Judul Pengaduan
              </span>
              <p className="text-base font-bold text-slate-900 mt-0.5">{complaint.title}</p>
            </div>

            <div className="grid grid-cols-1 gap-2 pt-1 text-xs sm:grid-cols-2">
              <div className="flex items-center gap-2 text-slate-600">
                <Tag className="h-3.5 w-3.5 text-sidebar-brand shrink-0" />
                <span>
                  Kategori: <strong className="text-slate-800">{complaint.category}</strong>
                </span>
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <MapPin className="h-3.5 w-3.5 text-sidebar-brand shrink-0" />
                <span>
                  Lokasi: <strong className="text-slate-800">{complaint.location || "-"}</strong>
                </span>
              </div>
              {complaint.employee && (
                <div className="flex items-center gap-2 text-slate-600">
                  <User className="h-3.5 w-3.5 text-sidebar-brand shrink-0" />
                  <span>
                    Pelapor: <strong className="text-slate-800">{complaint.employee}</strong>
                  </span>
                </div>
              )}
              <div className="flex items-center gap-2 text-slate-600">
                <CalendarDays className="h-3.5 w-3.5 text-sidebar-brand shrink-0" />
                <span>
                  Tanggal Masuk: <strong className="text-slate-800">{complaint.date}</strong>
                </span>
              </div>
            </div>

            <div className="border-t border-slate-200/80 pt-2.5">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Deskripsi Kendala
              </span>
              <p className="mt-1 text-xs leading-relaxed text-slate-700 whitespace-pre-line">
                {complaint.description}
              </p>
            </div>
          </div>

          {/* Bukti Foto / File Pengaduan Awal */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <ImageIcon className="h-3.5 w-3.5 text-sidebar-brand" />
              Bukti Foto / File Pengaduan Karyawan
            </h4>
            <EvidenceGallery
              files={complaint.bukti_pengaduan}
              emptyText="Karyawan tidak melampirkan foto/file saat mengajukan laporan."
            />
          </div>

          {/* Riwayat Verifikasi & Penanganan (Jika ada) */}
          {(complaint.hasil_verifikasi ||
            complaint.catatan_verifikasi ||
            complaint.jenis_penanganan ||
            complaint.catatan_penanganan) && (
            <div className="rounded-xl border border-blue-100 bg-blue-50/40 p-3.5 space-y-2 text-xs">
              <h4 className="font-bold text-blue-900 flex items-center gap-1.5">
                <Wrench className="h-3.5 w-3.5 text-blue-600" />
                Informasi Verifikasi & Penanganan GA
              </h4>
              {complaint.hasil_verifikasi && (
                <p className="text-slate-700">
                  <strong>Status Kelengkapan:</strong> {complaint.hasil_verifikasi}
                </p>
              )}
              {complaint.catatan_verifikasi && (
                <p className="text-slate-700">
                  <strong>Catatan Verifikasi:</strong> {complaint.catatan_verifikasi}
                </p>
              )}
              {complaint.jenis_penanganan && (
                <p className="text-slate-700">
                  <strong>Pihak Penanganan:</strong>{" "}
                  {complaint.jenis_penanganan === "VENDOR"
                    ? "Vendor Eksternal"
                    : "Tim GA Internal"}
                </p>
              )}
              {complaint.estimasi_selesai && (
                <p className="text-slate-700">
                  <strong>Estimasi Selesai:</strong> {complaint.estimasi_selesai}
                </p>
              )}
              {complaint.catatan_penanganan && (
                <p className="text-slate-700">
                  <strong>Instruksi / Catatan Penanganan:</strong> {complaint.catatan_penanganan}
                </p>
              )}
            </div>
          )}

          {/* Bukti & Catatan Penyelesaian (Khususnya saat SELESAI) */}
          {(complaint.status === "SELESAI" ||
            complaint.catatan_selesai ||
            (complaint.bukti_penyelesaian && complaint.bukti_penyelesaian.length > 0)) && (
            <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/40 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  Hasil & Bukti Penyelesaian Perbaikan
                </h4>
                {complaint.tanggal_selesai && (
                  <span className="text-[11px] font-medium text-emerald-700">
                    Selesai: {complaint.tanggal_selesai}
                  </span>
                )}
              </div>

              {complaint.catatan_selesai && (
                <div className="rounded-lg bg-white/90 p-3 border border-emerald-100 text-xs text-slate-700">
                  <span className="font-semibold text-emerald-900 block mb-0.5">
                    Catatan Penyelesaian Admin GA:
                  </span>
                  {complaint.catatan_selesai}
                </div>
              )}

              <div className="space-y-1.5">
                <span className="text-xs font-semibold text-emerald-900 block">
                  Bukti Foto / File Penyelesaian:
                </span>
                <EvidenceGallery
                  files={complaint.bukti_penyelesaian}
                  emptyText="Belum ada foto/file bukti penyelesaian yang diunggah oleh Admin."
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/60 px-6 py-3.5 shrink-0">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-slate-400" />
            <span className="text-xs text-slate-500">Status Saat Ini:</span>
            <StatusBadge status={complaint.status} />
          </div>
          <Button type="button" variant="outline" onClick={onClose} className="rounded-full h-9 px-5">
            Tutup
          </Button>
        </div>
      </div>
    </div>
  );
}
