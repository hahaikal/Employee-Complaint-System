"use client";

import { Building2, FileText, LayoutDashboard, LogOut, User, Users, CheckSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/utils/supabase/client";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";

export function AppSidebar({ role, onNavigate }: { role?: string, onNavigate?: () => void }) {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  const navItems = role === "ADMIN" ? [
    { label: "Profil", icon: User, href: "/dashboard/profil" },
    { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
    { label: "User", icon: Users, href: "/dashboard/users" },
    { label: "Progres", icon: CheckSquare, href: "/dashboard/progres" },
  ] : [
    { label: "Profil", icon: User, href: "/dashboard/profil" },
    { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
    { label: "Pengaduan Saya", icon: FileText, href: "/dashboard/pengaduan" },
  ];

  return (
    <div className="flex h-full w-64 flex-col bg-sidebar-brand text-white">
      <div className="flex items-center gap-3 px-6 pb-6 pt-7">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15">
          <Building2 className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-lg font-bold leading-tight tracking-tight">LaporGA</p>
          <p className="truncate text-[11px] text-white/60">Sistem Pengaduan Karyawan</p>
        </div>
      </div>

      <nav className="mt-2 flex flex-col gap-1.5" aria-label="Navigasi utama">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          
          return (
            <Link
              key={item.label}
              href={item.href}
              onClick={onNavigate}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex w-full items-center gap-3 py-3 pl-6 pr-4 text-sm transition-colors",
                isActive
                  ? "rounded-r-full bg-white font-semibold text-sidebar-brand shadow-md"
                  : "rounded-r-full text-white/70 hover:bg-white/10 hover:text-white"
              )}
            >
              <item.icon className="h-[18px] w-[18px] shrink-0" />
              <span className="flex-1 text-left">{item.label}</span>
              {(item as any).badge ? (
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[11px] font-semibold",
                    isActive ? "bg-slate-100 text-slate-600" : "bg-white/20 text-white"
                  )}
                >
                  {(item as any).badge}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto pb-6">
        <button
          type="button"
          onClick={handleLogout}
          className="mx-4 flex items-center gap-3 rounded-xl w-[calc(100%-2rem)] px-4 py-3 text-sm text-white/70 transition-colors hover:bg-white/10 hover:text-white"
        >
          <LogOut className="h-[18px] w-[18px]" />
          Logout
        </button>
      </div>
    </div>
  );
}
