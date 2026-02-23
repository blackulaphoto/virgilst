import { useMemo, useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import PublicLayout from "@/components/PublicLayout";
import SectionBlock from "@/components/SectionBlock";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, Phone, MapPin, ExternalLink, ArrowLeft, HeartPulse } from "lucide-react";
import { getDisplayDomain, getFaviconUrl, normalizeExternalUrl } from "@/lib/externalMedia";

function normalize(text?: string | null) {
  return (text || "").toLowerCase();
}

function matchesSuboxoneTerms(center: any) {
  const blob = [
    center.name,
    center.description,
    center.servicesOffered,
    center.type,
    center.city,
  ]
    .map(normalize)
    .join(" ");

  return (
    blob.includes("suboxone") ||
    blob.includes("sublocade") ||
    blob.includes("buprenorphine") ||
    blob.includes("mat")
  );
}

export default function SuboxoneClinics() {
  const [search, setSearch] = useState("");

  const { data: suboxoneMatches = [], isLoading: loadingSuboxone } = trpc.treatmentCenters.search.useQuery({
    query: "suboxone",
  });
  const { data: sublocadeMatches = [], isLoading: loadingSublocade } = trpc.treatmentCenters.search.useQuery({
    query: "sublocade",
  });

  const isLoading = loadingSuboxone || loadingSublocade;

  const clinics = useMemo(() => {
    const byId = new Map<number, any>();
    [...suboxoneMatches, ...sublocadeMatches].forEach((center) => {
      if (!byId.has(center.id)) byId.set(center.id, center);
    });
    return Array.from(byId.values()).filter(matchesSuboxoneTerms);
  }, [suboxoneMatches, sublocadeMatches]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return clinics;
    return clinics.filter((center) => {
      const blob = [
        center.name,
        center.city,
        center.description,
        center.servicesOffered,
        center.phone,
      ]
        .map(normalize)
        .join(" ");
      return blob.includes(q);
    });
  }, [clinics, search]);

  return (
    <PublicLayout
      title="Suboxone Clinics"
      subtitle={`${filtered.length} suboxone/sublocade providers found.`}
      actions={
        <div className="flex gap-2">
          <Link href="/submit-service/treatment_center">
            <Button size="sm" className="bg-[var(--cta)] text-[var(--cta-foreground)] hover:opacity-95">
              Submit a clinic
            </Button>
          </Link>
          <Link href="/healthcare">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Healthcare
            </Button>
          </Link>
        </div>
      }
    >
      <SectionBlock className="pt-8">
        <div className="mb-5">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by clinic name, city, services, or phone..."
              className="pl-9"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="py-10 text-center text-muted-foreground">Loading Suboxone clinics...</div>
        ) : filtered.length === 0 ? (
          <Card className="surface-card">
            <CardContent className="py-12 text-center">
              <HeartPulse className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
              <p className="mb-2 text-lg text-foreground">No Suboxone clinics found</p>
              <p className="text-sm text-muted-foreground">Try another search term or clear filters.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filtered.map((center) => {
              let services: string[] = [];
              try {
                services = JSON.parse(center.servicesOffered || "[]");
              } catch {
                services = [];
              }

              const websiteUrl = normalizeExternalUrl(center.website);
              const faviconUrl = getFaviconUrl(center.website);
              const domain = getDisplayDomain(center.website);

              return (
                <Card key={center.id} className="surface-card">
                  <CardHeader>
                    <div className="flex flex-wrap items-center gap-2">
                      <CardTitle>{center.name}</CardTitle>
                      <Badge className="bg-primary/15 text-primary">Suboxone</Badge>
                      {normalize(center.description).includes("sublocade") && (
                        <Badge variant="outline">Sublocade</Badge>
                      )}
                      {normalize(center.city) === "telehealth" && (
                        <Badge variant="secondary">Telehealth</Badge>
                      )}
                    </div>
                    {center.description && (
                      <CardDescription>{center.description}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {center.city && (
                      <div className="flex items-center gap-2 text-sm text-foreground">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span>{center.city}{center.zipCode ? ` ${center.zipCode}` : ""}</span>
                      </div>
                    )}
                    {center.phone && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <a href={`tel:${center.phone}`} className="text-primary hover:underline">
                          {center.phone}
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

                    <div className="flex flex-wrap gap-2 border-t border-border pt-2">
                      {services.slice(0, 6).map((service, idx) => (
                        <Badge key={`${center.id}-${idx}`} variant="outline">{service}</Badge>
                      ))}
                      {center.acceptsMediCal ? <Badge>Medi-Cal</Badge> : null}
                      {center.acceptsPrivateInsurance ? <Badge variant="secondary">Private Insurance</Badge> : null}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </SectionBlock>
    </PublicLayout>
  );
}
