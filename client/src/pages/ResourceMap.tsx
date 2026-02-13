import { useEffect, useState } from "react";
import { MapView } from "@/components/Map";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MapPin, Navigation, X } from "lucide-react";
import { Link } from "wouter";

const RESOURCE_TYPES = [
  { value: "all", label: "All Resources", color: "#3b82f6" },
  { value: "medical", label: "Medical/Dental", color: "#ef4444" },
  { value: "shelter", label: "Shelters", color: "#8b5cf6" },
  { value: "food", label: "Food", color: "#10b981" },
  { value: "legal", label: "Legal Aid", color: "#f59e0b" },
  { value: "employment", label: "Employment", color: "#06b6d4" },
  { value: "clothing", label: "Clothing", color: "#ec4899" },
  { value: "hygiene", label: "Hygiene", color: "#14b8a6" },
  { value: "housing", label: "Housing Programs", color: "#22c55e" },
  { value: "transportation", label: "Transportation", color: "#eab308" },
  { value: "other", label: "Other Services", color: "#6b7280" },
];

export default function ResourceMap() {
  const [selectedTypes, setSelectedTypes] = useState<string[]>(["all"]);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedResource, setSelectedResource] = useState<any>(null);
  
  const { data: allResources = [] } = trpc.resources.list.useQuery({});
  
  // Filter resources that have coordinates and match selected types
  const resources = allResources.filter(r => {
    if (!r.latitude || !r.longitude) return false;
    if (selectedTypes.includes("all")) return true;
    return selectedTypes.includes(r.type);
  });
  
  const handleMapReady = (map: google.maps.Map) => {
    // Add markers for all resources
    resources.forEach(resource => {
      const lat = parseFloat(resource.latitude as string);
      const lng = parseFloat(resource.longitude as string);
      
      if (isNaN(lat) || isNaN(lng)) return;
      
      const typeConfig = RESOURCE_TYPES.find(t => t.value === resource.type) || RESOURCE_TYPES[0];
      
      const marker = new google.maps.Marker({
        position: { lat, lng },
        map,
        title: resource.name,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: typeConfig.color,
          fillOpacity: 0.9,
          strokeColor: "#ffffff",
          strokeWeight: 2,
        },
      });
      
      marker.addListener("click", () => {
        setSelectedResource(resource);
        map.panTo({ lat, lng });
      });
    });
    
    // Add user location marker if available
    if (userLocation) {
      new google.maps.Marker({
        position: userLocation,
        map,
        title: "Your Location",
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: "#3b82f6",
          fillOpacity: 1,
          strokeColor: "#ffffff",
          strokeWeight: 3,
        },
      });
    }
  };
  
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
        ? selectedTypes.filter(t => t !== type)
        : [...selectedTypes.filter(t => t !== "all"), type];
      
      setSelectedTypes(newTypes.length === 0 ? ["all"] : newTypes);
    }
  };
  
  const mapCenter = userLocation || { lat: 34.0522, lng: -118.2437 }; // Default to LA
  
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Header */}
      <div className="border-b border-amber-500/20 bg-zinc-900/50 backdrop-blur">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <Link href="/">
                <Button variant="ghost" className="text-amber-500 hover:text-amber-400">
                  ← Back
                </Button>
              </Link>
              <h1 className="text-2xl font-bold mt-2">
                Resource <span className="text-amber-500">Map</span>
              </h1>
              <p className="text-zinc-400 text-sm mt-1">
                Find services near you
              </p>
            </div>
            <Button
              onClick={handleGetLocation}
              className="bg-amber-500 hover:bg-amber-600 text-black font-bold"
            >
              <Navigation className="w-4 h-4 mr-2" />
              Near Me
            </Button>
          </div>
        </div>
      </div>
      
      {/* Filter Bar */}
      <div className="border-b border-zinc-800 bg-zinc-900/30 backdrop-blur">
        <div className="container mx-auto px-4 py-3">
          <div className="flex flex-wrap gap-2">
            {RESOURCE_TYPES.map(type => (
              <Button
                key={type.value}
                onClick={() => toggleType(type.value)}
                variant={selectedTypes.includes(type.value) ? "default" : "outline"}
                size="sm"
                className={
                  selectedTypes.includes(type.value)
                    ? "bg-amber-500 hover:bg-amber-600 text-black border-amber-500"
                    : "border-zinc-700 hover:border-amber-500 hover:text-amber-500"
                }
              >
                <div
                  className="w-3 h-3 rounded-full mr-2"
                  style={{ backgroundColor: type.color }}
                />
                {type.label}
              </Button>
            ))}
          </div>
          <p className="text-zinc-500 text-sm mt-2">
            Showing {resources.length} resources
          </p>
        </div>
      </div>
      
      {/* Map */}
      <div className="relative" style={{ height: "calc(100vh - 200px)" }}>
        <MapView
          key={`${selectedTypes.join(",")}-${userLocation?.lat || 0}`}
          initialCenter={mapCenter}
          initialZoom={userLocation ? 13 : 10}
          onMapReady={handleMapReady}
        />
        
        {/* Selected Resource Card */}
        {selectedResource && (
          <Card className="absolute top-4 left-4 right-4 md:left-auto md:w-96 bg-zinc-900 border-amber-500/30 p-4 shadow-xl">
            <div className="flex justify-between items-start mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <MapPin className="w-4 h-4 text-amber-500" />
                  <span className="text-xs uppercase tracking-wide text-amber-500 font-semibold">
                    {selectedResource.type}
                  </span>
                </div>
                <h3 className="font-bold text-lg">{selectedResource.name}</h3>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedResource(null)}
                className="hover:bg-zinc-800"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            {selectedResource.description && (
              <p className="text-zinc-400 text-sm mb-3">
                {selectedResource.description}
              </p>
            )}
            
            <div className="space-y-2 text-sm">
              {selectedResource.address && (
                <div>
                  <span className="text-zinc-500">Address:</span>
                  <p className="text-zinc-300">{selectedResource.address}</p>
                </div>
              )}
              
              {selectedResource.phone && (
                <div>
                  <span className="text-zinc-500">Phone:</span>
                  <p className="text-zinc-300">
                    <a href={`tel:${selectedResource.phone}`} className="text-amber-500 hover:underline">
                      {selectedResource.phone}
                    </a>
                  </p>
                </div>
              )}
              
              {selectedResource.hours && (
                <div>
                  <span className="text-zinc-500">Hours:</span>
                  <p className="text-zinc-300">{selectedResource.hours}</p>
                </div>
              )}
              
              {selectedResource.website && (
                <div>
                  <a
                    href={selectedResource.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-amber-500 hover:underline text-sm"
                  >
                    Visit Website →
                  </a>
                </div>
              )}
            </div>
            
            <Button
              className="w-full mt-4 bg-amber-500 hover:bg-amber-600 text-black font-bold"
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
