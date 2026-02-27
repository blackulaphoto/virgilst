import { useEffect, useState, useMemo } from "react";
import { Link, useParams } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  UtensilsCrossed,
  Home,
  Bus,
  Stethoscope,
  Scale,
  Building,
  Heart,
  Phone,
  MapPin,
  ExternalLink,
  Flag,
  CheckCircle,
  XCircle,
  Search,
  ShieldAlert,
  Users,
  Baby,
  Sparkles,
  Star,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import PublicLayout from "@/components/PublicLayout";
import SectionBlock from "@/components/SectionBlock";
import { getDisplayDomain, getFaviconUrl, getWebsitePreviewImage, normalizeExternalUrl } from "@/lib/externalMedia";

const resourceCategories = [
  {
    type: "food",
    title: "Food and Grocery Programs",
    description: "Food banks, pantry services, and meal programs across LA County",
    icon: UtensilsCrossed,
    color: "text-primary",
    bgColor: "bg-primary/10",
    borderColor: "border-primary/40",
  },
  {
    type: "housing",
    title: "Housing Assistance",
    description: "Shelter, Section 8, prevention, and permanent housing pathways",
    icon: Home,
    color: "text-accent-foreground",
    bgColor: "bg-accent/20",
    borderColor: "border-accent/50",
  },
  {
    type: "transportation",
    title: "Transportation",
    description: "Bus passes, transit support, and mobility assistance",
    icon: Bus,
    color: "text-primary",
    bgColor: "bg-secondary",
    borderColor: "border-primary/35",
  },
  {
    type: "dental",
    title: "Healthcare and Dental",
    description: "Medical and dental support services",
    icon: Stethoscope,
    color: "text-primary",
    bgColor: "bg-primary/10",
    borderColor: "border-primary/40",
  },
  {
    type: "legal",
    title: "Legal Services",
    description: "Legal aid for housing, benefits, and documentation issues",
    icon: Scale,
    color: "text-accent-foreground",
    bgColor: "bg-accent/20",
    borderColor: "border-accent/50",
  },
  {
    type: "shelter",
    title: "Emergency Shelter",
    description: "Emergency shelter and crisis housing programs",
    icon: Building,
    color: "text-primary",
    bgColor: "bg-primary/10",
    borderColor: "border-primary/40",
  },
  {
    type: "crisis_hotline",
    title: "Crisis Hotlines",
    description: "24/7 crisis support, domestic violence, mental health hotlines",
    icon: Phone,
    color: "text-red-500",
    bgColor: "bg-red-500/10",
    borderColor: "border-red-500/40",
  },
  {
    type: "legal_aid",
    title: "Legal Aid",
    description: "Free legal assistance, restraining orders, custody help",
    icon: Scale,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/40",
  },
  {
    type: "couples_counseling",
    title: "Couples Counseling",
    description: "Relationship counseling and couples therapy services",
    icon: Users,
    color: "text-pink-500",
    bgColor: "bg-pink-500/10",
    borderColor: "border-pink-500/40",
  },
  {
    type: "parenting_classes",
    title: "Parenting Classes",
    description: "Parenting support, education, and family programs",
    icon: Baby,
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
    borderColor: "border-purple-500/40",
  },
  {
    type: "hygiene",
    title: "Hygiene Services",
    description: "Shower facilities, hygiene kits, and personal care",
    icon: Sparkles,
    color: "text-cyan-500",
    bgColor: "bg-cyan-500/10",
    borderColor: "border-cyan-500/40",
  },
];

export default function Resources() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const utils = trpc.useUtils();
  const { category } = useParams<{ category?: string }>();
  const isValidCategory = !!category && resourceCategories.some(cat => cat.type === category);
  const [selectedType, setSelectedType] = useState<string | null>(isValidCategory ? category! : null);
  const [searchQuery, setSearchQuery] = useState("");
  const [zipCodeFilter, setZipCodeFilter] = useState("");

  useEffect(() => {
    setSelectedType(isValidCategory ? category! : null);
  }, [category, isValidCategory]);

  const { data: resources = [], isLoading } = trpc.resources.list.useQuery(
    selectedType ? { type: selectedType } : {}
  );
  const { data: featuredResources = [] } = trpc.resources.featured.useQuery(
    selectedType ? { type: selectedType, limit: 8 } : { limit: 8 }
  );
  const setFeaturedMutation = trpc.resources.setFeatured.useMutation({
    onSuccess: () => {
      utils.resources.list.invalidate();
      utils.resources.featured.invalidate();
    },
  });

  const selectedCategory = resourceCategories.find(cat => cat.type === selectedType);

  // Filter resources based on search and zip code
  const filteredResources = useMemo(() => {
    const featuredIds = new Set(featuredResources.map(resource => resource.id));
    return resources.filter(resource => {
      if (featuredIds.has(resource.id)) return false;

      const matchesSearch = !searchQuery ||
        resource.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        resource.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        resource.address?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesZip = !zipCodeFilter ||
        resource.zipCode?.includes(zipCodeFilter);

      return matchesSearch && matchesZip;
    });
  }, [resources, featuredResources, searchQuery, zipCodeFilter]);

  if (selectedType && selectedCategory) {
    return (
      <PublicLayout
        title={selectedCategory.title}
        subtitle={`${filteredResources.length} ${filteredResources.length === resources.length ? 'resources' : `of ${resources.length} resources`} in this category.`}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setSelectedType(null)}>
              Browse all categories
            </Button>
            <Link href="/submit-service/resource">
              <Button size="sm" className="bg-[var(--cta)] text-[var(--cta-foreground)] hover:opacity-95">
                Submit a service
              </Button>
            </Link>
          </div>
        }
      >
        <SectionBlock>
          {featuredResources.length > 0 ? (
            <div className="mb-8">
              <div className="mb-4 flex items-center gap-2">
                <Badge className="bg-primary/10 text-primary border-primary/30">
                  Featured resources
                </Badge>
                <p className="text-sm text-muted-foreground">
                  Admin selected priority services with expanded details.
                </p>
              </div>
              <div className="space-y-4">
                {featuredResources.map((resource) => {
                  const websiteUrl = normalizeExternalUrl(resource.website);
                  const previewImage = getWebsitePreviewImage(resource.website);
                  const domain = getDisplayDomain(resource.website);
                  const faviconUrl = getFaviconUrl(resource.website);

                  return (
                    <Card key={`featured-${resource.id}`} className={`overflow-hidden border-2 ${selectedCategory.borderColor}`}>
                      <div className="grid gap-0 md:grid-cols-[220px_1fr]">
                        <div className="relative min-h-[160px] bg-muted/30">
                          {previewImage ? (
                            <img
                              src={previewImage}
                              alt={`${resource.name} logo`}
                              className="h-full w-full object-cover"
                              loading="lazy"
                              decoding="async"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center">
                              <Building className="h-10 w-10 text-muted-foreground" />
                            </div>
                          )}
                          <div className="absolute left-2 top-2">
                            <Badge variant="secondary" className="capitalize">
                              {resource.type}
                            </Badge>
                          </div>
                        </div>
                        <CardContent className="p-5">
                          <div className="mb-3 flex items-start justify-between gap-3">
                            <h3 className="text-lg font-bold text-foreground">{resource.name}</h3>
                            <div className="flex items-center gap-2">
                              {resource.isVerified === 1 ? (
                                <Badge variant="outline" className="border-primary/60 text-primary">
                                  Verified
                                </Badge>
                              ) : null}
                              {isAdmin ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    setFeaturedMutation.mutate({
                                      id: resource.id,
                                      isFeatured: false,
                                    })
                                  }
                                  disabled={setFeaturedMutation.isPending}
                                >
                                  <Star className="mr-2 h-4 w-4" />
                                  Unfeature
                                </Button>
                              ) : null}
                            </div>
                          </div>

                          {resource.description ? (
                            <p className="mb-4 text-sm text-muted-foreground">{resource.description}</p>
                          ) : null}

                          <div className="grid gap-2 text-sm">
                            {resource.address ? (
                              <div className="flex items-start gap-2">
                                <MapPin className="mt-0.5 h-4 w-4 text-primary shrink-0" />
                                <span>{resource.address}</span>
                              </div>
                            ) : null}
                            {resource.phone ? (
                              <div className="flex items-center gap-2">
                                <Phone className="h-4 w-4 text-primary shrink-0" />
                                <a href={`tel:${resource.phone}`} className="hover:text-primary transition-colors">
                                  {resource.phone}
                                </a>
                              </div>
                            ) : null}
                            {websiteUrl ? (
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
                                  <ExternalLink className="h-4 w-4 text-primary shrink-0" />
                                )}
                                <a
                                  href={websiteUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="hover:text-primary transition-colors hover:underline"
                                >
                                  {domain ? `Visit ${domain}` : "Visit website"}
                                </a>
                              </div>
                            ) : null}
                            {resource.hours ? (
                              <div className="flex items-start gap-2">
                                <span className="font-medium text-foreground">Hours:</span>
                                <span className="text-muted-foreground">{resource.hours}</span>
                              </div>
                            ) : null}
                          </div>
                        </CardContent>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          ) : null}

          <div className="mb-6 flex flex-wrap gap-2">
            {resourceCategories
              .filter(cat => cat.type !== selectedType)
              .slice(0, 5)
              .map(cat => (
                <Link key={cat.type} href={`/resources/${cat.type}`}>
                  <Button variant="outline" size="sm">
                    {cat.title}
                  </Button>
                </Link>
              ))}
          </div>

          {/* Search and Filter Bar */}
          <div className="mb-6 grid gap-4 md:grid-cols-[1fr_200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search by name, address, or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Input
              type="text"
              placeholder="Filter by zip code"
              value={zipCodeFilter}
              onChange={(e) => setZipCodeFilter(e.target.value)}
              maxLength={5}
            />
          </div>

          {searchQuery || zipCodeFilter ? (
            <div className="mb-4 text-sm text-muted-foreground">
              Showing {filteredResources.length} of {resources.length - featuredResources.length} standard resources
              {searchQuery && ` matching "${searchQuery}"`}
              {zipCodeFilter && ` in zip ${zipCodeFilter}`}
            </div>
          ) : null}

          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Card key={i} className="surface-card animate-pulse">
                  <CardContent className="p-6">
                    <div className="mb-3 h-6 w-3/4 rounded bg-muted" />
                    <div className="mb-2 h-4 w-full rounded bg-muted" />
                    <div className="h-4 w-2/3 rounded bg-muted" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredResources.length === 0 ? (
            <Card className="surface-card p-12 text-center">
              <p className="text-muted-foreground">
                {searchQuery || zipCodeFilter
                  ? "No resources match your search. Try different keywords or zip code."
                  : "No resources found in this category."}
              </p>
              {(searchQuery || zipCodeFilter) && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={() => {
                    setSearchQuery("");
                    setZipCodeFilter("");
                  }}
                >
                  Clear filters
                </Button>
              )}
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredResources.map(resource => (
                <Card key={resource.id} className={`surface-card border ${selectedCategory.borderColor}`}>
                  <CardHeader>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <CardTitle className="mb-2 flex items-center gap-2 text-foreground">
                            {resource.name}
                            {resource.isVerified === 1 && (
                              <Badge variant="outline" className="border-primary/60 text-primary text-xs">
                                Verified
                              </Badge>
                            )}
                            {isAdmin ? (
                              <Button
                                size="sm"
                                variant={resource.isFeatured === 1 ? "default" : "outline"}
                                className="ml-2 h-7 px-2 text-xs"
                                onClick={() =>
                                  setFeaturedMutation.mutate({
                                    id: resource.id,
                                    isFeatured: resource.isFeatured !== 1,
                                  })
                                }
                                disabled={setFeaturedMutation.isPending}
                              >
                                <Star className="mr-1 h-3 w-3" />
                                {resource.isFeatured === 1 ? "Unfeature" : "Feature"}
                              </Button>
                            ) : null}
                          </CardTitle>
                        {resource.description && (
                          <CardDescription className="mb-4 text-muted-foreground">
                            {resource.description}
                          </CardDescription>
                        )}

                        <div className="space-y-2">
                          {resource.address && (
                            <div className="flex items-start gap-2 text-sm text-foreground">
                              <MapPin className="mt-0.5 h-4 w-4 text-primary shrink-0" />
                              <span>{resource.address}</span>
                            </div>
                          )}

                          {resource.phone && (
                            <div className="flex items-center gap-2 text-sm text-foreground">
                              <Phone className="h-4 w-4 text-primary shrink-0" />
                              <a href={`tel:${resource.phone}`} className="hover:text-primary transition-colors">
                                {resource.phone}
                              </a>
                            </div>
                          )}

                          {(() => {
                            const websiteUrl = normalizeExternalUrl(resource.website);
                            const faviconUrl = getFaviconUrl(resource.website);
                            const domain = getDisplayDomain(resource.website);

                            if (!websiteUrl) return null;

                            return (
                              <div className="flex items-center gap-2 text-sm text-foreground">
                                {faviconUrl ? (
                                  <img
                                    src={faviconUrl}
                                    alt=""
                                    className="h-5 w-5 rounded-sm border border-border object-cover"
                                    loading="lazy"
                                    decoding="async"
                                  />
                                ) : (
                                  <ExternalLink className="h-4 w-4 text-primary shrink-0" />
                                )}
                                <a
                                  href={websiteUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="hover:text-primary transition-colors hover:underline"
                                >
                                  {domain ? `Visit ${domain}` : "Visit website"}
                                </a>
                              </div>
                            );
                          })()}

                          {resource.hours && (
                            <div className="mt-2 flex items-start gap-2 text-sm text-muted-foreground">
                              <span className="font-medium text-foreground">Hours:</span>
                              <span>{resource.hours}</span>
                            </div>
                          )}
                        </div>

                        <div className="mt-6 border-t border-border pt-4">
                          <p className="mb-3 text-xs text-muted-foreground">
                            Have you visited this location? Help keep this up to date:
                          </p>
                          <div className="flex flex-wrap gap-2">
                            <Button variant="outline" size="sm">
                              <CheckCircle className="mr-1 h-3 w-3" />
                              Still open
                            </Button>
                            <Button variant="outline" size="sm">
                              <XCircle className="mr-1 h-3 w-3" />
                              Closed
                            </Button>
                            <Button variant="outline" size="sm">
                              <Flag className="mr-1 h-3 w-3" />
                              Report issue
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}
        </SectionBlock>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout
      title="Resource Directory"
      subtitle="Find verified support across housing, food, healthcare, legal services, transportation, and shelter."
      actions={
        <Link href="/submit-service/resource">
          <Button size="sm" className="bg-[var(--cta)] text-[var(--cta-foreground)] hover:opacity-95">
            Submit a service
          </Button>
        </Link>
      }
    >
      <SectionBlock title="What do you need right now?" subtitle="Choose a category to see verified resources across Los Angeles County.">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {resourceCategories.map(category => {
            const Icon = category.icon;
            return (
              <Card
                key={category.type}
                className={`surface-card cursor-pointer border ${category.borderColor}`}
                onClick={() => setSelectedType(category.type)}
              >
                <CardHeader>
                  <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl ${category.bgColor}`}>
                    <Icon className={`h-6 w-6 ${category.color}`} />
                  </div>
                  <CardTitle className="text-xl">{category.title}</CardTitle>
                  <CardDescription className="text-muted-foreground">{category.description}</CardDescription>
                </CardHeader>
              </Card>
            );
          })}
        </div>
      </SectionBlock>

      <SectionBlock className="pt-0">
        <Card className="surface-card p-6">
          <h3 className="text-lg font-bold text-foreground">Need help choosing?</h3>
          <p className="mt-2 text-muted-foreground">
            Ask Virgil for a guided recommendation based on your immediate needs.
          </p>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <Link href="/chat">
              <Button className="bg-[var(--cta)] text-[var(--cta-foreground)] hover:opacity-95">
                <Heart className="mr-2 h-4 w-4" />
                Ask Virgil
              </Button>
            </Link>
            <Link href="/search">
              <Button variant="outline">Search everything</Button>
            </Link>
          </div>
        </Card>
      </SectionBlock>
    </PublicLayout>
  );
}
