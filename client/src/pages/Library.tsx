import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import {
  BookOpen,
  Search,
  ArrowLeft,
  FileText,
  Home,
  Scale,
  Heart,
  Briefcase,
  CreditCard,
  AlertCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

const CATEGORIES = [
  { value: "benefits", label: "Benefits", icon: CreditCard, color: "bg-primary/10 text-primary" },
  { value: "housing", label: "Housing", icon: Home, color: "bg-blue-500/10 text-blue-500" },
  { value: "legal", label: "Legal", icon: Scale, color: "bg-purple-500/10 text-purple-500" },
  { value: "health", label: "Health", icon: Heart, color: "bg-red-500/10 text-red-500" },
  { value: "employment", label: "Employment", icon: Briefcase, color: "bg-green-500/10 text-green-500" },
  { value: "identification", label: "ID & Docs", icon: FileText, color: "bg-orange-500/10 text-orange-500" },
  { value: "emergency", label: "Emergency", icon: AlertCircle, color: "bg-red-600/10 text-red-600" },
];

export default function Library() {
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: articles, isLoading } = trpc.articles.list.useQuery({
    category: selectedCategory,
    search: searchQuery || undefined,
  });

  const filteredArticles = articles || [];

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
              <h1 className="text-xl font-bold text-card-foreground">Resource Library</h1>
              <p className="text-sm text-muted-foreground">Step-by-step guides</p>
            </div>
          </div>
        </div>
      </header>

      <div className="container py-8">
        {/* Search */}
        <div className="mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Categories */}
        <div className="mb-8">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Categories
          </h2>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={!selectedCategory ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(undefined)}
            >
              All
            </Button>
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              return (
                <Button
                  key={cat.value}
                  variant={selectedCategory === cat.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(cat.value)}
                  className="gap-2"
                >
                  <Icon className="h-4 w-4" />
                  {cat.label}
                </Button>
              );
            })}
          </div>
        </div>

        {/* Articles Grid */}
        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-6 w-3/4 rounded bg-muted" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-4 w-full rounded bg-muted" />
                    <div className="h-4 w-5/6 rounded bg-muted" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredArticles.length === 0 ? (
          <Card className="p-12 text-center">
            <BookOpen className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="mb-2 text-lg font-semibold text-card-foreground">No articles found</h3>
            <p className="text-muted-foreground">
              {searchQuery
                ? "Try a different search term"
                : "No articles available in this category"}
            </p>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredArticles.map((article) => {
              const category = CATEGORIES.find((c) => c.value === article.category);
              const Icon = category?.icon || FileText;

              return (
                <Link key={article.id} href={`/library/${article.slug}`}>
                  <Card className="group h-full cursor-pointer transition-all hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10">
                    <CardHeader>
                      <div className="mb-2 flex items-center gap-2">
                        <div className={`inline-flex rounded-lg p-2 ${category?.color}`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {category?.label}
                        </Badge>
                      </div>
                      <CardTitle className="line-clamp-2 text-lg group-hover:text-primary">
                        {article.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {article.summary && (
                        <p className="line-clamp-3 text-sm text-muted-foreground">
                          {article.summary}
                        </p>
                      )}
                      <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
                        <span>{article.viewCount} views</span>
                        <span>•</span>
                        <span>{new Date(article.createdAt).toLocaleDateString()}</span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
