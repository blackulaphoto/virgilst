import { useState } from "react";
import { Link } from "wouter";
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
} from "lucide-react";
import { trpc } from "@/lib/trpc";

export default function MediCalProviders() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [selectedSpecialty, setSelectedSpecialty] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // Fetch providers based on search or filters
  const { data: providers = [], isLoading } = searchQuery
    ? trpc.mediCalProviders.search.useQuery({
        query: searchQuery,
        limit: 100,
      })
    : trpc.mediCalProviders.list.useQuery({
        city: selectedCity || undefined,
        specialty: selectedSpecialty || undefined,
        limit: 100,
      });

  // Fetch filter options
  const { data: cities = [] } = trpc.mediCalProviders.cities.useQuery();
  const { data: specialties = [] } = trpc.mediCalProviders.specialties.useQuery();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="container flex items-center justify-between py-4">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-blue-400/10">
                <Stethoscope className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-card-foreground">Medi-Cal Providers</h1>
                <p className="text-sm text-muted-foreground">
                  {providers.length} providers available
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Search & Filters */}
      <div className="border-b border-border bg-card/50">
        <div className="container py-4 space-y-3">
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
              {(selectedCity || selectedSpecialty) && (
                <Badge variant="secondary" className="ml-1">
                  {[selectedCity, selectedSpecialty].filter(Boolean).length}
                </Badge>
              )}
            </Button>

            {(selectedCity || selectedSpecialty) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedCity("");
                  setSelectedSpecialty("");
                }}
              >
                Clear All
              </Button>
            )}
          </div>

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

      {/* Provider List */}
      <div className="container py-8">
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
              {searchQuery || selectedCity || selectedSpecialty
                ? "Try adjusting your search or filters"
                : "No providers available"}
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            {providers.map((provider) => {
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
                <Card key={provider.id} className="border-zinc-800 hover:border-blue-400/50 transition-all">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <CardTitle className="text-white mb-2 flex items-center gap-2">
                          {provider.providerName}
                          {provider.isVerified === 1 && (
                            <Badge variant="outline" className="border-green-500 text-green-400 text-xs">
                              Verified
                            </Badge>
                          )}
                        </CardTitle>

                        {provider.facilityName && (
                          <div className="flex items-center gap-2 text-sm text-zinc-400 mb-2">
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
                                className="border-blue-500/30 text-blue-400 text-xs"
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
                          <MapPin className="h-4 w-4 text-zinc-500 mt-0.5 flex-shrink-0" />
                          <div>
                            <div className="text-zinc-300">{provider.address}</div>
                            <div className="text-zinc-500">
                              {provider.city}, {provider.state} {provider.zipCode}
                            </div>
                          </div>
                        </div>
                      )}

                      {provider.phone && (
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="h-4 w-4 text-zinc-500" />
                          <a href={`tel:${provider.phone}`} className="text-blue-400 hover:underline">
                            {provider.phone}
                          </a>
                        </div>
                      )}

                      {provider.gender && (
                        <div className="flex items-center gap-2 text-sm text-zinc-400">
                          <User className="h-4 w-4 text-zinc-500" />
                          <span>Gender: {provider.gender}</span>
                        </div>
                      )}

                      {languages.length > 0 && (
                        <div className="flex items-center gap-2 text-sm text-zinc-400">
                          <Languages className="h-4 w-4 text-zinc-500" />
                          <span>
                            Languages: {languages.slice(0, 2).join(", ")}
                            {languages.length > 2 && ` +${languages.length - 2}`}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Provider IDs */}
                    {(provider.npi || provider.stateLicense) && (
                      <div className="pt-3 border-t border-zinc-800">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-zinc-500">
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
                      <div className="pt-3 border-t border-zinc-800 space-y-2">
                        {networks.length > 0 && (
                          <div className="text-xs">
                            <span className="font-medium text-zinc-400">Networks:</span>
                            <div className="text-zinc-500 mt-1">
                              {networks.slice(0, 2).join(", ")}
                              {networks.length > 2 && ` +${networks.length - 2} more`}
                            </div>
                          </div>
                        )}

                        {hospitals.length > 0 && (
                          <div className="text-xs">
                            <span className="font-medium text-zinc-400">Hospital Affiliations:</span>
                            <div className="text-zinc-500 mt-1">
                              {hospitals.slice(0, 2).join(", ")}
                              {hospitals.length > 2 && ` +${hospitals.length - 2} more`}
                            </div>
                          </div>
                        )}

                        {medicalGroups.length > 0 && (
                          <div className="text-xs">
                            <span className="font-medium text-zinc-400">Medical Groups:</span>
                            <div className="text-zinc-500 mt-1">
                              {medicalGroups.slice(0, 2).join(", ")}
                              {medicalGroups.length > 2 && ` +${medicalGroups.length - 2} more`}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Distance (if available) */}
                    {provider.distance && (
                      <div className="pt-2 text-xs text-zinc-500">
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
    </div>
  );
}
