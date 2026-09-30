import Link from "next/link";
import { Metadata } from "next";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  ClipboardList,
  ShieldCheck,
  Timer,
  Wrench,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "SIPKA — Layanan Pengaduan Fasilitas Karyawan",
  description: "Sampaikan kendala fasilitas dan sarana kantor Anda dengan mudah, cepat, dan transparan melalui SIPKA.",
};

const steps = [
  {
    icon: ClipboardList,
    title: "Lapor",
    desc: "Isi formulir pengaduan beserta foto kondisi fasilitas.",
  },
  {
    icon: Wrench,
    title: "Diproses GA",
    desc: "Tim General Affairs memverifikasi dan menindaklanjuti laporan.",
  },
  {
    icon: CheckCircle2,
    title: "Selesai",
    desc: "Perbaikan rampung dan Anda menerima pemberitahuan status.",
  },
];

export default function Index() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-surface/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-xl bg-brand text-brand-foreground">
              <Building2 className="size-5" />
            </span>
            <span className="text-base font-semibold text-heading">SIPKA</span>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/login" className={cn(buttonVariants({ variant: "ghost" }), "text-body")}>
              Masuk
            </Link>
            <Link href="/register" className={cn(buttonVariants(), "bg-brand text-brand-foreground hover:bg-brand-dark")}>
              Buat Akun
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="mx-auto max-w-6xl px-4 pt-16 pb-12 sm:px-6 sm:pt-24">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-body shadow-soft">
              <ShieldCheck className="size-3.5 text-brand" />
              Layanan internal Divisi General Affairs
            </span>
            <h1 className="mt-6 text-4xl font-bold tracking-tight text-heading sm:text-5xl lg:text-6xl">
              Layanan Pengaduan Fasilitas Karyawan
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-lg text-body">
              Sampaikan kendala fasilitas dan sarana kantor Anda dengan mudah, cepat,
              dan transparan.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/login"
                className={cn(buttonVariants({ size: "lg" }), "w-full bg-brand px-8 text-brand-foreground shadow-soft hover:bg-brand-dark sm:w-auto")}
              >
                Masuk
                <ArrowRight className="size-4" />
              </Link>
              <Link
                href="/register"
                className={cn(buttonVariants({ size: "lg", variant: "outline" }), "w-full border-border bg-surface px-8 text-heading sm:w-auto")}
              >
                Buat Akun
              </Link>
            </div>
          </div>

          <div className="mx-auto mt-14 grid max-w-4xl gap-4 sm:grid-cols-3">
            {[
              { icon: Timer, label: "Respons cepat", value: "< 1x24 jam" },
              { icon: ClipboardList, label: "Pengaduan tertangani", value: "1.240+" },
              { icon: CheckCircle2, label: "Tingkat penyelesaian", value: "96%" },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-2xl border border-border bg-surface p-5 text-left shadow-soft"
              >
                <item.icon className="size-5 text-brand" />
                <p className="mt-3 text-2xl font-semibold text-heading">{item.value}</p>
                <p className="text-sm text-body">{item.label}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
          <div className="rounded-3xl border border-border bg-surface p-8 shadow-soft sm:p-12">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-heading sm:text-3xl">
                Tiga langkah sederhana
              </h2>
              <p className="mt-2 text-body">
                Alur pengaduan yang jelas dari awal hingga selesai.
              </p>
            </div>

            <ol className="mt-10 grid gap-6 lg:grid-cols-3">
              {steps.map((step, i) => (
                <li key={step.title} className="relative">
                  <div className="h-full rounded-2xl border border-border bg-background p-6">
                    <div className="flex items-center gap-3">
                      <span className="flex size-11 items-center justify-center rounded-xl bg-brand text-brand-foreground">
                        <step.icon className="size-5" />
                      </span>
                      <span className="text-sm font-semibold tracking-wide text-body uppercase">
                        Langkah {i + 1}
                      </span>
                    </div>
                    <h3 className="mt-4 text-lg font-semibold text-heading">
                      {step.title}
                    </h3>
                    <p className="mt-1.5 text-sm text-body">{step.desc}</p>
                  </div>
                  {i < steps.length - 1 && (
                    <ArrowRight className="absolute top-1/2 -right-4 hidden size-5 -translate-y-1/2 text-border lg:block" />
                  )}
                </li>
              ))}
            </ol>
          </div>
        </section>
      </main>

      <footer className="border-t border-border bg-surface">
        <div className="mx-auto max-w-6xl px-4 py-8 text-sm text-body sm:px-6">
          © 2026 SIPKA — Sistem Informasi Pengaduan Karyawan.
        </div>
      </footer>
    </div>
  );
}
