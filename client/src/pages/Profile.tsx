import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { Loader2, User, MapPin, MessageSquare, MessageCircle, Edit, Save, X } from "lucide-react";
import { Link, useLocation, useParams } from "wouter";
import { getLoginUrl } from "@/const";

export default function Profile() {
  const { isAuthenticated, user } = useAuth();
  const [, navigate] = useLocation();
  const params = useParams<{ userId?: string }>();
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");

  // Determine if viewing own profile or another user's
  const viewingUserId = params.userId ? parseInt(params.userId) : undefined;
  const isOwnProfile = !viewingUserId || (user && viewingUserId === user.id);

  // Get profile data
  const { data: profile, isLoading, refetch } = trpc.profile.get.useQuery(
    { userId: viewingUserId || user?.id || 0 },
    {
      enabled: isAuthenticated && (!!viewingUserId || !!user?.id),
    }
  );

  // Update form when profile loads
  useState(() => {
    if (profile) {
      setDisplayName(profile.displayName || "");
      setBio(profile.bio || "");
      setLocation(profile.location || "");
    }
  });

  const updateMutation = trpc.profile.update.useMutation({
    onSuccess: () => {
      setIsEditing(false);
      refetch();
    },
  });

  const handleSave = () => {
    updateMutation.mutate({
      displayName: displayName || undefined,
      bio: bio || undefined,
      location: location || undefined,
    });
  };

  const handleCancel = () => {
    if (profile) {
      setDisplayName(profile.displayName || "");
      setBio(profile.bio || "");
      setLocation(profile.location || "");
    }
    setIsEditing(false);
  };

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Card className="p-8 text-center">
          <User className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
          <h2 className="mb-2 text-2xl font-bold text-foreground">Sign in to view your profile</h2>
          <p className="mb-6 text-muted-foreground">
            Create an account to participate in the community
          </p>
          <Button asChild>
            <a href={getLoginUrl()}>Sign In</a>
          </Button>
        </Card>
      </div>
    );
  }

  if (isLoading || !profile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container flex items-center justify-between py-4">
          <Link href="/">
            <Button variant="ghost">← Back</Button>
          </Link>
          <h1 className="text-xl font-bold text-card-foreground">Profile</h1>
          <div className="w-20" /> {/* Spacer for centering */}
        </div>
      </header>

      <div className="container max-w-4xl py-8">
        <div className="grid gap-6 md:grid-cols-3">
          {/* Profile Card */}
          <Card className="md:col-span-1 p-6">
            <div className="text-center">
              {/* Avatar */}
              <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-primary text-primary-foreground">
                {profile.avatarUrl ? (
                  <img
                    src={profile.avatarUrl}
                    alt={profile.displayName || "User"}
                    className="h-full w-full rounded-full object-cover"
                  />
                ) : (
                  <User className="h-12 w-12" />
                )}
              </div>

              {/* Name */}
              {isEditing ? (
                <Input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Display name"
                  className="mb-2"
                />
              ) : (
                <h2 className="mb-1 text-2xl font-bold text-foreground">
                  {profile.displayName || profile.name || "Anonymous"}
                </h2>
              )}

              {/* Location */}
              {isEditing ? (
                <Input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Location (optional)"
                  className="mb-4"
                />
              ) : (
                profile.location && (
                  <p className="mb-4 text-sm text-muted-foreground">{profile.location}</p>
                )
              )}

              {/* Bio */}
              {isEditing ? (
                <Textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell us about yourself..."
                  className="mb-4 min-h-[100px]"
                />
              ) : (
                profile.bio && (
                  <p className="mb-4 text-sm text-muted-foreground">{profile.bio}</p>
                )
              )}

              {/* Edit/Save Buttons - only show for own profile */}
              {isOwnProfile && (isEditing ? (
                <div className="flex gap-2">
                  <Button
                    onClick={handleSave}
                    disabled={updateMutation.isPending}
                    className="flex-1"
                  >
                    {updateMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save
                      </>
                    )}
                  </Button>
                  <Button onClick={handleCancel} variant="outline">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <Button onClick={() => setIsEditing(true)} variant="outline" className="w-full">
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Profile
                </Button>
              ))}

              {/* Member Since */}
              <p className="mt-4 text-xs text-muted-foreground">
                Member since {new Date(profile.createdAt).toLocaleDateString()}
              </p>
            </div>
          </Card>

          {/* Activity Stats */}
          <div className="md:col-span-2 space-y-6">
            <Card className="p-6">
              <h3 className="mb-4 text-lg font-bold text-foreground">Activity</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <MessageSquare className="mx-auto mb-2 h-8 w-8 text-primary" />
                  <p className="text-2xl font-bold text-foreground">{profile.stats.postsCreated}</p>
                  <p className="text-sm text-muted-foreground">Posts Created</p>
                </div>
                <div className="text-center">
                  <MessageCircle className="mx-auto mb-2 h-8 w-8 text-primary" />
                  <p className="text-2xl font-bold text-foreground">{profile.stats.repliesMade}</p>
                  <p className="text-sm text-muted-foreground">Replies Made</p>
                </div>
                <div className="text-center">
                  <MapPin className="mx-auto mb-2 h-8 w-8 text-primary" />
                  <p className="text-2xl font-bold text-foreground">{profile.stats.pinsSubmitted}</p>
                  <p className="text-sm text-muted-foreground">Pins Submitted</p>
                </div>
                <div className="text-center">
                  <MessageCircle className="mx-auto mb-2 h-8 w-8 text-primary" />
                  <p className="text-2xl font-bold text-foreground">{profile.stats.commentsPosted}</p>
                  <p className="text-sm text-muted-foreground">Comments Posted</p>
                </div>
              </div>
            </Card>

            {/* Quick Links */}
            <Card className="p-6">
              <h3 className="mb-4 text-lg font-bold text-foreground">Quick Links</h3>
              <div className="space-y-2">
                <Button asChild variant="outline" className="w-full justify-start">
                  <Link href="/forum">
                    <MessageSquare className="mr-2 h-4 w-4" />
                    My Forum Posts
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full justify-start">
                  <Link href="/favorites">
                    <MessageSquare className="mr-2 h-4 w-4" />
                    My Favorites
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full justify-start">
                  <Link href="/map">
                    <MapPin className="mr-2 h-4 w-4" />
                    Community Map
                  </Link>
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
