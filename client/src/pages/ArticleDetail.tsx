import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Link, useParams } from "wouter";
import { BookOpen, Eye, Calendar, BookmarkIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Streamdown } from "streamdown";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import { useSeo } from "@/lib/seo";
import PublicLayout from "@/components/PublicLayout";
import { formatDate, toIsoDate } from "@/lib/dateTime";
import SectionBlock from "@/components/SectionBlock";

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
            datePublished: toIsoDate(article.createdAt),
            dateModified: toIsoDate(article.updatedAt || article.createdAt),
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
      <PublicLayout title="Loading article...">
        <SectionBlock>
          <div className="mx-auto max-w-3xl space-y-4">
            <div className="h-12 w-3/4 animate-pulse rounded bg-muted" />
            <div className="h-6 w-1/2 animate-pulse rounded bg-muted" />
            <div className="space-y-2">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="h-4 w-full animate-pulse rounded bg-muted" />
              ))}
            </div>
          </div>
        </SectionBlock>
      </PublicLayout>
    );
  }

  if (!article) {
    return (
      <PublicLayout title="Article Not Found">
        <SectionBlock>
          <div className="flex items-center justify-center">
            <Card className="surface-card max-w-md p-8 text-center">
              <BookOpen className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
              <h2 className="mb-2 text-2xl font-bold text-card-foreground">Article Not Found</h2>
              <p className="mb-6 text-muted-foreground">
                The article you are looking for does not exist or has been removed.
              </p>
              <Link href="/articles">
                <Button>Back to Articles</Button>
              </Link>
            </Card>
          </div>
        </SectionBlock>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout
      actions={
        <Button
          variant={isFavorited ? "default" : "outline"}
          size="sm"
          onClick={handleToggleFavorite}
          disabled={addFavoriteMutation.isPending || removeFavoriteMutation.isPending}
        >
          <BookmarkIcon className={`mr-2 h-4 w-4 ${isFavorited ? "fill-current" : ""}`} />
          {isFavorited ? "Bookmarked" : "Bookmark"}
        </Button>
      }
    >
      <SectionBlock>
        <article className="mx-auto max-w-3xl">
          <div className="mb-6">
            <Badge variant="secondary" className="mb-4 capitalize">
              {article.category.replace("_", " ")}
            </Badge>
            <h1 className="mb-4 text-4xl font-bold text-foreground md:text-5xl">{article.title}</h1>
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Eye className="h-4 w-4" />
                <span>{article.viewCount} views</span>
              </div>
              <span>•</span>
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>{formatDate(article.createdAt)}</span>
              </div>
            </div>
          </div>

          {article.summary && (
            <Card className="surface-card mb-8 border-l-4 border-l-primary p-6">
              <p className="text-lg text-card-foreground">{article.summary}</p>
            </Card>
          )}

          <div className="prose prose-slate max-w-none">
            <Streamdown>{article.content}</Streamdown>
          </div>

          {relatedLinks.length > 0 && (
            <div className="mt-8 rounded-lg border border-border bg-card/40 p-4">
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

          <div className="mt-12 border-t border-border pt-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-between">
              <Link href="/articles">
                <Button variant="outline">Back to Articles</Button>
              </Link>
              <Link href="/chat">
                <Button>Ask Virgil About This</Button>
              </Link>
            </div>
          </div>
        </article>
      </SectionBlock>
    </PublicLayout>
  );
}
