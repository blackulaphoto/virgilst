import { useState, useEffect, useRef } from "react";
import { Marker, Popup } from "react-leaflet";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import {
  ArrowLeft,
  MapPin as MapPinIcon,
  Plus,
  Filter,
  Navigation,
  AlertTriangle,
  Home,
  Utensils,
  Droplet,
  Wifi,
  Zap,
  Search,
  Navigation2,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { getLoginUrl } from "@/const";
import { LeafletMap, createCustomIcon, L } from "@/components/LeafletMap";
import { MapLiveFeed } from "@/components/MapLiveFeed";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const PIN_TYPES = [
  { value: "safe_zone", label: "Safe Zone", icon: Home, color: "#10b981" },
  { value: "resource", label: "Resource Center", icon: MapPinIcon, color: "#3b82f6" },
  { value: "food", label: "Food", icon: Utensils, color: "#f59e0b" },
  { value: "water", label: "Water", icon: Droplet, color: "#06b6d4" },
  { value: "bathroom", label: "Bathroom", icon: Home, color: "#8b5cf6" },
  { value: "charging", label: "Charging", icon: Zap, color: "#eab308" },
  { value: "wifi", label: "WiFi", icon: Wifi, color: "#6366f1" },
  { value: "warning", label: "Warning", icon: AlertTriangle, color: "#ef4444" },
  { value: "sweep_alert", label: "Sweep Alert", icon: AlertTriangle, color: "#dc2626" },
];

interface MapPin {
  id: number;
  title: string;
  description: string | null;
  type: string;
  latitude: string;
  longitude: string;
  notes: string | null;
  submittedBy: number | null;
  isApproved: boolean;
  createdAt: Date;
  commentCount?: number;
  submitter?: {
    id: number;
    displayName: string | null;
    avatarUrl: string | null;
  } | null;
}

interface PinComment {
  id: number;
  pinId: number;
  authorId: number | null;
  content: string;
  isAnonymous: boolean;
  createdAt: Date;
  author?: {
    id: number;
    displayName: string | null;
    avatarUrl: string | null;
  } | null;
}

export default function Map() {
  const { isAuthenticated } = useAuth();
  const [map, setMap] = useState<L.Map | null>(null);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [userLocation, setUserLocation] = useState<[number, number]>([34.0522, -118.2437]); // LA default
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedPin, setSelectedPin] = useState<MapPin | null>(null);
  const [showCommentsDialog, setShowCommentsDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const tempMarkerRef = useRef<L.Marker | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "",
    notes: "",
  });

  // Comment state
  const [commentText, setCommentText] = useState("");
  const [commentAnonymous, setCommentAnonymous] = useState(false);

  const utils = trpc.useUtils();
  const { data: pins, isLoading } = trpc.mapPins.list.useQuery({});

  const createPinMutation = trpc.mapPins.create.useMutation({
    onSuccess: () => {
      utils.mapPins.list.invalidate();
      setShowSubmitDialog(false);
      setFormData({ title: "", description: "", type: "", notes: "" });
      setSelectedLocation(null);
      toast.success("Pin submitted for approval!");
    },
    onError: () => {
      toast.error("Failed to submit pin");
    },
  });

  const addCommentMutation = trpc.mapPins.addComment.useMutation({
    onSuccess: () => {
      utils.mapPins.comments.invalidate();
      setCommentText("");
      setCommentAnonymous(false);
      toast.success("Comment added!");
    },
    onError: () => {
      toast.error("Failed to add comment");
    },
  });

  const { data: pinComments } = trpc.mapPins.comments.useQuery(
    { pinId: selectedPin?.id || 0 },
    { enabled: !!selectedPin }
  );

  // Get user location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation([position.coords.latitude, position.coords.longitude]);
        },
        () => {
          // Keep LA default
          setUserLocation([34.0522, -118.2437]);
        }
      );
    }
  }, []);

  const handleMapClick = (latlng: L.LatLng) => {
    if (isAuthenticated) {
      setSelectedLocation({ lat: latlng.lat, lng: latlng.lng });
      setShowSubmitDialog(true);
    }
  };

  const togglePinType = (type: string) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const handleSubmitPin = () => {
    if (!selectedLocation) {
      toast.error("Please select a location on the map");
      return;
    }

    if (!formData.title || !formData.type) {
      toast.error("Please fill in required fields");
      return;
    }

    createPinMutation.mutate({
      title: formData.title,
      description: formData.description || undefined,
      type: formData.type as any,
      latitude: selectedLocation.lat.toString(),
      longitude: selectedLocation.lng.toString(),
      notes: formData.notes || undefined,
    });
  };

  const centerOnUser = () => {
    if (map) {
      map.flyTo(userLocation, 15);
    }
  };

  const handleSearch = async () => {
    if (!map || !searchQuery.trim()) return;

    setIsSearching(true);
    try {
      // Use Nominatim (OpenStreetMap's geocoding service) - completely free
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          searchQuery + ", Los Angeles, CA"
        )}&limit=1`
      );
      const results = await response.json();

      if (results && results.length > 0) {
        const lat = parseFloat(results[0].lat);
        const lon = parseFloat(results[0].lon);
        map.flyTo([lat, lon], 16);

        // Remove existing temp marker if any
        if (tempMarkerRef.current) {
          tempMarkerRef.current.remove();
        }

        // Add temporary blue marker
        const blueIcon = createCustomIcon("#3b82f6");
        const tempMarker = L.marker([lat, lon], { icon: blueIcon }).addTo(map);
        tempMarkerRef.current = tempMarker;

        // Remove after 5 seconds
        setTimeout(() => {
          if (tempMarkerRef.current) {
            tempMarkerRef.current.remove();
            tempMarkerRef.current = null;
          }
        }, 5000);

        toast.success(`Found: ${results[0].display_name}`);
      } else {
        toast.error("Location not found. Try a different search.");
      }
    } catch (error) {
      console.error("Geocoding error:", error);
      toast.error("Failed to search location");
    } finally {
      setIsSearching(false);
    }
  };

  // Filter pins by selected types
  const filteredPins = selectedTypes.length > 0
    ? pins?.filter((pin) => selectedTypes.includes(pin.type))
    : pins;

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center">
          <MapPinIcon className="mx-auto mb-4 h-12 w-12 animate-pulse text-primary" />
          <p className="text-muted-foreground">Loading map...</p>
        </div>
      </div>
    );
  }

  const handlePinClickFromFeed = (pinId: number, lat: number, lng: number) => {
    if (map) {
      map.flyTo([lat, lng], 16, { duration: 1 });
    }
    // Find and select the pin
    const pin = pins?.find((p) => p.id === pinId);
    if (pin) {
      setSelectedPin(pin);
      setShowCommentsDialog(true);
    }
  };

  return (
    <div className="flex h-screen flex-col bg-background overflow-hidden">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container flex items-center justify-between py-3">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-lg font-bold text-card-foreground">Community Map</h1>
              <p className="text-xs text-muted-foreground">
                {pins?.length || 0} locations • {selectedTypes.length > 0 ? `${selectedTypes.length} filters active` : "All types"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={centerOnUser}>
              <Navigation className="h-4 w-4" />
            </Button>
            {isAuthenticated ? (
              <Button
                size="sm"
                className="gap-2"
                onClick={() => {
                  setShowSubmitDialog(true);
                  setSelectedLocation(null);
                }}
              >
                <Plus className="h-4 w-4" />
                Add Pin
              </Button>
            ) : (
              <Button asChild size="sm">
                <a href={getLoginUrl()}>Sign In</a>
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Search Bar */}
      <div className="border-b border-border bg-card/50 px-4 py-3">
        <div className="container">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search address or place in LA (e.g., 'Union Station', '123 Main St')..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="pl-9 pr-20"
              />
              <Button
                size="sm"
                onClick={handleSearch}
                disabled={isSearching || !searchQuery.trim()}
                className="absolute right-1 top-1/2 -translate-y-1/2"
              >
                {isSearching ? "Searching..." : "Search"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="border-b border-border bg-card/50 px-4 py-3">
        <div className="container">
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            {PIN_TYPES.map((type) => {
              const Icon = type.icon;
              const isSelected = selectedTypes.includes(type.value);
              return (
                <Button
                  key={type.value}
                  variant={isSelected ? "default" : "outline"}
                  size="sm"
                  onClick={() => togglePinType(type.value)}
                  className="gap-2 whitespace-nowrap"
                  style={isSelected ? { backgroundColor: type.color, borderColor: type.color } : {}}
                >
                  <Icon className="h-3 w-3" />
                  {type.label}
                </Button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content: Map + Live Feed */}
      <div className="flex flex-1 overflow-hidden">
        {/* Map */}
        <div className="relative flex-1">
        <LeafletMap
          center={userLocation}
          zoom={13}
          onMapReady={setMap}
          onClick={handleMapClick}
          className="h-full w-full"
        >
          {/* Render filtered pins as markers */}
          {filteredPins?.map((pin) => {
            const pinType = PIN_TYPES.find((t) => t.value === pin.type);
            if (!pinType) return null;

            const icon = createCustomIcon(
              pinType.color,
              pin.commentCount && pin.commentCount > 0 ? String(pin.commentCount) : undefined
            );

            return (
              <Marker
                key={pin.id}
                position={[parseFloat(pin.latitude), parseFloat(pin.longitude)]}
                icon={icon}
                eventHandlers={{
                  click: () => {
                    setSelectedPin(pin);
                    setShowCommentsDialog(true);
                  },
                }}
              >
                <Popup>
                  <div className="text-sm">
                    <strong>{pin.title}</strong>
                    {pin.description && <p className="mt-1 text-xs">{pin.description}</p>}
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </LeafletMap>

        {/* Legend */}
        <Card className="absolute bottom-4 left-4 max-w-xs">
          <CardContent className="p-4">
            <h3 className="mb-2 text-sm font-semibold">Legend</h3>
            <div className="space-y-1 text-xs">
              {PIN_TYPES.slice(0, 5).map((type) => {
                const Icon = type.icon;
                return (
                  <div key={type.value} className="flex items-center gap-2">
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: type.color }}
                    />
                    <span className="text-muted-foreground">{type.label}</span>
                  </div>
                );
              })}
            </div>
            {isAuthenticated && (
              <p className="mt-3 text-xs text-muted-foreground">
                Click anywhere on the map to add a pin
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Live Feed Sidebar */}
      <div className="w-full md:w-[500px] lg:w-[600px] overflow-y-auto border-l border-border bg-background">
        <MapLiveFeed onPinClick={handlePinClickFromFeed} />
      </div>
    </div>

      {/* Submit Pin Dialog */}
      <Dialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Community Pin</DialogTitle>
            <DialogDescription>
              Share a location with the community. Pins are reviewed before appearing on the map.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="pin-title">Title *</Label>
              <Input
                id="pin-title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Safe parking spot, Free water fountain"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pin-type">Type *</Label>
              <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                <SelectTrigger id="pin-type">
                  <SelectValue placeholder="Select pin type" />
                </SelectTrigger>
                <SelectContent>
                  {PIN_TYPES.map((type) => {
                    const Icon = type.icon;
                    return (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          {type.label}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="pin-description">Description</Label>
              <Textarea
                id="pin-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of this location"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pin-notes">Notes</Label>
              <Textarea
                id="pin-notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Any additional info (hours, access requirements, etc.)"
                rows={2}
              />
            </div>

            {selectedLocation && (
              <p className="text-xs text-muted-foreground">
                Location: {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
              </p>
            )}

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowSubmitDialog(false)} className="flex-1">
                Cancel
              </Button>
              <Button
                onClick={handleSubmitPin}
                disabled={createPinMutation.isPending || !formData.title || !formData.type}
                className="flex-1"
              >
                Submit for Review
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Pin Comments Dialog */}
      <Dialog open={showCommentsDialog} onOpenChange={setShowCommentsDialog}>
        <DialogContent className="max-h-[80vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedPin?.title}</DialogTitle>
            <DialogDescription>
              {selectedPin && PIN_TYPES.find((t) => t.value === selectedPin.type)?.label}
            </DialogDescription>
          </DialogHeader>

          {selectedPin && (
            <div className="space-y-4">
              {/* Pin Details */}
              <div className="rounded-lg border border-border bg-card/50 p-4">
                {selectedPin.description && (
                  <p className="mb-2 text-sm text-card-foreground">{selectedPin.description}</p>
                )}
                {selectedPin.notes && (
                  <p className="text-xs text-muted-foreground mb-3">
                    <strong>Notes:</strong> {selectedPin.notes}
                  </p>
                )}

                {/* Get Directions Buttons */}
                <div className="flex gap-2 mb-3">
                  <Button
                    variant="default"
                    size="sm"
                    className="flex-1 gap-2"
                    onClick={() => {
                      const url = `https://www.google.com/maps/dir/?api=1&destination=${selectedPin.latitude},${selectedPin.longitude}`;
                      window.open(url, "_blank");
                    }}
                  >
                    <Navigation2 className="h-4 w-4" />
                    Get Directions
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => {
                      const url = `https://www.google.com/maps/search/?api=1&query=${selectedPin.latitude},${selectedPin.longitude}`;
                      window.open(url, "_blank");
                    }}
                  >
                    <ExternalLink className="h-4 w-4" />
                    Open in Maps
                  </Button>
                </div>

                <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                  {selectedPin.submitter?.avatarUrl && (
                    <img
                      src={selectedPin.submitter.avatarUrl}
                      alt="Submitter"
                      className="h-5 w-5 rounded-full object-cover"
                    />
                  )}
                  <span>
                    Submitted by {selectedPin.submitter?.displayName || "Community Member"}
                  </span>
                  <span>•</span>
                  <span>{new Date(selectedPin.createdAt).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Comments Section */}
              <div>
                <h3 className="mb-3 text-sm font-semibold text-card-foreground">
                  Community Updates ({pinComments?.length || 0})
                </h3>

                {/* Comment Form */}
                {isAuthenticated ? (
                  <div className="mb-4 space-y-2 rounded-lg border border-border bg-card/30 p-3">
                    <Textarea
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="Share an update about this location..."
                      rows={2}
                      className="text-sm"
                    />
                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-2 text-xs text-muted-foreground">
                        <input
                          type="checkbox"
                          checked={commentAnonymous}
                          onChange={(e) => setCommentAnonymous(e.target.checked)}
                          className="rounded"
                        />
                        Post anonymously
                      </label>
                      <Button
                        size="sm"
                        onClick={() => {
                          if (!commentText.trim()) {
                            toast.error("Please enter a comment");
                            return;
                          }
                          addCommentMutation.mutate({
                            pinId: selectedPin.id,
                            content: commentText,
                            isAnonymous: commentAnonymous,
                          });
                        }}
                        disabled={addCommentMutation.isPending || !commentText.trim()}
                      >
                        Post Update
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="mb-4 rounded-lg border border-border bg-card/30 p-4 text-center">
                    <p className="mb-2 text-sm text-muted-foreground">
                      Sign in to share updates about this location
                    </p>
                    <Button asChild size="sm">
                      <a href={getLoginUrl()}>Sign In</a>
                    </Button>
                  </div>
                )}

                {/* Comments List */}
                <div className="space-y-3">
                  {pinComments && pinComments.length > 0 ? (
                    pinComments.map((comment) => (
                      <div
                        key={comment.id}
                        className="rounded-lg border border-border bg-card/20 p-3"
                      >
                        <div className="mb-2 flex items-center gap-2">
                          {comment.author?.avatarUrl && !comment.isAnonymous && (
                            <img
                              src={comment.author.avatarUrl}
                              alt="Avatar"
                              className="h-6 w-6 rounded-full object-cover"
                            />
                          )}
                          <span className="text-xs font-medium text-card-foreground">
                            {comment.isAnonymous
                              ? "Anonymous"
                              : comment.author?.displayName || "Community Member"}
                          </span>
                          <span className="text-xs text-muted-foreground">•</span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(comment.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm text-card-foreground">{comment.content}</p>
                      </div>
                    ))
                  ) : (
                    <p className="py-8 text-center text-sm text-muted-foreground">
                      No updates yet. Be the first to share info about this location!
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
