import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { Link, useLocation } from "wouter";
import { ArrowLeft, Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { getLoginUrl } from "@/const";

const CATEGORIES = [
  { value: "survival_tips", label: "Survival Tips", description: "Share practical advice for daily survival" },
  { value: "emotional_support", label: "Emotional Support", description: "Connect with others for encouragement" },
  { value: "shelter_reviews", label: "Shelter Reviews", description: "Share experiences with shelters and services" },
  { value: "ride_shares", label: "Ride Shares", description: "Coordinate transportation with others" },
  { value: "legal_help", label: "Legal Help", description: "Ask questions about legal issues" },
  { value: "urgent_needs", label: "Urgent Needs", description: "Request immediate assistance" },
  { value: "general", label: "General", description: "Everything else" },
];

export default function ForumNewPost() {
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState<string>("");
  const [isAnonymous, setIsAnonymous] = useState(false);

  const createPostMutation = trpc.forum.createPost.useMutation({
    onSuccess: (data) => {
      toast.success("Post created successfully!");
      navigate(`/forum/${data.postId}`);
    },
    onError: () => {
      toast.error("Failed to create post");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }

    if (!content.trim()) {
      toast.error("Content is required");
      return;
    }

    if (!category) {
      toast.error("Please select a category");
      return;
    }

    createPostMutation.mutate({
      title: title.trim(),
      content: content.trim(),
      category: category as any,
      isAnonymous,
    });
  };

  if (!isAuthenticated) {
    return (
      <div className="container flex min-h-screen items-center justify-center py-20">
        <Card className="max-w-md p-8 text-center">
          <h2 className="mb-4 text-2xl font-bold text-card-foreground">
            Sign In to Post
          </h2>
          <p className="mb-6 text-muted-foreground">
            Create an account to share with the community
          </p>
          <Button asChild className="w-full">
            <a href={getLoginUrl()}>Sign In</a>
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container flex items-center justify-between py-4">
          <div className="flex items-center gap-4">
            <Link href="/forum">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-bold text-card-foreground">Create New Post</h1>
              <p className="text-sm text-muted-foreground">Share with the community</p>
            </div>
          </div>
        </div>
      </header>

      <div className="container py-8">
        <div className="mx-auto max-w-3xl">
          <Card>
            <CardHeader>
              <CardTitle>New Forum Post</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Category */}
                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger id="category">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          <div>
                            <div className="font-semibold">{cat.label}</div>
                            <div className="text-xs text-muted-foreground">
                              {cat.description}
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Title */}
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="What's your post about?"
                    maxLength={500}
                  />
                  <p className="text-xs text-muted-foreground">
                    {title.length}/500 characters
                  </p>
                </div>

                {/* Content */}
                <div className="space-y-2">
                  <Label htmlFor="content">Content *</Label>
                  <Textarea
                    id="content"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Share your thoughts, questions, or experiences..."
                    className="min-h-[200px]"
                  />
                  <p className="text-xs text-muted-foreground">
                    Be respectful and helpful. This is a community support space.
                  </p>
                </div>

                {/* Anonymous Option */}
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="anonymous"
                    checked={isAnonymous}
                    onCheckedChange={(checked) => setIsAnonymous(checked as boolean)}
                  />
                  <Label htmlFor="anonymous" className="text-sm">
                    Post anonymously
                  </Label>
                </div>

                {/* Submit */}
                <div className="flex gap-4">
                  <Link href="/forum">
                    <Button type="button" variant="outline">
                      Cancel
                    </Button>
                  </Link>
                  <Button
                    type="submit"
                    disabled={createPostMutation.isPending}
                    className="gap-2"
                  >
                    {createPostMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                    Create Post
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
