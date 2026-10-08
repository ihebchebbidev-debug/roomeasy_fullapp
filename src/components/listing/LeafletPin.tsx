import { CircleMarker, MapContainer, TileLayer, ZoomControl } from "react-leaflet";

/** Browser-only map with the exact spot of a paid booking. */
export default function LeafletPin({ lat, lng }: { lat: number; lng: number }) {
  return (
    <MapContainer center={[lat, lng]} zoom={16} scrollWheelZoom={false} zoomControl={false} className="size-full">
      <TileLayer
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      <CircleMarker center={[lat, lng]} radius={10} className="map-area-circle" />
      <ZoomControl position="bottomright" />
    </MapContainer>
  );
}
