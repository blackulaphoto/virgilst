import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Link, useParams } from "wouter";
import { ArrowLeft, BookOpen, Eye, Calendar, BookmarkIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Streamdown } from "streamdown";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";

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
          <Link href="/library">
            <Button>Back to Library</Button>
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
          <Link href="/library">
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
          <div className="mt-12 border-t border-border pt-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-between">
              <Link href="/library">
                <Button variant="outline">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Library
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
