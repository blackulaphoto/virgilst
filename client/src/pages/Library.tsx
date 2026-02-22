import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import {
  BookOpen,
  Search,
  FileText,
  Home,
  Scale,
  Heart,
  Briefcase,
  CreditCard,
  AlertCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import PublicLayout from "@/components/PublicLayout";
import SectionBlock from "@/components/SectionBlock";

const CATEGORIES = [
  { value: "benefits", label: "Benefits", icon: CreditCard, color: "bg-primary/10 text-primary" },
  { value: "housing", label: "Housing", icon: Home, color: "bg-accent/20 text-accent-foreground" },
  { value: "legal", label: "Legal", icon: Scale, color: "bg-secondary text-secondary-foreground" },
  { value: "health", label: "Health", icon: Heart, color: "bg-primary/10 text-primary" },
  { value: "employment", label: "Employment", icon: Briefcase, color: "bg-secondary text-secondary-foreground" },
  { value: "identification", label: "ID and Docs", icon: FileText, color: "bg-accent/20 text-accent-foreground" },
  { value: "emergency", label: "Emergency", icon: AlertCircle, color: "bg-[var(--cta)]/15 text-[var(--cta)]" },
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
    <PublicLayout title="Resource Library" subtitle="Step-by-step guides for benefits, housing, legal issues, healthcare, and practical survival workflows.">
      <SectionBlock className="pt-8">
        <div className="mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search articles..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="mb-8">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Categories</h2>
          <div className="flex flex-wrap gap-2">
            <Button variant={!selectedCategory ? "default" : "outline"} size="sm" onClick={() => setSelectedCategory(undefined)}>
              All
            </Button>
            {CATEGORIES.map(cat => {
              const Icon = cat.icon;
              return (
                <Button key={cat.value} variant={selectedCategory === cat.value ? "default" : "outline"} size="sm" onClick={() => setSelectedCategory(cat.value)} className="gap-2">
                  <Icon className="h-4 w-4" />
                  {cat.label}
                </Button>
              );
            })}
          </div>
        </div>

        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="surface-card animate-pulse">
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
          <Card className="surface-card p-12 text-center">
            <BookOpen className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="mb-2 text-lg font-semibold text-card-foreground">No articles found</h3>
            <p className="text-muted-foreground">
              {searchQuery ? "Try a different search term" : "No articles available in this category"}
            </p>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredArticles.map(article => {
              const category = CATEGORIES.find(c => c.value === article.category);
              const Icon = category?.icon || FileText;

              return (
                <Link key={article.id} href={`/articles/${article.slug}`}>
                  <Card className="surface-card group h-full cursor-pointer">
                    <CardHeader>
                      <div className="mb-2 flex items-center gap-2">
                        <div className={`inline-flex rounded-lg p-2 ${category?.color}`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {category?.label}
                        </Badge>
                      </div>
                      <CardTitle className="line-clamp-2 text-lg group-hover:text-primary">{article.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {article.summary && <p className="line-clamp-3 text-sm text-muted-foreground">{article.summary}</p>}
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
      </SectionBlock>
    </PublicLayout>
  );
}
