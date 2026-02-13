import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapPin, Phone, ExternalLink, DollarSign, Users, CheckCircle2, Building2, Search } from "lucide-react";
import { Link } from "wouter";

export default function Treatment() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState<string | undefined>();
  const [selectedPopulation, setSelectedPopulation] = useState<string | undefined>();
  const [mediCalOnly, setMediCalOnly] = useState(false);
  const [couplesOnly, setCouplesOnly] = useState(false);
  const [selectedTreatmentType, setSelectedTreatmentType] = useState<string | undefined>();

  // Separate queries for sober living and treatment centers
  const { data: soberLivingCenters, isLoading: isLoadingSL } = trpc.treatmentCenters.list.useQuery({
    type: "sober_living",
    city: selectedCity,
    servesPopulation: selectedPopulation as any,
    acceptsMediCal: mediCalOnly || undefined,
    acceptsCouples: couplesOnly || undefined,
  });

  const { data: treatmentCenters, isLoading: isLoadingTC } = trpc.treatmentCenters.list.useQuery({
    type: selectedTreatmentType as any,
    city: selectedCity,
    servesPopulation: selectedPopulation as any,
    acceptsMediCal: mediCalOnly || undefined,
    acceptsCouples: couplesOnly || undefined,
  });

  const filteredSoberLiving = soberLivingCenters?.filter(center =>
    searchQuery === "" ||
    center.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    center.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredTreatmentCenters = treatmentCenters?.filter(center =>
    searchQuery === "" ||
    center.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    center.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const typeLabels: Record<string, string> = {
    sober_living: "Sober Living",
    detox: "Detox",
    residential: "Residential",
    outpatient: "Outpatient",
    iop_php: "IOP/PHP",
    dual_diagnosis: "Dual Diagnosis"
  };

  const populationLabels: Record<string, string> = {
    men: "Men",
    women: "Women",
    coed: "Co-ed",
    lgbtq: "LGBTQ+",
    women_with_children: "Women with Children"
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
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-4xl font-black text-white mb-2">
                TREATMENT <span className="text-amber-400">DIRECTORY</span>
              </h1>
              <p className="text-zinc-400 text-lg">
                Sober living, detox, and treatment centers in California
              </p>
            </div>
            <Link href="/treatment/wizard">
              <Button className="bg-amber-500 hover:bg-amber-600 text-black font-bold">
                🔍 Find Treatment Now
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="container mx-auto py-8">
        <Tabs defaultValue="sober_living" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="sober_living">🏠 Sober Living</TabsTrigger>
            <TabsTrigger value="treatment">🏥 Treatment Centers</TabsTrigger>
            <TabsTrigger value="maps">🗺️ Resource Maps</TabsTrigger>
          </TabsList>

          {/* SOBER LIVING TAB */}
          <TabsContent value="sober_living" className="space-y-6">
            {/* Search and Filters */}
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-white">Search & Filter</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-5 w-5 text-zinc-500" />
                  <Input
                    placeholder="Search by name or description..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-zinc-800 border-zinc-700 text-white"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-zinc-400 mb-2 block">City</label>
                    <Input
                      placeholder="Enter city..."
                      value={selectedCity || ""}
                      onChange={(e) => setSelectedCity(e.target.value || undefined)}
                      className="bg-zinc-800 border-zinc-700 text-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm text-zinc-400 block">Gender/Population</label>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant={selectedPopulation === "men" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedPopulation(selectedPopulation === "men" ? undefined : "men")}
                        className={selectedPopulation === "men" ? "bg-blue-500 hover:bg-blue-600" : ""}
                      >
                        👨 Men
                      </Button>
                      <Button
                        variant={selectedPopulation === "women" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedPopulation(selectedPopulation === "women" ? undefined : "women")}
                        className={selectedPopulation === "women" ? "bg-pink-500 hover:bg-pink-600" : ""}
                      >
                        👩 Women
                      </Button>
                      <Button
                        variant={selectedPopulation === "coed" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedPopulation(selectedPopulation === "coed" ? undefined : "coed")}
                        className={selectedPopulation === "coed" ? "bg-purple-500 hover:bg-purple-600" : ""}
                      >
                        👫 Co-ed
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant={mediCalOnly ? "default" : "outline"}
                    size="sm"
                    onClick={() => setMediCalOnly(!mediCalOnly)}
                    className={mediCalOnly ? "bg-amber-500 hover:bg-amber-600" : ""}
                  >
                    Medi-Cal
                  </Button>
                  <Button
                    variant={couplesOnly ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCouplesOnly(!couplesOnly)}
                    className={couplesOnly ? "bg-amber-500 hover:bg-amber-600" : ""}
                  >
                    Couples
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Results */}
            {isLoadingSL ? (
              <div className="text-center py-12 text-zinc-400">Loading sober living facilities...</div>
            ) : filteredSoberLiving && filteredSoberLiving.length > 0 ? (
              <div className="grid grid-cols-1 gap-6">
                {filteredSoberLiving.map((center) => (
                  <Card key={center.id} className="bg-zinc-900 border-zinc-800 hover:border-amber-500/50 transition-colors">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <CardTitle className="text-white text-xl">{center.name}</CardTitle>
                            {center.isVerified && (
                              <Badge className="bg-green-500/20 text-green-400 border-green-500/50">
                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                Verified
                              </Badge>
                            )}
                            {center.isJointCommission && (
                              <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/50">
                                Joint Commission
                              </Badge>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-2 mb-2">
                            <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/50">
                              {typeLabels[center.type]}
                            </Badge>
                            <Badge variant="outline" className="text-zinc-400">
                              <Users className="w-3 h-3 mr-1" />
                              {populationLabels[center.servesPopulation]}
                            </Badge>
                            {center.acceptsCouples && (
                              <Badge variant="outline" className="text-pink-400 border-pink-500/50">
                                Accepts Couples
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      {center.description && (
                        <CardDescription className="text-zinc-400 mt-2">
                          {center.description}
                        </CardDescription>
                      )}
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {/* Location */}
                      {center.address && (
                        <div className="flex items-start gap-2 text-zinc-300">
                          <MapPin className="w-4 h-4 mt-1 text-amber-400" />
                          <span>{center.address}, {center.city} {center.zipCode}</span>
                        </div>
                      )}

                      {/* Phone */}
                      {center.phone && (
                        <div className="flex items-center gap-2 text-zinc-300">
                          <Phone className="w-4 h-4 text-amber-400" />
                          <a href={`tel:${center.phone}`} className="hover:text-amber-400">
                            {center.phone}
                          </a>
                        </div>
                      )}

                      {/* Price */}
                      {center.priceRange && (
                        <div className="flex items-center gap-2 text-zinc-300">
                          <DollarSign className="w-4 h-4 text-green-400" />
                          <span className="text-green-400 font-medium">
                            {center.priceRange === "Free" ? "Free" : `${center.priceRange}/month`}
                          </span>
                        </div>
                      )}

                      {/* Website */}
                      {center.website && (
                        <div className="flex items-center gap-2">
                          <ExternalLink className="w-4 h-4 text-amber-400" />
                          <a
                            href={center.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-amber-400 hover:text-amber-300"
                          >
                            Visit Website
                          </a>
                        </div>
                      )}

                      {/* Insurance */}
                      <div className="flex flex-wrap gap-2 pt-2 border-t border-zinc-800">
                        {center.acceptsMediCal && (
                          <Badge className="bg-green-500/20 text-green-400">Medi-Cal</Badge>
                        )}
                        {center.acceptsMedicare && (
                          <Badge className="bg-green-500/20 text-green-400">Medicare</Badge>
                        )}
                        {center.acceptsPrivateInsurance && (
                          <Badge className="bg-blue-500/20 text-blue-400">Private Insurance</Badge>
                        )}
                        {center.acceptsRBH && (
                          <Badge className="bg-purple-500/20 text-purple-400">RBH</Badge>
                        )}
                      </div>

                      {/* Price */}
                      {center.priceRange && (
                        <div className="flex items-center gap-2 text-zinc-300 pt-2">
                          <DollarSign className="w-4 h-4 text-amber-400" />
                          <span>{center.priceRange}</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="bg-zinc-900 border-zinc-800">
                <CardContent className="py-12 text-center">
                  <Building2 className="w-12 h-12 mx-auto mb-4 text-zinc-600" />
                  <p className="text-zinc-400 text-lg mb-2">No sober living facilities found</p>
                  <p className="text-zinc-500 text-sm">Try adjusting your filters or search query</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* TREATMENT CENTERS TAB */}
          <TabsContent value="treatment" className="space-y-6">
            {/* Search and Filters */}
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-white">Search & Filter</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-5 w-5 text-zinc-500" />
                  <Input
                    placeholder="Search by name or description..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-zinc-800 border-zinc-700 text-white"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm text-zinc-400 mb-2 block">Type</label>
                    <select
                      value={selectedTreatmentType || ""}
                      onChange={(e) => setSelectedTreatmentType(e.target.value || undefined)}
                      className="w-full bg-zinc-800 border-zinc-700 text-white rounded-md p-2"
                    >
                      <option value="">All Treatment Types</option>
                      <option value="detox">Detox</option>
                      <option value="residential">Residential</option>
                      <option value="outpatient">Outpatient</option>
                      <option value="iop_php">IOP/PHP</option>
                      <option value="dual_diagnosis">Dual Diagnosis</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-sm text-zinc-400 mb-2 block">City</label>
                    <Input
                      placeholder="Enter city..."
                      value={selectedCity || ""}
                      onChange={(e) => setSelectedCity(e.target.value || undefined)}
                      className="bg-zinc-800 border-zinc-700 text-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm text-zinc-400 block">Gender/Population</label>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant={selectedPopulation === "men" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedPopulation(selectedPopulation === "men" ? undefined : "men")}
                        className={selectedPopulation === "men" ? "bg-blue-500 hover:bg-blue-600" : ""}
                      >
                        👨 Men
                      </Button>
                      <Button
                        variant={selectedPopulation === "women" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedPopulation(selectedPopulation === "women" ? undefined : "women")}
                        className={selectedPopulation === "women" ? "bg-pink-500 hover:bg-pink-600" : ""}
                      >
                        👩 Women
                      </Button>
                      <Button
                        variant={selectedPopulation === "coed" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedPopulation(selectedPopulation === "coed" ? undefined : "coed")}
                        className={selectedPopulation === "coed" ? "bg-purple-500 hover:bg-purple-600" : ""}
                      >
                        👫 Co-ed
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant={mediCalOnly ? "default" : "outline"}
                    size="sm"
                    onClick={() => setMediCalOnly(!mediCalOnly)}
                    className={mediCalOnly ? "bg-amber-500 hover:bg-amber-600" : ""}
                  >
                    Medi-Cal
                  </Button>
                  <Button
                    variant={couplesOnly ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCouplesOnly(!couplesOnly)}
                    className={couplesOnly ? "bg-amber-500 hover:bg-amber-600" : ""}
                  >
                    Couples
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Results */}
            {isLoadingTC ? (
              <div className="text-center py-12 text-zinc-400">Loading treatment centers...</div>
            ) : filteredTreatmentCenters && filteredTreatmentCenters.length > 0 ? (
              <div className="grid grid-cols-1 gap-6">
                {filteredTreatmentCenters.map((center) => (
                  <Card key={center.id} className="bg-zinc-900 border-zinc-800 hover:border-amber-500/50 transition-colors">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <CardTitle className="text-white text-xl">{center.name}</CardTitle>
                            {center.isVerified && (
                              <Badge className="bg-green-500/20 text-green-400 border-green-500/50">
                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                Verified
                              </Badge>
                            )}
                            {center.isJointCommission && (
                              <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/50">
                                Joint Commission
                              </Badge>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-2 mb-2">
                            <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/50">
                              {typeLabels[center.type]}
                            </Badge>
                            <Badge variant="outline" className="text-zinc-400">
                              <Users className="w-3 h-3 mr-1" />
                              {populationLabels[center.servesPopulation]}
                            </Badge>
                            {center.acceptsCouples && (
                              <Badge variant="outline" className="text-pink-400 border-pink-500/50">
                                Accepts Couples
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      {center.description && (
                        <CardDescription className="text-zinc-400 mt-2">
                          {center.description}
                        </CardDescription>
                      )}
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {/* Location */}
                      {center.address && (
                        <div className="flex items-start gap-2 text-zinc-300">
                          <MapPin className="w-4 h-4 mt-1 text-amber-400" />
                          <span>{center.address}, {center.city} {center.zipCode}</span>
                        </div>
                      )}

                      {/* Phone */}
                      {center.phone && (
                        <div className="flex items-center gap-2 text-zinc-300">
                          <Phone className="w-4 h-4 text-amber-400" />
                          <a href={`tel:${center.phone}`} className="hover:text-amber-400">
                            {center.phone}
                          </a>
                        </div>
                      )}

                      {/* Price */}
                      {center.priceRange && (
                        <div className="flex items-center gap-2 text-zinc-300">
                          <DollarSign className="w-4 h-4 text-green-400" />
                          <span className="text-green-400 font-medium">
                            {center.priceRange === "Free" ? "Free" : `${center.priceRange}/month`}
                          </span>
                        </div>
                      )}

                      {/* Website */}
                      {center.website && (
                        <div className="flex items-center gap-2">
                          <ExternalLink className="w-4 h-4 text-amber-400" />
                          <a
                            href={center.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-amber-400 hover:text-amber-300"
                          >
                            Visit Website
                          </a>
                        </div>
                      )}

                      {/* Insurance */}
                      <div className="flex flex-wrap gap-2 pt-2 border-t border-zinc-800">
                        {center.acceptsMediCal && (
                          <Badge className="bg-green-500/20 text-green-400">Medi-Cal</Badge>
                        )}
                        {center.acceptsMedicare && (
                          <Badge className="bg-green-500/20 text-green-400">Medicare</Badge>
                        )}
                        {center.acceptsPrivateInsurance && (
                          <Badge className="bg-blue-500/20 text-blue-400">Private Insurance</Badge>
                        )}
                        {center.acceptsRBH && (
                          <Badge className="bg-purple-500/20 text-purple-400">RBH</Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="bg-zinc-900 border-zinc-800">
                <CardContent className="py-12 text-center">
                  <Building2 className="w-12 h-12 mx-auto mb-4 text-zinc-600" />
                  <p className="text-zinc-400 text-lg mb-2">No treatment centers found</p>
                  <p className="text-zinc-500 text-sm">Try adjusting your filters or search query</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="maps" className="space-y-6">
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-white">SBAT - Substance Abuse Treatment Locator</CardTitle>
                <CardDescription className="text-zinc-400">
                  Interactive map of substance abuse treatment facilities in LA County
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="w-full h-[600px] rounded-lg overflow-hidden border border-zinc-800">
                  <iframe
                    src="https://sapccis.ph.lacounty.gov/sbat/"
                    className="w-full h-full"
                    title="SBAT Treatment Locator"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-white">211 LA County - Community Resources</CardTitle>
                <CardDescription className="text-zinc-400">
                  Find food, shelter, healthcare, and other essential services
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="bg-zinc-800 p-4 rounded-lg">
                    <p className="text-white mb-2">Call 2-1-1 for immediate assistance</p>
                    <p className="text-zinc-400 text-sm">Available 24/7 in 150+ languages</p>
                  </div>
                  <Button
                    className="w-full bg-amber-500 hover:bg-amber-600 text-black font-bold"
                    onClick={() => window.open("https://211la.org/", "_blank")}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Visit 211 LA Website
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
