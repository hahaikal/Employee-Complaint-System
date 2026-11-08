"use client";

import { useState, useEffect, useCallback } from "react";
import { Calendar, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "sipka_filter_periode_tanggal";

export type DateRange = {
  startDate: string; // Format YYYY-MM-DD
  endDate: string;   // Format YYYY-MM-DD
};

/**
 * Memeriksa apakah tanggal pengaduan berada dalam rentang tanggal yang dipilih.
 */
export function isWithinDateRange(
  rawDate?: string,
  startDate?: string,
  endDate?: string
): boolean {
  if (!startDate && !endDate) return true;
  if (!rawDate) return true;

  const d = new Date(rawDate);
  if (isNaN(d.getTime())) return true;

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const complaintDateStr = `${year}-${month}-${day}`;

  if (startDate && complaintDateStr < startDate) {
    return false;
  }
  if (endDate && complaintDateStr > endDate) {
    return false;
  }

  return true;
}

/**
 * Hook untuk mengelola filter tanggal periode (tersinkronisasi via localStorage).
 */
export function useDateFilter() {
  const [range, setRange] = useState<DateRange>({ startDate: "", endDate: "" });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.startDate || parsed.endDate) {
          setRange({
            startDate: typeof parsed.startDate === "string" ? parsed.startDate : "",
            endDate: typeof parsed.endDate === "string" ? parsed.endDate : "",
          });
        }
      }
    } catch (err) {
      console.warn("Gagal membaca filter periode:", err);
    }
  }, []);

  useEffect(() => {
    // Sinkronisasi filter saat ada perubahan dari tab atau navigasi halaman lain
    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          setRange({
            startDate: parsed.startDate || "",
            endDate: parsed.endDate || "",
          });
        } catch {
          // ignore
        }
      }
    };

    const handleCustom = (e: Event) => {
      const customEvt = e as CustomEvent<DateRange>;
      if (customEvt.detail) {
        setRange(customEvt.detail);
      }
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener("sipka_periode_changed", handleCustom);
    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("sipka_periode_changed", handleCustom);
    };
  }, []);

  const updateRange = useCallback((newRange: DateRange) => {
    setRange(newRange);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newRange));
      window.dispatchEvent(
        new CustomEvent("sipka_periode_changed", { detail: newRange })
      );
    } catch (err) {
      console.warn("Gagal menyimpan filter periode:", err);
    }
  }, []);

  const setStartDate = useCallback(
    (newStartDate: string) => {
      setRange((prev) => {
        const next = { ...prev, startDate: newStartDate };
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
          window.dispatchEvent(
            new CustomEvent("sipka_periode_changed", { detail: next })
          );
        } catch (e) {
          console.warn(e);
        }
        return next;
      });
    },
    []
  );

  const setEndDate = useCallback(
    (newEndDate: string) => {
      setRange((prev) => {
        const next = { ...prev, endDate: newEndDate };
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
          window.dispatchEvent(
            new CustomEvent("sipka_periode_changed", { detail: next })
          );
        } catch (e) {
          console.warn(e);
        }
        return next;
      });
    },
    []
  );

  const resetFilter = useCallback(() => {
    updateRange({ startDate: "", endDate: "" });
  }, [updateRange]);

  return {
    startDate: range.startDate,
    endDate: range.endDate,
    setStartDate,
    setEndDate,
    resetFilter,
    isFiltered: Boolean(range.startDate || range.endDate),
    mounted,
  };
}

/**
 * Komponen UI Filter Tanggal Periode.
 */
export function DateFilter({ className }: { className?: string }) {
  const { startDate, endDate, setStartDate, setEndDate, resetFilter, isFiltered, mounted } =
    useDateFilter();

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200/90 bg-white p-2 shadow-xs",
        className
      )}
    >
      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 pl-1 shrink-0">
        <Calendar className="h-4 w-4 text-sidebar-brand" />
        <span>Filter Periode:</span>
      </div>

      <div className="flex items-center gap-1.5 flex-wrap sm:flex-nowrap">
        <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1">
          <span className="text-[11px] text-slate-400 font-medium">Dari:</span>
          <input
            type="date"
            value={mounted ? startDate : ""}
            onChange={(e) => setStartDate(e.target.value)}
            className="h-6 cursor-pointer border-0 bg-transparent text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-sidebar-brand"
            aria-label="Tanggal Mulai"
          />
        </div>

        <span className="text-xs font-semibold text-slate-400">s/d</span>

        <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1">
          <span className="text-[11px] text-slate-400 font-medium">Sampai:</span>
          <input
            type="date"
            value={mounted ? endDate : ""}
            onChange={(e) => setEndDate(e.target.value)}
            className="h-6 cursor-pointer border-0 bg-transparent text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-sidebar-brand"
            aria-label="Tanggal Selesai"
          />
        </div>
      </div>

      {mounted && isFiltered && (
        <button
          type="button"
          onClick={resetFilter}
          className="flex items-center gap-1 rounded-xl bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-200 hover:text-slate-900 transition-colors ml-auto sm:ml-0"
          title="Reset filter tanggal"
        >
          <RotateCcw className="h-3 w-3" />
          <span>Reset</span>
        </button>
      )}
    </div>
  );
}
