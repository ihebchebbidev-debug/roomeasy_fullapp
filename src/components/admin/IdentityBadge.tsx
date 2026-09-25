import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useAdminT } from "@/i18n/adminAutoCopy";

export type IdentityStatus = "none" | "pending" | "verified" | "rejected";

const styles: Record<IdentityStatus, { label: string; className: string }> = {
  verified: { label: "ID verified", className: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400" },
  pending: { label: "ID to verify", className: "bg-amber-500/15 text-amber-700 dark:text-amber-400" },
  rejected: { label: "ID refused", className: "bg-destructive/10 text-destructive" },
  none: { label: "No ID", className: "bg-muted text-muted-foreground" },
};

export function IdentityBadge({ status, className }: { status: IdentityStatus; className?: string }) {
  const T = useAdminT();
  const s = styles[status] ?? styles.none;
  return <Badge className={cn("border-0", s.className, className)}>{T(s.label)}</Badge>;
}
