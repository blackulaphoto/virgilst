import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix default marker icons in Leaflet (they don't work out of the box with bundlers)
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

interface LeafletMapProps {
  center: [number, number];
  zoom: number;
  onMapReady?: (map: L.Map) => void;
  onClick?: (latlng: L.LatLng) => void;
  className?: string;
  children?: React.ReactNode;
}

// Component to handle map events and pass map instance to parent
function MapEventHandler({ onMapReady, onClick }: { onMapReady?: (map: L.Map) => void; onClick?: (latlng: L.LatLng) => void }) {
  const map = useMap();

  useEffect(() => {
    if (onMapReady) {
      onMapReady(map);
    }
  }, [map, onMapReady]);

  useMapEvents({
    click(e) {
      if (onClick) {
        onClick(e.latlng);
      }
    },
  });

  return null;
}

export function LeafletMap({ center, zoom, onMapReady, onClick, className, children }: LeafletMapProps) {
  return (
    <MapContainer
      center={center}
      zoom={zoom}
      className={className || "h-full w-full"}
      style={{ height: "100%", width: "100%", zIndex: 0 }}
    >
      {/* OpenStreetMap tiles - completely free, no API key needed */}
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        maxZoom={19}
      />

      <MapEventHandler onMapReady={onMapReady} onClick={onClick} />
      {children}
    </MapContainer>
  );
}

// Custom marker icon creator
export function createCustomIcon(color: string, label?: string) {
  const svgIcon = `
    <svg width="32" height="42" viewBox="0 0 32 42" xmlns="http://www.w3.org/2000/svg">
      <path d="M16 0C7.2 0 0 7.2 0 16c0 8.8 16 26 16 26s16-17.2 16-26c0-8.8-7.2-16-16-16z"
            fill="${color}"
            stroke="white"
            stroke-width="2"/>
      ${label ? `<text x="16" y="20" font-size="14" font-weight="bold" fill="white" text-anchor="middle">${label}</text>` : ''}
    </svg>
  `;

  return L.divIcon({
    className: "custom-leaflet-marker",
    html: svgIcon,
    iconSize: [32, 42],
    iconAnchor: [16, 42],
    popupAnchor: [0, -42],
  });
}

export { L };
