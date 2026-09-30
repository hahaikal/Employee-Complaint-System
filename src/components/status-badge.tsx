import { cn } from "@/lib/utils";
import type { ComplaintStatus } from "@/lib/complaints";

const styles: Record<ComplaintStatus, string> = {
  Diajukan: "bg-status-submitted text-status-submitted-foreground",
  Diverifikasi: "bg-status-verified text-status-verified-foreground",
  Diproses: "bg-status-processing text-status-processing-foreground",
  Selesai: "bg-status-resolved text-status-resolved-foreground",
};

export function StatusBadge({
  status,
  className,
}: {
  status: ComplaintStatus;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold",
        styles[status],
        className,
      )}
    >
      {status}
    </span>
  );
}
