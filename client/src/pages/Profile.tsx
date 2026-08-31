import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { formatDate } from "@/lib/dateTime";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { Loader2, User, MapPin, MessageSquare, MessageCircle, Edit, Save, X } from "lucide-react";
import { Link, useLocation, useParams } from "wouter";
import { getLoginUrl } from "@/const";
import PublicLayout from "@/components/PublicLayout";
import SectionBlock from "@/components/SectionBlock";

export default function Profile() {
  const { isAuthenticated, user } = useAuth();
  const [, navigate] = useLocation();
  const params = useParams<{ userId?: string }>();
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");

  const viewingUserId = params.userId ? parseInt(params.userId) : undefined;
  const isOwnProfile = !viewingUserId || (user && viewingUserId === user.id);

  const { data: profile, isLoading, refetch } = trpc.profile.get.useQuery(
    { userId: viewingUserId || user?.id || 0 },
    { enabled: isAuthenticated && (!!viewingUserId || !!user?.id) }
  );

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
      <PublicLayout title="Profile" subtitle="Sign in to manage your profile and activity.">
        <SectionBlock className="pt-8">
          <div className="flex items-center justify-center">
            <Card className="surface-card p-8 text-center">
              <User className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
              <h2 className="mb-2 text-2xl font-bold text-foreground">Sign in to view your profile</h2>
              <p className="mb-6 text-muted-foreground">Create an account to participate in the community.</p>
              <Button asChild>
                <a href={getLoginUrl()}>Sign In</a>
              </Button>
            </Card>
          </div>
        </SectionBlock>
      </PublicLayout>
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
    <PublicLayout
      title="Profile"
      subtitle="Manage your details and track your activity."
      actions={
        <Link href="/">
          <Button variant="outline" size="sm">Back</Button>
        </Link>
      }
    >
      <SectionBlock className="pt-8">
        <div className="container max-w-4xl py-0">
          <div className="grid gap-6 md:grid-cols-3">
            <Card className="surface-card p-6 md:col-span-1">
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  {profile.avatarUrl ? (
                    <img src={profile.avatarUrl} alt={profile.displayName || "User"} className="h-full w-full rounded-full object-cover" />
                  ) : (
                    <User className="h-12 w-12" />
                  )}
                </div>

                {isEditing ? (
                  <Input value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="Display name" className="mb-2" />
                ) : (
                  <h2 className="mb-1 text-2xl font-bold text-foreground">{profile.displayName || profile.name || "Anonymous"}</h2>
                )}

                {isEditing ? (
                  <Input value={location} onChange={e => setLocation(e.target.value)} placeholder="Location (optional)" className="mb-4" />
                ) : (
                  profile.location && <p className="mb-4 text-sm text-muted-foreground">{profile.location}</p>
                )}

                {isEditing ? (
                  <Textarea value={bio} onChange={e => setBio(e.target.value)} placeholder="Tell us about yourself..." className="mb-4 min-h-[100px]" />
                ) : (
                  profile.bio && <p className="mb-4 text-sm text-muted-foreground">{profile.bio}</p>
                )}

                {isOwnProfile && (isEditing ? (
                  <div className="flex gap-2">
                    <Button onClick={handleSave} disabled={updateMutation.isPending} className="flex-1">
                      {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Save className="mr-2 h-4 w-4" />Save</>}
                    </Button>
                    <Button onClick={handleCancel} variant="outline"><X className="h-4 w-4" /></Button>
                  </div>
                ) : (
                  <Button onClick={() => setIsEditing(true)} variant="outline" className="w-full">
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Profile
                  </Button>
                ))}

                <p className="mt-4 text-xs text-muted-foreground">Member since {formatDate(profile.createdAt)}</p>
              </div>
            </Card>

            <div className="space-y-6 md:col-span-2">
              <Card className="surface-card p-6">
                <h3 className="mb-4 text-lg font-bold text-foreground">Activity</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center"><MessageSquare className="mx-auto mb-2 h-8 w-8 text-primary" /><p className="text-2xl font-bold text-foreground">{profile.stats.postsCreated}</p><p className="text-sm text-muted-foreground">Posts</p></div>
                  <div className="text-center"><MessageCircle className="mx-auto mb-2 h-8 w-8 text-primary" /><p className="text-2xl font-bold text-foreground">{profile.stats.repliesMade}</p><p className="text-sm text-muted-foreground">Replies</p></div>
                  <div className="text-center"><MapPin className="mx-auto mb-2 h-8 w-8 text-primary" /><p className="text-2xl font-bold text-foreground">{profile.stats.pinsSubmitted}</p><p className="text-sm text-muted-foreground">Pins</p></div>
                  <div className="text-center"><MessageCircle className="mx-auto mb-2 h-8 w-8 text-primary" /><p className="text-2xl font-bold text-foreground">{profile.stats.commentsPosted}</p><p className="text-sm text-muted-foreground">Comments</p></div>
                </div>
              </Card>

              <Card className="surface-card p-6">
                <h3 className="mb-4 text-lg font-bold text-foreground">Quick Links</h3>
                <div className="space-y-2">
                  <Button asChild variant="outline" className="w-full justify-start"><Link href="/forum"><MessageSquare className="mr-2 h-4 w-4" />My Forum Posts</Link></Button>
                  <Button asChild variant="outline" className="w-full justify-start"><Link href="/favorites"><MessageSquare className="mr-2 h-4 w-4" />My Favorites</Link></Button>
                  <Button asChild variant="outline" className="w-full justify-start"><Link href="/map"><MapPin className="mr-2 h-4 w-4" />Community Map</Link></Button>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </SectionBlock>
    </PublicLayout>
  );
}
