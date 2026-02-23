import { useEffect, useState } from "react";
import { Link, useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import PublicLayout from "@/components/PublicLayout";
import SectionBlock from "@/components/SectionBlock";
import { getDisplayDomain, getFaviconUrl, normalizeExternalUrl } from "@/lib/externalMedia";

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
];

export default function Resources() {
  const { category } = useParams<{ category?: string }>();
  const isValidCategory = !!category && resourceCategories.some(cat => cat.type === category);
  const [selectedType, setSelectedType] = useState<string | null>(isValidCategory ? category! : null);

  useEffect(() => {
    setSelectedType(isValidCategory ? category! : null);
  }, [category, isValidCategory]);

  const { data: resources = [], isLoading } = trpc.resources.list.useQuery(
    selectedType ? { type: selectedType } : {}
  );

  const selectedCategory = resourceCategories.find(cat => cat.type === selectedType);

  if (selectedType && selectedCategory) {
    return (
      <PublicLayout
        title={selectedCategory.title}
        subtitle={`${resources.length} resources found in this category.`}
        actions={
          <Button variant="outline" size="sm" onClick={() => setSelectedType(null)}>
            Browse all categories
          </Button>
        }
      >
        <SectionBlock>
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
          ) : resources.length === 0 ? (
            <Card className="surface-card p-12 text-center">
              <p className="text-muted-foreground">No resources found in this category.</p>
            </Card>
          ) : (
            <div className="space-y-4">
              {resources.map(resource => (
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
