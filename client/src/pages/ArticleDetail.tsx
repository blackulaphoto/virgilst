import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Link, useParams } from "wouter";
import { ArrowLeft, BookOpen, Eye, Calendar, BookmarkIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Streamdown } from "streamdown";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import { useSeo } from "@/lib/seo";

const BASE_URL = "https://www.virgilst.com";

function stripMarkdown(input: string) {
  return input
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`]*`/g, " ")
    .replace(/!\[[^\]]*]\([^)]*\)/g, " ")
    .replace(/\[[^\]]*]\([^)]*\)/g, " ")
    .replace(/[#>*_~\-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getRelatedHubLinks(category: string) {
  switch (category) {
    case "housing":
      return [
        { href: "/resources/housing", label: "Housing Resources" },
        { href: "/resources/shelter", label: "Emergency Shelter Resources" },
        { href: "/treatment", label: "Explore Treatment Options" },
      ];
    case "benefits":
      return [
        { href: "/resources/food", label: "Food and Benefits Resources" },
        { href: "/resources/legal", label: "Benefits Legal Support" },
        { href: "/resources", label: "Browse All Resources" },
      ];
    case "health":
      return [
        { href: "/medical-providers", label: "Medi-Cal Providers" },
        { href: "/resources/dental", label: "Healthcare and Dental Resources" },
        { href: "/treatment", label: "Find Treatment Programs" },
      ];
    default:
      return [
        { href: "/resources", label: "Browse Resources" },
        { href: "/resources/legal", label: "Legal Services" },
        { href: "/treatment", label: "Find Treatment Programs" },
      ];
  }
}

export default function ArticleDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { isAuthenticated } = useAuth();
  const { data: article, isLoading } = trpc.articles.bySlug.useQuery({ slug: slug! });
  const { data: isFavorited, refetch: refetchFavorite } = trpc.favorites.isArticleFavorited.useQuery(
    { articleId: article?.id || 0 },
    { enabled: isAuthenticated && !!article }
  );

  const addFavoriteMutation = trpc.favorites.addArticle.useMutation({
    onSuccess: () => {
      toast.success("Article bookmarked!");
      refetchFavorite();
    },
  });

  const removeFavoriteMutation = trpc.favorites.removeArticle.useMutation({
    onSuccess: () => {
      toast.success("Bookmark removed");
      refetchFavorite();
    },
  });

  const description = article?.summary || (article?.content ? stripMarkdown(article.content).slice(0, 155) : "");
  const canonical = `${BASE_URL}/articles/${slug || ""}`;
  const relatedLinks = article ? getRelatedHubLinks(article.category) : [];

  useSeo({
    title: article ? `${article.title} | Virgil St` : "Article | Virgil St",
    description:
      description ||
      "Read a practical social-services guide from Virgil St covering housing, benefits, treatment, and crisis response.",
    canonical,
    robots: "index,follow",
    ogType: "article",
    ogImage: `${BASE_URL}/og-image.png`,
    jsonLd: article
      ? [
          {
            "@context": "https://schema.org",
            "@type": "Article",
            headline: article.title,
            description,
            url: canonical,
            datePublished: new Date(article.createdAt).toISOString(),
            dateModified: new Date(article.updatedAt || article.createdAt).toISOString(),
            author: { "@type": "Organization", name: "Virgil St" },
            publisher: { "@type": "Organization", name: "Virgil St" },
          },
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              {
                "@type": "ListItem",
                position: 1,
                name: "Articles",
                item: `${BASE_URL}/articles`,
              },
              {
                "@type": "ListItem",
                position: 2,
                name: article.title,
                item: canonical,
              },
            ],
          },
        ]
      : [],
  });

  const handleToggleFavorite = () => {
    if (!isAuthenticated) {
      toast.error("Please sign in to bookmark articles");
      return;
    }
    if (!article) return;

    if (isFavorited) {
      removeFavoriteMutation.mutate({ articleId: article.id });
    } else {
      addFavoriteMutation.mutate({ articleId: article.id });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-card">
          <div className="container py-4">
            <div className="h-8 w-48 animate-pulse rounded bg-muted" />
          </div>
        </header>
        <div className="container py-8">
          <div className="mx-auto max-w-3xl space-y-4">
            <div className="h-12 w-3/4 animate-pulse rounded bg-muted" />
            <div className="h-6 w-1/2 animate-pulse rounded bg-muted" />
            <div className="space-y-2">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="h-4 w-full animate-pulse rounded bg-muted" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Card className="max-w-md p-8 text-center">
          <BookOpen className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
          <h2 className="mb-2 text-2xl font-bold text-card-foreground">Article Not Found</h2>
          <p className="mb-6 text-muted-foreground">
            The article you're looking for doesn't exist or has been removed.
          </p>
          <Link href="/articles">
            <Button>Back to Articles</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container flex items-center justify-between py-4">
          <Link href="/articles">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          {article && (
            <Button
              variant={isFavorited ? "default" : "outline"}
              size="sm"
              onClick={handleToggleFavorite}
              disabled={addFavoriteMutation.isPending || removeFavoriteMutation.isPending}
            >
              <BookmarkIcon className={`h-4 w-4 mr-2 ${isFavorited ? "fill-current" : ""}`} />
              {isFavorited ? "Bookmarked" : "Bookmark"}
            </Button>
          )}
        </div>
      </header>

      {/* Article Content */}
      <article className="container py-8">
        <div className="mx-auto max-w-3xl">
          {/* Meta */}
          <div className="mb-6">
            <Badge variant="secondary" className="mb-4 capitalize">
              {article.category.replace("_", " ")}
            </Badge>
            <h1 className="mb-4 text-4xl font-bold text-foreground md:text-5xl">
              {article.title}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Eye className="h-4 w-4" />
                <span>{article.viewCount} views</span>
              </div>
              <span>•</span>
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>{new Date(article.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          {/* Summary */}
          {article.summary && (
            <Card className="mb-8 border-l-4 border-l-primary bg-card/50 p-6">
              <p className="text-lg text-card-foreground">{article.summary}</p>
            </Card>
          )}

          {/* Content */}
          <div className="prose prose-invert max-w-none">
            <Streamdown>{article.content}</Streamdown>
          </div>

          {/* Footer Actions */}
          {relatedLinks.length > 0 && (
            <div className="mb-8 rounded-lg border border-border bg-card/40 p-4">
              <h2 className="mb-3 text-lg font-semibold text-card-foreground">Related Help Hubs</h2>
              <div className="flex flex-wrap gap-2">
                {relatedLinks.map((item) => (
                  <Link key={item.href} href={item.href}>
                    <Button variant="outline" size="sm">
                      {item.label}
                    </Button>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="mt-12 border-t border-border pt-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-between">
              <Link href="/articles">
                <Button variant="outline">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Articles
                </Button>
              </Link>
              <Link href="/chat">
                <Button>
                  Ask Virgil About This
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </article>
    </div>
  );
}
