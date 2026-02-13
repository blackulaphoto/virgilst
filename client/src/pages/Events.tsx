import { useState } from "react";
import { trpc } from "../lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Calendar, MapPin, Clock, Users, Phone, Globe, Tag, DollarSign, Repeat, Star } from "lucide-react";

export default function Events() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string | undefined>();
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>();
  const [showRecurringOnly, setShowRecurringOnly] = useState(false);
  const [showFeaturedOnly, setShowFeaturedOnly] = useState(false);

  const { data: events, isLoading } = trpc.events.list.useQuery({
    eventType: selectedType,
    category: selectedCategory,
    isRecurring: showRecurringOnly || undefined,
    isFeatured: showFeaturedOnly || undefined,
  });

  const filteredEvents = events?.filter((event) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      event.title?.toLowerCase().includes(query) ||
      event.description?.toLowerCase().includes(query) ||
      event.venueName?.toLowerCase().includes(query) ||
      event.city?.toLowerCase().includes(query)
    );
  });

  const eventTypes = [
    { value: "resource_fair", label: "Resource Fair" },
    { value: "workshop", label: "Workshop" },
    { value: "support_group", label: "Support Group" },
    { value: "community_event", label: "Community Event" },
  ];

  const categories = [
    { value: "housing", label: "Housing" },
    { value: "health", label: "Health" },
    { value: "legal", label: "Legal" },
    { value: "benefits", label: "Benefits" },
    { value: "general", label: "General" },
  ];

  const getRecurrenceText = (event: any) => {
    if (!event.isRecurring) return null;

    try {
      const details = event.recurrenceDetails ? JSON.parse(event.recurrenceDetails) : {};
      if (details.weekOfMonth === "last" && details.dayOfWeek) {
        return `Last ${details.dayOfWeek.charAt(0).toUpperCase() + details.dayOfWeek.slice(1)} of every month`;
      }
      return `Recurring ${event.recurrencePattern}`;
    } catch {
      return `Recurring ${event.recurrencePattern || "event"}`;
    }
  };

  const getEventTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      resource_fair: "bg-blue-500/20 text-blue-400 border-blue-500/50",
      workshop: "bg-purple-500/20 text-purple-400 border-purple-500/50",
      support_group: "bg-green-500/20 text-green-400 border-green-500/50",
      community_event: "bg-amber-500/20 text-amber-400 border-amber-500/50",
    };
    return colors[type] || "bg-zinc-500/20 text-zinc-400 border-zinc-500/50";
  };

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 text-white">Community Events</h1>
          <p className="text-zinc-400 text-lg">
            Find free resource fairs, workshops, and community events in Los Angeles
          </p>
        </div>

        {/* Search and Filters */}
        <div className="mb-6 space-y-4">
          <Input
            placeholder="Search events by name, location, or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-500"
          />

          <div className="flex flex-wrap gap-2">
            {/* Event Type Filters */}
            <div className="flex flex-wrap gap-2">
              {eventTypes.map((type) => (
                <Button
                  key={type.value}
                  variant={selectedType === type.value ? "default" : "outline"}
                  size="sm"
                  onClick={() =>
                    setSelectedType(selectedType === type.value ? undefined : type.value)
                  }
                  className={
                    selectedType === type.value
                      ? "bg-blue-600 hover:bg-blue-700"
                      : "bg-zinc-900 border-zinc-700 hover:bg-zinc-800"
                  }
                >
                  {type.label}
                </Button>
              ))}
            </div>

            {/* Category Filters */}
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <Button
                  key={cat.value}
                  variant={selectedCategory === cat.value ? "default" : "outline"}
                  size="sm"
                  onClick={() =>
                    setSelectedCategory(selectedCategory === cat.value ? undefined : cat.value)
                  }
                  className={
                    selectedCategory === cat.value
                      ? "bg-green-600 hover:bg-green-700"
                      : "bg-zinc-900 border-zinc-700 hover:bg-zinc-800"
                  }
                >
                  {cat.label}
                </Button>
              ))}
            </div>

            {/* Special Filters */}
            <Button
              variant={showRecurringOnly ? "default" : "outline"}
              size="sm"
              onClick={() => setShowRecurringOnly(!showRecurringOnly)}
              className={
                showRecurringOnly
                  ? "bg-purple-600 hover:bg-purple-700"
                  : "bg-zinc-900 border-zinc-700 hover:bg-zinc-800"
              }
            >
              <Repeat className="w-4 h-4 mr-1" />
              Recurring
            </Button>

            <Button
              variant={showFeaturedOnly ? "default" : "outline"}
              size="sm"
              onClick={() => setShowFeaturedOnly(!showFeaturedOnly)}
              className={
                showFeaturedOnly
                  ? "bg-amber-600 hover:bg-amber-700"
                  : "bg-zinc-900 border-zinc-700 hover:bg-zinc-800"
              }
            >
              <Star className="w-4 h-4 mr-1" />
              Featured
            </Button>

            {(selectedType || selectedCategory || showRecurringOnly || showFeaturedOnly) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedType(undefined);
                  setSelectedCategory(undefined);
                  setShowRecurringOnly(false);
                  setShowFeaturedOnly(false);
                }}
                className="text-zinc-400 hover:text-white"
              >
                Clear Filters
              </Button>
            )}
          </div>
        </div>

        {/* Results Count */}
        {!isLoading && (
          <div className="mb-4 text-zinc-400">
            {filteredEvents?.length || 0} event{filteredEvents?.length !== 1 ? "s" : ""} found
          </div>
        )}

        {/* Events List */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="text-zinc-400">Loading events...</div>
          </div>
        ) : filteredEvents && filteredEvents.length > 0 ? (
          <div className="grid grid-cols-1 gap-4">
            {filteredEvents.map((event) => {
              const services = event.servicesOffered
                ? JSON.parse(event.servicesOffered)
                : [];
              const tags = event.tags ? JSON.parse(event.tags) : [];

              return (
                <Card
                  key={event.id}
                  className={`bg-zinc-900 border-zinc-800 hover:border-zinc-700 transition-colors ${
                    event.isFeatured ? "ring-2 ring-amber-500/50" : ""
                  }`}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {event.isFeatured && <Star className="w-4 h-4 text-amber-400 fill-amber-400" />}
                          <Badge className={getEventTypeColor(event.eventType)}>
                            {event.eventType.replace(/_/g, " ").toUpperCase()}
                          </Badge>
                          {event.category && (
                            <Badge variant="outline" className="border-zinc-700 text-zinc-400">
                              {event.category}
                            </Badge>
                          )}
                        </div>
                        <CardTitle className="text-2xl mb-1">{event.title}</CardTitle>
                        {event.description && (
                          <CardDescription className="text-zinc-400 text-base mt-2">
                            {event.description}
                          </CardDescription>
                        )}
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Schedule */}
                    <div className="flex items-start gap-2 text-zinc-300">
                      {event.isRecurring ? (
                        <Repeat className="w-5 h-5 mt-0.5 text-purple-400 flex-shrink-0" />
                      ) : (
                        <Calendar className="w-5 h-5 mt-0.5 text-blue-400 flex-shrink-0" />
                      )}
                      <div>
                        {event.isRecurring ? (
                          <div>
                            <div className="font-medium text-purple-400">
                              {getRecurrenceText(event)}
                            </div>
                            {event.startTime && (
                              <div className="text-sm text-zinc-400 flex items-center gap-1 mt-1">
                                <Clock className="w-4 h-4" />
                                {event.startTime}
                                {event.endTime && ` - ${event.endTime}`}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div>
                            {event.startDate && (
                              <div>
                                {new Date(event.startDate * 1000).toLocaleDateString("en-US", {
                                  weekday: "long",
                                  year: "numeric",
                                  month: "long",
                                  day: "numeric",
                                })}
                              </div>
                            )}
                            {event.startTime && (
                              <div className="text-sm text-zinc-400 flex items-center gap-1 mt-1">
                                <Clock className="w-4 h-4" />
                                {event.startTime}
                                {event.endTime && ` - ${event.endTime}`}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Location */}
                    {(event.venueName || event.address) && (
                      <div className="flex items-start gap-2 text-zinc-300">
                        <MapPin className="w-5 h-5 mt-0.5 text-green-400 flex-shrink-0" />
                        <div>
                          {event.venueName && <div className="font-medium">{event.venueName}</div>}
                          {event.address && (
                            <div className="text-sm text-zinc-400">
                              {event.address}
                              {event.city && `, ${event.city}`}
                              {event.zipCode && ` ${event.zipCode}`}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Online Event */}
                    {event.isOnline === 1 && event.onlineUrl && (
                      <div className="flex items-start gap-2 text-zinc-300">
                        <Globe className="w-5 h-5 mt-0.5 text-cyan-400 flex-shrink-0" />
                        <a
                          href={event.onlineUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-cyan-400 hover:underline"
                        >
                          Join Online
                        </a>
                      </div>
                    )}

                    {/* Contact */}
                    {event.phone && (
                      <div className="flex items-center gap-2 text-zinc-300">
                        <Phone className="w-5 h-5 text-amber-400 flex-shrink-0" />
                        <a href={`tel:${event.phone}`} className="hover:text-white">
                          {event.phone}
                        </a>
                      </div>
                    )}

                    {/* Services Offered */}
                    {services.length > 0 && (
                      <div className="border-t border-zinc-800 pt-4">
                        <div className="flex items-start gap-2 mb-2">
                          <Users className="w-5 h-5 text-blue-400 flex-shrink-0" />
                          <div className="font-medium text-blue-400">Services Offered:</div>
                        </div>
                        <div className="flex flex-wrap gap-2 ml-7">
                          {services.map((service: string, idx: number) => (
                            <Badge
                              key={idx}
                              variant="outline"
                              className="bg-blue-500/10 border-blue-500/30 text-blue-400"
                            >
                              {service.replace(/_/g, " ")}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Tags */}
                    {tags.length > 0 && (
                      <div className="flex items-start gap-2">
                        <Tag className="w-5 h-5 text-zinc-500 flex-shrink-0 mt-0.5" />
                        <div className="flex flex-wrap gap-2">
                          {tags.map((tag: string, idx: number) => (
                            <Badge
                              key={idx}
                              variant="outline"
                              className="border-zinc-700 text-zinc-400"
                            >
                              {tag.replace(/_/g, " ")}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Cost & Eligibility */}
                    <div className="flex flex-wrap gap-4 text-sm border-t border-zinc-800 pt-4">
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-green-400" />
                        <span className="text-zinc-400">Cost:</span>
                        <span className="font-medium text-green-400">
                          {event.cost || "Free"}
                        </span>
                      </div>
                      {event.eligibility && (
                        <div className="flex items-center gap-2">
                          <span className="text-zinc-400">Eligibility:</span>
                          <span className="text-zinc-300">{event.eligibility}</span>
                        </div>
                      )}
                    </div>

                    {/* Organizer */}
                    {event.organizerName && (
                      <div className="text-sm text-zinc-500">
                        Organized by {event.organizerName}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-zinc-400 text-lg">No events found</p>
            <p className="text-zinc-500 text-sm mt-2">
              Try adjusting your search or filters
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
