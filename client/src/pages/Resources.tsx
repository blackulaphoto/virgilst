import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
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
  ThumbsUp,
  ThumbsDown,
  Flag,
  CheckCircle,
  XCircle
} from "lucide-react";
import { trpc } from "@/lib/trpc";

const resourceCategories = [
  {
    type: "food",
    title: "Food & Grocery Programs",
    description: "179 food banks, pantries, and meal programs across LA County",
    icon: UtensilsCrossed,
    color: "text-green-400",
    bgColor: "bg-green-400/10",
    borderColor: "border-green-400/50",
  },
  {
    type: "housing",
    title: "Housing Assistance",
    description: "45 programs for shelter, Section 8, rental assistance, and permanent housing",
    icon: Home,
    color: "text-blue-400",
    bgColor: "bg-blue-400/10",
    borderColor: "border-blue-400/50",
  },
  {
    type: "transportation",
    title: "Transportation",
    description: "10 programs for free bus passes, Metro access, and travel assistance",
    icon: Bus,
    color: "text-purple-400",
    bgColor: "bg-purple-400/10",
    borderColor: "border-purple-400/50",
  },
  {
    type: "dental",
    title: "Healthcare & Dental",
    description: "12 dental clinics and healthcare services",
    icon: Stethoscope,
    color: "text-red-400",
    bgColor: "bg-red-400/10",
    borderColor: "border-red-400/50",
  },
  {
    type: "legal",
    title: "Legal Services",
    description: "5 free legal aid programs for housing, eviction, and benefits",
    icon: Scale,
    color: "text-amber-400",
    bgColor: "bg-amber-400/10",
    borderColor: "border-amber-400/50",
  },
  {
    type: "shelter",
    title: "Emergency Shelter",
    description: "3 emergency shelter and crisis housing programs",
    icon: Building,
    color: "text-orange-400",
    bgColor: "bg-orange-400/10",
    borderColor: "border-orange-400/50",
  },
];

export default function Resources() {
  const [selectedType, setSelectedType] = useState<string | null>(null);

  const { data: resources = [], isLoading } = trpc.resources.list.useQuery(
    selectedType ? { type: selectedType } : {}
  );

  const selectedCategory = resourceCategories.find(cat => cat.type === selectedType);

  if (selectedType && selectedCategory) {
    return (
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b border-border bg-card sticky top-0 z-10">
          <div className="container flex items-center justify-between py-4">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => setSelectedType(null)}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="flex items-center gap-3">
                <div className={`inline-flex h-10 w-10 items-center justify-center rounded-lg ${selectedCategory.bgColor}`}>
                  <selectedCategory.icon className={`h-5 w-5 ${selectedCategory.color}`} />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-card-foreground">{selectedCategory.title}</h1>
                  <p className="text-sm text-muted-foreground">{resources.length} resources available</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Resource List */}
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
          ) : resources.length === 0 ? (
            <Card className="p-12 text-center">
              <p className="text-muted-foreground">No resources found in this category.</p>
            </Card>
          ) : (
            <div className="space-y-4">
              {resources.map((resource) => (
                <Card
                  key={resource.id}
                  className={`border-zinc-800 hover:${selectedCategory.borderColor} transition-all`}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <CardTitle className="text-white mb-2 flex items-center gap-2">
                          {resource.name}
                          {resource.isVerified === 1 && (
                            <Badge variant="outline" className="border-green-500 text-green-400 text-xs">
                              Verified
                            </Badge>
                          )}
                        </CardTitle>
                        {resource.description && (
                          <CardDescription className="text-zinc-400 mb-4">
                            {resource.description}
                          </CardDescription>
                        )}

                        <div className="space-y-2">
                          {resource.address && (
                            <div className="flex items-start gap-2 text-sm text-zinc-300">
                              <MapPin className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                              <span>{resource.address}</span>
                            </div>
                          )}

                          {resource.phone && (
                            <div className="flex items-center gap-2 text-sm text-zinc-300">
                              <Phone className="w-4 h-4 text-green-400 flex-shrink-0" />
                              <a href={`tel:${resource.phone}`} className="hover:text-white transition-colors">
                                {resource.phone}
                              </a>
                            </div>
                          )}

                          {resource.website && (
                            <div className="flex items-center gap-2 text-sm text-zinc-300">
                              <ExternalLink className="w-4 h-4 text-purple-400 flex-shrink-0" />
                              <a
                                href={resource.website.startsWith('http') ? resource.website : `https://${resource.website}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:text-white transition-colors hover:underline"
                              >
                                Visit Website
                              </a>
                            </div>
                          )}

                          {resource.hours && (
                            <div className="flex items-start gap-2 text-sm text-zinc-400 mt-2">
                              <span className="font-medium">Hours:</span>
                              <span>{resource.hours}</span>
                            </div>
                          )}
                        </div>

                        {/* Community Feedback */}
                        <div className="mt-6 pt-4 border-t border-zinc-800">
                          <p className="text-xs text-zinc-500 mb-3">
                            Have you visited this location? Help keep info accurate:
                          </p>
                          <div className="flex flex-wrap gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-green-700 text-green-400 hover:bg-green-900/20"
                            >
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Still Open
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-red-700 text-red-400 hover:bg-red-900/20"
                            >
                              <XCircle className="w-3 h-3 mr-1" />
                              Closed
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-amber-700 text-amber-400 hover:bg-amber-900/20"
                            >
                              <Flag className="w-3 h-3 mr-1" />
                              Report Issue
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
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container flex items-center justify-between py-4">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-bold text-card-foreground">Resource Directory</h1>
              <p className="text-sm text-muted-foreground">Browse by category</p>
            </div>
          </div>
        </div>
      </header>

      {/* Category Grid */}
      <div className="container py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-2">What do you need?</h2>
          <p className="text-muted-foreground">
            Click a category to browse verified resources across Los Angeles County
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {resourceCategories.map((category) => {
            const Icon = category.icon;
            return (
              <Card
                key={category.type}
                className={`cursor-pointer border-zinc-800 hover:${category.borderColor} transition-all group`}
                onClick={() => setSelectedType(category.type)}
              >
                <CardHeader>
                  <div className={`inline-flex h-12 w-12 items-center justify-center rounded-lg ${category.bgColor} mb-4 group-hover:scale-110 transition-transform`}>
                    <Icon className={`h-6 w-6 ${category.color}`} />
                  </div>
                  <CardTitle className="text-white text-xl mb-2">{category.title}</CardTitle>
                  <CardDescription className="text-zinc-400">
                    {category.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            );
          })}
        </div>

        {/* Quick Links */}
        <div className="mt-12 p-6 bg-card border border-border rounded-lg">
          <h3 className="text-lg font-bold text-card-foreground mb-4">Can't find what you need?</h3>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/chat">
              <Button className="w-full sm:w-auto">
                <Heart className="w-4 h-4 mr-2" />
                Ask Virgil AI
              </Button>
            </Link>
            <Link href="/search">
              <Button variant="outline" className="w-full sm:w-auto">
                Search Everything
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
