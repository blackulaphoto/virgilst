import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Clock, Calendar, Users, Video, Phone, Search, Filter } from "lucide-react";
import { Link } from "wouter";

export default function Meetings() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string | undefined>();
  const [selectedDay, setSelectedDay] = useState<string | undefined>();
  const [selectedMode, setSelectedMode] = useState<string | undefined>();
  const [selectedCity, setSelectedCity] = useState<string | undefined>();

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

  // Group meetings by day
  const groupedMeetings = filteredMeetings?.reduce((acc, meeting) => {
    if (!acc[meeting.dayOfWeek]) {
      acc[meeting.dayOfWeek] = [];
    }
    acc[meeting.dayOfWeek].push(meeting);
    return acc;
  }, {} as Record<string, typeof filteredMeetings>);

  const dayOrder = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

  const typeLabels: Record<string, { label: string; color: string; icon: string }> = {
    aa: { label: "AA", color: "bg-blue-500", icon: "🙏" },
    na: { label: "NA", color: "bg-green-500", icon: "💚" },
    cma: { label: "CMA", color: "bg-purple-500", icon: "💎" },
    smart: { label: "SMART", color: "bg-orange-500", icon: "🧠" },
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

  const tagLabels: Record<string, { label: string; color: string }> = {
    women_only: { label: "Women Only", color: "bg-pink-600" },
    men_only: { label: "Men Only", color: "bg-blue-600" },
    lgbtq_friendly: { label: "LGBTQ+", color: "bg-rainbow-600" },
    wheelchair_accessible: { label: "Wheelchair ♿", color: "bg-cyan-600" },
    newcomer_friendly: { label: "Newcomer", color: "bg-green-600" },
    young_people: { label: "Young People", color: "bg-purple-600" },
    speaker: { label: "Speaker", color: "bg-amber-600" },
    candlelight: { label: "Candlelight", color: "bg-yellow-600" },
    dual_diagnosis: { label: "Dual Diagnosis", color: "bg-red-600" },
  };

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Header */}
      <div className="border-b border-zinc-800 bg-zinc-900/50">
        <div className="container mx-auto py-6">
          <Link href="/">
            <Button variant="ghost" className="mb-4 text-amber-400 hover:text-amber-300">
              ← Back to Home
            </Button>
          </Link>
          <div>
            <h1 className="text-4xl font-black text-white mb-2">
              RECOVERY <span className="text-amber-400">MEETINGS</span>
            </h1>
            <p className="text-zinc-400 text-lg">
              Find AA, NA, CMA, and SMART Recovery meetings in San Fernando Valley
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto py-8">
        {/* Search and Filters */}
        <Card className="bg-zinc-900 border-zinc-800 mb-8">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Search & Filter Meetings
            </CardTitle>
            <CardDescription>
              Find meetings by type, day, location, or format
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-5 w-5 text-zinc-500" />
              <Input
                placeholder="Search by name, venue, or city..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-zinc-800 border-zinc-700 text-white"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Select value={selectedType} onValueChange={(value) => setSelectedType(value === "all" ? undefined : value)}>
                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700">
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="aa">AA (Alcoholics Anonymous)</SelectItem>
                  <SelectItem value="na">NA (Narcotics Anonymous)</SelectItem>
                  <SelectItem value="cma">CMA (Crystal Meth Anonymous)</SelectItem>
                  <SelectItem value="smart">SMART Recovery</SelectItem>
                </SelectContent>
              </Select>

              <Select value={selectedDay} onValueChange={(value) => setSelectedDay(value === "all" ? undefined : value)}>
                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                  <SelectValue placeholder="Any Day" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700">
                  <SelectItem value="all">Any Day</SelectItem>
                  {dayOrder.map(day => (
                    <SelectItem key={day} value={day}>{dayLabels[day]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedMode} onValueChange={(value) => setSelectedMode(value === "all" ? undefined : value)}>
                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                  <SelectValue placeholder="Any Format" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700">
                  <SelectItem value="all">Any Format</SelectItem>
                  <SelectItem value="in_person">In-Person</SelectItem>
                  <SelectItem value="online">Online/Virtual</SelectItem>
                  <SelectItem value="hybrid">Hybrid</SelectItem>
                </SelectContent>
              </Select>

              <Select value={selectedCity} onValueChange={(value) => setSelectedCity(value === "all" ? undefined : value)}>
                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                  <SelectValue placeholder="All Cities" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700">
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
                onClick={() => {
                  setSelectedType(undefined);
                  setSelectedDay(undefined);
                  setSelectedMode(undefined);
                  setSelectedCity(undefined);
                  setSearchQuery("");
                }}
                className="text-amber-400 border-amber-400 hover:bg-amber-400 hover:text-black"
              >
                Clear All Filters
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Results */}
        {isLoading ? (
          <div className="text-center text-zinc-400 py-12">
            <p className="text-lg">Loading meetings...</p>
          </div>
        ) : filteredMeetings && filteredMeetings.length > 0 ? (
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">
                Found {filteredMeetings.length} meeting{filteredMeetings.length !== 1 ? "s" : ""}
              </h2>
            </div>

            {/* Group by day */}
            {dayOrder.map(day => {
              const dayMeetings = groupedMeetings?.[day];
              if (!dayMeetings || dayMeetings.length === 0) return null;

              return (
                <div key={day} className="space-y-4">
                  <h3 className="text-xl font-bold text-amber-400 uppercase flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    {dayLabels[day]} ({dayMeetings.length})
                  </h3>

                  <div className="grid gap-4">
                    {dayMeetings.map((meeting) => {
                      const ModeIcon = modeLabels[meeting.meetingMode]?.icon || MapPin;
                      const tags = parseTags(meeting.tags);

                      return (
                        <Card key={meeting.id} className="bg-zinc-900 border-zinc-800 hover:border-amber-400/50 transition-colors">
                          <CardHeader>
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="text-2xl">{typeLabels[meeting.type]?.icon}</span>
                                  <Badge className={`${typeLabels[meeting.type]?.color} text-white`}>
                                    {typeLabels[meeting.type]?.label}
                                  </Badge>
                                  <Badge variant="outline" className="text-white border-zinc-700">
                                    <ModeIcon className="h-3 w-3 mr-1" />
                                    {modeLabels[meeting.meetingMode]?.label}
                                  </Badge>
                                </div>
                                <CardTitle className="text-white text-xl mb-1">
                                  {meeting.name}
                                </CardTitle>
                                <div className="flex flex-wrap gap-2 mt-2">
                                  {tags.map(tag => (
                                    <Badge
                                      key={tag}
                                      className={`${tagLabels[tag]?.color || "bg-zinc-700"} text-white text-xs`}
                                    >
                                      {tagLabels[tag]?.label || tag}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-2xl font-bold text-amber-400">
                                  {meeting.time}
                                </div>
                                <div className="text-sm text-zinc-400 capitalize">
                                  {meeting.format.replace("_", " ")}
                                </div>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            {meeting.venueName && (
                              <div className="flex items-start gap-2 text-zinc-300">
                                <MapPin className="h-4 w-4 mt-0.5 text-zinc-500" />
                                <div>
                                  <div className="font-medium">{meeting.venueName}</div>
                                  {meeting.address && (
                                    <div className="text-sm text-zinc-400">
                                      {meeting.address}, {meeting.city}
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                            {!meeting.venueName && meeting.city && (
                              <div className="flex items-center gap-2 text-zinc-300">
                                <MapPin className="h-4 w-4 text-zinc-500" />
                                <span>{meeting.city}</span>
                              </div>
                            )}

                            {meeting.zoomId && (
                              <div className="flex items-start gap-2 text-zinc-300">
                                <Video className="h-4 w-4 mt-0.5 text-zinc-500" />
                                <div>
                                  <div className="text-sm">Zoom ID: <span className="font-mono">{meeting.zoomId}</span></div>
                                  {meeting.zoomPassword && (
                                    <div className="text-sm text-zinc-400">
                                      Password: <span className="font-mono">{meeting.zoomPassword}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                            {meeting.notes && (
                              <div className="text-sm text-zinc-400 border-t border-zinc-800 pt-3 mt-3">
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
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="py-12 text-center">
              <p className="text-zinc-400 text-lg mb-4">No meetings found matching your criteria.</p>
              <Button
                onClick={() => {
                  setSelectedType(undefined);
                  setSelectedDay(undefined);
                  setSelectedMode(undefined);
                  setSelectedCity(undefined);
                  setSearchQuery("");
                }}
                className="bg-amber-500 hover:bg-amber-600 text-black font-bold"
              >
                Clear Filters
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
