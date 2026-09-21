import { Circle, MapContainer, TileLayer, ZoomControl } from "react-leaflet";

type Props = {
  lat: number;
  lng: number;
};

/**
 * Browser-only Leaflet map. Rendered through React.lazy inside <ClientOnly>
 * so Leaflet never evaluates during SSR.
 *
 * Themed to the RoomEasy palette: minimal light basemap that echoes the
 * crisp ice/navy design, brand-primary area circle (styled via the
 * `map-area-circle` class in styles.css) and token-driven zoom controls.
 */
export default function LeafletArea({ lat, lng }: Props) {
  return (
    <MapContainer
      center={[lat, lng]}
      zoom={13}
      scrollWheelZoom={false}
      zoomControl={false}
      attributionControl
      className="size-full"
    >
      <TileLayer
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      <Circle center={[lat, lng]} radius={900} className="map-area-circle" />
      <ZoomControl position="bottomright" />
    </MapContainer>
  );
}
