import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Calendar, Users, Video, Search, Filter } from "lucide-react";
import { Link, useParams } from "wouter";
import PublicLayout from "@/components/PublicLayout";
import SectionBlock from "@/components/SectionBlock";

export default function Meetings() {
  const { program } = useParams<{ program?: string }>();
  const initialProgram = program && ["aa", "na", "cma", "smart"].includes(program) ? program : undefined;
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string | undefined>(initialProgram);
  const [selectedDay, setSelectedDay] = useState<string | undefined>();
  const [selectedMode, setSelectedMode] = useState<string | undefined>();
  const [selectedCity, setSelectedCity] = useState<string | undefined>();

  useEffect(() => {
    if (initialProgram) setSelectedType(initialProgram);
  }, [initialProgram]);

  const { data: meetings, isLoading } = trpc.meetings.list.useQuery({
    type: selectedType as any,
    dayOfWeek: selectedDay,
    meetingMode: selectedMode as any,
    city: selectedCity,
  });

  const filteredMeetings = meetings?.filter(meeting =>
    searchQuery === "" ||
    meeting.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    meeting.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    meeting.venueName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const groupedMeetings = filteredMeetings?.reduce((acc, meeting) => {
    if (!acc[meeting.dayOfWeek]) acc[meeting.dayOfWeek] = [];
    acc[meeting.dayOfWeek].push(meeting);
    return acc;
  }, {} as Record<string, typeof filteredMeetings>);

  const dayOrder = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

  const typeLabels: Record<string, { label: string; color: string; icon: string }> = {
    aa: { label: "AA", color: "bg-primary", icon: "AA" },
    na: { label: "NA", color: "bg-accent-foreground", icon: "NA" },
    cma: { label: "CMA", color: "bg-[var(--cta)]", icon: "CMA" },
    smart: { label: "SMART", color: "bg-secondary-foreground", icon: "SMART" },
  };

  const modeLabels: Record<string, { label: string; icon: any }> = {
    in_person: { label: "In-Person", icon: MapPin },
    online: { label: "Online", icon: Video },
    hybrid: { label: "Hybrid", icon: Users },
  };

  const dayLabels: Record<string, string> = {
    sunday: "Sunday",
    monday: "Monday",
    tuesday: "Tuesday",
    wednesday: "Wednesday",
    thursday: "Thursday",
    friday: "Friday",
    saturday: "Saturday",
  };

  const parseTags = (tagsJson: string | null): string[] => {
    if (!tagsJson) return [];
    try {
      return JSON.parse(tagsJson);
    } catch {
      return [];
    }
  };

  return (
    <PublicLayout
      title="Recovery Meetings"
      subtitle="Find AA, NA, CMA, and SMART Recovery meetings by day, city, and format."
      actions={
        <Link href="/">
          <Button variant="outline" size="sm">Back home</Button>
        </Link>
      }
    >
      <SectionBlock className="pt-8">
        <Card className="surface-card mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Search and filter meetings
            </CardTitle>
            <CardDescription>Filter by type, day, location, and format.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search by name, venue, or city..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
              <Select value={selectedType} onValueChange={value => setSelectedType(value === "all" ? undefined : value)}>
                <SelectTrigger><SelectValue placeholder="All types" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="aa">AA</SelectItem>
                  <SelectItem value="na">NA</SelectItem>
                  <SelectItem value="cma">CMA</SelectItem>
                  <SelectItem value="smart">SMART</SelectItem>
                </SelectContent>
              </Select>
              <Select value={selectedDay} onValueChange={value => setSelectedDay(value === "all" ? undefined : value)}>
                <SelectTrigger><SelectValue placeholder="Any day" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any Day</SelectItem>
                  {dayOrder.map(day => <SelectItem key={day} value={day}>{dayLabels[day]}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={selectedMode} onValueChange={value => setSelectedMode(value === "all" ? undefined : value)}>
                <SelectTrigger><SelectValue placeholder="Any format" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any Format</SelectItem>
                  <SelectItem value="in_person">In-Person</SelectItem>
                  <SelectItem value="online">Online</SelectItem>
                  <SelectItem value="hybrid">Hybrid</SelectItem>
                </SelectContent>
              </Select>
              <Select value={selectedCity} onValueChange={value => setSelectedCity(value === "all" ? undefined : value)}>
                <SelectTrigger><SelectValue placeholder="All cities" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Cities</SelectItem>
                  <SelectItem value="North Hollywood">North Hollywood</SelectItem>
                  <SelectItem value="Sherman Oaks">Sherman Oaks</SelectItem>
                  <SelectItem value="Canoga Park">Canoga Park</SelectItem>
                  <SelectItem value="Burbank">Burbank</SelectItem>
                  <SelectItem value="Van Nuys">Van Nuys</SelectItem>
                  <SelectItem value="Northridge">Northridge</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {(selectedType || selectedDay || selectedMode || selectedCity) && (
              <Button
                variant="outline"
                className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                onClick={() => {
                  setSelectedType(undefined);
                  setSelectedDay(undefined);
                  setSelectedMode(undefined);
                  setSelectedCity(undefined);
                  setSearchQuery("");
                }}
              >
                Clear Filters
              </Button>
            )}
          </CardContent>
        </Card>

        {isLoading ? (
          <div className="py-12 text-center text-muted-foreground">Loading meetings...</div>
        ) : filteredMeetings && filteredMeetings.length > 0 ? (
          <div className="space-y-8">
            <h2 className="text-2xl font-bold text-foreground">
              Found {filteredMeetings.length} meeting{filteredMeetings.length !== 1 ? "s" : ""}
            </h2>
            {dayOrder.map(day => {
              const dayMeetings = groupedMeetings?.[day];
              if (!dayMeetings?.length) return null;

              return (
                <div key={day} className="space-y-4">
                  <h3 className="flex items-center gap-2 text-xl font-bold uppercase text-primary">
                    <Calendar className="h-5 w-5" />
                    {dayLabels[day]} ({dayMeetings.length})
                  </h3>
                  <div className="grid gap-4">
                    {dayMeetings.map(meeting => {
                      const ModeIcon = modeLabels[meeting.meetingMode]?.icon || MapPin;
                      const tags = parseTags(meeting.tags);

                      return (
                        <Card key={meeting.id} className="surface-card">
                          <CardHeader>
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <div className="mb-2 flex items-center gap-2">
                                  <Badge className={`${typeLabels[meeting.type]?.color} text-white`}>
                                    {typeLabels[meeting.type]?.icon}
                                  </Badge>
                                  <Badge variant="outline">
                                    <ModeIcon className="mr-1 h-3 w-3" />
                                    {modeLabels[meeting.meetingMode]?.label}
                                  </Badge>
                                </div>
                                <CardTitle className="mb-2 text-xl">{meeting.name}</CardTitle>
                                <div className="flex flex-wrap gap-2">
                                  {tags.map(tag => (
                                    <Badge key={tag} variant="secondary" className="text-xs">
                                      {tag.replace(/_/g, " ")}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-2xl font-bold text-primary">{meeting.time}</div>
                                <div className="text-sm capitalize text-muted-foreground">
                                  {meeting.format.replace("_", " ")}
                                </div>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            {meeting.venueName && (
                              <div className="flex items-start gap-2 text-foreground">
                                <MapPin className="mt-0.5 h-4 w-4 text-muted-foreground" />
                                <div>
                                  <div className="font-medium">{meeting.venueName}</div>
                                  {meeting.address && (
                                    <div className="text-sm text-muted-foreground">
                                      {meeting.address}, {meeting.city}
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                            {!meeting.venueName && meeting.city && (
                              <div className="flex items-center gap-2 text-foreground">
                                <MapPin className="h-4 w-4 text-muted-foreground" />
                                <span>{meeting.city}</span>
                              </div>
                            )}
                            {meeting.zoomId && (
                              <div className="flex items-start gap-2 text-foreground">
                                <Video className="mt-0.5 h-4 w-4 text-muted-foreground" />
                                <div className="text-sm">
                                  Zoom ID: <span className="font-mono">{meeting.zoomId}</span>
                                  {meeting.zoomPassword && (
                                    <div className="text-muted-foreground">
                                      Password: <span className="font-mono">{meeting.zoomPassword}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                            {meeting.notes && (
                              <div className="mt-3 border-t border-border pt-3 text-sm text-muted-foreground">
                                {meeting.notes}
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <Card className="surface-card">
            <CardContent className="py-12 text-center">
              <p className="mb-4 text-lg text-muted-foreground">No meetings found matching your criteria.</p>
              <Button
                className="bg-[var(--cta)] text-[var(--cta-foreground)] hover:opacity-95"
                onClick={() => {
                  setSelectedType(undefined);
                  setSelectedDay(undefined);
                  setSelectedMode(undefined);
                  setSelectedCity(undefined);
                  setSearchQuery("");
                }}
              >
                Clear Filters
              </Button>
            </CardContent>
          </Card>
        )}
      </SectionBlock>
    </PublicLayout>
  );
}
