import L from "leaflet";
import { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, Marker, TileLayer, ZoomControl, useMap, useMapEvents } from "react-leaflet";
import { useNavigate } from "@tanstack/react-router";

import type { Property } from "@/models/property";
import type { Bounds } from "@/models/staySearch";

type Props = {
  items: Property[];
  area: Bounds | null;
  formatPrice: (value: number, currency?: string) => string;
  searchLabel: string;
  onSearchArea: (bounds: Bounds) => void;
};

/** Browser-only results map: one price pin per stay, plus "search this area". */
export default function LeafletResults({ items, area, formatPrice, searchLabel, onSearchArea }: Props) {
  const placed = useMemo(() => items.filter((item) => item.coords), [items]);
  const center: [number, number] = area
    ? [(area.south + area.north) / 2, (area.west + area.east) / 2]
    : placed[0]?.coords
      ? [placed[0].coords.lat, placed[0].coords.lng]
      : [46.6, 2.4];

  return (
    <MapContainer center={center} zoom={6} scrollWheelZoom zoomControl={false} className="size-full">
      <TileLayer
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      <ZoomControl position="bottomright" />
      <FitView items={placed} area={area} />
      <Pins items={placed} formatPrice={formatPrice} />
      <AreaButton label={searchLabel} onSearchArea={onSearchArea} />
    </MapContainer>
  );
}

function FitView({ items, area }: { items: Property[]; area: Bounds | null }) {
  const map = useMap();
  const fitted = useRef(false);
  useEffect(() => {
    // A saved area wins; otherwise frame the stays once, on first results.
    if (area) {
      if (!fitted.current) map.fitBounds([[area.south, area.west], [area.north, area.east]]);
      fitted.current = true;
      return;
    }
    if (fitted.current || !items.length) return;
    const points = items.map((item) => [item.coords!.lat, item.coords!.lng] as [number, number]);
    map.fitBounds(points, { padding: [40, 40], maxZoom: 13 });
    fitted.current = true;
  }, [map, items, area]);
  return null;
}

function Pins({ items, formatPrice }: { items: Property[]; formatPrice: (value: number, currency?: string) => string }) {
  const navigate = useNavigate();
  return (
    <>
      {items.map((item) => (
        <Marker
          key={item.id}
          position={[item.coords!.lat, item.coords!.lng]}
          title={item.name}
          icon={L.divIcon({
            className: "map-price-pin",
            html: `<span>${formatPrice(item.price, item.currency).replace(/</g, "&lt;")}</span>`,
            iconSize: undefined,
          })}
          eventHandlers={{
            click: () => void navigate({ to: "/stays/$propertyId", params: { propertyId: item.id } }),
          }}
        />
      ))}
    </>
  );
}

function AreaButton({ label, onSearchArea }: { label: string; onSearchArea: (bounds: Bounds) => void }) {
  const [moved, setMoved] = useState(false);
  const map = useMapEvents({
    dragend: () => setMoved(true),
    zoomend: () => setMoved(true),
  });
  if (!moved) return null;
  return (
    <div className="absolute inset-x-0 top-3 z-[500] flex justify-center">
      <button
        type="button"
        className="rounded-full border border-border bg-surface px-4 py-2 text-sm font-semibold shadow-lg hover:bg-secondary"
        onClick={() => {
          const b = map.getBounds();
          setMoved(false);
          onSearchArea({
            south: Math.max(-90, b.getSouth()),
            west: Math.max(-180, b.getWest()),
            north: Math.min(90, b.getNorth()),
            east: Math.min(180, b.getEast()),
          });
        }}
      >
        {label}
      </button>
    </div>
  );
}
