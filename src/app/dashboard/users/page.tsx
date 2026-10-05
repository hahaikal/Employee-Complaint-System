"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Check, X, Loader2 } from "lucide-react";

type UserData = {
  id: string;
  nama: string;
  email: string;
  nik: string;
  status_akun: string;
  role: string;
};

export default function UsersPage() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("users")
      .select("id, nama, email, nik, status_akun, role")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Gagal mengambil data user");
    } else {
      setUsers(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    const { error } = await supabase
      .from("users")
      .update({ status_akun: newStatus })
      .eq("id", id);

    if (error) {
      toast.error(`Gagal mengubah status: ${error.message}`);
    } else {
      toast.success(`Status berhasil diubah menjadi ${newStatus}`);
      fetchUsers();
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Manajemen User</h2>
        <p className="mt-1 text-sm text-slate-500">
          Kelola akun karyawan dan berikan persetujuan pendaftaran.
        </p>
      </div>

      <Card className="rounded-2xl border-slate-200/80 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Daftar Pengguna</CardTitle>
          <CardDescription>Semua karyawan yang terdaftar di sistem.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex py-12 justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-sidebar-brand" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="border-b border-slate-200 bg-slate-50 text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-medium">Nama / Email</th>
                    <th className="px-4 py-3 font-medium">NIK</th>
                    <th className="px-4 py-3 font-medium">Role</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-slate-900">{u.nama}</p>
                        <p className="text-xs text-slate-500">{u.email}</p>
                      </td>
                      <td className="px-4 py-3">{u.nik}</td>
                      <td className="px-4 py-3">{u.role}</td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className={
                          u.status_akun === "Aktif" ? "border-green-200 bg-green-50 text-green-700" :
                          u.status_akun === "Menunggu Persetujuan" ? "border-amber-200 bg-amber-50 text-amber-700" :
                          "border-red-200 bg-red-50 text-red-700"
                        }>
                          {u.status_akun}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {u.status_akun === "Menunggu Persetujuan" && (
                          <div className="flex justify-end gap-2">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="border-green-200 text-green-700 hover:bg-green-50"
                              onClick={() => handleUpdateStatus(u.id, "Aktif")}
                            >
                              <Check className="h-4 w-4 mr-1" /> Terima
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="border-red-200 text-red-700 hover:bg-red-50"
                              onClick={() => handleUpdateStatus(u.id, "Ditolak")}
                            >
                              <X className="h-4 w-4 mr-1" /> Tolak
                            </Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                  {users.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-500">
                        Belum ada pengguna.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
