import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { BookmarkIcon, MapPinIcon, MessageSquareIcon } from "lucide-react";
import { Link } from "wouter";
import PublicLayout from "@/components/PublicLayout";
import SectionBlock from "@/components/SectionBlock";

export default function Favorites() {
  const { isAuthenticated } = useAuth();

  const { data: favoriteArticles, isLoading: articlesLoading } = trpc.favorites.getArticles.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  const { data: favoriteMapPins, isLoading: pinsLoading } = trpc.favorites.getMapPins.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  const { data: followedThreads, isLoading: threadsLoading } = trpc.favorites.getThreads.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  if (!isAuthenticated) {
    return (
      <PublicLayout title="Your Favorites" subtitle="Save articles, map locations, and discussion threads in one place.">
        <SectionBlock>
          <Card className="surface-card mx-auto max-w-2xl p-10 text-center">
            <BookmarkIcon className="mx-auto mb-6 h-16 w-16 text-primary" />
            <h2 className="mb-4 text-3xl font-bold text-card-foreground">Sign in to view favorites</h2>
            <p className="mb-8 text-muted-foreground">
              Bookmark articles, save map locations, and follow forum threads.
            </p>
            <Button asChild size="lg">
              <a href={getLoginUrl()}>Sign In</a>
            </Button>
          </Card>
        </SectionBlock>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout title="Your Favorites" subtitle="Quick access to everything you have saved.">
      <SectionBlock>
        <Tabs defaultValue="articles" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-secondary">
            <TabsTrigger value="articles">
              <BookmarkIcon className="mr-2 h-4 w-4" />
              Articles ({favoriteArticles?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="pins">
              <MapPinIcon className="mr-2 h-4 w-4" />
              Locations ({favoriteMapPins?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="threads">
              <MessageSquareIcon className="mr-2 h-4 w-4" />
              Threads ({followedThreads?.length || 0})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="articles" className="mt-6">
            {articlesLoading ? (
              <p className="py-8 text-center text-muted-foreground">Loading...</p>
            ) : favoriteArticles && favoriteArticles.length > 0 ? (
              <div className="grid gap-4">
                {favoriteArticles.map((item) => (
                  <Card key={item.id} className="surface-card transition-colors hover:border-primary/40">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="mb-2 text-xl">
                            <Link href={`/articles/${item.slug}`} className="hover:text-primary">
                              {item.title}
                            </Link>
                          </CardTitle>
                          <CardDescription className="text-muted-foreground">
                            {item.summary || "No summary available"}
                          </CardDescription>
                        </div>
                        <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold uppercase text-secondary-foreground">
                          {item.category}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        Saved {new Date(item.createdAt).toLocaleDateString()}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="surface-card">
                <CardContent className="py-12 text-center">
                  <BookmarkIcon className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                  <p className="mb-4 text-muted-foreground">No bookmarked articles yet.</p>
                  <Button asChild variant="outline">
                    <Link href="/articles">Browse Articles</Link>
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="pins" className="mt-6">
            {pinsLoading ? (
              <p className="py-8 text-center text-muted-foreground">Loading...</p>
            ) : favoriteMapPins && favoriteMapPins.length > 0 ? (
              <div className="grid gap-4">
                {favoriteMapPins.map((item) => (
                  <Card key={item.id} className="surface-card transition-colors hover:border-primary/40">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="mb-2 text-xl">
                            <Link href="/map" className="hover:text-primary">
                              {item.title}
                            </Link>
                          </CardTitle>
                          <CardDescription className="text-muted-foreground">
                            {item.description || "No description"}
                          </CardDescription>
                        </div>
                        <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold uppercase text-secondary-foreground">
                          {item.type.replace("_", " ")}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        Saved {new Date(item.createdAt).toLocaleDateString()}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="surface-card">
                <CardContent className="py-12 text-center">
                  <MapPinIcon className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                  <p className="mb-4 text-muted-foreground">No saved locations yet.</p>
                  <Button asChild variant="outline">
                    <Link href="/map">Explore Map</Link>
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="threads" className="mt-6">
            {threadsLoading ? (
              <p className="py-8 text-center text-muted-foreground">Loading...</p>
            ) : followedThreads && followedThreads.length > 0 ? (
              <div className="grid gap-4">
                {followedThreads.map((item) => (
                  <Card key={item.id} className="surface-card transition-colors hover:border-primary/40">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="mb-2 text-xl">
                            <Link href={`/forum/${item.postId}`} className="hover:text-primary">
                              {item.title}
                            </Link>
                          </CardTitle>
                          <div className="mt-2 flex items-center gap-4 text-sm text-muted-foreground">
                            <span>{item.replyCount} replies</span>
                            <span>{item.upvotes} upvotes</span>
                          </div>
                        </div>
                        <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold uppercase text-secondary-foreground">
                          {item.category.replace("_", " ")}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        Followed {new Date(item.createdAt).toLocaleDateString()}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="surface-card">
                <CardContent className="py-12 text-center">
                  <MessageSquareIcon className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                  <p className="mb-4 text-muted-foreground">No followed threads yet.</p>
                  <Button asChild variant="outline">
                    <Link href="/forum">Browse Forum</Link>
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </SectionBlock>
    </PublicLayout>
  );
}
