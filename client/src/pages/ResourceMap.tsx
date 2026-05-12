import { useEffect, useMemo, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ExternalLink, MapPin, Navigation, X } from "lucide-react";
import { Link } from "wouter";
import { getDisplayDomain, getFaviconUrl, normalizeExternalUrl } from "@/lib/externalMedia";
import { LeafletMap, createCustomIcon, L } from "@/components/LeafletMap";
import { Marker, Popup } from "react-leaflet";

const RESOURCE_TYPES = [
  { value: "all", label: "All Resources", color: "#0E5E6F" },
  { value: "medical", label: "Medical/Dental", color: "#C94B48" },
  { value: "shelter", label: "Shelters", color: "#6CB4EE" },
  { value: "food", label: "Food", color: "#22c55e" },
  { value: "legal", label: "Legal Aid", color: "#f59e0b" },
  { value: "employment", label: "Employment", color: "#06b6d4" },
  { value: "clothing", label: "Clothing", color: "#ec4899" },
  { value: "hygiene", label: "Hygiene", color: "#14b8a6" },
  { value: "housing", label: "Housing Programs", color: "#16a34a" },
  { value: "transportation", label: "Transportation", color: "#eab308" },
  { value: "other", label: "Other Services", color: "#6b7280" },
];

export default function ResourceMap() {
  const [selectedTypes, setSelectedTypes] = useState<string[]>(["all"]);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedResource, setSelectedResource] = useState<any>(null);
  const [map, setMap] = useState<L.Map | null>(null);

  const { data: allResources = [] } = trpc.resources.list.useQuery({});

  const resources = useMemo(
    () =>
      allResources
        .map((resource) => {
          const lat = Number(resource.latitude);
          const lng = Number(resource.longitude);
          if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
          return { ...resource, lat, lng };
        })
        .filter((resource): resource is NonNullable<typeof resource> => {
          if (!resource) return false;
          if (selectedTypes.includes("all")) return true;
          return selectedTypes.includes(resource.type);
        }),
    [allResources, selectedTypes]
  );

  useEffect(() => {
    if (!map) return;
    map.setView(
      userLocation ? [userLocation.lat, userLocation.lng] : [34.0522, -118.2437],
      userLocation ? 13 : 10
    );
  }, [map, userLocation]);

  const handleGetLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.error("Error getting location:", error);
          alert("Could not get your location. Please enable location services.");
        }
      );
    } else {
      alert("Geolocation is not supported by your browser.");
    }
  };

  const toggleType = (type: string) => {
    if (type === "all") {
      setSelectedTypes(["all"]);
    } else {
      const newTypes = selectedTypes.includes(type)
        ? selectedTypes.filter((t) => t !== type)
        : [...selectedTypes.filter((t) => t !== "all"), type];

      setSelectedTypes(newTypes.length === 0 ? ["all"] : newTypes);
    }
  };

  const mapCenter = userLocation || { lat: 34.0522, lng: -118.2437 };
  const selectedResourceWebsite = normalizeExternalUrl(selectedResource?.website);
  const selectedResourceDomain = getDisplayDomain(selectedResource?.website);
  const selectedResourceFavicon = getFaviconUrl(selectedResource?.website);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card">
        <div className="container flex items-center justify-between gap-4 py-4">
          <div>
            <Link href="/">
              <Button variant="ghost" className="px-2 text-muted-foreground hover:text-foreground">
                â† Back
              </Button>
            </Link>
            <h1 className="mt-2 text-3xl font-bold">Resource Map</h1>
            <p className="mt-1 text-sm text-muted-foreground">Find services near you.</p>
          </div>
          <Button onClick={handleGetLocation}>
            <Navigation className="mr-2 h-4 w-4" />
            Near Me
          </Button>
        </div>
      </header>

      <div className="border-b border-border bg-card/70">
        <div className="container py-3">
          <div className="flex flex-wrap gap-2">
            {RESOURCE_TYPES.map((type) => (
              <Button
                key={type.value}
                onClick={() => toggleType(type.value)}
                variant={selectedTypes.includes(type.value) ? "default" : "outline"}
                size="sm"
              >
                <div className="mr-2 h-3 w-3 rounded-full" style={{ backgroundColor: type.color }} />
                {type.label}
              </Button>
            ))}
          </div>
          <p className="mt-2 text-sm text-muted-foreground">Showing {resources.length} resources</p>
        </div>
      </div>

      <div className="relative" style={{ height: "calc(100vh - 204px)" }}>
        <LeafletMap
          center={[mapCenter.lat, mapCenter.lng]}
          zoom={userLocation ? 13 : 10}
          onMapReady={setMap}
          className="h-full w-full"
        >
          {resources.map((resource) => {
            const typeConfig = RESOURCE_TYPES.find((t) => t.value === resource.type) || RESOURCE_TYPES[0];
            const icon = createCustomIcon(typeConfig.color);
            return (
              <Marker
                key={resource.id}
                position={[resource.lat, resource.lng]}
                icon={icon}
                eventHandlers={{
                  click: () => {
                    setSelectedResource(resource);
                    map?.flyTo([resource.lat, resource.lng], Math.max(map.getZoom(), 14), { duration: 0.8 });
                  },
                }}
              >
                <Popup>
                  <div className="text-sm">
                    <strong>{resource.name}</strong>
                    {resource.description ? <p className="mt-1 text-xs">{resource.description}</p> : null}
                  </div>
                </Popup>
              </Marker>
            );
          })}

          {userLocation ? (
            <Marker
              position={[userLocation.lat, userLocation.lng]}
              icon={createCustomIcon("#0E5E6F")}
            >
              <Popup>Your location</Popup>
            </Marker>
          ) : null}
        </LeafletMap>

        {selectedResource && (
          <Card className="surface-card absolute left-4 right-4 top-4 p-4 shadow-md md:left-auto md:w-96">
            <div className="mb-3 flex items-start justify-between">
              <div className="flex-1">
                <div className="mb-1 flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" />
                  <span className="text-xs font-semibold uppercase tracking-wide text-primary">
                    {selectedResource.type}
                  </span>
                </div>
                <h3 className="text-lg font-bold">{selectedResource.name}</h3>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedResource(null)}
                className="hover:bg-muted"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {selectedResource.description && (
              <p className="mb-3 text-sm text-muted-foreground">{selectedResource.description}</p>
            )}

            <div className="space-y-2 text-sm">
              {selectedResource.address && (
                <div>
                  <span className="text-muted-foreground">Address:</span>
                  <p className="text-foreground">{selectedResource.address}</p>
                </div>
              )}

              {selectedResource.phone && (
                <div>
                  <span className="text-muted-foreground">Phone:</span>
                  <p className="text-foreground">
                    <a href={`tel:${selectedResource.phone}`} className="text-primary hover:underline">
                      {selectedResource.phone}
                    </a>
                  </p>
                </div>
              )}

              {selectedResource.hours && (
                <div>
                  <span className="text-muted-foreground">Hours:</span>
                  <p className="text-foreground">{selectedResource.hours}</p>
                </div>
              )}

              {selectedResourceWebsite && (
                <div>
                  <a
                    href={selectedResourceWebsite}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                  >
                    {selectedResourceFavicon ? (
                      <img
                        src={selectedResourceFavicon}
                        alt=""
                        className="h-4 w-4 rounded-sm border border-border object-cover"
                        loading="lazy"
                        decoding="async"
                      />
                    ) : (
                      <ExternalLink className="h-4 w-4" />
                    )}
                    {selectedResourceDomain ? `Visit ${selectedResourceDomain}` : "Visit website"}
                  </a>
                </div>
              )}
            </div>

            <Button
              className="mt-4 w-full"
              onClick={() => {
                const lat = parseFloat(selectedResource.latitude as string);
                const lng = parseFloat(selectedResource.longitude as string);
                window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, "_blank");
              }}
            >
              Get Directions
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
}
