import { useEffect, useState } from "react";
import { Link, useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft,
  Stethoscope,
  Phone,
  MapPin,
  User,
  Languages,
  Building2,
  Search,
  Filter,
  X,
  ExternalLink,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { MEDI_CAL_CATEGORY_DEFS, type MediCalCategoryKey } from "@shared/mediCalTaxonomy";
import PublicLayout from "@/components/PublicLayout";
import SectionBlock from "@/components/SectionBlock";
import { getDisplayDomain, getFaviconUrl, normalizeExternalUrl } from "@/lib/externalMedia";

export default function MediCalProviders() {
  const { city } = useParams<{ city?: string }>();
  const citySlugMap: Record<string, string> = {
    "los-angeles": "LOS ANGELES",
    "van-nuys": "VAN NUYS",
    encino: "ENCINO",
    tarzana: "TARZANA",
    burbank: "BURBANK",
    northridge: "NORTHRIDGE",
    "culver-city": "CULVER CITY",
    "mission-hills": "MISSION HILLS",
  };
  const initialCity = city ? citySlugMap[city] || city.replace(/-/g, " ").toUpperCase() : "";
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState(initialCity);
  const [selectedSpecialty, setSelectedSpecialty] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<MediCalCategoryKey | "">("");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    setSelectedCity(initialCity);
  }, [initialCity]);

  // Fetch providers based on search or filters
  const { data: providers = [], isLoading } = searchQuery
    ? trpc.mediCalProviders.search.useQuery({
        query: searchQuery,
        category: selectedCategory || undefined,
        city: selectedCity || undefined,
        limit: 100,
      })
    : trpc.mediCalProviders.list.useQuery({
        city: selectedCity || undefined,
        specialty: selectedSpecialty || undefined,
        category: selectedCategory || undefined,
        limit: 100,
      });

  // Fetch filter options
  const { data: cities = [] } = trpc.mediCalProviders.cities.useQuery();
  const { data: specialties = [] } = trpc.mediCalProviders.specialties.useQuery();
  const { data: categoryCounts = [] } = trpc.mediCalProviders.categories.useQuery();

  const resolvedCategories = MEDI_CAL_CATEGORY_DEFS.map(def => {
    const fromApi = categoryCounts.find(category => category.key === def.key);
    return {
      key: def.key,
      label: def.label,
      count: fromApi?.count ?? 0,
    };
  });

  return (
    <PublicLayout
      title="Medi-Cal Providers"
      subtitle={`${providers.length} providers available by city, specialty, and category.`}
      actions={
        <div className="flex gap-2">
          <Link href="/submit-service/medi_cal_provider">
            <Button size="sm" className="bg-[var(--cta)] text-[var(--cta-foreground)] hover:opacity-95">
              Submit a provider
            </Button>
          </Link>
          <Link href="/">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back home
            </Button>
          </Link>
        </div>
      }
    >
      <div className="border-b border-border bg-card/60">
        <div className="container py-4 space-y-3">
          {/* Category Navigation */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Browse by Category</p>
            <div className="flex flex-wrap gap-2">
              {resolvedCategories.map((category) => (
                <Button
                  key={category.key}
                  type="button"
                  variant={selectedCategory === category.key ? "default" : "outline"}
                  size="sm"
                  className="gap-2"
                  onClick={() => {
                    setSelectedCategory(prev => (prev === category.key ? "" : category.key));
                  }}
                >
                  <span>{category.label}</span>
                  <Badge variant="secondary" className="text-xs">
                    {category.count}
                  </Badge>
                </Button>
              ))}
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by provider name, city, specialty, or NPI..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Filter Toggle */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="gap-2"
            >
              <Filter className="h-4 w-4" />
              Filters
              {(selectedCity || selectedSpecialty || selectedCategory) && (
                <Badge variant="secondary" className="ml-1">
                  {[selectedCity, selectedSpecialty, selectedCategory].filter(Boolean).length}
                </Badge>
              )}
            </Button>

            {(selectedCity || selectedSpecialty || selectedCategory) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedCity("");
                  setSelectedSpecialty("");
                  setSelectedCategory("");
                  setSearchQuery("");
                }}
              >
                Clear All
              </Button>
            )}
          </div>

          {(selectedCategory || selectedCity || selectedSpecialty || searchQuery) && (
            <div className="flex flex-wrap gap-2 pt-1">
              {selectedCategory && (
                <Badge variant="secondary" className="gap-1">
                  Category: {resolvedCategories.find(c => c.key === selectedCategory)?.label || selectedCategory}
                  <button type="button" onClick={() => setSelectedCategory("")} aria-label="Clear category">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {selectedCity && (
                <Badge variant="secondary" className="gap-1">
                  City: {selectedCity}
                  <button type="button" onClick={() => setSelectedCity("")} aria-label="Clear city">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {selectedSpecialty && (
                <Badge variant="secondary" className="gap-1">
                  Specialty: {selectedSpecialty}
                  <button type="button" onClick={() => setSelectedSpecialty("")} aria-label="Clear specialty">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
            </div>
          )}

          {/* Filter Options */}
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
              <div>
                <label className="text-sm font-medium mb-2 block">City</label>
                <select
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">All Cities</option>
                  {cities.map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Specialty</label>
                <select
                  value={selectedSpecialty}
                  onChange={(e) => setSelectedSpecialty(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">All Specialties</option>
                  {specialties.map((specialty) => (
                    <option key={specialty} value={specialty}>
                      {specialty}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>
      </div>

      <SectionBlock className="pt-8">
      <div className="container py-0">
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-6 w-3/4 rounded bg-muted mb-3" />
                  <div className="h-4 w-full rounded bg-muted mb-2" />
                  <div className="h-4 w-2/3 rounded bg-muted" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : providers.length === 0 ? (
          <Card className="p-12 text-center">
            <Stethoscope className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg font-medium mb-2">No providers found</p>
            <p className="text-muted-foreground">
              {searchQuery || selectedCity || selectedSpecialty || selectedCategory
                ? "Try another category, city, specialty, or search term"
                : "No providers available"}
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            {providers.map((provider) => {
              const website = (provider as { website?: string | null }).website;
              const websiteUrl = normalizeExternalUrl(website);
              const faviconUrl = getFaviconUrl(website);
              const domain = getDisplayDomain(website);
              let specialties: string[] = [];
              let languages: string[] = [];
              let networks: string[] = [];
              let hospitals: string[] = [];
              let medicalGroups: string[] = [];

              try {
                specialties = JSON.parse(provider.specialties || "[]");
                languages = JSON.parse(provider.languagesSpoken || "[]");
                networks = JSON.parse(provider.networks || "[]");
                hospitals = JSON.parse(provider.hospitalAffiliations || "[]");
                medicalGroups = JSON.parse(provider.medicalGroups || "[]");
              } catch (e) {
                // Ignore JSON parse errors
              }

              return (
                <Card key={provider.id} className="surface-card transition-all">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <CardTitle className="mb-2 flex items-center gap-2 text-foreground">
                          {provider.providerName}
                          {provider.isVerified === 1 && (
                            <Badge variant="outline" className="border-green-500 text-green-400 text-xs">
                              Verified
                            </Badge>
                          )}
                        </CardTitle>

                        {provider.facilityName && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                            <Building2 className="h-4 w-4" />
                            <span>{provider.facilityName}</span>
                          </div>
                        )}

                        {/* Specialties */}
                        {specialties.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mb-3">
                            {specialties.slice(0, 3).map((specialty, idx) => (
                              <Badge
                                key={idx}
                                variant="outline"
                                className="border-primary/40 text-primary text-xs"
                              >
                                {specialty}
                              </Badge>
                            ))}
                            {specialties.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{specialties.length - 3} more
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Contact Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {provider.address && (
                        <div className="flex items-start gap-2 text-sm">
                          <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                          <div>
                            <div className="text-foreground">{provider.address}</div>
                            <div className="text-muted-foreground">
                              {provider.city}, {provider.state} {provider.zipCode}
                            </div>
                          </div>
                        </div>
                      )}

                      {provider.phone && (
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <a href={`tel:${provider.phone}`} className="text-primary hover:underline">
                            {provider.phone}
                          </a>
                        </div>
                      )}

                      {websiteUrl && (
                        <div className="flex items-center gap-2 text-sm">
                          {faviconUrl ? (
                            <img
                              src={faviconUrl}
                              alt=""
                              className="h-5 w-5 rounded-sm border border-border object-cover"
                              loading="lazy"
                              decoding="async"
                            />
                          ) : (
                            <ExternalLink className="h-4 w-4 text-muted-foreground" />
                          )}
                          <a href={websiteUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                            {domain ? `Visit ${domain}` : "Visit website"}
                          </a>
                        </div>
                      )}

                      {provider.gender && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span>Gender: {provider.gender}</span>
                        </div>
                      )}

                      {languages.length > 0 && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Languages className="h-4 w-4 text-muted-foreground" />
                          <span>
                            Languages: {languages.slice(0, 2).join(", ")}
                            {languages.length > 2 && ` +${languages.length - 2}`}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Provider IDs */}
                    {(provider.npi || provider.stateLicense) && (
                      <div className="pt-3 border-t border-border">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-muted-foreground">
                          {provider.npi && (
                            <div>
                              <span className="font-medium">NPI:</span> {provider.npi}
                            </div>
                          )}
                          {provider.stateLicense && (
                            <div>
                              <span className="font-medium">State License:</span> {provider.stateLicense}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Networks & Affiliations */}
                    {(networks.length > 0 || hospitals.length > 0 || medicalGroups.length > 0) && (
                      <div className="pt-3 border-t border-border space-y-2">
                        {networks.length > 0 && (
                          <div className="text-xs">
                            <span className="font-medium text-muted-foreground">Networks:</span>
                            <div className="text-muted-foreground mt-1">
                              {networks.slice(0, 2).join(", ")}
                              {networks.length > 2 && ` +${networks.length - 2} more`}
                            </div>
                          </div>
                        )}

                        {hospitals.length > 0 && (
                          <div className="text-xs">
                            <span className="font-medium text-muted-foreground">Hospital Affiliations:</span>
                            <div className="text-muted-foreground mt-1">
                              {hospitals.slice(0, 2).join(", ")}
                              {hospitals.length > 2 && ` +${hospitals.length - 2} more`}
                            </div>
                          </div>
                        )}

                        {medicalGroups.length > 0 && (
                          <div className="text-xs">
                            <span className="font-medium text-muted-foreground">Medical Groups:</span>
                            <div className="text-muted-foreground mt-1">
                              {medicalGroups.slice(0, 2).join(", ")}
                              {medicalGroups.length > 2 && ` +${medicalGroups.length - 2} more`}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Distance (if available) */}
                    {provider.distance && (
                      <div className="pt-2 text-xs text-muted-foreground">
                        Distance: {provider.distance}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
      </SectionBlock>
    </PublicLayout>
  );
}
