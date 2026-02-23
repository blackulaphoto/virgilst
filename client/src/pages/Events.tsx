import { useState } from "react";
import { trpc } from "../lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Calendar, MapPin, Clock, Users, Phone, Globe, Tag, DollarSign, Repeat, Star, ExternalLink } from "lucide-react";
import PublicLayout from "@/components/PublicLayout";
import SectionBlock from "@/components/SectionBlock";
import { getDisplayDomain, getFaviconUrl, normalizeExternalUrl } from "@/lib/externalMedia";

type JsonArray = string[];

function parseJsonArray(input: string | null): JsonArray {
  if (!input) return [];
  try {
    const parsed = JSON.parse(input);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

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
      resource_fair: "bg-primary/10 text-primary border-primary/30",
      workshop: "bg-accent/20 text-accent-foreground border-accent/40",
      support_group: "bg-secondary text-secondary-foreground border-border",
      community_event: "bg-[var(--cta)]/10 text-[var(--cta)] border-[var(--cta)]/35",
    };
    return colors[type] || "bg-secondary text-secondary-foreground border-border";
  };

  return (
    <PublicLayout
      title="Community Events"
      subtitle="Find free resource fairs, workshops, and support events across Los Angeles County."
    >
      <SectionBlock>
        <div className="mb-6 space-y-4">
          <Input
            placeholder="Search events by name, location, or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />

          <div className="flex flex-wrap gap-2">
            {eventTypes.map((type) => (
              <Button
                key={type.value}
                variant={selectedType === type.value ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedType(selectedType === type.value ? undefined : type.value)}
              >
                {type.label}
              </Button>
            ))}

            {categories.map((cat) => (
              <Button
                key={cat.value}
                variant={selectedCategory === cat.value ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(selectedCategory === cat.value ? undefined : cat.value)}
              >
                {cat.label}
              </Button>
            ))}

            <Button
              variant={showRecurringOnly ? "default" : "outline"}
              size="sm"
              onClick={() => setShowRecurringOnly(!showRecurringOnly)}
            >
              <Repeat className="mr-1 h-4 w-4" />
              Recurring
            </Button>

            <Button
              variant={showFeaturedOnly ? "default" : "outline"}
              size="sm"
              onClick={() => setShowFeaturedOnly(!showFeaturedOnly)}
            >
              <Star className="mr-1 h-4 w-4" />
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
              >
                Clear Filters
              </Button>
            )}
          </div>
        </div>

        {!isLoading && (
          <div className="mb-4 text-sm text-muted-foreground">
            {filteredEvents?.length || 0} event{filteredEvents?.length !== 1 ? "s" : ""} found
          </div>
        )}

        {isLoading ? (
          <div className="py-12 text-center text-muted-foreground">Loading events...</div>
        ) : filteredEvents && filteredEvents.length > 0 ? (
          <div className="grid grid-cols-1 gap-4">
            {filteredEvents.map((event) => {
              const services = parseJsonArray(event.servicesOffered);
              const tags = parseJsonArray(event.tags);
              const onlineUrl = normalizeExternalUrl(event.onlineUrl);
              const onlineDomain = getDisplayDomain(event.onlineUrl);
              const onlineFavicon = getFaviconUrl(event.onlineUrl);
              const websiteUrl = normalizeExternalUrl(event.website);
              const websiteDomain = getDisplayDomain(event.website);
              const websiteFavicon = getFaviconUrl(event.website);
              const registrationUrl = normalizeExternalUrl(event.registrationUrl);
              const registrationDomain = getDisplayDomain(event.registrationUrl);
              const registrationFavicon = getFaviconUrl(event.registrationUrl);

              return (
                <Card
                  key={event.id}
                  className={`surface-card transition-all ${
                    event.isFeatured ? "ring-2 ring-[var(--cta)]/40" : ""
                  }`}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="mb-2 flex items-center gap-2">
                          {event.isFeatured && <Star className="h-4 w-4 fill-[var(--cta)] text-[var(--cta)]" />}
                          <Badge className={getEventTypeColor(event.eventType)}>
                            {event.eventType.replace(/_/g, " ").toUpperCase()}
                          </Badge>
                          {event.category && <Badge variant="outline">{event.category}</Badge>}
                        </div>
                        <CardTitle className="mb-1 text-2xl">{event.title}</CardTitle>
                        {event.description && (
                          <CardDescription className="mt-2 text-base text-muted-foreground">
                            {event.description}
                          </CardDescription>
                        )}
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <div className="flex items-start gap-2 text-foreground">
                      {event.isRecurring ? (
                        <Repeat className="mt-0.5 h-5 w-5 shrink-0 text-accent-foreground" />
                      ) : (
                        <Calendar className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                      )}
                      <div>
                        {event.isRecurring ? (
                          <div>
                            <div className="font-medium text-accent-foreground">{getRecurrenceText(event)}</div>
                            {event.startTime && (
                              <div className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                                <Clock className="h-4 w-4" />
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
                              <div className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                                <Clock className="h-4 w-4" />
                                {event.startTime}
                                {event.endTime && ` - ${event.endTime}`}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {(event.venueName || event.address) && (
                      <div className="flex items-start gap-2 text-foreground">
                        <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                        <div>
                          {event.venueName && <div className="font-medium">{event.venueName}</div>}
                          {event.address && (
                            <div className="text-sm text-muted-foreground">
                              {event.address}
                              {event.city && `, ${event.city}`}
                              {event.zipCode && ` ${event.zipCode}`}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {event.isOnline === 1 && onlineUrl && (
                      <div className="flex items-start gap-2 text-foreground">
                        <Globe className="mt-0.5 h-5 w-5 shrink-0 text-accent-foreground" />
                        <div className="flex items-center gap-2">
                          {onlineFavicon ? (
                            <img
                              src={onlineFavicon}
                              alt=""
                              className="h-5 w-5 rounded-sm border border-border object-cover"
                              loading="lazy"
                              decoding="async"
                            />
                          ) : null}
                          <a
                            href={onlineUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-accent-foreground hover:underline"
                          >
                            {onlineDomain ? `Join online (${onlineDomain})` : "Join online"}
                          </a>
                        </div>
                      </div>
                    )}

                    {websiteUrl && (
                      <div className="flex items-start gap-2 text-foreground">
                        <ExternalLink className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                        <div className="flex items-center gap-2">
                          {websiteFavicon ? (
                            <img
                              src={websiteFavicon}
                              alt=""
                              className="h-5 w-5 rounded-sm border border-border object-cover"
                              loading="lazy"
                              decoding="async"
                            />
                          ) : null}
                          <a href={websiteUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                            {websiteDomain ? `Event website (${websiteDomain})` : "Event website"}
                          </a>
                        </div>
                      </div>
                    )}

                    {registrationUrl && (
                      <div className="flex items-start gap-2 text-foreground">
                        <ExternalLink className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                        <div className="flex items-center gap-2">
                          {registrationFavicon ? (
                            <img
                              src={registrationFavicon}
                              alt=""
                              className="h-5 w-5 rounded-sm border border-border object-cover"
                              loading="lazy"
                              decoding="async"
                            />
                          ) : null}
                          <a href={registrationUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                            {registrationDomain ? `Register (${registrationDomain})` : "Register"}
                          </a>
                        </div>
                      </div>
                    )}

                    {event.phone && (
                      <div className="flex items-center gap-2 text-foreground">
                        <Phone className="h-5 w-5 shrink-0 text-primary" />
                        <a href={`tel:${event.phone}`} className="hover:text-primary">
                          {event.phone}
                        </a>
                      </div>
                    )}

                    {services.length > 0 && (
                      <div className="border-t border-border pt-4">
                        <div className="mb-2 flex items-start gap-2">
                          <Users className="h-5 w-5 shrink-0 text-primary" />
                          <div className="font-medium text-foreground">Services offered</div>
                        </div>
                        <div className="ml-7 flex flex-wrap gap-2">
                          {services.map((service, idx) => (
                            <Badge key={idx} variant="outline" className="bg-primary/5 text-primary">
                              {service.replace(/_/g, " ")}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {tags.length > 0 && (
                      <div className="flex items-start gap-2">
                        <Tag className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
                        <div className="flex flex-wrap gap-2">
                          {tags.map((tag, idx) => (
                            <Badge key={idx} variant="outline">
                              {tag.replace(/_/g, " ")}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-4 border-t border-border pt-4 text-sm">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-primary" />
                        <span className="text-muted-foreground">Cost:</span>
                        <span className="font-medium text-foreground">{event.cost || "Free"}</span>
                      </div>
                      {event.eligibility && (
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">Eligibility:</span>
                          <span className="text-foreground">{event.eligibility}</span>
                        </div>
                      )}
                    </div>

                    {event.organizerName && (
                      <div className="text-sm text-muted-foreground">Organized by {event.organizerName}</div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="py-12 text-center">
            <p className="text-lg text-muted-foreground">No events found</p>
            <p className="mt-2 text-sm text-muted-foreground">Try adjusting your search or filters.</p>
          </div>
        )}
      </SectionBlock>
    </PublicLayout>
  );
}
