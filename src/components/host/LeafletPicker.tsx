import { useEffect } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapContainer, Marker, TileLayer, ZoomControl, useMap, useMapEvents } from "react-leaflet";

const pin = L.divIcon({
  className: "",
  html: '<div style="width:22px;height:22px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:hsl(var(--primary, 215 70% 35%));border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,.35)"></div>',
  iconSize: [22, 22],
  iconAnchor: [11, 22],
});

type Props = {
  value: { lat: number; lng: number } | null;
  center: { lat: number; lng: number; zoom: number };
  onChange: (value: { lat: number; lng: number }) => void;
};

function ClickToPlace({ onChange }: { onChange: Props["onChange"] }) {
  useMapEvents({ click: (e) => onChange({ lat: e.latlng.lat, lng: e.latlng.lng }) });
  return null;
}

function Recenter({ center }: { center: Props["center"] }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo([center.lat, center.lng], center.zoom, { duration: 0.8 });
  }, [map, center.lat, center.lng, center.zoom]);
  return null;
}

/** Browser-only map where the host clicks or drags a pin to the exact address. */
export default function LeafletPicker({ value, center, onChange }: Props) {
  return (
    <MapContainer center={[center.lat, center.lng]} zoom={center.zoom} zoomControl={false} className="size-full">
      <TileLayer
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      <Recenter center={center} />
      <ClickToPlace onChange={onChange} />
      {value ? (
        <Marker
          position={[value.lat, value.lng]}
          icon={pin}
          draggable
          eventHandlers={{
            dragend: (e) => {
              const p = (e.target as L.Marker).getLatLng();
              onChange({ lat: p.lat, lng: p.lng });
            },
          }}
        />
      ) : null}
      <ZoomControl position="bottomright" />
    </MapContainer>
  );
}
