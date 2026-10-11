"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
  AlertTriangle,
  Camera,
  Check,
  Filter,
  Loader2,
  MoreVertical,
  Pencil,
  Plus,
  Search,
  Trash2,
  UserCheck,
  UserX,
  Users,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/utils/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  nik: string;
  no_hp?: string;
  role: string;
  status_akun: string;
  jabatan?: string;
  departemen?: string;
  foto_url?: string;
};

export default function UsersPage() {
  const supabase = createClient();

  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"SEMUA" | "PENDING" | "AKTIF" | "DITOLAK">("SEMUA");

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
      const { data, error } = await supabase
        .from("users")
        .select("id, nama, email, nik, no_hp, role, status_akun, jabatan, departemen, foto_url")
        .order("created_at", { ascending: false });

      if (error) {
        toast.error(`Gagal mengambil data user: ${error.message}`);
      } else {
        setUsers(data || []);
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
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [fetchUsers]);

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
    const { error } = await supabase
      .from("users")
      .update({ status_akun: newStatus })
      .eq("id", id);

    if (error) {
      toast.error(`Gagal memproses status: ${error.message}`);
    } else {
      if (newStatus === "Aktif") {
        toast.success(`Akun ${userName} berhasil disetujui! Pengguna kini dapat login.`);
      } else {
        toast.error(`Akun ${userName} ditolak. Pengguna akan melihat pemberitahuan penangguhan saat login.`);
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
      const { error } = await supabase
        .from("users")
        .update({
          nama: editFormData.nama,
          nik: editFormData.nik,
          email: editFormData.email,
          no_hp: editFormData.no_hp || null,
          jabatan: editFormData.jabatan || null,
          departemen: editFormData.departemen || null,
          role: editFormData.role,
          status_akun: editFormData.status_akun,
          foto_url: editFormData.foto_url || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", editUser.id);

      if (error) throw error;

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
      const { error } = await supabase
        .from("users")
        .delete()
        .eq("id", userToDelete.id);

      if (error) throw error;

      toast.success(`Akun ${userToDelete.nama} berhasil dihapus dari sistem.`);
      setUserToDelete(null);
      fetchUsers();
    } catch (err: unknown) {
      toast.error(`Gagal menghapus user: ${(err as Error).message}`);
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

  // Filter calculations
  const pendingUsers = users.filter((u) => u.status_akun === "Menunggu Persetujuan");

  const filteredUsers = users.filter((u) => {
    const matchSearch =
      u.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.nik.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.email && u.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (u.departemen && u.departemen.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchSearch) return false;

    if (activeTab === "PENDING") return u.status_akun === "Menunggu Persetujuan";
    if (activeTab === "AKTIF") return u.status_akun === "Aktif";
    if (activeTab === "DITOLAK") return u.status_akun === "Ditolak" || u.status_akun === "Nonaktif";
    return true;
  });

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Manajemen Pengguna</h2>
          <p className="mt-1 text-sm text-slate-500">
            Kelola data akun karyawan, atur hak akses, serta berikan persetujuan registrasi.
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama, NIK, divisi..."
            className="h-10 rounded-full border-slate-200 bg-white pl-10 text-sm focus-visible:ring-sidebar-brand"
          />
        </div>
      </div>

      {/* Pending Registrations Section (Persetujuan Pendaftaran) */}
      {pendingUsers.length > 0 && (
        <Card className="rounded-2xl border-amber-200 bg-gradient-to-r from-amber-50/70 to-orange-50/40 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500 text-white shadow-sm">
                  <UserCheck className="h-4 w-4" />
                </span>
                <CardTitle className="text-base text-amber-950">
                  Permintaan Pendaftaran Akun Baru ({pendingUsers.length})
                </CardTitle>
              </div>
              <span className="text-xs font-medium text-amber-800">
                Memerlukan persetujuan Admin
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {pendingUsers.map((pUser) => (
                <div
                  key={pUser.id}
                  className="flex flex-col justify-between rounded-xl border border-amber-200/80 bg-white p-4 shadow-sm"
                >
                  <div className="flex items-start gap-3">
                    <Avatar className="h-10 w-10 border border-slate-200">
                      <AvatarImage src={pUser.foto_url} alt={pUser.nama} />
                      <AvatarFallback className="bg-amber-100 text-xs font-bold text-amber-800">
                        {pUser.nama.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-slate-900 truncate">{pUser.nama}</p>
                      <p className="text-xs text-slate-500 truncate">{pUser.email || "No email"}</p>
                      <p className="mt-1 text-xs text-slate-400">NIK: {pUser.nik}</p>
                    </div>
                  </div>

                  <div className="mt-4 flex gap-2 pt-3 border-t border-slate-100">
                    <Button
                      size="sm"
                      onClick={() => handleUpdateStatus(pUser.id, "Aktif", pUser.nama)}
                      className="flex-1 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs"
                    >
                      <Check className="h-3.5 w-3.5 mr-1" /> Setujui
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleUpdateStatus(pUser.id, "Ditolak", pUser.nama)}
                      className="flex-1 rounded-full border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 text-xs font-semibold"
                    >
                      <X className="h-3.5 w-3.5 mr-1" /> Tolak
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs Filter Bar */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
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
          <Users className="h-3.5 w-3.5" />
          Semua Pengguna
          <span className="ml-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-700">
            {users.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("PENDING")}
          className={cn(
            "flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-xs font-semibold transition-all shadow-sm",
            activeTab === "PENDING"
              ? "bg-amber-600 text-white"
              : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
          )}
        >
          <Filter className="h-3.5 w-3.5" />
          Menunggu Persetujuan
          <span className={cn("ml-1 rounded-full px-2 py-0.5 text-[10px]", activeTab === "PENDING" ? "bg-white/20 text-white" : "bg-amber-100 text-amber-800")}>
            {pendingUsers.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("AKTIF")}
          className={cn(
            "flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-xs font-semibold transition-all shadow-sm",
            activeTab === "AKTIF"
              ? "bg-emerald-600 text-white"
              : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
          )}
        >
          <UserCheck className="h-3.5 w-3.5" />
          Aktif
          <span className={cn("ml-1 rounded-full px-2 py-0.5 text-[10px]", activeTab === "AKTIF" ? "bg-white/20 text-white" : "bg-emerald-100 text-emerald-800")}>
            {users.filter((u) => u.status_akun === "Aktif").length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("DITOLAK")}
          className={cn(
            "flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-xs font-semibold transition-all shadow-sm",
            activeTab === "DITOLAK"
              ? "bg-red-600 text-white"
              : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
          )}
        >
          <UserX className="h-3.5 w-3.5" />
          Ditolak / Nonaktif
          <span className={cn("ml-1 rounded-full px-2 py-0.5 text-[10px]", activeTab === "DITOLAK" ? "bg-white/20 text-white" : "bg-red-100 text-red-800")}>
            {users.filter((u) => u.status_akun === "Ditolak" || u.status_akun === "Nonaktif").length}
          </span>
        </button>
      </div>

      {/* Main Users Table Card */}
      <Card className="rounded-2xl border-slate-200/80 shadow-sm bg-white overflow-hidden">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex py-16 justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-sidebar-brand" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="border-b border-slate-200 bg-slate-50/80 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-5 py-4">Profil & Nama</th>
                    <th className="px-4 py-4">NIK</th>
                    <th className="px-4 py-4">Jabatan & Divisi</th>
                    <th className="px-4 py-4">Role</th>
                    <th className="px-4 py-4">Status Akun</th>
                    <th className="px-5 py-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/60 transition-colors">
                      {/* Name & Avatar */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10 border border-slate-200 shrink-0">
                            <AvatarImage src={u.foto_url} alt={u.nama} />
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

                      {/* Position & Department */}
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
                              : u.status_akun === "Menunggu Persetujuan"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-red-100 text-red-800"
                          )}
                        >
                          {u.status_akun}
                        </Badge>
                      </td>

                      {/* Aksi Column */}
                      <td className="px-5 py-3.5 text-right relative">
                        <div className="flex items-center justify-end gap-1.5">
                          {u.status_akun === "Menunggu Persetujuan" && (
                            <div className="flex items-center gap-1 mr-2">
                              <Button
                                size="sm"
                                onClick={() => handleUpdateStatus(u.id, "Aktif", u.nama)}
                                className="h-7 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-2.5"
                              >
                                <Check className="h-3 w-3 mr-1" /> Setujui
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleUpdateStatus(u.id, "Ditolak", u.nama)}
                                className="h-7 rounded-full border-red-200 text-red-600 hover:bg-red-50 text-xs px-2.5"
                              >
                                <X className="h-3 w-3 mr-1" /> Tolak
                              </Button>
                            </div>
                          )}

                          {/* Three-dots Menu Button */}
                          <div className="relative">
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

                            {/* Dropdown Menu Popup */}
                            {openDropdownId === u.id && (
                              <div
                                onClick={(e) => e.stopPropagation()}
                                className="absolute right-0 top-full mt-1 w-44 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg shadow-slate-900/10 z-30 animate-in fade-in-0 zoom-in-95"
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
                        </div>
                      </td>
                    </tr>
                  ))}

                  {filteredUsers.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-14 text-center text-slate-400 text-sm">
                        Tidak ada data pengguna yang sesuai.
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl animate-in fade-in-0 zoom-in-95 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Edit Data Pengguna</h3>
                <p className="text-xs text-slate-500">Perbarui identitas, foto profil, dan status akun pengguna.</p>
              </div>
              <button
                type="button"
                onClick={() => setEditUser(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="mt-5 flex flex-col gap-4">
              {/* Foto Profil with Crop Trigger */}
              <div className="flex items-center gap-4 rounded-xl bg-slate-50 p-4 border border-slate-100">
                <Avatar className="h-20 w-20 border-2 border-white shadow-md ring-2 ring-sidebar-brand/20">
                  <AvatarImage src={editFormData.foto_url} alt={editFormData.nama} />
                  <AvatarFallback className="bg-sidebar-brand text-lg font-bold text-white">
                    {(editFormData.nama || "U").substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                <div className="flex flex-col gap-2">
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
                      className="rounded-full border-slate-200 text-xs font-medium"
                    >
                      <Camera className="h-3.5 w-3.5 mr-1.5" />
                      {editFormData.foto_url ? "Ganti Foto" : "Unggah Foto"}
                    </Button>
                    {editFormData.foto_url && (
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => setEditFormData((prev) => ({ ...prev, foto_url: "" }))}
                        className="rounded-full text-xs text-red-600 hover:bg-red-50 hover:text-red-700"
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
                    className="border-slate-200 text-sm"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="nik" className="text-xs">NIK (Nomor Induk Karyawan)</Label>
                  <Input
                    id="nik"
                    value={editFormData.nik || ""}
                    onChange={(e) => setEditFormData({ ...editFormData, nik: e.target.value })}
                    required
                    className="border-slate-200 text-sm"
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
                    className="border-slate-200 text-sm"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="no_hp" className="text-xs">No. Handphone / WA</Label>
                  <Input
                    id="no_hp"
                    value={editFormData.no_hp || ""}
                    onChange={(e) => setEditFormData({ ...editFormData, no_hp: e.target.value })}
                    placeholder="+62 8..."
                    className="border-slate-200 text-sm"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="jabatan" className="text-xs">Jabatan</Label>
                  <Input
                    id="jabatan"
                    value={editFormData.jabatan || ""}
                    onChange={(e) => setEditFormData({ ...editFormData, jabatan: e.target.value })}
                    placeholder="Staff IT, Marketing, dll"
                    className="border-slate-200 text-sm"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="departemen" className="text-xs">Departemen / Divisi</Label>
                  <Input
                    id="departemen"
                    value={editFormData.departemen || ""}
                    onChange={(e) => setEditFormData({ ...editFormData, departemen: e.target.value })}
                    placeholder="General Affairs, Operasional, dll"
                    className="border-slate-200 text-sm"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs">Role Pengguna</Label>
                  <Select
                    value={editFormData.role || "karyawan"}
                    onValueChange={(val) => setEditFormData({ ...editFormData, role: val ?? "karyawan" })}
                  >
                    <SelectTrigger className="border-slate-200 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="karyawan">Karyawan (Pelapor)</SelectItem>
                      <SelectItem value="admin_ga">Admin GA (Pengelola)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs">Status Akun</Label>
                  <Select
                    value={editFormData.status_akun || "Aktif"}
                    onValueChange={(val) => setEditFormData({ ...editFormData, status_akun: val ?? "Aktif" })}
                  >
                    <SelectTrigger className="border-slate-200 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Aktif">Aktif (Dapat Login)</SelectItem>
                      <SelectItem value="Menunggu Persetujuan">Menunggu Persetujuan</SelectItem>
                      <SelectItem value="Ditolak">Ditolak (Ditangguhkan)</SelectItem>
                      <SelectItem value="Nonaktif">Nonaktif</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100 mt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditUser(null)}
                  className="rounded-full"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="rounded-full bg-sidebar-brand hover:bg-sidebar-brand-hover text-white font-semibold"
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
                <p className="text-xs text-slate-500">Tindakan ini tidak dapat dibatalkan.</p>
              </div>
            </div>

            <p className="text-sm text-slate-600 leading-relaxed">
              Apakah Anda yakin ingin menghapus akun pengguna{" "}
              <strong className="text-slate-900">{userToDelete.nama}</strong> (NIK:{" "}
              <span className="font-mono">{userToDelete.nik}</span>)? Semua data terkait pengguna ini akan dihapus dari sistem.
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
