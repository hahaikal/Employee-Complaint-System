import type { ReactNode } from "react";
import Link from "next/link";
import { Building2, Quote } from "lucide-react";

export function AuthLayout({
  children,
  quote,
}: {
  children: ReactNode;
  quote: string;
}) {
  return (
    <div className="flex min-h-screen flex-col lg:grid lg:grid-cols-2">
      <div className="relative flex min-h-[50vh] flex-col justify-between overflow-hidden bg-brand p-6 sm:p-8 md:p-10 lg:min-h-screen lg:p-12">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 20%, rgba(255,255,255,0.45) 0, transparent 45%), radial-gradient(circle at 85% 70%, rgba(255,255,255,0.3) 0, transparent 40%), repeating-linear-gradient(135deg, rgba(255,255,255,0.14) 0 2px, transparent 2px 22px)",
          }}
        />
        <Link
          href="/"
          className="relative flex items-center gap-3 text-brand-foreground"
        >
          <span className="flex size-10 sm:size-11 items-center justify-center rounded-2xl bg-white/15 backdrop-blur">
            <Building2 className="size-5 sm:size-6" />
          </span>
          <span className="text-lg font-semibold tracking-tight">SIPKA</span>
        </Link>

        <div className="relative my-6 max-w-md text-brand-foreground lg:my-0">
          <Quote className="size-7 opacity-60 sm:size-8 lg:size-9" />
          <p className="mt-3 text-lg leading-relaxed font-medium sm:mt-4 sm:text-xl lg:mt-5 lg:text-2xl">
            {quote}
          </p>
          <p className="mt-3 text-xs opacity-80 sm:mt-4 sm:text-sm lg:mt-6">
            Divisi General Affairs — Sistem Informasi Pengaduan Karyawan
          </p>
        </div>

        <p className="relative text-xs text-brand-foreground/70">
          © 2026 SIPKA. Seluruh hak cipta dilindungi.
        </p>
      </div>

      <div className="flex min-h-[50vh] flex-1 flex-col items-center justify-center bg-background px-4 py-8 sm:px-8 sm:py-12 lg:min-h-screen">
        <div className="w-full max-w-md">
          {children}
        </div>
      </div>
    </div>
  );
}
