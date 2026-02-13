import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { Link, useParams, useLocation } from "wouter";
import {
  ArrowLeft,
  MessageSquare,
  ThumbsUp,
  Eye,
  MessageCircle,
  Send,
  Loader2,
  BellIcon,
  User,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { getLoginUrl } from "@/const";
import { toast } from "sonner";
import { Streamdown } from "streamdown";

const CATEGORIES = [
  { value: "survival_tips", label: "Survival Tips" },
  { value: "emotional_support", label: "Emotional Support" },
  { value: "shelter_reviews", label: "Shelter Reviews" },
  { value: "ride_shares", label: "Ride Shares" },
  { value: "legal_help", label: "Legal Help" },
  { value: "urgent_needs", label: "Urgent Needs" },
  { value: "general", label: "General" },
];

interface Reply {
  id: number;
  postId: number;
  parentReplyId: number | null;
  content: string;
  authorId: number | null;
  isAnonymous: boolean;
  upvotes: number;
  createdAt: Date;
  updatedAt: Date;
  authorName: string | null;
  authorDisplayName: string | null;
  authorAvatar: string | null;
}

function ReplyItem({ reply, onReply }: { reply: Reply; onReply: (replyId: number) => void }) {
  const { isAuthenticated } = useAuth();
  const utils = trpc.useUtils();

  const upvoteMutation = trpc.forum.upvoteReply.useMutation({
    onSuccess: () => {
      utils.forum.replies.invalidate();
      toast.success("Upvoted!");
    },
    onError: () => {
      toast.error("Failed to upvote");
    },
  });

  const handleUpvote = () => {
    if (!isAuthenticated) {
      toast.error("Sign in to upvote");
      return;
    }
    upvoteMutation.mutate({ replyId: reply.id });
  };

  return (
    <Card className="border-l-2 border-l-primary/30">
      <CardContent className="p-4">
        <div className="mb-3 flex items-center gap-2 text-xs text-muted-foreground">
          {reply.isAnonymous ? (
            <span>Anonymous</span>
          ) : reply.authorId && (reply.authorDisplayName || reply.authorName) ? (
            <Link href={`/profile/${reply.authorId}`}>
              <div className="flex items-center gap-1 hover:text-primary transition-colors cursor-pointer">
                {reply.authorAvatar ? (
                  <img
                    src={reply.authorAvatar}
                    alt={reply.authorDisplayName || reply.authorName || ""}
                    className="h-4 w-4 rounded-full object-cover"
                  />
                ) : (
                  <User className="h-3 w-3" />
                )}
                <span>{reply.authorDisplayName || reply.authorName}</span>
              </div>
            </Link>
          ) : (
            <span>User</span>
          )}
          <span>•</span>
          <span>{new Date(reply.createdAt).toLocaleDateString()}</span>
        </div>
        <div className="mb-3 text-sm text-card-foreground">
          <Streamdown>{reply.content}</Streamdown>
        </div>
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleUpvote}
            disabled={upvoteMutation.isPending}
            className="gap-1 text-xs"
          >
            <ThumbsUp className="h-3 w-3" />
            <span>{reply.upvotes}</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onReply(reply.id)}
            className="gap-1 text-xs"
          >
            <MessageCircle className="h-3 w-3" />
            Reply
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ForumPost() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { isAuthenticated } = useAuth();
  const [replyContent, setReplyContent] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [replyingTo, setReplyingTo] = useState<number | null>(null);

  const postId = parseInt(id!);
  const utils = trpc.useUtils();

  const { data: post, isLoading: postLoading } = trpc.forum.post.useQuery({ id: postId });
  const { data: replies, isLoading: repliesLoading } = trpc.forum.replies.useQuery({ postId });
  const { data: isFollowing, refetch: refetchFollowing } = trpc.favorites.isThreadFollowed.useQuery(
    { postId },
    { enabled: isAuthenticated }
  );

  const followMutation = trpc.favorites.followThread.useMutation({
    onSuccess: () => {
      toast.success("Following thread!");
      refetchFollowing();
    },
  });

  const unfollowMutation = trpc.favorites.unfollowThread.useMutation({
    onSuccess: () => {
      toast.success("Unfollowed thread");
      refetchFollowing();
    },
  });

  const handleToggleFollow = () => {
    if (!isAuthenticated) {
      toast.error("Please sign in to follow threads");
      return;
    }

    if (isFollowing) {
      unfollowMutation.mutate({ postId });
    } else {
      followMutation.mutate({ postId });
    }
  };

  const upvotePostMutation = trpc.forum.upvotePost.useMutation({
    onSuccess: () => {
      utils.forum.post.invalidate({ id: postId });
      toast.success("Upvoted!");
    },
    onError: () => {
      toast.error("Failed to upvote");
    },
  });

  const createReplyMutation = trpc.forum.createReply.useMutation({
    onSuccess: () => {
      utils.forum.replies.invalidate({ postId });
      utils.forum.post.invalidate({ id: postId });
      setReplyContent("");
      setIsAnonymous(false);
      setReplyingTo(null);
      toast.success("Reply posted!");
    },
    onError: () => {
      toast.error("Failed to post reply");
    },
  });

  const handleUpvotePost = () => {
    if (!isAuthenticated) {
      toast.error("Sign in to upvote");
      return;
    }
    upvotePostMutation.mutate({ postId });
  };

  const handleSubmitReply = () => {
    if (!replyContent.trim()) {
      toast.error("Reply cannot be empty");
      return;
    }

    createReplyMutation.mutate({
      postId,
      content: replyContent.trim(),
      parentReplyId: replyingTo || undefined,
      isAnonymous,
    });
  };

  const handleAskVirgil = () => {
    if (!post) return;
    const question = `I saw this forum post: "${post.title}"\n\n${post.content}\n\nCan you help me understand this better?`;
    navigate(`/chat?q=${encodeURIComponent(question)}`);
  };

  if (postLoading) {
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
            <div className="h-32 w-full animate-pulse rounded bg-muted" />
          </div>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Card className="max-w-md p-8 text-center">
          <MessageSquare className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
          <h2 className="mb-2 text-2xl font-bold text-card-foreground">Post Not Found</h2>
          <p className="mb-6 text-muted-foreground">
            This post doesn't exist or has been removed.
          </p>
          <Link href="/forum">
            <Button>Back to Forum</Button>
          </Link>
        </Card>
      </div>
    );
  }

  const category = CATEGORIES.find((c) => c.value === post.category);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container flex items-center justify-between py-4">
          <Link href="/forum">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex gap-2">
            <Button
              variant={isFollowing ? "default" : "outline"}
              size="sm"
              onClick={handleToggleFollow}
              disabled={followMutation.isPending || unfollowMutation.isPending}
            >
              <BellIcon className={`h-4 w-4 mr-2 ${isFollowing ? "fill-current" : ""}`} />
              {isFollowing ? "Following" : "Follow"}
            </Button>
            <Button onClick={handleAskVirgil} variant="outline" size="sm">
              Ask Virgil About This
            </Button>
          </div>
        </div>
      </header>

      {/* Post Content */}
      <div className="container py-8">
        <div className="mx-auto max-w-3xl">
          {/* Post */}
          <Card className="mb-8">
            <CardContent className="p-6">
              <div className="mb-4 flex items-center gap-2">
                <Badge variant="secondary">{category?.label}</Badge>
                {post.isAnonymous && (
                  <Badge variant="outline">Anonymous</Badge>
                )}
                {post.isPinned && (
                  <Badge variant="default">Pinned</Badge>
                )}
              </div>

              {/* Author Info */}
              {!post.isAnonymous && post.authorId && (post.authorDisplayName || post.authorName) && (
                <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
                  <Link href={`/profile/${post.authorId}`}>
                    <div className="flex items-center gap-2 hover:text-primary transition-colors cursor-pointer">
                      {post.authorAvatar ? (
                        <img
                          src={post.authorAvatar}
                          alt={post.authorDisplayName || post.authorName || ""}
                          className="h-6 w-6 rounded-full object-cover"
                        />
                      ) : (
                        <User className="h-5 w-5" />
                      )}
                      <span className="font-medium">{post.authorDisplayName || post.authorName}</span>
                    </div>
                  </Link>
                  <span>•</span>
                  <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                </div>
              )}

              <h1 className="mb-4 text-3xl font-bold text-card-foreground">
                {post.title}
              </h1>

              <div className="mb-6 whitespace-pre-wrap text-card-foreground">
                <Streamdown>{post.content}</Streamdown>
              </div>

              <div className="flex items-center gap-4 border-t border-border pt-4 text-sm text-muted-foreground">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleUpvotePost}
                  disabled={upvotePostMutation.isPending}
                  className="gap-2"
                >
                  <ThumbsUp className="h-4 w-4" />
                  <span>{post.upvotes}</span>
                </Button>
                <div className="flex items-center gap-1">
                  <Eye className="h-4 w-4" />
                  <span>{post.viewCount}</span>
                </div>
                <div className="flex items-center gap-1">
                  <MessageCircle className="h-4 w-4" />
                  <span>{post.replyCount}</span>
                </div>
                <span>•</span>
                <span>{new Date(post.createdAt).toLocaleDateString()}</span>
              </div>
            </CardContent>
          </Card>

          {/* Reply Form */}
          {isAuthenticated ? (
            <Card className="mb-8">
              <CardContent className="p-6">
                <h3 className="mb-4 text-lg font-semibold text-card-foreground">
                  {replyingTo ? "Reply to Comment" : "Add a Reply"}
                </h3>
                <Textarea
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder="Share your thoughts..."
                  className="mb-4 min-h-[120px]"
                />
                <div className="flex items-center justify-between">
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
                  <div className="flex gap-2">
                    {replyingTo && (
                      <Button
                        variant="outline"
                        onClick={() => setReplyingTo(null)}
                      >
                        Cancel
                      </Button>
                    )}
                    <Button
                      onClick={handleSubmitReply}
                      disabled={!replyContent.trim() || createReplyMutation.isPending}
                      className="gap-2"
                    >
                      {createReplyMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                      Post Reply
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="mb-8 p-6 text-center">
              <p className="mb-4 text-muted-foreground">Sign in to reply to this post</p>
              <Button asChild>
                <a href={getLoginUrl()}>Sign In</a>
              </Button>
            </Card>
          )}

          {/* Replies */}
          <div>
            <h3 className="mb-4 text-xl font-bold text-foreground">
              Replies ({post.replyCount})
            </h3>
            {repliesLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-4">
                      <div className="h-4 w-1/4 rounded bg-muted" />
                      <div className="mt-2 h-16 w-full rounded bg-muted" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : replies && replies.length > 0 ? (
              <div className="space-y-4">
                {replies.map((reply) => (
                  <ReplyItem
                    key={reply.id}
                    reply={reply}
                    onReply={setReplyingTo}
                  />
                ))}
              </div>
            ) : (
              <Card className="p-8 text-center">
                <MessageCircle className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
                <p className="text-muted-foreground">No replies yet. Be the first to respond!</p>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
