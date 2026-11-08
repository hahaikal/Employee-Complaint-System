"use client";

import { useEffect, useState, useCallback } from "react";
import { Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

export type TimeframeFilter = "1m" | "3m" | "1y" | "all";

export const TIMEFRAME_STORAGE_KEY = "sipka_admin_timeframe";

export const TIMEFRAME_OPTIONS: { id: TimeframeFilter; label: string; shortLabel: string }[] = [
  { id: "1m", label: "1 Bulan Terakhir", shortLabel: "1 Bulan" },
  { id: "3m", label: "3 Bulan Terakhir", shortLabel: "3 Bulan" },
  { id: "1y", label: "1 Tahun Terakhir", shortLabel: "1 Tahun" },
  { id: "all", label: "Semua Waktu", shortLabel: "Semua" },
];

/**
 * Filter a complaint's date against the chosen timeframe.
 * Dates >= (now - duration) will return true.
 */
export function isComplaintInTimeframe(
  rawDate?: string,
  timeframe: TimeframeFilter = "all"
): boolean {
  if (timeframe === "all") return true;
  if (!rawDate) return true;

  const itemDate = new Date(rawDate);
  if (isNaN(itemDate.getTime())) return true;

  const now = new Date();
  const cutoff = new Date(now);

  if (timeframe === "1m") {
    cutoff.setMonth(now.getMonth() - 1);
  } else if (timeframe === "3m") {
    cutoff.setMonth(now.getMonth() - 3);
  } else if (timeframe === "1y") {
    cutoff.setFullYear(now.getFullYear() - 1);
  }

  // Set cutoff to start of that day
  cutoff.setHours(0, 0, 0, 0);

  return itemDate >= cutoff;
}

/**
 * Hook to manage admin timeframe filter state, synchronized with localStorage
 * and shared across /dashboard and /dashboard/progres.
 */
export function useAdminTimeframe(defaultFilter: TimeframeFilter = "all") {
  const [timeframe, setTimeframeState] = useState<TimeframeFilter>(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem(TIMEFRAME_STORAGE_KEY) as TimeframeFilter | null;
        if (stored && ["1m", "3m", "1y", "all"].includes(stored)) {
          return stored;
        }
      } catch (e) {
        console.warn("Error reading localStorage timeframe:", e);
      }
    }
    return defaultFilter;
  });

  useEffect(() => {
    try {
      const stored = localStorage.getItem(TIMEFRAME_STORAGE_KEY) as TimeframeFilter | null;
      if (stored && ["1m", "3m", "1y", "all"].includes(stored) && stored !== timeframe) {
        setTimeframeState(stored);
      }
    } catch (e) {
      console.warn("Error syncing localStorage timeframe:", e);
    }

    const handleStorage = (e: StorageEvent) => {
      if (e.key === TIMEFRAME_STORAGE_KEY && e.newValue) {
        const val = e.newValue as TimeframeFilter;
        if (["1m", "3m", "1y", "all"].includes(val)) {
          setTimeframeState(val);
        }
      }
    };

    const handleCustom = (e: Event) => {
      const customEvt = e as CustomEvent<TimeframeFilter>;
      if (customEvt.detail && ["1m", "3m", "1y", "all"].includes(customEvt.detail)) {
        setTimeframeState(customEvt.detail);
      }
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener("sipka_timeframe_changed", handleCustom);
    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("sipka_timeframe_changed", handleCustom);
    };
  }, [timeframe]);

  const setTimeframe = useCallback((newVal: TimeframeFilter) => {
    setTimeframeState(newVal);
    try {
      localStorage.setItem(TIMEFRAME_STORAGE_KEY, newVal);
      window.dispatchEvent(new CustomEvent("sipka_timeframe_changed", { detail: newVal }));
    } catch (err) {
      console.warn("Could not save timeframe to localStorage:", err);
    }
  }, []);

  return { timeframe, setTimeframe };
}

/**
 * Reusable pill/segmented control component for filtering timeframe.
 */
export function TimeframeFilterControl({
  timeframe,
  onChange,
  className,
}: {
  timeframe: TimeframeFilter;
  onChange: (val: TimeframeFilter) => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-slate-200/90 bg-white p-1 shadow-xs",
        className
      )}
    >
      <span className="flex items-center gap-1 pl-2.5 pr-1 text-xs font-semibold text-slate-400">
        <Calendar className="h-3.5 w-3.5 text-slate-500" />
        <span className="hidden sm:inline">Periode:</span>
      </span>
      {TIMEFRAME_OPTIONS.map((opt) => {
        const isActive = timeframe === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange(opt.id)}
            className={cn(
              "rounded-full px-3 py-1 text-xs font-semibold transition-all",
              isActive
                ? "bg-sidebar-brand text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            )}
            title={opt.label}
          >
            {opt.shortLabel}
          </button>
        );
      })}
    </div>
  );
}
