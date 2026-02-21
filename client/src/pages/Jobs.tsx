import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Briefcase,
  MapPin,
  DollarSign,
  Clock,
  ExternalLink,
  Search,
  Warehouse,
  ShoppingCart,
  Construction,
  Truck,
  Shield,
  UtensilsCrossed,
  Home as HomeIcon,
  Loader2,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

const jobCategories = [
  {
    id: "entry-level",
    query: "entry level jobs no experience",
    title: "Entry Level",
    description: "Jobs that don't require prior experience",
    icon: Briefcase,
    color: "text-blue-400",
    bgColor: "bg-blue-400/10",
    borderColor: "border-blue-400/50",
  },
  {
    id: "warehouse",
    query: "warehouse jobs hiring immediately",
    title: "Warehouse",
    description: "Warehouse and fulfillment center positions",
    icon: Warehouse,
    color: "text-purple-400",
    bgColor: "bg-purple-400/10",
    borderColor: "border-purple-400/50",
  },
  {
    id: "retail",
    query: "retail jobs",
    title: "Retail",
    description: "Sales and retail positions",
    icon: ShoppingCart,
    color: "text-green-400",
    bgColor: "bg-green-400/10",
    borderColor: "border-green-400/50",
  },
  {
    id: "construction",
    query: "construction laborer",
    title: "Construction",
    description: "Construction and labor jobs",
    icon: Construction,
    color: "text-orange-400",
    bgColor: "bg-orange-400/10",
    borderColor: "border-orange-400/50",
  },
  {
    id: "delivery",
    query: "delivery driver",
    title: "Delivery",
    description: "Delivery and driving positions",
    icon: Truck,
    color: "text-yellow-400",
    bgColor: "bg-yellow-400/10",
    borderColor: "border-yellow-400/50",
  },
  {
    id: "security",
    query: "security guard",
    title: "Security",
    description: "Security and protective services",
    icon: Shield,
    color: "text-red-400",
    bgColor: "bg-red-400/10",
    borderColor: "border-red-400/50",
  },
  {
    id: "food-service",
    query: "food service jobs",
    title: "Food Service",
    description: "Restaurant and food service jobs",
    icon: UtensilsCrossed,
    color: "text-pink-400",
    bgColor: "bg-pink-400/10",
    borderColor: "border-pink-400/50",
  },
  {
    id: "janitorial",
    query: "janitorial custodian",
    title: "Janitorial",
    description: "Cleaning and custodial positions",
    icon: HomeIcon,
    color: "text-cyan-400",
    bgColor: "bg-cyan-400/10",
    borderColor: "border-cyan-400/50",
  },
];

export default function Jobs() {
  const [searchQuery, setSearchQuery] = useState("");
  const [location, setLocation] = useState("Los Angeles, CA");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [displayedResults, setDisplayedResults] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const RESULTS_PER_PAGE = 20;

  const utils = trpc.useUtils();
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async (query: string) => {
    setIsSearching(true);
    setPage(1);
    try {
      const data = await utils.client.jobs.search.query({ query, location, limit: 100 });
      setSearchResults(data.jobs);
      setDisplayedResults(data.jobs.slice(0, RESULTS_PER_PAGE));
      toast.success(data.fromCache ? "Loaded from cache" : `Found ${data.jobs.length} jobs`);
    } catch (error: any) {
      toast.error(`Search failed: ${error.message}`);
    } finally {
      setIsSearching(false);
    }
  };

  const handleLoadMore = () => {
    const nextPage = page + 1;
    const startIndex = 0;
    const endIndex = nextPage * RESULTS_PER_PAGE;
    setDisplayedResults(searchResults.slice(startIndex, endIndex));
    setPage(nextPage);
  };

  const handleCategoryClick = (category: typeof jobCategories[0]) => {
    setSelectedCategory(category.id);
    setSearchQuery(category.query);
    handleSearch(category.query);
  };

  const handleCustomSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setSelectedCategory(null);
      handleSearch(searchQuery);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-8 pb-24">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Job Search</h1>
          <p className="text-muted-foreground">
            Find employment opportunities in Los Angeles County
          </p>
        </div>

        {/* Search Form */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <form onSubmit={handleCustomSearch} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <Input
                    type="text"
                    placeholder="Job title, keywords, or company"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full"
                  />
                </div>
                <div>
                  <Input
                    type="text"
                    placeholder="Location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full"
                  />
                </div>
              </div>
              <Button
                type="submit"
                className="w-full md:w-auto"
                disabled={isSearching || !searchQuery.trim()}
              >
                {isSearching ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4 mr-2" />
                    Search Jobs
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Job Categories */}
        {!searchResults.length && (
          <>
            <h2 className="text-2xl font-bold mb-4">Browse by Category</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {jobCategories.map((category) => {
                const Icon = category.icon;
                return (
                  <Link key={category.id} href={`/jobs/category/${category.id}`}>
                    <Card
                      className={`cursor-pointer transition-all hover:shadow-lg border-2 ${
                        selectedCategory === category.id
                          ? category.borderColor
                          : "border-border"
                      }`}
                    >
                      <CardHeader>
                        <div className={`w-12 h-12 rounded-lg ${category.bgColor} flex items-center justify-center mb-2`}>
                          <Icon className={`w-6 h-6 ${category.color}`} />
                        </div>
                        <CardTitle className="text-lg">{category.title}</CardTitle>
                        <CardDescription className="text-sm">
                          {category.description}
                        </CardDescription>
                      </CardHeader>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </>
        )}

        {/* Search Results */}
        {searchResults.length > 0 && (
          <>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">
                {searchResults.length} Jobs Found {displayedResults.length < searchResults.length && `(Showing ${displayedResults.length})`}
              </h2>
              <Button
                variant="outline"
                onClick={() => {
                  setSearchResults([]);
                  setDisplayedResults([]);
                  setSearchQuery("");
                  setSelectedCategory(null);
                  setPage(1);
                }}
              >
                Clear Results
              </Button>
            </div>

            <div className="space-y-4">
              {displayedResults.map((job: any, index: number) => (
                <Card key={job.externalId || index} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-xl mb-1">
                          <Link href={`/jobs/${job.slug}`}>
                            <a className="hover:text-primary transition-colors">
                              {job.title}
                            </a>
                          </Link>
                        </CardTitle>
                        <CardDescription className="text-base font-medium">
                          {job.company}
                        </CardDescription>
                      </div>
                      {job.salary && (
                        <Badge variant="secondary" className="ml-4">
                          <DollarSign className="w-3 h-3 mr-1" />
                          {job.salary}
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {job.location}
                        </div>
                        {job.employmentType && (
                          <Badge variant="outline">{job.employmentType}</Badge>
                        )}
                        {job.postedDate && (
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {job.postedDate}
                          </div>
                        )}
                      </div>

                      {job.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {job.description}
                        </p>
                      )}

                      <div className="flex gap-2">
                        <Button size="sm" asChild>
                          <a
                            href={
                              job.applyLink ||
                              job.sourceUrl ||
                              `https://www.google.com/search?q=${encodeURIComponent(
                                `${job.title} ${job.company} ${job.location} jobs`
                              )}`
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {job.applyLink ? "Apply Now" : "Find Posting"}
                            <ExternalLink className="w-3 h-3 ml-2" />
                          </a>
                        </Button>
                        <Button size="sm" variant="outline" asChild>
                          <Link href={`/jobs/${job.slug}`}>
                            <a>View Details</a>
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Load More Button */}
            {displayedResults.length < searchResults.length && (
              <div className="flex justify-center mt-8">
                <Button
                  onClick={handleLoadMore}
                  size="lg"
                  variant="outline"
                >
                  Load More Jobs ({searchResults.length - displayedResults.length} remaining)
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
