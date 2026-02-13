import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { BookmarkIcon, MapPinIcon, MessageSquareIcon } from "lucide-react";
import { Link } from "wouter";

export default function Favorites() {
  const { user, isAuthenticated } = useAuth();

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
      <div className="min-h-screen bg-black text-gray-100">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-2xl mx-auto text-center">
            <BookmarkIcon className="w-16 h-16 mx-auto mb-6 text-amber-500" />
            <h1 className="text-4xl font-black mb-4">Your Favorites</h1>
            <p className="text-gray-400 mb-8">
              Sign in to bookmark articles, save map locations, and follow forum threads.
            </p>
            <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700">
              <a href={getLoginUrl()}>Sign In</a>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-gray-100">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-black mb-2">Your Favorites</h1>
          <p className="text-gray-400">Quick access to everything you've saved</p>
        </div>

        <Tabs defaultValue="articles" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-zinc-900">
            <TabsTrigger value="articles" className="data-[state=active]:bg-amber-500 data-[state=active]:text-black">
              <BookmarkIcon className="w-4 h-4 mr-2" />
              Articles ({favoriteArticles?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="pins" className="data-[state=active]:bg-amber-500 data-[state=active]:text-black">
              <MapPinIcon className="w-4 h-4 mr-2" />
              Locations ({favoriteMapPins?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="threads" className="data-[state=active]:bg-amber-500 data-[state=active]:text-black">
              <MessageSquareIcon className="w-4 h-4 mr-2" />
              Threads ({followedThreads?.length || 0})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="articles" className="mt-6">
            {articlesLoading ? (
              <p className="text-center text-gray-400 py-8">Loading...</p>
            ) : favoriteArticles && favoriteArticles.length > 0 ? (
              <div className="grid gap-4">
                {favoriteArticles.map((item) => (
                  <Card key={item.id} className="bg-zinc-900 border-zinc-800 hover:border-amber-500/50 transition-colors">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-xl mb-2">
                            <Link href={`/library/${item.slug}`} className="hover:text-amber-500">
                              {item.title}
                            </Link>
                          </CardTitle>
                          <CardDescription className="text-gray-400">
                            {item.summary || "No summary available"}
                          </CardDescription>
                        </div>
                        <span className="px-3 py-1 bg-zinc-800 text-amber-500 text-xs font-bold rounded-full uppercase">
                          {item.category}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-500">
                        Saved {new Date(item.createdAt).toLocaleDateString()}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="bg-zinc-900 border-zinc-800">
                <CardContent className="py-12 text-center">
                  <BookmarkIcon className="w-12 h-12 mx-auto mb-4 text-gray-600" />
                  <p className="text-gray-400 mb-4">No bookmarked articles yet</p>
                  <Button asChild variant="outline">
                    <Link href="/library">Browse Articles</Link>
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="pins" className="mt-6">
            {pinsLoading ? (
              <p className="text-center text-gray-400 py-8">Loading...</p>
            ) : favoriteMapPins && favoriteMapPins.length > 0 ? (
              <div className="grid gap-4">
                {favoriteMapPins.map((item) => (
                  <Card key={item.id} className="bg-zinc-900 border-zinc-800 hover:border-amber-500/50 transition-colors">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-xl mb-2">
                            <Link href="/map" className="hover:text-amber-500">
                              {item.title}
                            </Link>
                          </CardTitle>
                          <CardDescription className="text-gray-400">
                            {item.description || "No description"}
                          </CardDescription>
                        </div>
                        <span className="px-3 py-1 bg-zinc-800 text-amber-500 text-xs font-bold rounded-full uppercase">
                          {item.type.replace("_", " ")}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-500">
                        Saved {new Date(item.createdAt).toLocaleDateString()}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="bg-zinc-900 border-zinc-800">
                <CardContent className="py-12 text-center">
                  <MapPinIcon className="w-12 h-12 mx-auto mb-4 text-gray-600" />
                  <p className="text-gray-400 mb-4">No saved locations yet</p>
                  <Button asChild variant="outline">
                    <Link href="/map">Explore Map</Link>
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="threads" className="mt-6">
            {threadsLoading ? (
              <p className="text-center text-gray-400 py-8">Loading...</p>
            ) : followedThreads && followedThreads.length > 0 ? (
              <div className="grid gap-4">
                {followedThreads.map((item) => (
                  <Card key={item.id} className="bg-zinc-900 border-zinc-800 hover:border-amber-500/50 transition-colors">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-xl mb-2">
                            <Link href={`/forum/${item.postId}`} className="hover:text-amber-500">
                              {item.title}
                            </Link>
                          </CardTitle>
                          <div className="flex items-center gap-4 text-sm text-gray-400 mt-2">
                            <span>{item.replyCount} replies</span>
                            <span>{item.upvotes} upvotes</span>
                          </div>
                        </div>
                        <span className="px-3 py-1 bg-zinc-800 text-amber-500 text-xs font-bold rounded-full uppercase">
                          {item.category.replace("_", " ")}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-500">
                        Followed {new Date(item.createdAt).toLocaleDateString()}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="bg-zinc-900 border-zinc-800">
                <CardContent className="py-12 text-center">
                  <MessageSquareIcon className="w-12 h-12 mx-auto mb-4 text-gray-600" />
                  <p className="text-gray-400 mb-4">No followed threads yet</p>
                  <Button asChild variant="outline">
                    <Link href="/forum">Browse Forum</Link>
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
