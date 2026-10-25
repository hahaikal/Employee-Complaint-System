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
  const brandPatternStyle = {
    backgroundImage:
      "radial-gradient(circle at 20% 20%, rgba(255,255,255,0.45) 0, transparent 45%), radial-gradient(circle at 85% 70%, rgba(255,255,255,0.3) 0, transparent 40%), repeating-linear-gradient(135deg, rgba(255,255,255,0.14) 0 2px, transparent 2px 22px)",
  };

  return (
    <div className="relative flex min-h-screen flex-col justify-center lg:grid lg:grid-cols-2">
      {/* Background split for < 1024px: Top half blue design, bottom half plain white */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 flex flex-col lg:hidden"
      >
        <div className="relative h-1/2 w-full overflow-hidden bg-brand">
          <div
            className="absolute inset-0 opacity-30"
            style={brandPatternStyle}
          />
        </div>
        <div className="h-1/2 w-full bg-background" />
      </div>

      {/* Left Column for >= 1024px (lg, xl, 2xl) */}
      <div className="relative hidden overflow-hidden bg-brand p-12 lg:flex lg:min-h-screen lg:flex-col lg:justify-between">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-30"
          style={brandPatternStyle}
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

      {/* Center Content for < 1024px & Right Column for >= 1024px */}
      <div className="relative z-10 grid min-h-screen grid-rows-[1fr_auto_1fr] items-center justify-items-center px-4 py-4 sm:px-8 sm:py-6 lg:flex lg:flex-col lg:justify-center lg:bg-background lg:px-8 lg:py-12">
        {/* Row 1 (< 1024px): Branding Header in top blue space above the centered form */}
        <div className="flex w-full max-w-md flex-col items-center justify-end pb-4 text-center text-brand-foreground lg:hidden">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-xl bg-white/15 backdrop-blur">
              <Building2 className="size-5" />
            </span>
            <span className="text-lg font-bold tracking-tight">SIPKA</span>
          </Link>
          <p className="mt-2 max-w-sm text-xs font-medium leading-snug sm:text-sm">
            &ldquo;{quote}&rdquo;
          </p>
          <p className="mt-0.5 text-[11px] opacity-80">
            Divisi General Affairs — Sistem Informasi Pengaduan Karyawan
          </p>
        </div>

        {/* Row 2 (< 1024px) / Center (>= 1024px): Form Card dead-center at 50% screen height */}
        <div className="w-full max-w-md">{children}</div>

        {/* Row 3 (< 1024px): Footer in bottom white space below the centered form */}
        <div className="flex w-full items-start justify-center pt-4 lg:hidden">
          <p className="text-center text-xs text-muted-foreground">
            © 2026 SIPKA. Seluruh hak cipta dilindungi.
          </p>
        </div>
      </div>
    </div>
  );
}
