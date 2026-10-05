import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { IdCard, Mail, Phone, Building } from "lucide-react";

export default async function ProfilPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single();

  const roleLabel = profile?.role === "admin_ga" ? "Admin GA" : "Karyawan";

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Profil Saya</h2>
        <p className="mt-1 text-sm text-slate-500">
          Informasi akun dan data diri Anda.
        </p>
      </div>

      <Card className="max-w-2xl rounded-2xl border-slate-200/80 shadow-sm">
        <CardContent className="flex flex-col gap-6 p-6 sm:flex-row sm:items-start">
          <Avatar className="h-24 w-24 shrink-0 border-4 border-white shadow-md ring-2 ring-sidebar-brand/10">
            <AvatarImage src={"https://github.com/shadcn.png"} alt={profile?.nama || "User"} />
            <AvatarFallback className="bg-sidebar-brand text-2xl font-semibold text-white">
              {(profile?.nama || "U").substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 space-y-4">
            <div>
              <h3 className="text-2xl font-bold text-slate-900">{profile?.nama}</h3>
              <p className="text-sm font-medium text-sidebar-brand">{roleLabel}</p>
            </div>

            <div className="grid gap-3 pt-2 text-sm text-slate-600 sm:grid-cols-2">
              <div className="flex items-center gap-2.5">
                <IdCard className="h-4 w-4 text-slate-400" />
                <span>NIK: <span className="font-medium text-slate-900">{profile?.nik || "-"}</span></span>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail className="h-4 w-4 text-slate-400" />
                <span>{user.email || "-"}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="h-4 w-4 text-slate-400" />
                <span>{profile?.no_hp || "-"}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Building className="h-4 w-4 text-slate-400" />
                <span>Divisi / Departemen (TBD)</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
