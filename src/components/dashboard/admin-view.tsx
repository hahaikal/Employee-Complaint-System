"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  CalendarDays,
  CheckCircle2,
  Inbox,
  LoaderCircle,
  Paperclip,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Complaint, ComplaintStatus } from "./data";
import { StatusBadge } from "./status-badge";
import { ComplaintDetailModal } from "./complaint-detail-modal";

const columns: {
  status: ComplaintStatus;
  title: string;
}[] = [
  {
    status: "DIAJUKAN",
    title: "Pengajuan Masuk",
  },
  {
    status: "DIVERIFIKASI",
    title: "Diverifikasi",
  },
  {
    status: "DIPROSES",
    title: "Sedang Diproses",
  },
  {
    status: "SELESAI",
    title: "Selesai",
  },
];

function AdminViewInner({
  complaints,
}: {
  currentUser?: any;
  complaints: Complaint[];
}) {
  const searchParams = useSearchParams();
  const globalSearch = (searchParams.get("q") || "").trim().toLowerCase();
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);

  const filteredComplaints = complaints.filter((c) => {
    if (!globalSearch) return true;
    return (
      c.title.toLowerCase().includes(globalSearch) ||
      c.nomor_pengaduan.toLowerCase().includes(globalSearch) ||
      c.category.toLowerCase().includes(globalSearch) ||
      c.description.toLowerCase().includes(globalSearch) ||
      (c.employee && c.employee.toLowerCase().includes(globalSearch)) ||
      (c.location && c.location.toLowerCase().includes(globalSearch))
    );
  });

  const stats = [
    {
      label: "Total Diajukan",
      value: filteredComplaints.filter((c) => c.status === "DIAJUKAN").length,
      icon: Inbox,
      accent: "bg-status-diajukan-bg text-status-diajukan",
    },
    {
      label: "Total Diproses",
      value: filteredComplaints.filter(
        (c) => c.status === "DIPROSES" || c.status === "DIVERIFIKASI"
      ).length,
      icon: LoaderCircle,
      accent: "bg-status-diproses-bg text-status-diproses",
    },
    {
      label: "Total Selesai",
      value: filteredComplaints.filter((c) => c.status === "SELESAI").length,
      icon: CheckCircle2,
      accent: "bg-status-selesai-bg text-status-selesai",
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Ringkasan Pengaduan</h2>
        <p className="mt-1 text-sm text-slate-500">
          Pantau dan tangani pengaduan fasilitas dari seluruh karyawan. Klik kartu pengaduan untuk melihat detail & lampiran bukti.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.label} className="rounded-2xl border-slate-200/80 shadow-sm">
            <CardContent className="flex items-center gap-4 p-5">
              <div
                className={cn(
                  "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl",
                  stat.accent
                )}
              >
                <stat.icon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-slate-500">{stat.label}</p>
                <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-4">
        {columns.map((col) => {
          const cards = filteredComplaints.filter((c) => c.status === col.status);
          const visibleCards = cards.slice(0, 3);

          return (
            <div
              key={col.status}
              className="flex flex-col gap-4 rounded-2xl border border-slate-200/60 bg-white p-4 shadow-sm"
            >
              <div className="flex items-center justify-between px-1">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                  <span
                    className={cn(
                      "h-2.5 w-2.5 rounded-full",
                      col.status === "DIAJUKAN" && "bg-status-diajukan",
                      col.status === "DIVERIFIKASI" && "bg-blue-500",
                      col.status === "DIPROSES" && "bg-status-diproses",
                      col.status === "SELESAI" && "bg-status-selesai"
                    )}
                  />
                  {col.title}
                </h3>
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-500">
                  {cards.length}
                </span>
              </div>

              <div className="flex flex-col gap-3">
                {visibleCards.map((card) => (
                  <KanbanCard
                    key={card.id}
                    complaint={card}
                    onClick={() => setSelectedComplaint(card)}
                  />
                ))}
                {cards.length === 0 && (
                  <p className="rounded-xl border border-dashed border-slate-200 py-8 text-center text-xs text-slate-400">
                    Tidak ada pengaduan
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <ComplaintDetailModal
        complaint={selectedComplaint}
        onClose={() => setSelectedComplaint(null)}
      />
    </div>
  );
}

export function AdminView(props: { currentUser?: any; complaints: Complaint[] }) {
  return (
    <Suspense fallback={<div className="py-10 text-center text-sm text-slate-400">Memuat dashboard...</div>}>
      <AdminViewInner {...props} />
    </Suspense>
  );
}

function KanbanCard({
  complaint,
  onClick,
}: {
  complaint: Complaint;
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className="cursor-pointer rounded-xl border border-slate-100 bg-slate-50/70 p-4 transition-all hover:border-sidebar-brand/30 hover:bg-white hover:shadow-md"
    >
      <div className="flex items-center justify-between gap-2">
        <p className="truncate text-xs font-medium text-slate-400">
          {complaint.employee} · {complaint.department}
        </p>
        <span className="font-mono text-[10px] font-semibold text-sidebar-brand shrink-0">
          {complaint.nomor_pengaduan}
        </span>
      </div>
      <h4 className="mt-1 text-sm font-semibold text-slate-900">
        {complaint.title}
      </h4>
      <p className="mt-1 line-clamp-2 text-xs text-slate-500">
        {complaint.description}
      </p>
      {complaint.bukti_pengaduan && complaint.bukti_pengaduan.length > 0 && (
        <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-slate-200/70 px-2 py-0.5 text-[10px] font-medium text-slate-600">
          <Paperclip className="h-2.5 w-2.5" />
          {complaint.bukti_pengaduan.length} Bukti Foto/File
        </div>
      )}
      <div className="mt-3 flex items-center justify-between gap-2">
        <span className="flex min-w-0 items-center gap-1.5 text-xs text-slate-400">
          <CalendarDays className="h-3.5 w-3.5 shrink-0" />
          {complaint.date}
        </span>
        <StatusBadge status={complaint.status} />
      </div>
    </div>
  );
}
