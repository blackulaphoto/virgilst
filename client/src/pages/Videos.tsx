import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { ArrowLeft, Video, Play } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const CATEGORIES = [
  { value: "how_to_guides", label: "How-To Guides", color: "bg-primary/10 text-primary" },
  { value: "legal_help", label: "Legal Help", color: "bg-purple-500/10 text-purple-500" },
  { value: "recovery_motivation", label: "Recovery & Motivation", color: "bg-blue-500/10 text-blue-500" },
  { value: "street_hacks", label: "Street Hacks", color: "bg-green-500/10 text-green-500" },
  { value: "mental_health", label: "Mental Health", color: "bg-red-500/10 text-red-500" },
];

export default function Videos() {
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>();
  const [selectedVideo, setSelectedVideo] = useState<{ id: string; title: string } | null>(null);

  const { data: videos, isLoading } = trpc.videos.list.useQuery({
    category: selectedCategory,
  });

  const filteredVideos = videos || [];

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
              <h1 className="text-xl font-bold text-card-foreground">Video Library</h1>
              <p className="text-sm text-muted-foreground">Watch and learn</p>
            </div>
          </div>
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

        {/* Videos Grid */}
        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <div className="aspect-video w-full rounded-t-lg bg-muted" />
                <CardContent className="p-4">
                  <div className="h-6 w-3/4 rounded bg-muted" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredVideos.length === 0 ? (
          <Card className="p-12 text-center">
            <Video className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="mb-2 text-lg font-semibold text-card-foreground">No videos found</h3>
            <p className="text-muted-foreground">
              No videos available in this category
            </p>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredVideos.map((video) => {
              const category = CATEGORIES.find((c) => c.value === video.category);
              const thumbnailUrl = video.thumbnailUrl || `https://img.youtube.com/vi/${video.youtubeId}/maxresdefault.jpg`;

              return (
                <Card
                  key={video.id}
                  className="group cursor-pointer overflow-hidden transition-all hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10"
                  onClick={() => setSelectedVideo({ id: video.youtubeId, title: video.title })}
                >
                  <div className="relative aspect-video w-full overflow-hidden bg-muted">
                    <img
                      src={thumbnailUrl}
                      alt={video.title}
                      className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary">
                        <Play className="h-8 w-8 text-primary-foreground" />
                      </div>
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <Badge variant="secondary" className={`mb-2 text-xs ${category?.color}`}>
                      {category?.label}
                    </Badge>
                    <h3 className="line-clamp-2 font-semibold text-card-foreground group-hover:text-primary">
                      {video.title}
                    </h3>
                    {video.description && (
                      <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                        {video.description}
                      </p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Video Player Dialog */}
      <Dialog open={!!selectedVideo} onOpenChange={() => setSelectedVideo(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{selectedVideo?.title}</DialogTitle>
          </DialogHeader>
          {selectedVideo && (
            <div className="aspect-video w-full">
              <iframe
                width="100%"
                height="100%"
                src={`https://www.youtube.com/embed/${selectedVideo.id}?autoplay=1`}
                title={selectedVideo.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="rounded-lg"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
