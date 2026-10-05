import {
  CalendarDays,
  Check,
  CheckCircle2,
  Eye,
  Inbox,
  LoaderCircle,
  RefreshCw,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Complaint, ComplaintStatus } from "./data";
import { StatusBadge } from "./status-badge";

const columns: {
  status: ComplaintStatus;
  title: string;
  action: { label: string; icon: typeof Check };
}[] = [
  {
    status: "DIAJUKAN",
    title: "Pengajuan Masuk",
    action: { label: "Verifikasi", icon: Check },
  },
  {
    status: "DIVERIFIKASI",
    title: "Diverifikasi",
    action: { label: "Tentukan Penanganan", icon: Check },
  },
  {
    status: "DIPROSES",
    title: "Sedang Diproses",
    action: { label: "Update Status", icon: RefreshCw },
  },
  {
    status: "SELESAI",
    title: "Selesai",
    action: { label: "Lihat Detail", icon: Eye },
  },
];

export function AdminView({ currentUser, complaints }: { currentUser?: any, complaints: Complaint[] }) {
  const stats = [
    {
      label: "Total Diajukan",
      value: complaints.filter((c) => c.status === "DIAJUKAN").length,
      icon: Inbox,
      accent: "bg-status-diajukan-bg text-status-diajukan",
    },
    {
      label: "Total Diproses",
      value: complaints.filter((c) => c.status === "DIPROSES").length,
      icon: LoaderCircle,
      accent: "bg-status-diproses-bg text-status-diproses",
    },
    {
      label: "Total Selesai",
      value: complaints.filter((c) => c.status === "SELESAI").length,
      icon: CheckCircle2,
      accent: "bg-status-selesai-bg text-status-selesai",
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Ringkasan Pengaduan</h2>
        <p className="mt-1 text-sm text-slate-500">
          Pantau dan tangani pengaduan fasilitas dari seluruh karyawan.
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

      <div className="grid gap-4 md:grid-cols-4">
        {columns.map((col) => {
          const cards = complaints.filter((c) => c.status === col.status);

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
                {cards.map((card) => (
                  <KanbanCard key={card.id} complaint={card} action={col.action} />
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
    </div>
  );
}

function KanbanCard({
  complaint,
  action,
}: {
  complaint: Complaint;
  action: { label: string; icon: typeof Check };
}) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4 transition-all hover:bg-white hover:shadow-md">
      <p className="truncate text-xs font-medium text-slate-400">
        {complaint.employee} · {complaint.department}
      </p>
      <h4 className="mt-1 text-sm font-semibold text-slate-900">
        {complaint.title}
      </h4>
      <p className="mt-1 line-clamp-2 text-xs text-slate-500">
        {complaint.description}
      </p>
      <div className="mt-3 flex items-center justify-between gap-2">
        <span className="flex min-w-0 items-center gap-1.5 text-xs text-slate-400">
          <CalendarDays className="h-3.5 w-3.5 shrink-0" />
          {complaint.date}
        </span>
        <StatusBadge status={complaint.status} />
      </div>
      <Button
        variant="outline"
        size="sm"
        className="mt-3 w-full rounded-full border-slate-200 text-xs font-semibold text-slate-700 hover:bg-sidebar-brand hover:text-white hover:border-sidebar-brand"
      >
        <action.icon className="h-3.5 w-3.5" />
        {action.label}
      </Button>
    </div>
  );
}
