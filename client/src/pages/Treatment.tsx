import { useEffect, useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapPin, Phone, ExternalLink, DollarSign, Users, CheckCircle2, Building2, Search, Star } from "lucide-react";
import { Link, useParams } from "wouter";
import PublicLayout from "@/components/PublicLayout";
import SectionBlock from "@/components/SectionBlock";
import { getDisplayDomain, getFaviconUrl, getWebsitePreviewImage, normalizeExternalUrl } from "@/lib/externalMedia";

export default function Treatment() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const utils = trpc.useUtils();
  const { program } = useParams<{ program?: string }>();
  const initialSearchQuery = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("q") || "" : "";
  const initialInsurance = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("insurance") || "" : "";
  const routeProgramMap: Record<string, string> = {
    "sober-living": "sober_living",
    detox: "detox",
    residential: "residential",
    outpatient: "outpatient",
    "dual-diagnosis": "dual_diagnosis",
  };
  const initialProgramType = program ? routeProgramMap[program] : undefined;
  const initialTab = !initialProgramType || initialProgramType === "sober_living" ? "sober_living" : "treatment";

  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [selectedCity, setSelectedCity] = useState<string | undefined>();
  const [selectedPopulation, setSelectedPopulation] = useState<string | undefined>();
  const [mediCalOnly, setMediCalOnly] = useState(false);
  const [privateInsuranceOnly, setPrivateInsuranceOnly] = useState(initialInsurance === "private");
  const [couplesOnly, setCouplesOnly] = useState(false);
  const [selectedTreatmentType, setSelectedTreatmentType] = useState<string | undefined>(
    initialProgramType && initialProgramType !== "sober_living" ? initialProgramType : undefined
  );
  const [activeTab, setActiveTab] = useState<string>(initialTab);

  useEffect(() => {
    if (initialProgramType === "sober_living") {
      setActiveTab("sober_living");
      setSelectedTreatmentType(undefined);
      return;
    }
    if (initialProgramType) {
      setActiveTab("treatment");
      setSelectedTreatmentType(initialProgramType);
    }
  }, [initialProgramType]);

  const { data: soberLivingCenters, isLoading: isLoadingSL } = trpc.treatmentCenters.list.useQuery({
    type: "sober_living",
    city: selectedCity,
    servesPopulation: selectedPopulation as any,
    acceptsMediCal: mediCalOnly || undefined,
    acceptsPrivateInsurance: privateInsuranceOnly || undefined,
    acceptsCouples: couplesOnly || undefined,
  });

  const { data: allTreatmentCenters, isLoading: isLoadingTC } = trpc.treatmentCenters.list.useQuery({
    city: selectedCity,
    servesPopulation: selectedPopulation as any,
    acceptsMediCal: mediCalOnly || undefined,
    acceptsPrivateInsurance: privateInsuranceOnly || undefined,
    acceptsCouples: couplesOnly || undefined,
  });

  const filteredSoberLiving = soberLivingCenters?.filter(center =>
    searchQuery === "" ||
    center.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    center.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    center.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredTreatmentCenters = allTreatmentCenters?.filter(center => {
    if (center.type === "sober_living") return false;
    if (selectedTreatmentType && center.type !== selectedTreatmentType) return false;
    if (
      searchQuery !== "" &&
      !center.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !center.city?.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !center.description?.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  const featuredSoberLiving = filteredSoberLiving?.filter(center => center.isFeatured === 1) || [];
  const standardSoberLiving = filteredSoberLiving?.filter(center => center.isFeatured !== 1) || [];
  const featuredTreatmentCenters = filteredTreatmentCenters?.filter(center => center.isFeatured === 1) || [];
  const standardTreatmentCenters = filteredTreatmentCenters?.filter(center => center.isFeatured !== 1) || [];

  const setTreatmentFeaturedMutation = trpc.treatmentCenters.setFeatured.useMutation({
    onSuccess: () => {
      utils.treatmentCenters.list.invalidate();
      utils.treatmentCenters.featured.invalidate();
    },
  });

  const typeLabels: Record<string, string> = {
    sober_living: "Sober Living",
    detox: "Detox",
    residential: "Residential",
    outpatient: "Outpatient",
    iop_php: "IOP/PHP",
    dual_diagnosis: "Dual Diagnosis",
  };

  const populationLabels: Record<string, string> = {
    men: "Men",
    women: "Women",
    coed: "Co-ed",
    lgbtq: "LGBTQ+",
    women_with_children: "Women with Children",
  };

  const renderSearchFilters = (showTypeFilter: boolean) => (
    <Card className="surface-card">
      <CardHeader>
        <CardTitle>Search and filter</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Search by name, city, or description..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className={`grid grid-cols-1 gap-4 ${showTypeFilter ? "md:grid-cols-3" : "md:grid-cols-2"}`}>
          {showTypeFilter && (
            <div>
              <label className="mb-2 block text-sm font-medium text-muted-foreground">Treatment type</label>
              <select
                value={selectedTreatmentType || ""}
                onChange={e => setSelectedTreatmentType(e.target.value || undefined)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">All Treatment Types</option>
                <option value="detox">Detox</option>
                <option value="residential">Residential</option>
                <option value="outpatient">Outpatient</option>
                <option value="iop_php">IOP/PHP</option>
                <option value="dual_diagnosis">Dual Diagnosis</option>
              </select>
            </div>
          )}

          <div>
            <label className="mb-2 block text-sm font-medium text-muted-foreground">City</label>
            <Input
              placeholder="Enter city..."
              value={selectedCity || ""}
              onChange={e => setSelectedCity(e.target.value || undefined)}
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-muted-foreground">Population served</label>
            <div className="flex flex-wrap gap-2">
              <Button variant={selectedPopulation === "men" ? "default" : "outline"} size="sm" onClick={() => setSelectedPopulation(selectedPopulation === "men" ? undefined : "men")}>Men</Button>
              <Button variant={selectedPopulation === "women" ? "default" : "outline"} size="sm" onClick={() => setSelectedPopulation(selectedPopulation === "women" ? undefined : "women")}>Women</Button>
              <Button variant={selectedPopulation === "coed" ? "default" : "outline"} size="sm" onClick={() => setSelectedPopulation(selectedPopulation === "coed" ? undefined : "coed")}>Co-ed</Button>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant={mediCalOnly ? "default" : "outline"} size="sm" onClick={() => setMediCalOnly(!mediCalOnly)}>Medi-Cal</Button>
          <Button variant={privateInsuranceOnly ? "default" : "outline"} size="sm" onClick={() => setPrivateInsuranceOnly(!privateInsuranceOnly)}>Private Insurance</Button>
          <Button variant={couplesOnly ? "default" : "outline"} size="sm" onClick={() => setCouplesOnly(!couplesOnly)}>Couples</Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderCenterCard = (center: any) => (
    <Card key={center.id} className="surface-card">
      {center.isFeatured === 1 ? (
        <div className="relative h-40 overflow-hidden border-b border-border bg-muted/20">
          {(center.websiteImage || getWebsitePreviewImage(center.website)) ? (
            <img
              src={center.websiteImage || getWebsitePreviewImage(center.website) || ""}
              alt={`${center.name} website preview`}
              className="h-full w-full object-cover"
              loading="lazy"
              decoding="async"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <Building2 className="h-10 w-10 text-muted-foreground" />
            </div>
          )}
        </div>
      ) : null}
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <CardTitle className="text-xl">{center.name}</CardTitle>
              {center.isVerified && (
                <Badge className="bg-primary/15 text-primary border-primary/40">
                  <CheckCircle2 className="mr-1 h-3 w-3" />
                  Verified
                </Badge>
              )}
              {center.isJointCommission && <Badge variant="outline">Joint Commission</Badge>}
              {center.isFeatured === 1 && <Badge className="bg-amber-500/15 text-amber-700 border-amber-500/40">Featured</Badge>}
            </div>
            <div className="mb-2 flex flex-wrap gap-2">
              <Badge variant="secondary">{typeLabels[center.type]}</Badge>
              <Badge variant="outline" className="text-muted-foreground">
                <Users className="mr-1 h-3 w-3" />
                {populationLabels[center.servesPopulation]}
              </Badge>
              {center.acceptsCouples && <Badge variant="outline">Accepts Couples</Badge>}
            </div>
          </div>
          {isAdmin ? (
            <Button
              size="sm"
              variant={center.isFeatured === 1 ? "default" : "outline"}
              onClick={() =>
                setTreatmentFeaturedMutation.mutate({
                  id: center.id,
                  isFeatured: center.isFeatured !== 1,
                })
              }
              disabled={setTreatmentFeaturedMutation.isPending}
            >
              <Star className="mr-2 h-4 w-4" />
              {center.isFeatured === 1 ? "Unfeature" : "Feature"}
            </Button>
          ) : null}
        </div>
        {(center.description || center.websiteDescription) && (
          <CardDescription>{center.description || center.websiteDescription}</CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {center.address && (
          <div className="flex items-start gap-2 text-foreground">
            <MapPin className="mt-1 h-4 w-4 text-muted-foreground" />
            <span>{center.address}, {center.city} {center.zipCode}</span>
          </div>
        )}
        {center.phone && (
          <div className="flex items-center gap-2 text-foreground">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <a href={`tel:${center.phone}`} className="hover:text-primary">{center.phone}</a>
          </div>
        )}
        {center.priceRange && (
          <div className="flex items-center gap-2 text-foreground">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <span>{center.priceRange === "Free" ? "Free" : `${center.priceRange}/month`}</span>
          </div>
        )}
        {(() => {
          const websiteUrl = normalizeExternalUrl(center.website);
          const faviconUrl = center.websiteFavicon || getFaviconUrl(center.website);
          const domain = getDisplayDomain(center.website);

          if (!websiteUrl) return null;

          return (
            <div className="flex items-center gap-2">
              {faviconUrl ? (
                <img
                  src={faviconUrl}
                  alt=""
                  className="h-5 w-5 rounded-sm border border-border object-cover"
                  loading="lazy"
                  decoding="async"
                />
              ) : (
                <ExternalLink className="h-4 w-4 text-primary" />
              )}
              <a href={websiteUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                {center.websiteTitle ? `Visit ${center.websiteTitle}` : (domain ? `Visit ${domain}` : "Visit website")}
              </a>
            </div>
          );
        })()}
        <div className="flex flex-wrap gap-2 border-t border-border pt-2">
          {center.acceptsMediCal && <Badge className="bg-primary/15 text-primary">Medi-Cal</Badge>}
          {center.acceptsMedicare && <Badge variant="outline">Medicare</Badge>}
          {center.acceptsPrivateInsurance && <Badge variant="outline">Private Insurance</Badge>}
          {center.acceptsRBH && <Badge variant="outline">RBH</Badge>}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <PublicLayout
      title="Treatment Directory"
      subtitle="Sober living, detox, and treatment centers in California."
      actions={
        <div className="flex gap-2">
          <Link href="/submit-service/treatment_center">
            <Button variant="outline" size="sm">Submit a center</Button>
          </Link>
          <Link href="/treatment/wizard">
            <Button className="bg-[var(--cta)] text-[var(--cta-foreground)] hover:opacity-95">Find treatment now</Button>
          </Link>
        </div>
      }
    >
      <SectionBlock className="pt-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-8 grid w-full grid-cols-3">
            <TabsTrigger value="sober_living">Sober Living</TabsTrigger>
            <TabsTrigger value="treatment">Treatment Centers</TabsTrigger>
            <TabsTrigger value="maps">Resource Maps</TabsTrigger>
          </TabsList>

          <TabsContent value="sober_living" className="space-y-6">
            {renderSearchFilters(false)}
            {featuredSoberLiving.length > 0 ? (
              <div className="space-y-3">
                <Badge className="bg-amber-500/15 text-amber-700 border-amber-500/40">Featured sober living</Badge>
                <div className="grid grid-cols-1 gap-6">
                  {featuredSoberLiving.map(renderCenterCard)}
                </div>
              </div>
            ) : null}
            <div className="text-sm text-muted-foreground">
              {isLoadingSL ? "Loading..." : `${filteredSoberLiving?.length || 0} sober living facilities found`}
            </div>
            {isLoadingSL ? (
              <div className="py-12 text-center text-muted-foreground">Loading sober living facilities...</div>
            ) : standardSoberLiving && standardSoberLiving.length > 0 ? (
              <div className="grid grid-cols-1 gap-6">
                {standardSoberLiving.map(renderCenterCard)}
              </div>
            ) : (
              <Card className="surface-card">
                <CardContent className="py-12 text-center">
                  <Building2 className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                  <p className="mb-2 text-lg text-muted-foreground">No sober living facilities found</p>
                  <p className="text-sm text-muted-foreground">Try adjusting your filters or search query.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="treatment" className="space-y-6">
            {renderSearchFilters(true)}
            {featuredTreatmentCenters.length > 0 ? (
              <div className="space-y-3">
                <Badge className="bg-amber-500/15 text-amber-700 border-amber-500/40">Featured treatment centers</Badge>
                <div className="grid grid-cols-1 gap-6">
                  {featuredTreatmentCenters.map(renderCenterCard)}
                </div>
              </div>
            ) : null}
            <div className="text-sm text-muted-foreground">
              {isLoadingTC ? "Loading..." : `${filteredTreatmentCenters?.length || 0} treatment centers found`}
            </div>
            {isLoadingTC ? (
              <div className="py-12 text-center text-muted-foreground">Loading treatment centers...</div>
            ) : standardTreatmentCenters && standardTreatmentCenters.length > 0 ? (
              <div className="grid grid-cols-1 gap-6">
                {standardTreatmentCenters.map(renderCenterCard)}
              </div>
            ) : (
              <Card className="surface-card">
                <CardContent className="py-12 text-center">
                  <Building2 className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                  <p className="mb-2 text-lg text-muted-foreground">No treatment centers found</p>
                  <p className="text-sm text-muted-foreground">Try adjusting your filters or search query.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="maps" className="space-y-6">
            <Card className="surface-card">
              <CardHeader>
                <CardTitle>SBAT Substance Abuse Treatment Locator</CardTitle>
                <CardDescription>Interactive map of treatment facilities in LA County.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[600px] w-full overflow-hidden rounded-lg border border-border">
                  <iframe src="https://sapccis.ph.lacounty.gov/sbat/" className="h-full w-full" title="SBAT Treatment Locator" />
                </div>
              </CardContent>
            </Card>

            <Card className="surface-card">
              <CardHeader>
                <CardTitle>211 LA County</CardTitle>
                <CardDescription>Find food, shelter, healthcare, and other essential services.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="rounded-lg border border-border bg-secondary p-4">
                    <p className="text-foreground">Call 2-1-1 for immediate assistance</p>
                    <p className="text-sm text-muted-foreground">Available 24/7 in over 150 languages</p>
                  </div>
                  <Button className="w-full bg-[var(--cta)] text-[var(--cta-foreground)] hover:opacity-95" onClick={() => window.open("https://211la.org/", "_blank")}>
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Visit 211 LA website
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </SectionBlock>
    </PublicLayout>
  );
}
