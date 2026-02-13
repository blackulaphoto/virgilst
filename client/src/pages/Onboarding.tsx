import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { Loader2, User, ArrowRight } from "lucide-react";
import { useLocation } from "wouter";

export default function Onboarding() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");

  const updateMutation = trpc.profile.update.useMutation({
    onSuccess: () => {
      navigate("/");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) return;

    updateMutation.mutate({
      displayName: displayName.trim(),
      bio: bio.trim() || undefined,
      location: location.trim() || undefined,
    });
  };

  const handleSkip = () => {
    navigate("/");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md p-8">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <User className="h-8 w-8" />
          </div>
          <h1 className="mb-2 text-2xl font-bold text-foreground">Welcome to Virgil St.</h1>
          <p className="text-sm text-muted-foreground">
            Set up your profile to participate in the community
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">
              Display Name <span className="text-destructive">*</span>
            </label>
            <Input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="How should we call you?"
              required
              maxLength={100}
            />
            <p className="mt-1 text-xs text-muted-foreground">
              This is how others will see you on the forum and map
            </p>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">
              Bio (Optional)
            </label>
            <Textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell us a bit about yourself..."
              maxLength={500}
              className="min-h-[100px]"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">
              Location (Optional)
            </label>
            <Input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g., Los Angeles, CA"
              maxLength={200}
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              type="submit"
              disabled={!displayName.trim() || updateMutation.isPending}
              className="flex-1"
            >
              {updateMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  Continue
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
            <Button type="button" onClick={handleSkip} variant="outline">
              Skip
            </Button>
          </div>
        </form>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          You can always update your profile later from the settings
        </p>
      </Card>
    </div>
  );
}
