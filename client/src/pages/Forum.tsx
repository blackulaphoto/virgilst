import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import {
  ArrowLeft,
  MessageSquare,
  Plus,
  Users,
  Eye,
  MessageCircle,
  Pin,
  User,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getLoginUrl } from "@/const";

const CATEGORIES = [
  { value: "survival_tips", label: "Survival Tips", color: "bg-primary/10 text-primary" },
  { value: "emotional_support", label: "Emotional Support", color: "bg-blue-500/10 text-blue-500" },
  { value: "shelter_reviews", label: "Shelter Reviews", color: "bg-purple-500/10 text-purple-500" },
  { value: "ride_shares", label: "Ride Shares", color: "bg-green-500/10 text-green-500" },
  { value: "legal_help", label: "Legal Help", color: "bg-orange-500/10 text-orange-500" },
  { value: "urgent_needs", label: "Urgent Needs", color: "bg-red-600/10 text-red-600" },
  { value: "general", label: "General", color: "bg-gray-500/10 text-gray-500" },
];

export default function Forum() {
  const { isAuthenticated } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>();

  const { data: posts, isLoading } = trpc.forum.posts.useQuery({
    category: selectedCategory,
  });

  const filteredPosts = posts || [];

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
              <h1 className="text-xl font-bold text-card-foreground">Community Forum</h1>
              <p className="text-sm text-muted-foreground">Share tips and support</p>
            </div>
          </div>
          {isAuthenticated ? (
            <Link href="/forum/new">
              <Button size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                New Post
              </Button>
            </Link>
          ) : (
            <Button asChild size="sm">
              <a href={getLoginUrl()}>Sign In to Post</a>
            </Button>
          )}
        </div>
      </header>

      <div className="container py-8">
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
            {CATEGORIES.map((cat) => (
              <Button
                key={cat.value}
                variant={selectedCategory === cat.value ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(cat.value)}
              >
                {cat.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Posts List */}
        {isLoading ? (
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
        ) : filteredPosts.length === 0 ? (
          <Card className="p-12 text-center">
            <Users className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="mb-2 text-lg font-semibold text-card-foreground">No posts yet</h3>
            <p className="mb-6 text-muted-foreground">
              Be the first to start a conversation in this category
            </p>
            {isAuthenticated && (
              <Link href="/forum/new">
                <Button>Create First Post</Button>
              </Link>
            )}
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredPosts.map((post) => {
              const category = CATEGORIES.find((c) => c.value === post.category);

              return (
                <Link key={post.id} href={`/forum/${post.id}`}>
                  <Card className="group cursor-pointer transition-all hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="flex-1">
                          <div className="mb-2 flex items-center gap-2">
                            {post.isPinned && (
                              <Pin className="h-4 w-4 text-primary" />
                            )}
                            <Badge variant="secondary" className={`text-xs ${category?.color}`}>
                              {category?.label}
                            </Badge>
                            {post.isAnonymous && (
                              <Badge variant="outline" className="text-xs">
                                Anonymous
                              </Badge>
                            )}
                          </div>
                          <h3 className="mb-2 text-lg font-bold text-card-foreground group-hover:text-primary">
                            {post.title}
                          </h3>
                          <p className="line-clamp-2 text-sm text-muted-foreground">
                            {post.content}
                          </p>
                          <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
                            {!post.isAnonymous && (post.authorDisplayName || post.authorName) && post.authorId && (
                              <>
                                <Link href={`/profile/${post.authorId}`}>
                                  <div className="flex items-center gap-1 hover:text-primary transition-colors cursor-pointer">
                                    {post.authorAvatar ? (
                                      <img
                                        src={post.authorAvatar}
                                        alt={post.authorDisplayName || post.authorName || ""}
                                        className="h-4 w-4 rounded-full object-cover"
                                      />
                                    ) : (
                                      <User className="h-3 w-3" />
                                    )}
                                    <span>{post.authorDisplayName || post.authorName}</span>
                                  </div>
                                </Link>
                                <span>•</span>
                              </>
                            )}
                            <div className="flex items-center gap-1">
                              <Eye className="h-3 w-3" />
                              <span>{post.viewCount}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <MessageCircle className="h-3 w-3" />
                              <span>{post.replyCount}</span>
                            </div>
                            <span>•</span>
                            <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
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
