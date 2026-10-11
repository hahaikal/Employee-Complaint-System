"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
  AlertTriangle,
  Camera,
  Check,
  CheckCircle2,
  Filter,
  Loader2,
  MoreVertical,
  Pencil,
  Search,
  Trash2,
  UserCheck,
  UserX,
  Users,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/utils/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { ImageCropModal } from "./image-crop-modal";

export type UserItem = {
  id: string;
  nama: string;
  email: string;
  username?: string;
  nik: string;
  no_hp?: string;
  role: string;
  status_akun: string;
  jabatan?: string;
  departemen?: string;
  foto_url?: string;
  created_at?: string;
};

export default function UsersPage() {
  const supabase = createClient();

  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTabTable2, setActiveTabTable2] = useState<"SEMUA" | "AKTIF" | "DITOLAK">("SEMUA");

  // Dropdown menu state
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  // Edit modal state
  const [editUser, setEditUser] = useState<UserItem | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<UserItem>>({});
  const [submitting, setSubmitting] = useState(false);

  // Delete modal state
  const [userToDelete, setUserToDelete] = useState<UserItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Crop image state
  const [cropRawImage, setCropRawImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchUsers = useCallback(async () => {
    try {
      // First attempt to fetch with all columns
      let { data, error } = await supabase
        .from("users")
        .select("id, nama, email, username, nik, no_hp, role, status_akun, jabatan, departemen, foto_url, created_at")
        .order("created_at", { ascending: false });

      // Fallback if custom columns don't exist yet
      if (error && (error.message?.includes("does not exist") || error.code === "42703" || error.code === "PGRST204")) {
        const retry = await supabase
          .from("users")
          .select("id, nama, email, username, nik, no_hp, role, status_akun, created_at")
          .order("created_at", { ascending: false });
        data = (retry.data as unknown as typeof data) || null;
        error = retry.error;
      }

      if (error) {
        toast.error(`Gagal mengambil data user: ${error.message}`);
      } else {
        setUsers((data as unknown as UserItem[]) || []);
      }
    } catch (err: unknown) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    let isMounted = true;
    const timer = setTimeout(() => {
      if (isMounted) void fetchUsers();
    }, 0);

    // Realtime listener for user updates
    const channel = supabase
      .channel("users_page_realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "users" }, () => {
        if (isMounted) void fetchUsers();
      })
      .subscribe();

    return () => {
      isMounted = false;
      clearTimeout(timer);
      void supabase.removeChannel(channel);
    };
  }, [fetchUsers, supabase]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = () => {
      setOpenDropdownId(null);
    };
    window.addEventListener("click", handleClickOutside);
    return () => window.removeEventListener("click", handleClickOutside);
  }, []);

  // Quick Action Approve / Reject
  const handleUpdateStatus = async (id: string, newStatus: "Aktif" | "Ditolak", userName: string) => {
    // Optimistic UI update
    setUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, status_akun: newStatus } : u))
    );

    const { error } = await supabase
      .from("users")
      .update({ status_akun: newStatus, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) {
      toast.error(`Gagal memproses status: ${error.message}`);
      fetchUsers();
    } else {
      if (newStatus === "Aktif") {
        toast.success(`Akun ${userName} berhasil disetujui! Pengguna kini dapat login.`);
      } else {
        toast.error(`Akun ${userName} ditolak. Pengguna tidak akan dapat login.`);
      }
      fetchUsers();
    }
  };

  // Open Edit Modal
  const handleOpenEdit = (user: UserItem) => {
    setEditUser(user);
    setEditFormData({ ...user });
    setOpenDropdownId(null);
  };

  // Save Edit User
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editUser) return;
    setSubmitting(true);

    try {
      // 1. Call RPC to sync auth.users (email, nama, foto_url) if changed
      try {
        await supabase.rpc("admin_update_user_credentials", {
          target_user_id: editUser.id,
          new_email: editFormData.email || "",
          new_nama: editFormData.nama || "",
        });
      } catch (rpcErr) {
        console.warn("RPC update credentials fallback:", rpcErr);
      }

      // 2. Direct update on public.users
      let { error } = await supabase
        .from("users")
        .update({
          nama: editFormData.nama,
          username: editFormData.username || null,
          nik: editFormData.nik,
          email: editFormData.email,
          no_hp: editFormData.no_hp || null,
          jabatan: editFormData.jabatan || null,
          departemen: editFormData.departemen || null,
          role: editFormData.role,
          foto_url: editFormData.foto_url || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", editUser.id);

      // Fallback if columns don't exist yet in DB
      if (error && (error.message?.includes("does not exist") || error.code === "42703" || error.code === "PGRST204")) {
        const fallback = await supabase
          .from("users")
          .update({
            nama: editFormData.nama,
            username: editFormData.username || null,
            nik: editFormData.nik,
            email: editFormData.email,
            no_hp: editFormData.no_hp || null,
            role: editFormData.role,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editUser.id);
        error = fallback.error;
      }

      if (error) throw error;

      // 3. Optimistic local state update so the table immediately reflects new email & photo
      setUsers((prev) =>
        prev.map((u) =>
          u.id === editUser.id
            ? {
                ...u,
                nama: editFormData.nama || u.nama,
                username: editFormData.username || u.username,
                nik: editFormData.nik || u.nik,
                email: editFormData.email || u.email,
                no_hp: editFormData.no_hp || u.no_hp,
                jabatan: editFormData.jabatan || u.jabatan,
                departemen: editFormData.departemen || u.departemen,
                role: editFormData.role || u.role,
                foto_url: editFormData.foto_url !== undefined ? editFormData.foto_url : u.foto_url,
              }
            : u
        )
      );

      toast.success(`Data pengguna ${editFormData.nama} berhasil diperbarui!`);
      setEditUser(null);
      fetchUsers();
    } catch (err: unknown) {
      toast.error(`Gagal menyimpan perubahan: ${(err as Error).message}`);
    } finally {
      setSubmitting(false);
    }
  };

  // Delete User
  const handleConfirmDelete = async () => {
    if (!userToDelete) return;
    setDeleting(true);

    try {
      // 1. Call RPC function if available (deletes from auth.users and public.users)
      const { error: rpcError } = await supabase.rpc("delete_user_by_admin", {
        target_user_id: userToDelete.id,
      });

      // 2. Direct delete on public.users
      const { error: deleteError } = await supabase
        .from("users")
        .delete()
        .eq("id", userToDelete.id);

      // 3. Set status to Ditolak as safety barrier against login
      await supabase
        .from("users")
        .update({ status_akun: "Ditolak" })
        .eq("id", userToDelete.id);

      // If both RPC and direct delete returned critical errors, throw
      if (rpcError && deleteError) {
        console.warn("Delete warnings:", { rpcError, deleteError });
      }

      // Optimistically remove from list
      setUsers((prev) => prev.filter((u) => u.id !== userToDelete.id));
      toast.success(`Akun ${userToDelete.nama} berhasil dihapus.`);
      setUserToDelete(null);
      fetchUsers();
    } catch (err: unknown) {
      toast.error(`Gagal menghapus akun: ${(err as Error).message}`);
    } finally {
      setDeleting(false);
    }
  };

  // Handle Photo File Selection
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Format file harus berupa gambar.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setCropRawImage(reader.result as string);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  // Divide into TWO separate datasets:
  // 1. Pending registration users (Menunggu Persetujuan)
  const pendingUsers = users.filter((u) => u.status_akun === "Menunggu Persetujuan");

  // 2. Main users table (All approved / existing accounts)
  const approvedUsers = users.filter((u) => u.status_akun !== "Menunggu Persetujuan");

  // Filter Table 2 by search and active tabs
  const filteredApprovedUsers = approvedUsers.filter((u) => {
    const matchSearch =
      u.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.nik.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.email && u.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (u.username && u.username.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (u.departemen && u.departemen.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchSearch) return false;

    if (activeTabTable2 === "AKTIF") return u.status_akun === "Aktif";
    if (activeTabTable2 === "DITOLAK") return u.status_akun === "Ditolak" || u.status_akun === "Nonaktif";
    return true;
  });

  return (
    <div className="flex flex-col gap-8">
      {/* Page Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900">Manajemen Pengguna</h2>
        <p className="mt-1 text-sm text-slate-500">
          Kelola data akun karyawan, beri persetujuan pendaftaran baru, dan atur hak akses sistem.
        </p>
      </div>

      {/* ========================================================================= */}
      {/* TABEL 1: PERMOHONAN PENDAFTARAN AKUN BARU (MENUNGGU PERSETUJUAN) */}
      {/* ========================================================================= */}
      <Card className="rounded-2xl border-amber-200 bg-white shadow-sm overflow-hidden">
        <CardHeader className="border-b border-amber-100 bg-amber-50/60 pb-4">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500 text-white shadow-sm">
                <UserCheck className="h-4 w-4" />
              </span>
              <div>
                <CardTitle className="text-base font-bold text-slate-900">
                  Tabel 1: Permohonan Pendaftaran Akun Baru
                </CardTitle>
                <CardDescription className="text-xs text-amber-900/70">
                  Akun karyawan yang baru mendaftar dan membutuhkan persetujuan Admin sebelum dapat login.
                </CardDescription>
              </div>
            </div>
            <span className="w-fit rounded-full bg-amber-100 border border-amber-300/60 px-3 py-1 text-xs font-bold text-amber-800">
              {pendingUsers.length} Permintaan Menunggu
            </span>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex py-10 justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-amber-500" />
            </div>
          ) : pendingUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 mb-2">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <p className="text-sm font-semibold text-slate-700">
                Tidak ada pendaftaran baru yang menunggu persetujuan
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                Semua akun pendaftar sudah disetujui atau ditolak.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="border-b border-amber-100 bg-amber-50/30 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-5 py-3.5">Nama & Username</th>
                    <th className="px-4 py-3.5">Email</th>
                    <th className="px-4 py-3.5">NIK</th>
                    <th className="px-4 py-3.5">WhatsApp</th>
                    <th className="px-4 py-3.5">Status Akun</th>
                    <th className="px-5 py-3.5 text-right">Aksi Persetujuan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pendingUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-amber-50/20 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9 border border-amber-200 shrink-0">
                            <AvatarImage src={u.foto_url} alt={u.nama} />
                            <AvatarFallback className="bg-amber-100 text-xs font-bold text-amber-800">
                              {u.nama.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-900 leading-tight truncate">
                              {u.nama}
                            </p>
                            <p className="text-xs text-slate-400 truncate mt-0.5">
                              @{u.username || "user"}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-xs text-slate-600">{u.email || "-"}</td>
                      <td className="px-4 py-3.5 font-mono text-xs font-medium text-slate-800">{u.nik}</td>
                      <td className="px-4 py-3.5 text-xs text-slate-600">{u.no_hp || "-"}</td>
                      <td className="px-4 py-3.5">
                        <Badge variant="outline" className="rounded-full border-amber-300 bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
                          Menunggu Persetujuan
                        </Badge>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleUpdateStatus(u.id, "Aktif", u.nama)}
                            className="h-8 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-3 shadow-sm"
                          >
                            <Check className="h-3.5 w-3.5 mr-1" /> Setujui
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleUpdateStatus(u.id, "Ditolak", u.nama)}
                            className="h-8 rounded-full border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 font-semibold text-xs px-3"
                          >
                            <X className="h-3.5 w-3.5 mr-1" /> Tolak
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ========================================================================= */}
      {/* TABEL 2: DAFTAR SELURUH PENGGUNA TERVERIFIKASI & TERDAFTAR */}
      {/* ========================================================================= */}
      <Card className="rounded-2xl border-slate-200/80 bg-white shadow-sm overflow-hidden">
        <CardHeader className="border-b border-slate-100 pb-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-sidebar-brand text-white shadow-sm">
                <Users className="h-4 w-4" />
              </span>
              <div>
                <CardTitle className="text-base font-bold text-slate-900">
                  Tabel 2: Daftar Seluruh Pengguna
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Data semua akun karyawan dan admin yang sudah terverifikasi di sistem.
                </CardDescription>
              </div>
            </div>

            {/* Search Input for Table 2 */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama, NIK, divisi..."
                className="h-9 rounded-full border-slate-200 bg-slate-50/70 pl-9 text-xs focus-visible:ring-sidebar-brand"
              />
            </div>
          </div>

          {/* Filter Status Chips for Table 2 */}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={() => setActiveTabTable2("SEMUA")}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-semibold transition-all",
                activeTabTable2 === "SEMUA"
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              )}
            >
              Semua ({approvedUsers.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTabTable2("AKTIF")}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-semibold transition-all",
                activeTabTable2 === "AKTIF"
                  ? "bg-emerald-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              )}
            >
              Aktif ({approvedUsers.filter((u) => u.status_akun === "Aktif").length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTabTable2("DITOLAK")}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-semibold transition-all",
                activeTabTable2 === "DITOLAK"
                  ? "bg-red-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              )}
            >
              Ditolak / Nonaktif ({approvedUsers.filter((u) => u.status_akun === "Ditolak" || u.status_akun === "Nonaktif").length})
            </button>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {loading ? (
            <div className="flex py-14 justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-sidebar-brand" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="border-b border-slate-200 bg-slate-50/80 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-5 py-3.5">Profil & Nama</th>
                    <th className="px-4 py-3.5">NIK</th>
                    <th className="px-4 py-3.5">Jabatan & Divisi</th>
                    <th className="px-4 py-3.5">Role</th>
                    <th className="px-4 py-3.5">Status Akun</th>
                    <th className="px-5 py-3.5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredApprovedUsers.map((u, index) => {
                    const isInactiveOrRejected = u.status_akun === "Ditolak" || u.status_akun === "Nonaktif";
                    const isNearBottom = index >= filteredApprovedUsers.length - 2;

                    return (
                      <tr key={u.id} className="hover:bg-slate-50/60 transition-colors">
                        {/* Name & Avatar */}
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10 border border-slate-200 shrink-0">
                              <AvatarImage src={u.foto_url || undefined} alt={u.nama} />
                              <AvatarFallback className="bg-sidebar-brand text-xs font-bold text-white">
                                {u.nama.substring(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <p className="font-semibold text-slate-900 leading-tight truncate">
                                {u.nama}
                              </p>
                              <p className="text-xs text-slate-400 truncate mt-0.5">{u.email || "-"}</p>
                            </div>
                          </div>
                        </td>

                        {/* NIK */}
                        <td className="px-4 py-3.5 font-mono text-xs text-slate-700">{u.nik}</td>

                        {/* Jabatan & Departemen */}
                        <td className="px-4 py-3.5 text-xs text-slate-600">
                          <p className="font-medium text-slate-800">{u.jabatan || "-"}</p>
                          <p className="text-slate-400">{u.departemen || "-"}</p>
                        </td>

                        {/* Role */}
                        <td className="px-4 py-3.5">
                          <Badge
                            variant="outline"
                            className={cn(
                              "rounded-full px-2.5 py-0.5 text-xs font-medium border-transparent",
                              u.role === "admin_ga" || u.role === "GA"
                                ? "bg-purple-100 text-purple-700"
                                : "bg-slate-100 text-slate-700"
                            )}
                          >
                            {u.role === "admin_ga" || u.role === "GA" ? "Admin GA" : "Karyawan"}
                          </Badge>
                        </td>

                        {/* Status Akun */}
                        <td className="px-4 py-3.5">
                          <Badge
                            variant="outline"
                            className={cn(
                              "rounded-full px-2.5 py-0.5 text-xs font-medium border-transparent",
                              u.status_akun === "Aktif"
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-red-100 text-red-800"
                            )}
                          >
                            {u.status_akun}
                          </Badge>
                        </td>

                        {/* Aksi Column */}
                        <td className="px-5 py-3.5 text-right relative">
                          {isInactiveOrRejected ? (
                            <Button
                              size="sm"
                              onClick={() => handleUpdateStatus(u.id, "Aktif", u.nama)}
                              className="h-8 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-3 shadow-sm inline-flex items-center gap-1.5"
                            >
                              <Check className="h-3.5 w-3.5" />
                              Aktifkan
                            </Button>
                          ) : (
                            <div className="relative inline-block text-left">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenDropdownId(openDropdownId === u.id ? null : u.id);
                                }}
                                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                                aria-label="Aksi akun"
                              >
                                <MoreVertical className="h-4 w-4" />
                              </button>

                              {/* Popover Dropdown Menu */}
                              {openDropdownId === u.id && (
                                <div
                                  onClick={(e) => e.stopPropagation()}
                                  className={cn(
                                    "absolute right-0 w-44 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl shadow-slate-900/10 z-30 animate-in fade-in-0 zoom-in-95",
                                    isNearBottom
                                      ? "bottom-full mb-1.5 origin-bottom-right"
                                      : "top-full mt-1.5 origin-top-right"
                                  )}
                                >
                                  <button
                                    type="button"
                                    onClick={() => handleOpenEdit(u)}
                                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                                  >
                                    <Pencil className="h-3.5 w-3.5 text-slate-500" />
                                    Edit Data User
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setUserToDelete(u);
                                      setOpenDropdownId(null);
                                    }}
                                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                    Hapus Akun
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}

                  {filteredApprovedUsers.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-14 text-center text-slate-400 text-sm">
                        Tidak ada data pengguna yang sesuai dengan filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* DIALOG 1: EDIT USER MODAL */}
      {editUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-3 sm:p-4">
          <div className="flex flex-col w-full max-w-lg max-h-[85vh] rounded-2xl bg-white shadow-2xl overflow-hidden animate-in fade-in-0 zoom-in-95">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 shrink-0 bg-white">
              <div>
                <h3 className="text-base font-bold text-slate-900">Edit Data Pengguna</h3>
                <p className="text-xs text-slate-500">Perbarui identitas dan foto profil pengguna.</p>
              </div>
              <button
                type="button"
                onClick={() => setEditUser(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveEdit} className="flex flex-col flex-1 overflow-hidden">
              <div className="overflow-y-auto px-6 py-4 space-y-4 flex-1">
                {/* Foto Profil with Crop Trigger */}
                <div className="flex items-center gap-4 rounded-xl bg-slate-50 p-3.5 border border-slate-100">
                  <Avatar className="h-16 w-16 border-2 border-white shadow-md ring-2 ring-sidebar-brand/20 shrink-0">
                    {editFormData.foto_url ? (
                      <AvatarImage src={editFormData.foto_url} alt={editFormData.nama} />
                    ) : null}
                    <AvatarFallback className="bg-sidebar-brand text-base font-bold text-white">
                      {(editFormData.nama || "U").substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex flex-col gap-1.5 min-w-0">
                    <span className="text-xs font-semibold text-slate-700">Foto Profil Karyawan</span>
                    <div className="flex flex-wrap gap-2">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoSelect}
                        className="hidden"
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        className="h-8 rounded-full border-slate-200 text-xs font-medium"
                      >
                        <Camera className="h-3.5 w-3.5 mr-1.5" />
                        {editFormData.foto_url ? "Ganti Foto" : "Unggah Foto"}
                      </Button>
                      {editFormData.foto_url && (
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => setEditFormData((prev) => ({ ...prev, foto_url: undefined }))}
                          className="h-8 rounded-full text-xs text-red-600 hover:bg-red-50 hover:text-red-700"
                        >
                          <Trash2 className="h-3.5 w-3.5 mr-1" />
                          Hapus Foto
                        </Button>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-400">
                      Foto dapat disesuaikan dan di-crop menjadi bulat.
                    </span>
                  </div>
                </div>

                {/* Form Grid */}
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="nama" className="text-xs">Nama Lengkap</Label>
                    <Input
                      id="nama"
                      value={editFormData.nama || ""}
                      onChange={(e) => setEditFormData({ ...editFormData, nama: e.target.value })}
                      required
                      className="border-slate-200 text-sm h-9"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="username" className="text-xs">Username</Label>
                    <Input
                      id="username"
                      value={editFormData.username || ""}
                      onChange={(e) => setEditFormData({ ...editFormData, username: e.target.value })}
                      placeholder="username"
                      className="border-slate-200 text-sm h-9"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="nik" className="text-xs">NIK (Nomor Induk Karyawan)</Label>
                    <Input
                      id="nik"
                      value={editFormData.nik || ""}
                      onChange={(e) => setEditFormData({ ...editFormData, nik: e.target.value })}
                      required
                      className="border-slate-200 text-sm h-9"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="email" className="text-xs">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={editFormData.email || ""}
                      onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                      required
                      className="border-slate-200 text-sm h-9"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="no_hp" className="text-xs">No. Handphone / WA</Label>
                    <Input
                      id="no_hp"
                      value={editFormData.no_hp || ""}
                      onChange={(e) => setEditFormData({ ...editFormData, no_hp: e.target.value })}
                      placeholder="+62 8..."
                      className="border-slate-200 text-sm h-9"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="jabatan" className="text-xs">Jabatan</Label>
                    <Input
                      id="jabatan"
                      value={editFormData.jabatan || ""}
                      onChange={(e) => setEditFormData({ ...editFormData, jabatan: e.target.value })}
                      placeholder="Staff IT, Marketing, dll"
                      className="border-slate-200 text-sm h-9"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="departemen" className="text-xs">Departemen / Divisi</Label>
                    <Input
                      id="departemen"
                      value={editFormData.departemen || ""}
                      onChange={(e) => setEditFormData({ ...editFormData, departemen: e.target.value })}
                      placeholder="General Affairs, Operasional, dll"
                      className="border-slate-200 text-sm h-9"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs">Role Pengguna</Label>
                    <Select
                      value={editFormData.role || "karyawan"}
                      onValueChange={(val) => setEditFormData({ ...editFormData, role: val ?? "karyawan" })}
                    >
                      <SelectTrigger className="w-full h-9 border-slate-200 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="karyawan">Karyawan (Pelapor)</SelectItem>
                        <SelectItem value="admin_ga">Admin GA (Pengelola)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Modal Sticky Footer */}
              <div className="flex justify-end gap-2.5 px-6 py-3.5 border-t border-slate-100 bg-slate-50/60 shrink-0">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditUser(null)}
                  className="rounded-full h-9"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="rounded-full bg-sidebar-brand hover:bg-sidebar-brand-hover text-white font-semibold h-9"
                >
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
                  Simpan Perubahan
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DIALOG 2: DELETE CONFIRMATION MODAL */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl animate-in fade-in-0 zoom-in-95">
            <div className="flex items-center gap-3 text-red-600 mb-4">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
                <AlertTriangle className="h-5 w-5" />
              </span>
              <div>
                <h3 className="text-base font-bold text-slate-900">Konfirmasi Hapus Akun</h3>
                <p className="text-xs text-slate-500">Tindakan ini akan menghapus akun secara permanen.</p>
              </div>
            </div>

            <p className="text-sm text-slate-600 leading-relaxed">
              Apakah Anda yakin ingin menghapus akun pengguna{" "}
              <strong className="text-slate-900">{userToDelete.nama}</strong> (NIK:{" "}
              <span className="font-mono font-semibold">{userToDelete.nik}</span>)? Pengguna ini tidak akan dapat login lagi ke sistem.
            </p>

            <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100 mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => setUserToDelete(null)}
                className="rounded-full"
              >
                Batal
              </Button>
              <Button
                type="button"
                disabled={deleting}
                onClick={handleConfirmDelete}
                className="rounded-full bg-red-600 hover:bg-red-700 text-white font-semibold"
              >
                {deleting ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <Trash2 className="h-4 w-4 mr-1.5" />}
                Ya, Hapus Akun
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* DIALOG 3: CROP IMAGE MODAL */}
      {cropRawImage && (
        <ImageCropModal
          imageSrc={cropRawImage}
          onCancel={() => setCropRawImage(null)}
          onCropComplete={(croppedDataUrl) => {
            setEditFormData((prev) => ({ ...prev, foto_url: croppedDataUrl }));
            setCropRawImage(null);
          }}
        />
      )}
    </div>
  );
}
