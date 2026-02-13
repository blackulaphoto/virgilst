import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import {
  ArrowLeft,
  Search as SearchIcon,
  FileText,
  MessageSquare,
  MapPin,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Search() {
  const [query, setQuery] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: results, isLoading } = trpc.search.global.useQuery(
    { query: searchQuery },
    { enabled: searchQuery.length > 0 }
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setSearchQuery(query.trim());
    }
  };

  const totalResults =
    (results?.articles.length || 0) +
    (results?.forumPosts.length || 0) +
    (results?.resources.length || 0);

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
              <h1 className="text-xl font-bold text-card-foreground">Search</h1>
              <p className="text-sm text-muted-foreground">Find what you need</p>
            </div>
          </div>
        </div>
      </header>

      <div className="container py-8">
        {/* Search Form */}
        <form onSubmit={handleSearch} className="mb-8">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search articles, forum posts, resources..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10 pr-24"
            />
            <Button
              type="submit"
              size="sm"
              className="absolute right-2 top-1/2 -translate-y-1/2"
              disabled={!query.trim()}
            >
              Search
            </Button>
          </div>
        </form>

        {/* Results */}
        {!searchQuery ? (
          <Card className="p-12 text-center">
            <SearchIcon className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="mb-2 text-lg font-semibold text-card-foreground">
              Search Across Everything
            </h3>
            <p className="text-muted-foreground">
              Find articles, forum posts, and resources all in one place
            </p>
          </Card>
        ) : isLoading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-6 w-3/4 rounded bg-muted" />
                  <div className="mt-2 h-4 w-1/2 rounded bg-muted" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : totalResults === 0 ? (
          <Card className="p-12 text-center">
            <SearchIcon className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="mb-2 text-lg font-semibold text-card-foreground">No results found</h3>
            <p className="text-muted-foreground">
              Try different keywords or check your spelling
            </p>
          </Card>
        ) : (
          <div>
            <div className="mb-6">
              <p className="text-sm text-muted-foreground">
                Found {totalResults} result{totalResults !== 1 ? "s" : ""} for "{searchQuery}"
              </p>
            </div>

            <Tabs defaultValue="all" className="w-full">
              <TabsList className="mb-6">
                <TabsTrigger value="all">
                  All ({totalResults})
                </TabsTrigger>
                <TabsTrigger value="articles">
                  Articles ({results?.articles.length || 0})
                </TabsTrigger>
                <TabsTrigger value="forum">
                  Forum ({results?.forumPosts.length || 0})
                </TabsTrigger>
                <TabsTrigger value="resources">
                  Resources ({results?.resources.length || 0})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="space-y-4">
                {/* Articles */}
                {results?.articles.map((article) => (
                  <Link key={`article-${article.id}`} href={`/library/${article.slug}`}>
                    <Card className="group cursor-pointer transition-all hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10">
                      <CardContent className="p-6">
                        <div className="mb-2 flex items-center gap-2">
                          <FileText className="h-4 w-4 text-primary" />
                          <Badge variant="secondary" className="text-xs">Article</Badge>
                          <Badge variant="outline" className="text-xs capitalize">
                            {article.category.replace("_", " ")}
                          </Badge>
                        </div>
                        <h3 className="mb-2 text-lg font-bold text-card-foreground group-hover:text-primary">
                          {article.title}
                        </h3>
                        {article.summary && (
                          <p className="line-clamp-2 text-sm text-muted-foreground">
                            {article.summary}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  </Link>
                ))}

                {/* Forum Posts */}
                {results?.forumPosts.map((post) => (
                  <Link key={`post-${post.id}`} href={`/forum/${post.id}`}>
                    <Card className="group cursor-pointer transition-all hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10">
                      <CardContent className="p-6">
                        <div className="mb-2 flex items-center gap-2">
                          <MessageSquare className="h-4 w-4 text-blue-500" />
                          <Badge variant="secondary" className="text-xs">Forum Post</Badge>
                          <Badge variant="outline" className="text-xs capitalize">
                            {post.category.replace("_", " ")}
                          </Badge>
                        </div>
                        <h3 className="mb-2 text-lg font-bold text-card-foreground group-hover:text-primary">
                          {post.title}
                        </h3>
                        <p className="line-clamp-2 text-sm text-muted-foreground">
                          {post.content}
                        </p>
                      </CardContent>
                    </Card>
                  </Link>
                ))}

                {/* Resources */}
                {results?.resources.map((resource) => (
                  <Card key={`resource-${resource.id}`} className="group transition-all hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10">
                    <CardContent className="p-6">
                      <div className="mb-2 flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-green-500" />
                        <Badge variant="secondary" className="text-xs">Resource</Badge>
                        <Badge variant="outline" className="text-xs capitalize">
                          {resource.type}
                        </Badge>
                      </div>
                      <h3 className="mb-2 text-lg font-bold text-card-foreground group-hover:text-primary">
                        {resource.name}
                      </h3>
                      {resource.description && (
                        <p className="line-clamp-2 text-sm text-muted-foreground">
                          {resource.description}
                        </p>
                      )}
                      {resource.address && (
                        <p className="mt-2 text-xs text-muted-foreground">
                          {resource.address}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="articles" className="space-y-4">
                {results?.articles.map((article) => (
                  <Link key={article.id} href={`/library/${article.slug}`}>
                    <Card className="group cursor-pointer transition-all hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10">
                      <CardContent className="p-6">
                        <Badge variant="outline" className="mb-2 text-xs capitalize">
                          {article.category.replace("_", " ")}
                        </Badge>
                        <h3 className="mb-2 text-lg font-bold text-card-foreground group-hover:text-primary">
                          {article.title}
                        </h3>
                        {article.summary && (
                          <p className="line-clamp-2 text-sm text-muted-foreground">
                            {article.summary}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </TabsContent>

              <TabsContent value="forum" className="space-y-4">
                {results?.forumPosts.map((post) => (
                  <Link key={post.id} href={`/forum/${post.id}`}>
                    <Card className="group cursor-pointer transition-all hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10">
                      <CardContent className="p-6">
                        <Badge variant="outline" className="mb-2 text-xs capitalize">
                          {post.category.replace("_", " ")}
                        </Badge>
                        <h3 className="mb-2 text-lg font-bold text-card-foreground group-hover:text-primary">
                          {post.title}
                        </h3>
                        <p className="line-clamp-2 text-sm text-muted-foreground">
                          {post.content}
                        </p>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </TabsContent>

              <TabsContent value="resources" className="space-y-4">
                {results?.resources.map((resource) => (
                  <Card key={resource.id} className="group transition-all hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10">
                    <CardContent className="p-6">
                      <Badge variant="outline" className="mb-2 text-xs capitalize">
                        {resource.type}
                      </Badge>
                      <h3 className="mb-2 text-lg font-bold text-card-foreground group-hover:text-primary">
                        {resource.name}
                      </h3>
                      {resource.description && (
                        <p className="line-clamp-2 text-sm text-muted-foreground">
                          {resource.description}
                        </p>
                      )}
                      {resource.address && (
                        <p className="mt-2 text-xs text-muted-foreground">
                          {resource.address}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
    </div>
  );
}
