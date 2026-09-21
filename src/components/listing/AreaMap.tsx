import { ClientOnly } from "@tanstack/react-router";
import { MapPin } from "lucide-react";
import { Suspense, lazy } from "react";

const LeafletArea = lazy(() => import("@/components/listing/LeafletArea"));

type Props = {
  coords?: { lat: number; lng: number } | undefined;
  city: string;
  note: string;
  className?: string;
};

function Skeleton() {
  return <div className="size-full animate-pulse bg-secondary" />;
}

/**
 * Real map of the neighbourhood. Only a circular zone is drawn — the exact
 * address is never plotted.
 */
export function AreaMap({ coords, city, note, className }: Props) {
  return (
    <figure className={className}>
      <div className="relative isolate overflow-hidden rounded-2xl border border-border bg-secondary shadow-sm">
        <div className="h-64 w-full sm:h-[22rem] [&_.leaflet-container]:bg-secondary">
          {coords ? (
            <ClientOnly fallback={<Skeleton />}>
              <Suspense fallback={<Skeleton />}>
                <LeafletArea lat={coords.lat} lng={coords.lng} />
              </Suspense>
            </ClientOnly>
          ) : (
            <div className="grid size-full place-items-center text-muted-foreground">
              <MapPin className="size-7" aria-hidden />
            </div>
          )}
        </div>

        <figcaption className="pointer-events-none absolute inset-x-3 top-3 z-[500] w-fit max-w-[calc(100%-1.5rem)] rounded-xl border border-border bg-surface/95 px-4 py-2.5 shadow-sm backdrop-blur">
          <p className="flex items-center gap-2 truncate text-sm font-semibold">
            <MapPin className="size-4 shrink-0 text-primary" aria-hidden />
            {city}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">{note}</p>
        </figcaption>
      </div>
    </figure>
  );
}
