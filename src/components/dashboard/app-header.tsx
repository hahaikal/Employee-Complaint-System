"use client";

import { Bell, LogOut, Menu, Search } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { AppSidebar } from "./app-sidebar";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";

const roleLabels: Record<string, string> = {
  KARYAWAN: "Karyawan",
  ADMIN: "Admin GA",
};

export function AppHeader({ role, currentUser }: { role: string, currentUser: any }) {
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/90 backdrop-blur">
      <div className="flex h-16 items-center gap-2 px-4 sm:gap-3 sm:px-6 lg:px-8">
        <Sheet>
          <SheetTrigger render={
            <Button
              variant="ghost"
              size="icon"
              className="text-slate-500 lg:hidden"
              aria-label="Buka menu"
            >
              <Menu className="h-5 w-5" />
            </Button>
          } />
          <SheetContent
            side="left"
            className="w-64 border-0 p-0 [&>button]:text-white"
          >
            <SheetTitle className="sr-only">Menu navigasi</SheetTitle>
            <AppSidebar />
          </SheetContent>
        </Sheet>

        <div className="relative w-full max-w-md">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Cari pengaduan, kategori, nomor tiket..."
            className="h-10 rounded-full border-0 bg-slate-100 pl-11 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-sidebar-brand/30"
          />
        </div>

        <div className="ml-auto flex items-center gap-2 sm:gap-4">
          <button
            type="button"
            className="relative flex h-10 w-10 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
            aria-label="Notifikasi"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-amber-400 ring-2 ring-white" />
          </button>

          <div className="hidden h-8 w-px bg-slate-200 sm:block" />

          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9 border border-slate-200">
              <AvatarImage src={"https://github.com/shadcn.png"} alt={currentUser.name} />
              <AvatarFallback className="bg-sidebar-brand text-xs font-semibold text-white">
                {currentUser.name.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="hidden text-left sm:block">
              <p className="text-sm font-semibold leading-tight text-slate-900">
                {currentUser.name}
              </p>
              <p className="text-xs text-slate-500">{roleLabels[role] ?? role}</p>
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            className="hidden text-slate-500 hover:text-slate-900 sm:inline-flex"
            aria-label="Keluar"
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
}
