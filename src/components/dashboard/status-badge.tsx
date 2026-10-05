import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ComplaintStatus } from "./data";

export const statusConfig: Record<
  ComplaintStatus,
  { label: string; badgeClass: string; dotClass: string }
> = {
  DIAJUKAN: {
    label: "Diajukan",
    badgeClass: "bg-status-diajukan-bg text-status-diajukan",
    dotClass: "bg-status-diajukan",
  },
  DIVERIFIKASI: {
    label: "Diverifikasi",
    badgeClass: "bg-blue-100 text-blue-700",
    dotClass: "bg-blue-500",
  },
  DIPROSES: {
    label: "Diproses",
    badgeClass: "bg-status-diproses-bg text-status-diproses",
    dotClass: "bg-status-diproses",
  },
  SELESAI: {
    label: "Selesai",
    badgeClass: "bg-status-selesai-bg text-status-selesai",
    dotClass: "bg-status-selesai",
  },
};

export function StatusBadge({
  status,
  className,
}: {
  status: ComplaintStatus;
  className?: string;
}) {
  const config = statusConfig[status];

  return (
    <Badge
      className={cn(
        "gap-1.5 rounded-full border-transparent font-medium",
        config.badgeClass,
        className
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", config.dotClass)} />
      {config.label}
    </Badge>
  );
}
