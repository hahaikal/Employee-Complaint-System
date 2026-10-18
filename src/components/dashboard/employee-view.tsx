"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  CalendarDays,
  ChevronRight,
  ExternalLink,
  IdCard,
  Inbox,
  Mail,
  Paperclip,
  Plus,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { Complaint } from "./data";
import { StatusBadge, statusConfig } from "./status-badge";
import { ComplaintDetailModal } from "./complaint-detail-modal";
import Link from "next/link";

function EmployeeViewInner({
  currentUser,
  complaints,
}: {
  currentUser: any;
  complaints: Complaint[];
}) {
  const searchParams = useSearchParams();
  const globalSearch = (searchParams.get("q") || "").trim().toLowerCase();
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);

  const filteredComplaints = complaints.filter((item) => {
    if (!globalSearch) return true;
    return (
      item.title.toLowerCase().includes(globalSearch) ||
      item.nomor_pengaduan.toLowerCase().includes(globalSearch) ||
      item.category.toLowerCase().includes(globalSearch) ||
      item.description.toLowerCase().includes(globalSearch) ||
      (item.location && item.location.toLowerCase().includes(globalSearch))
    );
  });

  return (
    <div className="flex flex-col gap-6">
      <ProfileSummary currentUser={currentUser} />
      <ComplaintTracking
        complaints={filteredComplaints}
        totalCount={complaints.length}
        hasSearch={Boolean(globalSearch)}
        onSelectComplaint={(item) => setSelectedComplaint(item)}
      />
      <ComplaintDetailModal
        complaint={selectedComplaint}
        onClose={() => setSelectedComplaint(null)}
      />
    </div>
  );
}

export function EmployeeView(props: { currentUser: any; complaints: Complaint[] }) {
  return (
    <Suspense fallback={<div className="py-10 text-center text-sm text-slate-400">Memuat dashboard...</div>}>
      <EmployeeViewInner {...props} />
    </Suspense>
  );
}

function ProfileSummary({ currentUser }: { currentUser: any }) {
  return (
    <Card className="rounded-2xl border-slate-200/80 shadow-sm">
      <CardContent className="flex flex-col gap-6 p-6 lg:flex-row lg:items-center">
        <div className="flex items-center gap-5">
          <Avatar className="h-20 w-20 shrink-0 border-4 border-white shadow-md ring-2 ring-sidebar-brand/10">
            <AvatarImage src={currentUser?.foto_url || undefined} alt={currentUser.name} />
            <AvatarFallback className="bg-sidebar-brand text-lg font-semibold text-white">
              {currentUser.name.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
              Profil Saya
            </p>
            <h2 className="mt-0.5 truncate text-xl font-bold text-slate-900">
              {currentUser.name}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {currentUser.position} · {currentUser.department}
            </p>
          </div>
        </div>

        <div className="grid gap-x-8 gap-y-3 border-t border-slate-100 pt-5 text-sm sm:grid-cols-2 lg:flex-1 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
          <div className="flex items-center gap-2.5 text-slate-500">
            <IdCard className="h-4 w-4 shrink-0 text-sidebar-brand" />
            <span>
              NIK: <span className="font-medium text-slate-700">{currentUser.nik}</span>
            </span>
          </div>
          <div className="flex items-center gap-2.5 text-slate-500">
            <Mail className="h-4 w-4 shrink-0 text-sidebar-brand" />
            <span className="truncate">{currentUser.email}</span>
          </div>
        </div>

        <Link
          href="/dashboard/pengaduan"
          className={cn(
            buttonVariants({ size: "lg" }),
            "w-fit shrink-0 rounded-full bg-sidebar-brand px-6 font-semibold text-white shadow-lg shadow-sidebar-brand/25 hover:bg-sidebar-brand-hover"
          )}
        >
          <Plus className="h-4 w-4" />
          Ajukan Pengaduan
        </Link>
      </CardContent>
    </Card>
  );
}

function ComplaintTracking({
  complaints,
  totalCount,
  hasSearch,
  onSelectComplaint,
}: {
  complaints: Complaint[];
  totalCount: number;
  hasSearch: boolean;
  onSelectComplaint: (item: Complaint) => void;
}) {
  return (
    <Card className="rounded-2xl border-slate-200/80 shadow-sm">
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="text-lg text-slate-900">Pengaduan Saya</CardTitle>
          <CardDescription>
            Riwayat pengajuan Anda kepada General Affairs (klik laporan untuk melihat rincian & bukti penyelesaian)
          </CardDescription>
        </div>
        <span className="shrink-0 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
          {complaints.length} pengajuan
        </span>
      </CardHeader>
      <CardContent>
        {totalCount === 0 ? (
          <EmptyState />
        ) : complaints.length === 0 && hasSearch ? (
          <div className="py-10 text-center text-sm text-slate-500">
            Tidak ada pengaduan yang cocok dengan kata kunci pencarian Anda.
          </div>
        ) : (
          <Timeline items={complaints} onSelectComplaint={onSelectComplaint} />
        )}
      </CardContent>
    </Card>
  );
}

function Timeline({
  items,
  onSelectComplaint,
}: {
  items: Complaint[];
  onSelectComplaint: (item: Complaint) => void;
}) {
  return (
    <ol className="relative ml-3 space-y-4 border-l-2 border-slate-100 pl-8">
      {items.map((item) => (
        <li key={item.id} className="relative">
          <span
            className={cn(
              "absolute -left-[41px] top-7 h-4 w-4 rounded-full border-4 border-white shadow-sm",
              statusConfig[item.status].dotClass
            )}
          />
          <div
            onClick={() => onSelectComplaint(item)}
            className="group cursor-pointer rounded-2xl border border-slate-100 bg-slate-50/70 p-4 transition-all hover:border-sidebar-brand/30 hover:bg-white hover:shadow-md sm:p-5"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <h3 className="truncate font-semibold text-slate-900">
                    {item.title}
                  </h3>
                  <ChevronRight className="h-4 w-4 shrink-0 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-sidebar-brand" />
                  {item.bukti_pengaduan && item.bukti_pengaduan.length > 0 && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-200/70 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                      <Paperclip className="h-2.5 w-2.5" />
                      {item.bukti_pengaduan.length} Bukti
                    </span>
                  )}
                </div>
                <p className="mt-1 line-clamp-1 text-sm text-slate-500">
                  {item.category} · {item.description}
                </p>
                <p className="mt-1.5 flex items-center gap-1.5 text-xs text-slate-400">
                  <CalendarDays className="h-3.5 w-3.5" />
                  {item.date} · <span className="font-mono font-medium text-slate-500">{item.nomor_pengaduan}</span>
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
                    onSelectComplaint(item);
                  }}
                  className="h-8 rounded-full border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                >
                  <ExternalLink className="h-3.5 w-3.5 mr-1" />
                  {item.status === "SELESAI" ? "Detail Selesai" : "Detail"}
                </Button>
              </div>
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 px-6 py-14 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-sidebar-brand/10">
        <Inbox className="h-8 w-8 text-sidebar-brand" />
      </div>
      <h3 className="mt-5 text-lg font-semibold text-slate-900">
        Belum ada pengajuan
      </h3>
      <p className="mt-1.5 max-w-sm text-sm text-slate-500">
        Semua kendala fasilitas di tempat kerja bisa Anda laporkan di sini.
        Mulai dengan membuat pengajuan pertama Anda.
      </p>
      <Link
        href="/dashboard/pengaduan"
        className={cn(
          buttonVariants(),
          "mt-6 rounded-full bg-sidebar-brand px-6 font-semibold text-white shadow-lg shadow-sidebar-brand/25 hover:bg-sidebar-brand-hover"
        )}
      >
        <Plus className="h-4 w-4" />
        Buat Pengajuan Baru
      </Link>
    </div>
  );
}
