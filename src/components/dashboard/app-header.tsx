"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { FileText, LogOut, Menu, Search, X } from "lucide-react";
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
import { NotificationDropdown } from "./notification-dropdown";
import { StatusBadge } from "./status-badge";
import type { ComplaintStatus } from "./data";
import { createClient } from "@/utils/supabase/client";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

const roleLabels: Record<string, string> = {
  KARYAWAN: "Karyawan",
  ADMIN: "Admin GA",
};

type SearchResultItem = {
  id: string;
  nomor_pengaduan: string;
  judul: string;
  lokasi: string;
  status: ComplaintStatus;
  kategori: string;
};

function GlobalSearchBar({ role, currentUserId }: { role: string; currentUserId?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync input when URL search param changes externally
  useEffect(() => {
    const urlQ = searchParams.get("q") || "";
    setQuery(urlQ);
  }, [searchParams]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const updateUrlQuery = (newQuery: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (newQuery.trim()) {
      params.set("q", newQuery.trim());
    } else {
      params.delete("q");
    }
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  // Fetch matching complaints for quick dropdown preview
  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        let req = supabase
          .from("pengaduan")
          .select("id, nomor_pengaduan, judul, lokasi, status, informasi_tambahan, kategori_pengaduan(nama_kategori)")
          .order("created_at", { ascending: false })
          .limit(20);

        if (role !== "ADMIN" && currentUserId) {
          req = req.eq("user_id", currentUserId);
        }

        const { data } = await req;
        if (data) {
          const lower = trimmed.toLowerCase();
          const matched: SearchResultItem[] = (data as any[])
            .map((c) => {
              let cat = c.kategori_pengaduan?.nama_kategori;
              if (!cat && c.informasi_tambahan?.startsWith("Kategori: ")) {
                cat = c.informasi_tambahan.replace("Kategori: ", "");
              }
              return {
                id: c.id,
                nomor_pengaduan: c.nomor_pengaduan || "",
                judul: c.judul || "",
                lokasi: c.lokasi || "-",
                status: (c.status as ComplaintStatus) || "DIAJUKAN",
                kategori: cat || "Umum",
              };
            })
            .filter(
              (item) =>
                item.nomor_pengaduan.toLowerCase().includes(lower) ||
                item.judul.toLowerCase().includes(lower) ||
                item.kategori.toLowerCase().includes(lower) ||
                item.lokasi.toLowerCase().includes(lower)
            )
            .slice(0, 6);

          setResults(matched);
        }
      } catch (err) {
        console.warn("Global search error:", err);
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query, role, currentUserId, supabase]);

  const handleChange = (val: string) => {
    setQuery(val);
    setIsOpen(Boolean(val.trim()));
    updateUrlQuery(val);
  };

  const handleClear = () => {
    setQuery("");
    setResults([]);
    setIsOpen(false);
    updateUrlQuery("");
  };

  const handleSelectResult = (item: SearchResultItem) => {
    setIsOpen(false);
    setQuery(item.nomor_pengaduan);
    const targetPath = role === "ADMIN" ? "/dashboard/progres" : "/dashboard/pengaduan";
    router.push(`${targetPath}?q=${encodeURIComponent(item.nomor_pengaduan)}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      setIsOpen(false);
      if (pathname === "/dashboard/profil" || pathname === "/dashboard/users") {
        const targetPath = role === "ADMIN" ? "/dashboard/progres" : "/dashboard/pengaduan";
        router.push(`${targetPath}?q=${encodeURIComponent(query.trim())}`);
      } else {
        updateUrlQuery(query);
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-md">
      <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 pointer-events-none" />
      <Input
        value={query}
        onChange={(e) => handleChange(e.target.value)}
        onFocus={() => {
          if (query.trim()) setIsOpen(true);
        }}
        onKeyDown={handleKeyDown}
        placeholder="Cari pengaduan, kategori, nomor tiket..."
        className="h-10 rounded-full border-0 bg-slate-100 pl-11 pr-9 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-sidebar-brand/30"
      />
      {query && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700"
          aria-label="Bersihkan pencarian"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}

      {/* Instant Search Results Dropdown */}
      {isOpen && query.trim() && (
        <div className="absolute left-0 right-0 top-full mt-2 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl z-50 animate-in fade-in-0 zoom-in-95">
          <div className="border-b border-slate-100 bg-slate-50/70 px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Hasil Pencarian Pengaduan
          </div>
          {loading ? (
            <div className="px-4 py-6 text-center text-xs text-slate-400">
              Mencari tiket pengaduan...
            </div>
          ) : results.length === 0 ? (
            <div className="px-4 py-6 text-center text-xs text-slate-500">
              Tidak ditemukan tiket dengan kata kunci <strong>&ldquo;{query}&rdquo;</strong>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
              {results.map((item) => (
                <li
                  key={item.id}
                  onClick={() => handleSelectResult(item)}
                  className="flex cursor-pointer items-center justify-between gap-3 px-4 py-3 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-start gap-2.5 min-w-0">
                    <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-sidebar-brand/10 text-sidebar-brand">
                      <FileText className="h-3.5 w-3.5" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-bold text-slate-900">
                        {item.judul}
                      </p>
                      <p className="truncate text-[11px] text-slate-500">
                        <span className="font-mono font-semibold text-sidebar-brand">
                          {item.nomor_pengaduan}
                        </span>{" "}
                        · {item.kategori} · {item.lokasi}
                      </p>
                    </div>
                  </div>
                  <StatusBadge status={item.status} className="shrink-0" />
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

export function AppHeader({ role, currentUser }: { role: string; currentUser: any }) {
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
          <SheetTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                className="text-slate-500 lg:hidden"
                aria-label="Buka menu"
              >
                <Menu className="h-5 w-5" />
              </Button>
            }
          />
          <SheetContent
            side="left"
            className="w-64 border-0 p-0 [&>button]:text-white"
          >
            <SheetTitle className="sr-only">Menu navigasi</SheetTitle>
            <AppSidebar role={role} />
          </SheetContent>
        </Sheet>

        <Suspense
          fallback={
            <div className="relative w-full max-w-md">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Cari pengaduan, kategori, nomor tiket..."
                disabled
                className="h-10 rounded-full border-0 bg-slate-100 pl-11 text-sm"
              />
            </div>
          }
        >
          <GlobalSearchBar role={role} currentUserId={currentUser?.id} />
        </Suspense>

        <div className="ml-auto flex items-center gap-2 sm:gap-4">
          <NotificationDropdown role={role} currentUserId={currentUser?.id} />

          <div className="hidden h-8 w-px bg-slate-200 sm:block" />

          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9 border border-slate-200">
              <AvatarImage src={currentUser?.foto_url || undefined} alt={currentUser.name} />
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
