"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  BellOff,
  CheckCheck,
  CheckCircle2,
  Inbox,
  RefreshCw,
  UserPlus,
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { cn } from "@/lib/utils";

export type NotificationItem = {
  id: string;
  type: "user_approval" | "complaint_new" | "complaint_status";
  title: string;
  message: string;
  time: string;
  timestamp: number;
  link: string;
  statusBadge?: string;
};

function formatTimeAgo(dateString?: string): string {
  if (!dateString) return "Baru saja";
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return "Baru saja";
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes} menit lalu`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours} jam lalu`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays === 1) return "Kemarin";
  if (diffInDays < 7) return `${diffInDays} hari lalu`;

  return date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
  });
}

export function NotificationDropdown({
  role,
  currentUserId,
}: {
  role: string;
  currentUserId?: string;
}) {
  const router = useRouter();
  const supabase = createClient();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [readIds, setReadIds] = useState<Set<string>>(() => {
    if (typeof window === "undefined") return new Set();
    try {
      const stored = localStorage.getItem("sipk_read_notifs");
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch {
      return new Set();
    }
  });
  const [loading, setLoading] = useState(false);

  const fetchNotifications = useCallback(async () => {
    const notifs: NotificationItem[] = [];

    try {
      if (role === "ADMIN") {
        // 1. Pending user registrations needing approval
        const { data: pendingUsers } = await supabase
          .from("users")
          .select("id, nama, email, nik, created_at")
          .eq("status_akun", "Menunggu Persetujuan")
          .order("created_at", { ascending: false })
          .limit(10);

        if (pendingUsers) {
          for (const u of pendingUsers) {
            notifs.push({
              id: `user-pending-${u.id}`,
              type: "user_approval",
              title: "Pendaftaran Pengguna Baru",
              message: `${u.nama} (${u.nik}) mendaftar dan menunggu persetujuan akun.`,
              time: formatTimeAgo(u.created_at),
              timestamp: new Date(u.created_at).getTime(),
              link: "/dashboard/users",
              statusBadge: "Persetujuan",
            });
          }
        }

        // 2. Newly submitted complaints (status DIAJUKAN)
        const { data: newComplaints } = await supabase
          .from("pengaduan")
          .select("id, nomor_pengaduan, judul, created_at, users(nama)")
          .eq("status", "DIAJUKAN")
          .order("created_at", { ascending: false })
          .limit(10);

        if (newComplaints) {
          for (const c of newComplaints) {
            const reporter = (c.users as { nama?: string } | null)?.nama || "Karyawan";
            notifs.push({
              id: `complaint-new-${c.id}`,
              type: "complaint_new",
              title: "Pengaduan Baru Masuk",
              message: `${c.nomor_pengaduan} — ${c.judul} diajukan oleh ${reporter}.`,
              time: formatTimeAgo(c.created_at),
              timestamp: new Date(c.created_at).getTime(),
              link: "/dashboard/progres",
              statusBadge: "Diajukan",
            });
          }
        }
      } else if (currentUserId) {
        // Karyawan notifications: complaints history and status updates
        const { data: userComplaints } = await supabase
          .from("pengaduan")
          .select("id, nomor_pengaduan, judul, status, updated_at, created_at")
          .eq("user_id", currentUserId)
          .order("updated_at", { ascending: false })
          .limit(15);

        if (userComplaints) {
          for (const c of userComplaints) {
            const timeField = c.updated_at || c.created_at;
            let title = "Pengaduan Diajukan";
            let message = `Laporan "${c.nomor_pengaduan}: ${c.judul}" berhasil dikirim ke GA.`;
            let statusBadge = "Diajukan";

            if (c.status === "DIVERIFIKASI") {
              title = "Pengaduan Diverifikasi";
              message = `Laporan "${c.nomor_pengaduan}: ${c.judul}" telah diverifikasi oleh tim GA.`;
              statusBadge = "Diverifikasi";
            } else if (c.status === "DIPROSES") {
              title = "Pengaduan Sedang Diproses";
              message = `Laporan "${c.nomor_pengaduan}: ${c.judul}" sedang dikerjakan.`;
              statusBadge = "Diproses";
            } else if (c.status === "SELESAI") {
              title = "Pengaduan Telah Selesai";
              message = `Laporan "${c.nomor_pengaduan}: ${c.judul}" telah rampung diperbaiki.`;
              statusBadge = "Selesai";
            }

            notifs.push({
              id: `user-complaint-${c.id}-${c.status}`,
              type: "complaint_status",
              title,
              message,
              time: formatTimeAgo(timeField),
              timestamp: new Date(timeField).getTime(),
              link: "/dashboard/pengaduan",
              statusBadge,
            });
          }
        }
      }

      // Sort newest first
      notifs.sort((a, b) => b.timestamp - a.timestamp);
      setNotifications(notifs);
    } catch (err) {
      console.error("Gagal mengambil notifikasi:", err);
    } finally {
      setLoading(false);
    }
  }, [role, currentUserId, supabase]);

  useEffect(() => {
    let isSubscribed = true;
    const timer = setTimeout(() => {
      if (isSubscribed) void fetchNotifications();
    }, 0);
    const interval = setInterval(() => {
      if (isSubscribed) void fetchNotifications();
    }, 30000);
    return () => {
      isSubscribed = false;
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [fetchNotifications]);

  // Click outside listener
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const unreadCount = notifications.filter((n) => !readIds.has(n.id)).length;

  const markAllAsRead = () => {
    const allIds = new Set(notifications.map((n) => n.id));
    setReadIds(allIds);
    try {
      localStorage.setItem("sipk_read_notifs", JSON.stringify(Array.from(allIds)));
    } catch {
      // ignore
    }
  };

  const handleItemClick = (item: NotificationItem) => {
    if (!readIds.has(item.id)) {
      const nextRead = new Set(readIds);
      nextRead.add(item.id);
      setReadIds(nextRead);
      try {
        localStorage.setItem("sipk_read_notifs", JSON.stringify(Array.from(nextRead)));
      } catch {
        // ignore
      }
    }
    setIsOpen(false);
    router.push(item.link);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={cn(
          "relative flex h-10 w-10 items-center justify-center rounded-full transition-colors",
          isOpen
            ? "bg-slate-100 text-slate-900"
            : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
        )}
        aria-label="Notifikasi"
        aria-expanded={isOpen}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 ? (
          <span className="absolute right-2 top-2 flex h-2.5 w-2.5 items-center justify-center">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500 ring-2 ring-white" />
          </span>
        ) : null}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 rounded-2xl border border-slate-200/80 bg-white shadow-xl shadow-slate-900/10 z-50 overflow-hidden animate-in fade-in-0 zoom-in-95 duration-150">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 bg-slate-50/70">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-900">Notifikasi</span>
              {unreadCount > 0 ? (
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800">
                  {unreadCount} baru
                </span>
              ) : null}
            </div>

            {unreadCount > 0 ? (
              <button
                type="button"
                onClick={markAllAsRead}
                className="flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-sidebar-brand transition-colors"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Tandai dibaca
              </button>
            ) : null}
          </div>

          {/* List Content */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100">
            {loading && notifications.length === 0 ? (
              <div className="flex items-center justify-center py-10 text-slate-400">
                <RefreshCw className="h-5 w-5 animate-spin" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center px-4 py-10 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400 mb-3">
                  <BellOff className="h-6 w-6" />
                </div>
                <p className="text-sm font-semibold text-slate-700">
                  Tidak ada pemberitahuan terbaru
                </p>
                <p className="mt-1 text-xs text-slate-400 max-w-[220px]">
                  Semua aktivitas pembaruan pengaduan atau akun akan muncul di sini.
                </p>
              </div>
            ) : (
              notifications.map((item) => {
                const isRead = readIds.has(item.id);

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleItemClick(item)}
                    className={cn(
                      "flex w-full items-start gap-3 p-3.5 text-left transition-colors hover:bg-slate-50",
                      isRead ? "bg-white opacity-75" : "bg-slate-50/60 font-medium"
                    )}
                  >
                    <div className="mt-0.5 shrink-0">
                      {item.type === "user_approval" ? (
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
                          <UserPlus className="h-4 w-4" />
                        </div>
                      ) : item.statusBadge === "Selesai" ? (
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                          <CheckCircle2 className="h-4 w-4" />
                        </div>
                      ) : item.statusBadge === "Diproses" ? (
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100 text-purple-700">
                          <RefreshCw className="h-4 w-4" />
                        </div>
                      ) : item.statusBadge === "Diverifikasi" ? (
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
                          <CheckCircle2 className="h-4 w-4" />
                        </div>
                      ) : (
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
                          <Inbox className="h-4 w-4" />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className={cn("text-xs font-semibold truncate", isRead ? "text-slate-800" : "text-slate-900")}>
                          {item.title}
                        </p>
                        <span className="shrink-0 text-[10px] text-slate-400">
                          {item.time}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-slate-600 line-clamp-2 leading-relaxed">
                        {item.message}
                      </p>
                    </div>

                    {!isRead ? (
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-sidebar-brand" />
                    ) : null}
                  </button>
                );
              })
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 ? (
            <div className="border-t border-slate-100 p-2 bg-slate-50/50 text-center">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  if (role === "ADMIN") {
                    router.push("/dashboard/users");
                  } else {
                    router.push("/dashboard/pengaduan");
                  }
                }}
                className="text-xs font-medium text-sidebar-brand hover:underline py-1"
              >
                {role === "ADMIN" ? "Buka Manajemen User & Laporan →" : "Buka Daftar Pengaduan Saya →"}
              </button>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
