import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";
import { MessageCircle, MapPin, Send, Clock, User } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface LiveFeedProps {
  onPinClick?: (pinId: number, lat: number, lng: number) => void;
}

const PIN_TYPE_COLORS: Record<string, string> = {
  safe_zone: "#10b981",
  resource: "#3b82f6",
  food: "#f59e0b",
  water: "#06b6d4",
  bathroom: "#8b5cf6",
  charging: "#eab308",
  wifi: "#6366f1",
  warning: "#ef4444",
  sweep_alert: "#dc2626",
};

const PIN_TYPE_LABELS: Record<string, string> = {
  safe_zone: "Safe Zone",
  resource: "Resource",
  food: "Food",
  water: "Water",
  bathroom: "Bathroom",
  charging: "Charging",
  wifi: "WiFi",
  warning: "Warning",
  sweep_alert: "Sweep Alert",
};

export function MapLiveFeed({ onPinClick }: LiveFeedProps) {
  const { isAuthenticated, user } = useAuth();
  const [selectedPinForComment, setSelectedPinForComment] = useState<number | null>(null);
  const [commentText, setCommentText] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);

  const { data: recentActivity, refetch } = trpc.map.recentActivity.useQuery(
    { limit: 50 },
    {
      refetchInterval: 10000, // Refresh every 10 seconds for real-time feel
    }
  );

  const addCommentMutation = trpc.map.addComment.useMutation({
    onSuccess: () => {
      setCommentText("");
      setSelectedPinForComment(null);
      refetch();
    },
  });

  const handlePostComment = () => {
    if (!commentText.trim() || !selectedPinForComment) return;
    addCommentMutation.mutate({
      pinId: selectedPinForComment,
      content: commentText.trim(),
      isAnonymous,
    });
  };

  const formatTime = (timestamp: number) => {
    try {
      return formatDistanceToNow(new Date(timestamp * 1000), { addSuffix: true });
    } catch {
      return "just now";
    }
  };

  return (
    <div className="border-t border-border bg-card">
      <div className="container py-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-card-foreground flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Live Updates
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Real-time community updates from the map
            </p>
          </div>
          {!isAuthenticated && (
            <Button asChild size="sm">
              <a href={getLoginUrl()}>Sign In to Post</a>
            </Button>
          )}
        </div>

        {/* Live Feed */}
        <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
          {!recentActivity || recentActivity.length === 0 ? (
            <Card className="p-8 text-center">
              <MessageCircle className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
              <p className="text-muted-foreground">No recent updates yet</p>
              <p className="text-sm text-muted-foreground/70 mt-1">
                Be the first to share an update about a location!
              </p>
            </Card>
          ) : (
            recentActivity.map((activity) => (
              <Card key={activity.id} className="p-4 hover:shadow-md transition-shadow">
                <div className="flex gap-3">
                  {/* Avatar */}
                  <Avatar className="h-10 w-10 shrink-0">
                    <AvatarFallback>
                      {activity.isAnonymous ? (
                        <User className="h-5 w-5" />
                      ) : (
                        activity.author?.displayName?.charAt(0).toUpperCase() || "?"
                      )}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <p className="font-medium text-sm">
                          {activity.isAnonymous ? "Anonymous" : activity.author?.displayName || "Unknown"}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <button
                            onClick={() => onPinClick?.(activity.pinId, activity.pin.latitude, activity.pin.longitude)}
                            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <MapPin
                              className="h-3 w-3"
                              style={{ color: PIN_TYPE_COLORS[activity.pin.type] || "#888" }}
                            />
                            <span className="font-medium">{activity.pin.title}</span>
                          </button>
                          <span className="text-xs text-muted-foreground/60">•</span>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {formatTime(activity.createdAt)}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Content */}
                    <p className="text-sm text-foreground whitespace-pre-wrap break-words">
                      {activity.content}
                    </p>

                    {/* Quick Reply */}
                    {isAuthenticated && selectedPinForComment !== activity.pinId && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedPinForComment(activity.pinId)}
                        className="mt-2 h-8 text-xs"
                      >
                        <MessageCircle className="h-3 w-3 mr-1" />
                        Reply
                      </Button>
                    )}

                    {/* Reply Form */}
                    {isAuthenticated && selectedPinForComment === activity.pinId && (
                      <div className="mt-3 p-3 bg-muted/50 rounded-lg">
                        <Input
                          placeholder={`Reply to update about ${activity.pin.title}...`}
                          value={commentText}
                          onChange={(e) => setCommentText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault();
                              handlePostComment();
                            }
                          }}
                          className="mb-2"
                        />
                        <div className="flex items-center justify-between">
                          <label className="flex items-center gap-2 text-xs text-muted-foreground">
                            <input
                              type="checkbox"
                              checked={isAnonymous}
                              onChange={(e) => setIsAnonymous(e.target.checked)}
                              className="rounded"
                            />
                            Post anonymously
                          </label>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedPinForComment(null);
                                setCommentText("");
                              }}
                            >
                              Cancel
                            </Button>
                            <Button
                              size="sm"
                              onClick={handlePostComment}
                              disabled={!commentText.trim() || addCommentMutation.isPending}
                            >
                              <Send className="h-3 w-3 mr-1" />
                              {addCommentMutation.isPending ? "Posting..." : "Post"}
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
