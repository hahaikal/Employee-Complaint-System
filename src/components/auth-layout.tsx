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
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-brand p-12 lg:flex lg:flex-col lg:justify-between">
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
          <span className="flex size-11 items-center justify-center rounded-2xl bg-white/15 backdrop-blur">
            <Building2 className="size-6" />
          </span>
          <span className="text-lg font-semibold tracking-tight">SIPKA</span>
        </Link>

        <div className="relative max-w-md text-brand-foreground">
          <Quote className="size-9 opacity-60" />
          <p className="mt-5 text-2xl leading-relaxed font-medium">{quote}</p>
          <p className="mt-6 text-sm opacity-80">
            Divisi General Affairs — Sistem Informasi Pengaduan Karyawan
          </p>
        </div>

        <p className="relative text-xs text-brand-foreground/70">
          © 2026 SIPKA. Seluruh hak cipta dilindungi.
        </p>
      </div>

      <div className="flex flex-col items-center justify-center bg-background px-4 py-12 sm:px-8">
        <div className="w-full max-w-md">
          <Link
            href="/"
            className="mb-8 flex items-center gap-3 lg:hidden justify-center"
          >
            <span className="flex size-10 items-center justify-center rounded-xl bg-brand text-brand-foreground shadow-soft">
              <Building2 className="size-5" />
            </span>
            <span className="text-xl font-bold tracking-tight text-heading">SIPKA</span>
          </Link>
          {children}
        </div>
      </div>
    </div>
  );
}
