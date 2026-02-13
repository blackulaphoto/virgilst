import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { 
  BookOpen, 
  Video, 
  Link as LinkIcon, 
  MapPin, 
  MessageSquare, 
  Users,
  Shield,
  Loader2,
  Plus,
  Check,
  X,
  Trash2,
  Eye
} from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

export default function AdminDashboard() {
  const { user, loading } = useAuth();
  const utils = trpc.useUtils();

  // Dialog states
  const [showArticleDialog, setShowArticleDialog] = useState(false);
  const [showVideoDialog, setShowVideoDialog] = useState(false);
  const [showResourceDialog, setShowResourceDialog] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form states
  const [articleForm, setArticleForm] = useState({
    title: "",
    content: "",
    category: "",
    summary: "",
    tags: "",
  });

  const [videoForm, setVideoForm] = useState<{
    title: string;
    description: string;
    youtubeId: string;
    category: "how_to_guides" | "legal_help" | "recovery_motivation" | "street_hacks" | "mental_health" | "";
  }>({
    title: "",
    description: "",
    youtubeId: "",
    category: "",
  });

  const [resourceForm, setResourceForm] = useState<{
    name: string;
    description: string;
    type: "shelter" | "food" | "medical" | "legal" | "employment" | "clothing" | "hygiene" | "housing" | "transportation" | "other" | "";
    address: string;
    phone: string;
    website: string;
    hours: string;
  }>({
    name: "",
    description: "",
    type: "",
    address: "",
    phone: "",
    website: "",
    hours: "",
  });

  // Queries
  const { data: pendingPins } = trpc.mapPins.pending.useQuery();
  const { data: allArticles } = trpc.articles.list.useQuery({});
  const { data: allVideos } = trpc.videos.list.useQuery({});
  const { data: allResources } = trpc.resources.list.useQuery({});

  // Mutations
  const createArticleMutation = trpc.articles.create.useMutation({
    onSuccess: () => {
      utils.articles.list.invalidate();
      setShowArticleDialog(false);
      setArticleForm({ title: "", content: "", category: "", summary: "", tags: "" });
      toast.success("Article created successfully!");
    },
    onError: () => {
      toast.error("Failed to create article");
    },
  });

  const createVideoMutation = trpc.videos.create.useMutation({
    onSuccess: () => {
      utils.videos.list.invalidate();
      setShowVideoDialog(false);
      setVideoForm({ title: "", description: "", youtubeId: "", category: "" });
      toast.success("Video added successfully!");
    },
    onError: () => {
      toast.error("Failed to add video");
    },
  });

  const createResourceMutation = trpc.resources.create.useMutation({
    onSuccess: () => {
      utils.resources.list.invalidate();
      setShowResourceDialog(false);
      setResourceForm({ name: "", description: "", type: "", address: "", phone: "", website: "", hours: "" });
      toast.success("Resource added successfully!");
    },
    onError: () => {
      toast.error("Failed to add resource");
    },
  });

  const approvePinMutation = trpc.mapPins.approve.useMutation({
    onSuccess: () => {
      utils.mapPins.pending.invalidate();
      utils.mapPins.list.invalidate();
      toast.success("Pin approved!");
    },
    onError: () => {
      toast.error("Failed to approve pin");
    },
  });

  const uploadKnowledgeMutation = trpc.knowledge.upload.useMutation({
    onSuccess: (result) => {
      toast.success(`Uploaded "${result.title}" (${result.chunkCount} chunks)`);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to upload knowledge file");
    },
  });

  const fileToBase64 = (file: File) => new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const value = String(reader.result || "");
      const splitIndex = value.indexOf(",");
      resolve(splitIndex >= 0 ? value.slice(splitIndex + 1) : value);
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });

  const inferMimeType = (file: File): string => {
    if (file.type) return file.type;
    const lower = file.name.toLowerCase();
    if (lower.endsWith(".pdf")) return "application/pdf";
    if (lower.endsWith(".md") || lower.endsWith(".markdown")) return "text/markdown";
    return "text/plain";
  };

  const handleKnowledgeFileSelected = async (file?: File) => {
    if (!file) return;

    const maxBytes = 10 * 1024 * 1024;
    if (file.size > maxBytes) {
      toast.error("File is too large. Max size is 10MB.");
      return;
    }

    const mimeType = inferMimeType(file);
    const allowed = new Set(["application/pdf", "text/markdown", "text/plain"]);
    if (!allowed.has(mimeType)) {
      toast.error("Unsupported file type. Use PDF, Markdown, or plain text.");
      return;
    }

    try {
      const base64Data = await fileToBase64(file);
      uploadKnowledgeMutation.mutate({
        filename: file.name,
        mimeType,
        base64Data,
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to read file");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    window.location.href = getLoginUrl();
    return null;
  }

  if (user.role !== "admin") {
    window.location.href = "/";
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold text-card-foreground">Admin Dashboard</h1>
          </div>
          <Button variant="outline" asChild>
            <a href="/">Back to Site</a>
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="container py-8">
        <Tabs defaultValue="guides" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6 lg:w-auto">
            <TabsTrigger value="guides">
              <BookOpen className="mr-2 h-4 w-4" />
              Guides
            </TabsTrigger>
            <TabsTrigger value="videos">
              <Video className="mr-2 h-4 w-4" />
              Videos
            </TabsTrigger>
            <TabsTrigger value="resources">
              <LinkIcon className="mr-2 h-4 w-4" />
              Resources
            </TabsTrigger>
            <TabsTrigger value="pins">
              <MapPin className="mr-2 h-4 w-4" />
              Map Pins
              {pendingPins && pendingPins.length > 0 && (
                <span className="ml-2 rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                  {pendingPins.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="forum">
              <MessageSquare className="mr-2 h-4 w-4" />
              Forum
            </TabsTrigger>
            <TabsTrigger value="users">
              <Users className="mr-2 h-4 w-4" />
              Users
            </TabsTrigger>
          </TabsList>

          {/* Guides Management */}
          <TabsContent value="guides" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Guide Library Management</CardTitle>
                  <CardDescription>
                    Upload and manage survival guides for the resource library
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => setShowArticleDialog(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    New Guide
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadKnowledgeMutation.isPending}
                  >
                    {uploadKnowledgeMutation.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Plus className="mr-2 h-4 w-4" />
                    )}
                    Upload File
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept=".pdf,.md,.markdown,.txt,application/pdf,text/markdown,text/plain"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      handleKnowledgeFileSelected(file);
                      event.target.value = "";
                    }}
                  />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {allArticles && allArticles.length > 0 ? (
                    allArticles.map((article) => (
                      <div
                        key={article.id}
                        className="flex items-center justify-between rounded-lg border border-border p-4"
                      >
                        <div>
                          <h3 className="font-semibold text-card-foreground">{article.title}</h3>
                          <p className="text-sm text-muted-foreground">
                            {article.category} • {article.viewCount} views
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" asChild>
                            <a href={`/library/${article.slug}`}>
                              <Eye className="h-4 w-4" />
                            </a>
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="py-8 text-center text-sm text-muted-foreground">
                      No guides yet. Create your first one!
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Videos Management */}
          <TabsContent value="videos" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Virgil TV Management</CardTitle>
                  <CardDescription>
                    Add and organize videos for the video library
                  </CardDescription>
                </div>
                <Button onClick={() => setShowVideoDialog(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Video
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {allVideos && allVideos.length > 0 ? (
                    allVideos.map((video) => (
                      <div
                        key={video.id}
                        className="flex items-center justify-between rounded-lg border border-border p-4"
                      >
                        <div>
                          <h3 className="font-semibold text-card-foreground">{video.title}</h3>
                          <p className="text-sm text-muted-foreground">
                            {video.category} • {video.viewCount} views
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" asChild>
                            <a href={`/videos`}>
                              <Eye className="h-4 w-4" />
                            </a>
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="py-8 text-center text-sm text-muted-foreground">
                      No videos yet. Add your first one!
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Resources Management */}
          <TabsContent value="resources" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Resource Links Management</CardTitle>
                  <CardDescription>
                    Add and verify resource links for shelters, services, and support
                  </CardDescription>
                </div>
                <Button onClick={() => setShowResourceDialog(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Resource
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {allResources && allResources.length > 0 ? (
                    allResources.map((resource) => (
                      <div
                        key={resource.id}
                        className="flex items-center justify-between rounded-lg border border-border p-4"
                      >
                        <div>
                          <h3 className="font-semibold text-card-foreground">{resource.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {resource.type} • {resource.address || "No address"}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="py-8 text-center text-sm text-muted-foreground">
                      No resources yet. Add your first one!
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Map Pins Moderation */}
          <TabsContent value="pins" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Map Pin Moderation</CardTitle>
                <CardDescription>
                  Review and approve community-submitted map pins
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {pendingPins && pendingPins.length > 0 ? (
                    pendingPins.map((pin) => (
                      <div
                        key={pin.id}
                        className="flex items-start justify-between rounded-lg border border-border p-4"
                      >
                        <div>
                          <h3 className="font-semibold text-card-foreground">{pin.title}</h3>
                          <p className="text-sm text-muted-foreground">{pin.type}</p>
                          {pin.description && (
                            <p className="mt-1 text-sm text-card-foreground">{pin.description}</p>
                          )}
                          {pin.notes && (
                            <p className="mt-1 text-xs text-muted-foreground">Notes: {pin.notes}</p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => approvePinMutation.mutate({ id: pin.id })}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline">
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="py-8 text-center text-sm text-muted-foreground">
                      No pending pins to review
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Forum Moderation */}
          <TabsContent value="forum" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Forum Moderation</CardTitle>
                <CardDescription>
                  Monitor and moderate forum posts and replies
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Forum moderation tools coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users Management */}
          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>
                  View and manage user accounts and permissions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">User management tools coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Article Dialog */}
      <Dialog open={showArticleDialog} onOpenChange={setShowArticleDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Guide</DialogTitle>
            <DialogDescription>
              Add a new survival guide to the resource library
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="article-title">Title</Label>
              <Input
                id="article-title"
                value={articleForm.title}
                onChange={(e) => setArticleForm({ ...articleForm, title: e.target.value })}
                placeholder="e.g., How to Apply for General Relief"
              />
            </div>
            <div>
              <Label htmlFor="article-category">Category</Label>
              <Select
                value={articleForm.category}
                onValueChange={(value) => setArticleForm({ ...articleForm, category: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="benefits">Benefits</SelectItem>
                  <SelectItem value="housing">Housing</SelectItem>
                  <SelectItem value="legal">Legal</SelectItem>
                  <SelectItem value="health">Health</SelectItem>
                  <SelectItem value="employment">Employment</SelectItem>
                  <SelectItem value="identification">Identification</SelectItem>
                  <SelectItem value="emergency">Emergency</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="article-summary">Summary</Label>
              <Textarea
                id="article-summary"
                value={articleForm.summary}
                onChange={(e) => setArticleForm({ ...articleForm, summary: e.target.value })}
                placeholder="Brief summary of the guide"
                rows={2}
              />
            </div>
            <div>
              <Label htmlFor="article-content">Content (Markdown supported)</Label>
              <Textarea
                id="article-content"
                value={articleForm.content}
                onChange={(e) => setArticleForm({ ...articleForm, content: e.target.value })}
                placeholder="Full guide content..."
                rows={10}
              />
            </div>
            <div>
              <Label htmlFor="article-tags">Tags (comma-separated)</Label>
              <Input
                id="article-tags"
                value={articleForm.tags}
                onChange={(e) => setArticleForm({ ...articleForm, tags: e.target.value })}
                placeholder="e.g., welfare, cash aid, county services"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowArticleDialog(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (!articleForm.title || !articleForm.content || !articleForm.category) {
                    toast.error("Please fill in all required fields");
                    return;
                  }
                  const slug = articleForm.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
                  createArticleMutation.mutate({
                    title: articleForm.title,
                    slug,
                    content: articleForm.content,
                    category: articleForm.category as "benefits" | "housing" | "legal" | "health" | "employment" | "identification" | "emergency",
                    summary: articleForm.summary || undefined,
                    tags: articleForm.tags ? JSON.stringify(articleForm.tags.split(",").map((t) => t.trim())) : undefined,
                  });
                }}
                disabled={createArticleMutation.isPending}
              >
                Create Guide
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Video Dialog */}
      <Dialog open={showVideoDialog} onOpenChange={setShowVideoDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Video to Virgil TV</DialogTitle>
            <DialogDescription>
              Add a YouTube video to the video library
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="video-title">Title</Label>
              <Input
                id="video-title"
                value={videoForm.title}
                onChange={(e) => setVideoForm({ ...videoForm, title: e.target.value })}
                placeholder="Video title"
              />
            </div>
            <div>
              <Label htmlFor="video-youtube">YouTube Video ID</Label>
              <Input
                id="video-youtube"
                value={videoForm.youtubeId}
                onChange={(e) => setVideoForm({ ...videoForm, youtubeId: e.target.value })}
                placeholder="e.g., dQw4w9WgXcQ"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                The ID from the YouTube URL (youtube.com/watch?v=ID)
              </p>
            </div>
            <div>
              <Label htmlFor="video-category">Category</Label>
              <Select
                value={videoForm.category}
                onValueChange={(value) => setVideoForm({ ...videoForm, category: value as typeof videoForm.category })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="how_to_guides">How-To Guides</SelectItem>
                  <SelectItem value="legal_help">Legal Help</SelectItem>
                  <SelectItem value="recovery_motivation">Recovery & Motivation</SelectItem>
                  <SelectItem value="street_hacks">Street Hacks</SelectItem>
                  <SelectItem value="mental_health">Mental Health</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="video-description">Description</Label>
              <Textarea
                id="video-description"
                value={videoForm.description}
                onChange={(e) => setVideoForm({ ...videoForm, description: e.target.value })}
                placeholder="Video description"
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowVideoDialog(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (!videoForm.title || !videoForm.youtubeId || !videoForm.category) {
                    toast.error("Please fill in all required fields");
                    return;
                  }
                  createVideoMutation.mutate({
                    title: videoForm.title,
                    description: videoForm.description,
                    youtubeId: videoForm.youtubeId,
                    category: videoForm.category as "how_to_guides" | "legal_help" | "recovery_motivation" | "street_hacks" | "mental_health",
                  });
                }}
                disabled={createVideoMutation.isPending}
              >
                Add Video
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Resource Dialog */}
      <Dialog open={showResourceDialog} onOpenChange={setShowResourceDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Resource</DialogTitle>
            <DialogDescription>
              Add a new resource link for shelters, services, or support
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="resource-name">Name</Label>
              <Input
                id="resource-name"
                value={resourceForm.name}
                onChange={(e) => setResourceForm({ ...resourceForm, name: e.target.value })}
                placeholder="Resource name"
              />
            </div>
            <div>
              <Label htmlFor="resource-type">Type</Label>
              <Select
                value={resourceForm.type}
                onValueChange={(value) => setResourceForm({ ...resourceForm, type: value as typeof resourceForm.type })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="shelter">Shelter</SelectItem>
                  <SelectItem value="food">Food</SelectItem>
                  <SelectItem value="medical">Medical</SelectItem>
                  <SelectItem value="legal">Legal</SelectItem>
                  <SelectItem value="employment">Employment</SelectItem>
                  <SelectItem value="clothing">Clothing</SelectItem>
                  <SelectItem value="hygiene">Hygiene</SelectItem>
                  <SelectItem value="housing">Housing</SelectItem>
                  <SelectItem value="transportation">Transportation</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="resource-description">Description</Label>
              <Textarea
                id="resource-description"
                value={resourceForm.description}
                onChange={(e) => setResourceForm({ ...resourceForm, description: e.target.value })}
                placeholder="Resource description"
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="resource-phone">Phone</Label>
                <Input
                  id="resource-phone"
                  value={resourceForm.phone}
                  onChange={(e) => setResourceForm({ ...resourceForm, phone: e.target.value })}
                  placeholder="(555) 123-4567"
                />
              </div>
              <div>
                <Label htmlFor="resource-website">Website</Label>
                <Input
                  id="resource-website"
                  value={resourceForm.website}
                  onChange={(e) => setResourceForm({ ...resourceForm, website: e.target.value })}
                  placeholder="https://example.com"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="resource-address">Address</Label>
              <Input
                id="resource-address"
                value={resourceForm.address}
                onChange={(e) => setResourceForm({ ...resourceForm, address: e.target.value })}
                placeholder="123 Main St, Los Angeles, CA 90012"
              />
            </div>
            <div>
              <Label htmlFor="resource-hours">Hours</Label>
              <Input
                id="resource-hours"
                value={resourceForm.hours}
                onChange={(e) => setResourceForm({ ...resourceForm, hours: e.target.value })}
                placeholder="Mon-Fri 9am-5pm"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowResourceDialog(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (!resourceForm.name || !resourceForm.type) {
                    toast.error("Please fill in required fields");
                    return;
                  }
                  createResourceMutation.mutate({
                    name: resourceForm.name,
                    description: resourceForm.description || undefined,
                    type: resourceForm.type as "shelter" | "food" | "medical" | "legal" | "employment" | "clothing" | "hygiene" | "housing" | "transportation" | "other",
                    address: resourceForm.address || undefined,
                    phone: resourceForm.phone || undefined,
                    website: resourceForm.website || undefined,
                    hours: resourceForm.hours || undefined,
                  });
                }}
                disabled={createResourceMutation.isPending}
              >
                Add Resource
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
