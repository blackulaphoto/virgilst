import { useParams, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Briefcase,
  MapPin,
  DollarSign,
  Clock,
  ExternalLink,
  Building,
  Calendar,
  BookmarkPlus,
  Loader2,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getDisplayDomain, getFaviconUrl, normalizeExternalUrl } from "@/lib/externalMedia";

export default function JobDetail() {
  const { slug } = useParams<{ slug: string }>();
  const [trackDialogOpen, setTrackDialogOpen] = useState(false);
  const [trackingNotes, setTrackingNotes] = useState("");

  const { data: job, isLoading } = trpc.jobs.bySlug.useQuery(
    { slug: slug! },
    { enabled: !!slug }
  );

  const { data: user } = trpc.auth.me.useQuery();

  const trackApplicationMutation = trpc.jobs.trackApplication.useMutation({
    onSuccess: () => {
      toast.success("Application tracked successfully!");
      setTrackDialogOpen(false);
      setTrackingNotes("");
    },
    onError: (error) => {
      toast.error(`Failed to track application: ${error.message}`);
    },
  });

  const handleTrackApplication = () => {
    if (!job) return;

    trackApplicationMutation.mutate({
      jobId: job.id,
      company: job.company,
      position: job.title,
      status: "applied",
      notes: trackingNotes,
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Card>
            <CardHeader>
              <CardTitle>Job Not Found</CardTitle>
              <CardDescription>
                This job posting could not be found or may have been removed.
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

  const fallbackSearchUrl = `https://www.google.com/search?q=${encodeURIComponent(
    `${job.title} ${job.company} ${job.location} jobs`
  )}`;
  const outboundUrl = job.applyLink || job.sourceUrl || fallbackSearchUrl;
  const outboundSourceLabel = job.applyLink
    ? "Direct apply"
    : job.sourceUrl
      ? "Original source"
      : "Google search";
  const normalizedOutboundUrl = normalizeExternalUrl(outboundUrl) ?? outboundUrl;
  const outboundFavicon = getFaviconUrl(outboundUrl);
  const outboundDomain = getDisplayDomain(outboundUrl);

  // Generate JobPosting schema markup for SEO
  const jobPostingSchema = {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    "title": job.title,
    "description": job.description || `${job.title} position at ${job.company} in ${job.location}`,
    "identifier": {
      "@type": "PropertyValue",
      "name": job.company,
      "value": job.externalId || job.id.toString()
    },
    "datePosted": job.createdAt,
    "hiringOrganization": {
      "@type": "Organization",
      "name": job.company,
      "sameAs": job.sourceUrl || undefined
    },
    "jobLocation": {
      "@type": "Place",
      "address": {
        "@type": "PostalAddress",
        "addressLocality": job.location
      }
    },
    "baseSalary": job.salary ? {
      "@type": "MonetaryAmount",
      "currency": "USD",
      "value": {
        "@type": "QuantitativeValue",
        "value": job.salary,
        "unitText": "YEAR"
      }
    } : undefined,
    "employmentType": job.employmentType?.toUpperCase() || "FULL_TIME",
    "applicantLocationRequirements": {
      "@type": "Country",
      "name": "US"
    },
    "jobLocationType": "TELECOMMUTE",
  };

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{job.title} - {job.company} | Virgil St Jobs</title>
        <meta name="description" content={`${job.title} at ${job.company} in ${job.location}. ${job.description?.substring(0, 150) || 'Apply now on Virgil St.'}`} />
        <script type="application/ld+json">
          {JSON.stringify(jobPostingSchema)}
        </script>
      </Helmet>

      <div className="max-w-4xl mx-auto px-4 py-8 pb-24">
        {/* Back Button */}
        <Button variant="ghost" asChild className="mb-4">
          <Link href="/jobs">
            <a>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Jobs
            </a>
          </Link>
        </Button>

        {/* Job Header */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-3xl mb-2">{job.title}</CardTitle>
                <CardDescription className="text-xl font-medium flex items-center gap-2">
                  <Building className="w-5 h-5" />
                  {job.company}
                </CardDescription>
              </div>
            </div>

            <div className="flex flex-wrap gap-4 mt-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="w-4 h-4" />
                <span>{job.location}</span>
              </div>

              {job.salary && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <DollarSign className="w-4 h-4" />
                  <span>{job.salary}</span>
                </div>
              )}

              {job.employmentType && (
                <Badge variant="secondary">{job.employmentType}</Badge>
              )}

              {job.postedDate && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  <span>Posted {job.postedDate}</span>
                </div>
              )}
            </div>
          </CardHeader>

          <Separator />

          <CardContent className="pt-6">
            <div className="flex flex-wrap items-center gap-2">
              <Button size="lg" asChild>
                <a
                  href={normalizedOutboundUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {outboundFavicon ? (
                    <img
                      src={outboundFavicon}
                      alt=""
                      className="mr-2 h-4 w-4 rounded-sm border border-border object-cover"
                      loading="lazy"
                      decoding="async"
                    />
                  ) : null}
                  {job.applyLink ? "Apply Now" : "Find Original Posting"}
                  <ExternalLink className="w-4 h-4 ml-2" />
                </a>
              </Button>
              <Badge variant="outline" className="text-xs">
                Source: {outboundDomain ? `${outboundSourceLabel} • ${outboundDomain}` : outboundSourceLabel}
              </Badge>

              {user && (
                <Dialog open={trackDialogOpen} onOpenChange={setTrackDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="lg" variant="outline">
                      <BookmarkPlus className="w-4 h-4 mr-2" />
                      Track Application
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Track This Application</DialogTitle>
                      <DialogDescription>
                        Keep track of your application progress for {job.title} at {job.company}
                      </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>Company</Label>
                        <Input value={job.company} disabled />
                      </div>

                      <div className="space-y-2">
                        <Label>Position</Label>
                        <Input value={job.title} disabled />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="notes">Notes (Optional)</Label>
                        <Textarea
                          id="notes"
                          placeholder="Add any notes about your application..."
                          value={trackingNotes}
                          onChange={(e) => setTrackingNotes(e.target.value)}
                          rows={3}
                        />
                      </div>
                    </div>

                    <div className="flex gap-2 justify-end">
                      <Button
                        variant="outline"
                        onClick={() => setTrackDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleTrackApplication}
                        disabled={trackApplicationMutation.isPending}
                      >
                        {trackApplicationMutation.isPending ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          "Track Application"
                        )}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Job Description */}
        {job.description && (
          <Card>
            <CardHeader>
              <CardTitle>Job Description</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-invert max-w-none">
                <p className="whitespace-pre-wrap text-muted-foreground">
                  {job.description}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Job Metadata */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Job Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Company:</span>
                <p className="font-medium mt-1">{job.company}</p>
              </div>

              <div>
                <span className="text-muted-foreground">Location:</span>
                <p className="font-medium mt-1">{job.location}</p>
              </div>

              {job.employmentType && (
                <div>
                  <span className="text-muted-foreground">Employment Type:</span>
                  <p className="font-medium mt-1">{job.employmentType}</p>
                </div>
              )}

              {job.salary && (
                <div>
                  <span className="text-muted-foreground">Salary:</span>
                  <p className="font-medium mt-1">{job.salary}</p>
                </div>
              )}

              {job.postedDate && (
                <div>
                  <span className="text-muted-foreground">Posted:</span>
                  <p className="font-medium mt-1">{job.postedDate}</p>
                </div>
              )}

              <div>
                <span className="text-muted-foreground">Views:</span>
                <p className="font-medium mt-1">{job.viewCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
