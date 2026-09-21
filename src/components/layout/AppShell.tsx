import type { ReactNode } from "react";

import { SiteHeader } from "@/components/layout/SiteHeader";
import { cn } from "@/lib/utils";

export function AppShell({
  children,
  title,
  subtitle,
  actions,
  contentClassName,
}: {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
  contentClassName?: string;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />

      <main className={cn("mx-auto w-full max-w-7xl flex-1 px-4 pt-8 pb-28 sm:px-6 lg:px-8 lg:py-12", contentClassName)}>
        {title ? (
          <div className="mb-8 grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4 sm:flex sm:items-center sm:justify-between">
            <div className="min-w-0">
              <h1 className="font-display text-2xl font-bold sm:text-3xl">{title}</h1>
              {subtitle ? <p className="mt-1.5 text-sm text-muted-foreground">{subtitle}</p> : null}
            </div>
            {actions}
          </div>
        ) : null}
        {children}
      </main>
    </div>
  );
}
