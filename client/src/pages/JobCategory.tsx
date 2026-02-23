import { useState, useEffect } from "react";
import { useParams, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  MapPin,
  DollarSign,
  Clock,
  ExternalLink,
  Loader2,
  Briefcase,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Helmet } from "react-helmet-async";
import { getDisplayDomain, getFaviconUrl, normalizeExternalUrl } from "@/lib/externalMedia";

// SEO-optimized category definitions
const categoryDefinitions: Record<string, {
  title: string;
  h1: string;
  description: string;
  metaDescription: string;
  query: string;
  keywords: string[];
  content: {
    intro: string;
    benefits: string[];
    tips: string[];
  };
}> = {
  "entry-level": {
    title: "Entry Level Jobs Los Angeles - No Experience Required",
    h1: "Entry Level Jobs in Los Angeles (No Experience Required)",
    description: "Find entry-level jobs in Los Angeles that don't require prior experience. Start your career today with immediate hire positions.",
    metaDescription: "Looking for entry level jobs in Los Angeles with no experience required? Find immediate hire positions, training programs, and career opportunities in LA County.",
    query: "entry level jobs no experience",
    keywords: ["entry level jobs", "no experience", "los angeles jobs", "immediate hire", "first job"],
    content: {
      intro: "Starting your career in Los Angeles doesn't require years of experience. Many employers offer entry-level positions with on-the-job training, making them perfect for first-time job seekers, career changers, or those re-entering the workforce.",
      benefits: [
        "No prior experience required",
        "On-the-job training provided",
        "Competitive starting pay",
        "Opportunities for advancement",
        "Flexible scheduling options",
        "Benefits eligibility"
      ],
      tips: [
        "Highlight any volunteer work or transferable skills",
        "Show enthusiasm and willingness to learn",
        "Be reliable and punctual from day one",
        "Ask questions during the interview process",
        "Dress professionally for interviews"
      ]
    }
  },
  "warehouse": {
    title: "Warehouse Jobs Los Angeles - Hiring Immediately",
    h1: "Warehouse & Fulfillment Jobs in Los Angeles",
    description: "Immediate hire warehouse jobs in Los Angeles. Amazon, UPS, FedEx and more are hiring now.",
    metaDescription: "Find warehouse jobs in Los Angeles hiring immediately. Amazon fulfillment centers, UPS, FedEx, and local distribution centers are hiring. Apply today!",
    query: "warehouse jobs hiring immediately",
    keywords: ["warehouse jobs", "fulfillment center", "amazon jobs", "immediate hire", "los angeles warehouse"],
    content: {
      intro: "Los Angeles is a major hub for warehouse and fulfillment operations. With e-commerce growth, companies like Amazon, UPS, FedEx, and local distributors are constantly hiring for immediate positions.",
      benefits: [
        "Immediate start dates available",
        "Competitive hourly wages ($17-$25/hr)",
        "Health benefits and 401k",
        "Overtime opportunities",
        "Shift differentials for nights/weekends",
        "Career advancement programs"
      ],
      tips: [
        "Be prepared for physical work - warehouse jobs require lifting",
        "Bring required documents on day one (ID, work authorization)",
        "Steel-toe boots may be required or provided",
        "Flexible scheduling options often available",
        "Ask about tuition reimbursement programs"
      ]
    }
  },
  "retail": {
    title: "Retail Jobs Los Angeles - Sales & Customer Service",
    h1: "Retail Sales & Customer Service Jobs in Los Angeles",
    description: "Find retail jobs in Los Angeles. Sales associate, cashier, and customer service positions available now.",
    metaDescription: "Looking for retail jobs in Los Angeles? Find sales associate, cashier, and customer service positions at top retailers. Many positions offer flexible schedules.",
    query: "retail jobs",
    keywords: ["retail jobs", "sales associate", "cashier", "customer service", "los angeles retail"],
    content: {
      intro: "Los Angeles offers abundant retail opportunities across major shopping districts, malls, and local stores. Retail positions provide flexible schedules, employee discounts, and opportunities to develop customer service skills.",
      benefits: [
        "Flexible part-time and full-time schedules",
        "Employee merchandise discounts",
        "Customer service skill development",
        "Advancement to management roles",
        "Commission opportunities in some stores",
        "Health benefits for full-time employees"
      ],
      tips: [
        "Customer service attitude is key",
        "Be prepared to work weekends and holidays",
        "Dress professionally and maintain good grooming",
        "Learn about the products you'll be selling",
        "Show enthusiasm and positive energy during interviews"
      ]
    }
  },
  "construction": {
    title: "Construction Jobs Los Angeles - Laborer Positions",
    h1: "Construction & Labor Jobs in Los Angeles",
    description: "Construction laborer jobs in Los Angeles. Immediate hire for experienced and entry-level workers.",
    metaDescription: "Find construction jobs in Los Angeles. General laborers, skilled trades, and entry-level construction positions available. Union and non-union opportunities.",
    query: "construction laborer",
    keywords: ["construction jobs", "laborer", "construction worker", "los angeles construction", "trade jobs"],
    content: {
      intro: "Los Angeles construction industry is booming with residential, commercial, and infrastructure projects. Opportunities exist for both experienced tradespeople and entry-level laborers willing to learn.",
      benefits: [
        "High hourly wages ($18-$45/hr depending on skill)",
        "Union membership opportunities",
        "Apprenticeship programs available",
        "Learn valuable trade skills",
        "Overtime pay common",
        "Benefits through union or employer"
      ],
      tips: [
        "Bring work boots and appropriate clothing",
        "OSHA certification is a plus but often not required",
        "Be prepared for early morning start times",
        "Physical fitness and stamina required",
        "Own basic hand tools may be required"
      ]
    }
  },
  "delivery": {
    title: "Delivery Driver Jobs Los Angeles - Immediate Hire",
    h1: "Delivery Driver Jobs in Los Angeles",
    description: "Delivery driver jobs in Los Angeles. Amazon, UberEats, DoorDash, and more are hiring now.",
    metaDescription: "Find delivery driver jobs in Los Angeles. Amazon Flex, UberEats, DoorDash, package delivery, and route driver positions available. Start earning today.",
    query: "delivery driver",
    keywords: ["delivery driver", "amazon flex", "doordash", "ubereats", "package delivery"],
    content: {
      intro: "Delivery driving offers flexible schedules and immediate earning opportunities in Los Angeles. From package delivery to food delivery, companies are actively hiring drivers with valid licenses.",
      benefits: [
        "Flexible scheduling - choose your hours",
        "Immediate start with gig economy platforms",
        "Competitive pay plus tips",
        "Use your own vehicle or company provided",
        "Fuel reimbursement or allowance",
        "Weekly or daily pay options"
      ],
      tips: [
        "Valid driver's license and clean driving record required",
        "Auto insurance meeting minimum requirements",
        "Smartphone for navigation and order management",
        "Know Los Angeles streets and traffic patterns",
        "Customer service skills important for tips"
      ]
    }
  },
  "security": {
    title: "Security Guard Jobs Los Angeles - Hiring Now",
    h1: "Security Guard Jobs in Los Angeles",
    description: "Security guard jobs in Los Angeles. Unarmed and armed positions available with training provided.",
    metaDescription: "Find security guard jobs in Los Angeles. Unarmed and armed security positions. Get your guard card and start working. Many companies provide training.",
    query: "security guard",
    keywords: ["security guard", "unarmed security", "armed security", "guard card", "los angeles security"],
    content: {
      intro: "Security positions in Los Angeles range from retail loss prevention to corporate security and event security. California Guard Card required but many employers help you obtain it.",
      benefits: [
        "Multiple shift options (day, night, graveyard)",
        "Guard card training often provided",
        "Advancement to supervisor roles",
        "Armed positions pay premium wages",
        "Stable, year-round employment",
        "Benefits for full-time positions"
      ],
      tips: [
        "Obtain your California Guard Card (required)",
        "Clean background check required",
        "Professional appearance and demeanor",
        "Be prepared for standing for long periods",
        "Strong observation and reporting skills needed"
      ]
    }
  },
  "food-service": {
    title: "Food Service Jobs Los Angeles - Restaurant & Kitchen",
    h1: "Food Service & Restaurant Jobs in Los Angeles",
    description: "Food service jobs in Los Angeles. Cook, server, dishwasher, and kitchen positions hiring now.",
    metaDescription: "Find food service jobs in Los Angeles. Restaurants, cafes, and catering companies are hiring cooks, servers, dishwashers, and kitchen staff. Many positions offer tips.",
    query: "food service jobs",
    keywords: ["food service", "restaurant jobs", "cook", "server", "kitchen jobs"],
    content: {
      intro: "Los Angeles has a thriving restaurant and food service industry with constant demand for kitchen staff, servers, and support positions. Many entry-level positions available with flexible schedules.",
      benefits: [
        "Tips can significantly increase earnings",
        "Flexible part-time and full-time schedules",
        "Free or discounted meals during shifts",
        "Learn culinary skills on the job",
        "Fast-paced, social work environment",
        "Opportunities in fine dining to casual restaurants"
      ],
      tips: [
        "Food handler's certificate may be required (easy to obtain)",
        "Be prepared to work evenings and weekends",
        "Prior experience helpful but not always required",
        "Good communication and teamwork essential",
        "Clean appearance and hygiene critical"
      ]
    }
  },
  "janitorial": {
    title: "Janitorial Jobs Los Angeles - Custodian Positions",
    h1: "Janitorial & Custodian Jobs in Los Angeles",
    description: "Janitorial and custodian jobs in Los Angeles. Day and night shift positions available.",
    metaDescription: "Find janitorial jobs in Los Angeles. Custodian, cleaner, and maintenance positions for offices, schools, and commercial buildings. Flexible shifts available.",
    query: "janitorial custodian",
    keywords: ["janitorial jobs", "custodian", "cleaner", "maintenance", "los angeles janitorial"],
    content: {
      intro: "Janitorial positions offer stable employment with flexible schedules and opportunities for advancement. Commercial buildings, schools, hospitals, and offices constantly need reliable cleaning staff.",
      benefits: [
        "Day or night shift options",
        "Stable, year-round employment",
        "No experience required for entry positions",
        "Opportunity to work independently",
        "Competitive hourly wages",
        "Benefits for full-time employees"
      ],
      tips: [
        "Reliability and punctuality highly valued",
        "Physical stamina for standing and lifting",
        "Background checks often required for school positions",
        "Own transportation may be needed for multiple site routes",
        "Attention to detail and thoroughness important"
      ]
    }
  }
};

export default function JobCategory() {
  const { category } = useParams<{ category: string }>();
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [displayedResults, setDisplayedResults] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const RESULTS_PER_PAGE = 20;

  const utils = trpc.useUtils();

  const categoryData = category ? categoryDefinitions[category] : null;

  const getJobOutboundInfo = (job: any) => {
    if (job.applyLink) {
      return { url: job.applyLink, sourceLabel: "Direct apply", actionLabel: "Apply Now" };
    }
    if (job.sourceUrl) {
      return { url: job.sourceUrl, sourceLabel: "Original source", actionLabel: "Find Posting" };
    }
    return {
      url: `https://www.google.com/search?q=${encodeURIComponent(`${job.title} ${job.company} ${job.location} jobs`)}`,
      sourceLabel: "Google search",
      actionLabel: "Find Posting",
    };
  };

  useEffect(() => {
    if (categoryData) {
      performSearch();
    }
  }, [category]);

  const performSearch = async () => {
    if (!categoryData) return;

    setIsLoading(true);
    setPage(1);
    try {
      const data = await utils.client.jobs.search.query({
        query: categoryData.query,
        location: "Los Angeles, CA",
        limit: 100
      });
      setSearchResults(data.jobs);
      setDisplayedResults(data.jobs.slice(0, RESULTS_PER_PAGE));
    } catch (error: any) {
      toast.error(`Failed to load jobs: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadMore = () => {
    const nextPage = page + 1;
    const startIndex = 0;
    const endIndex = nextPage * RESULTS_PER_PAGE;
    setDisplayedResults(searchResults.slice(startIndex, endIndex));
    setPage(nextPage);
  };

  if (!categoryData) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Card>
            <CardHeader>
              <CardTitle>Category Not Found</CardTitle>
              <CardDescription>
                The job category you're looking for doesn't exist.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <Link href="/jobs">
                  <a>
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Jobs
                  </a>
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://www.virgilst.com/"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Jobs",
        "item": "https://www.virgilst.com/jobs"
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": categoryData.title,
        "item": `https://www.virgilst.com/jobs/category/${category}`
      }
    ]
  };

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{categoryData.title}</title>
        <meta name="description" content={categoryData.metaDescription} />
        <meta name="keywords" content={categoryData.keywords.join(", ")} />
        <link rel="canonical" href={`https://www.virgilst.com/jobs/category/${category}`} />
        <script type="application/ld+json">
          {JSON.stringify(breadcrumbSchema)}
        </script>
      </Helmet>

      <div className="max-w-7xl mx-auto px-4 py-8 pb-24">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
          <Link href="/"><a>Home</a></Link>
          <span>/</span>
          <Link href="/jobs"><a>Jobs</a></Link>
          <span>/</span>
          <span className="text-foreground">{categoryData.h1}</span>
        </div>

        {/* SEO Header Section */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">{categoryData.h1}</h1>
          <p className="text-xl text-muted-foreground mb-6">
            {categoryData.description}
          </p>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>About {categoryData.h1}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4">{categoryData.content.intro}</p>

              <div className="grid md:grid-cols-2 gap-6 mt-6">
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Briefcase className="w-5 h-5 text-primary" />
                    Benefits & Advantages
                  </h3>
                  <ul className="space-y-2">
                    {categoryData.content.benefits.map((benefit, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <span className="text-primary mt-0.5">•</span>
                        <span>{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold mb-3">Job Search Tips</h3>
                  <ul className="space-y-2">
                    {categoryData.content.tips.map((tip, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <span className="text-primary mt-0.5">•</span>
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Job Listings */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-4">
            Current {categoryData.h1} ({searchResults.length} positions{displayedResults.length < searchResults.length ? `, showing ${displayedResults.length}` : ''})
          </h2>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : searchResults.length > 0 ? (
          <>
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
                      {(() => {
                        const outbound = getJobOutboundInfo(job);
                        const outboundUrl = normalizeExternalUrl(outbound.url) ?? outbound.url;
                        const faviconUrl = getFaviconUrl(outbound.url);
                        const domain = getDisplayDomain(outbound.url);
                        return (
                          <>
                            <Button size="sm" asChild>
                              <a
                                href={outboundUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                {faviconUrl ? (
                                  <img
                                    src={faviconUrl}
                                    alt=""
                                    className="mr-2 h-4 w-4 rounded-sm border border-border object-cover"
                                    loading="lazy"
                                    decoding="async"
                                  />
                                ) : null}
                                {outbound.actionLabel}
                                <ExternalLink className="w-3 h-3 ml-2" />
                              </a>
                            </Button>
                            <Badge variant="outline" className="text-xs">
                              {domain ? `${outbound.sourceLabel} • ${domain}` : outbound.sourceLabel}
                            </Badge>
                          </>
                        );
                      })()}
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
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground mb-4">
                No jobs found in this category at the moment.
              </p>
              <Button asChild>
                <Link href="/jobs">
                  <a>Browse All Jobs</a>
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* SEO Footer Content */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Frequently Asked Questions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">How do I apply for {categoryData.h1.toLowerCase()}?</h3>
              <p className="text-sm text-muted-foreground">
                Click "Apply Now" on any job listing to be directed to the employer's application page. You can also click "View Details" to learn more about the position before applying.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Are these jobs in Los Angeles County?</h3>
              <p className="text-sm text-muted-foreground">
                Yes, all jobs listed are located in Los Angeles County and surrounding areas. Use the location filter to find positions closest to you.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">How often are new jobs posted?</h3>
              <p className="text-sm text-muted-foreground">
                Our job listings are updated daily with new positions from employers across Los Angeles. Check back regularly for the latest opportunities.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Call to Action */}
        <div className="mt-8 text-center">
          <Button size="lg" asChild>
            <Link href="/jobs">
              <a>Browse All Job Categories</a>
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
