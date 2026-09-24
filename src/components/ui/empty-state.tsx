import { Inbox, LoaderCircle, RefreshCw, WifiOff, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Shared "nothing here yet" block. Used everywhere a real list can legitimately
 * be empty, so an empty account never looks like a broken page: a soft framed
 * panel with an icon medallion, a title, an optional hint and an optional action.
 */
export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  size = "default",
  className,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  size?: "default" | "compact";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative isolate overflow-hidden rounded-2xl border border-dashed border-border bg-surface text-center",
        size === "compact" ? "px-5 py-8" : "px-6 py-14",
        className,
      )}
    >
      {/* soft light behind the medallion, kept subtle in both themes */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-24 mx-auto size-56 rounded-full bg-accent/50 blur-3xl"
      />
      <div className="relative">
        <span
          className={cn(
            "mx-auto flex items-center justify-center rounded-2xl bg-accent text-primary shadow-sm ring-1 ring-border",
            size === "compact" ? "size-10" : "size-14",
          )}
        >
          <Icon className={size === "compact" ? "size-5" : "size-6"} aria-hidden />
        </span>
        <h3
          className={cn(
            "mt-4 font-display font-bold",
            size === "compact" ? "text-base" : "text-lg sm:text-xl",
          )}
        >
          {title}
        </h3>
        {description ? (
          <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">{description}</p>
        ) : null}
        {action ? <div className="mt-6 flex justify-center gap-3">{action}</div> : null}
      </div>
    </div>
  );
}

export function DataState({
  status,
  loading,
  error,
  retry,
  compact = false,
}: {
  status: "idle" | "loading" | "ready" | "error";
  loading: string;
  error: string;
  retry: string;
  compact?: boolean;
}) {
  if (status === "ready") return null;
  return (
    <EmptyState
      icon={status === "error" ? WifiOff : LoaderCircle}
      title={status === "error" ? error : loading}
      size={compact ? "compact" : "default"}
      action={status === "error" ? (
        <button type="button" onClick={() => window.location.reload()} className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground">
          <RefreshCw className="size-4" aria-hidden />
          {retry}
        </button>
      ) : undefined}
    />
  );
}
