import { ClientOnly } from "@tanstack/react-router";
import { Suspense, lazy } from "react";

import type { Property } from "@/models/property";
import type { Bounds } from "@/models/staySearch";

const LeafletResults = lazy(() => import("@/components/listing/LeafletResults"));

function Skeleton() {
  return <div className="size-full animate-pulse bg-secondary" />;
}

export function ResultsMap(props: {
  items: Property[];
  area: Bounds | null;
  formatPrice: (value: number, currency?: string) => string;
  searchLabel: string;
  onSearchArea: (bounds: Bounds) => void;
}) {
  return (
    <div className="relative isolate mt-7 h-[70vh] min-h-[26rem] overflow-hidden rounded-2xl border border-border bg-secondary">
      <ClientOnly fallback={<Skeleton />}>
        <Suspense fallback={<Skeleton />}>
          <LeafletResults {...props} />
        </Suspense>
      </ClientOnly>
    </div>
  );
}
