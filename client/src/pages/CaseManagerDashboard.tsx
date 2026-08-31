import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";
import PublicLayout from "@/components/PublicLayout";
import { Link } from "wouter";
import { CheckCircle2, Circle, Loader2, Sparkles, AlertTriangle, MapPin, Phone } from "lucide-react";

const PRIORITY_LABEL: Record<string, string> = {
  immediate: "Immediate",
  high: "High",
  medium: "Medium",
  long_term: "Long-term",
};

const PRIORITY_VARIANT: Record<string, "destructive" | "default" | "secondary" | "outline"> = {
  immediate: "destructive",
  high: "default",
  medium: "secondary",
  long_term: "outline",
};

function GoalResources({ goalId }: { goalId: number }) {
  const { data } = trpc.caseManager.goals.resourceRecommendations.useQuery({ goalId });
  if (!data) return null;
  if (data.length === 0) {
    return (
      <div className="mt-3 border-t border-border pt-3 text-xs text-muted-foreground">
        No verified matching resource found yet.
      </div>
    );
  }

  return (
    <div className="mt-3 space-y-2 border-t border-border pt-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Recommended resources</p>
      {data.map(rec => (
        <div key={rec.id} className="rounded-md bg-secondary/40 p-3 text-sm">
          <p className="font-medium text-foreground">{rec.name}</p>
          {rec.address && (
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3" /> {rec.address}
            </p>
          )}
          {rec.phone && (
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <Phone className="h-3 w-3" /> {rec.phone}
            </p>
          )}
          <p className="mt-1 text-xs text-muted-foreground">{rec.rationale}</p>
        </div>
      ))}
    </div>
  );
}

export default function CaseManagerDashboard() {
  const { isAuthenticated } = useAuth();
  const utils = trpc.useUtils();

  const activePlan = trpc.caseManager.plan.active.useQuery(undefined, { enabled: isAuthenticated });
  const recommended = trpc.caseManager.dashboard.recommendedTasks.useQuery(undefined, { enabled: isAuthenticated });

  const updateObjective = trpc.caseManager.objectives.updateStatus.useMutation({
    onSuccess: async () => {
      await utils.caseManager.plan.active.invalidate();
      await utils.caseManager.dashboard.recommendedTasks.invalidate();
    },
  });

  const updateGoal = trpc.caseManager.goals.updateStatus.useMutation({
    onSuccess: async () => {
      await utils.caseManager.plan.active.invalidate();
      await utils.caseManager.dashboard.recommendedTasks.invalidate();
    },
  });

  if (!isAuthenticated) {
    return (
      <PublicLayout title="Your Care Plan">
        <div className="container section-space text-center">
          <p className="mb-6 text-muted-foreground">Sign in to see your care plan.</p>
          <Button asChild>
            <a href={getLoginUrl()}>Sign In</a>
          </Button>
        </div>
      </PublicLayout>
    );
  }

  if (activePlan.isLoading) {
    return (
      <PublicLayout title="Your Care Plan">
        <div className="container section-space text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
        </div>
      </PublicLayout>
    );
  }

  if (!activePlan.data) {
    return (
      <PublicLayout title="Your Care Plan">
        <div className="container section-space text-center">
          <p className="mb-6 text-muted-foreground">
            You don't have a care plan yet. Talk to the AI Case Manager to build one.
          </p>
          <Link href="/case-manager/assessment">
            <Button className="bg-[var(--cta)] text-[var(--cta-foreground)] hover:opacity-95">
              Start my assessment
            </Button>
          </Link>
        </div>
      </PublicLayout>
    );
  }

  const { goals } = activePlan.data;
  const stats = recommended.data;
  const nextAction = stats?.nextAction;

  return (
    <PublicLayout title="Your Care Plan" subtitle="Here's where things stand and what to do next.">
      <div className="container max-w-4xl section-space space-y-6">
        {nextAction ? (
          <Card className="surface-card border-primary/40 bg-primary/5">
            <CardHeader className="flex flex-row items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <CardTitle>Do this next</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-semibold text-foreground">{nextAction.objective.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">{nextAction.reason}</p>
              <Button
                className="mt-4"
                size="sm"
                disabled={updateObjective.isPending}
                onClick={() =>
                  updateObjective.mutate({ objectiveId: nextAction.objective.id, status: "completed" })
                }
              >
                {updateObjective.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Mark complete
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="surface-card border-primary/40 bg-primary/5">
            <CardContent className="py-6 text-center text-muted-foreground">
              Everything in your plan is complete. 🎉
            </CardContent>
          </Card>
        )}

        {stats && stats.totalObjectives > 0 && (
          <Card className="surface-card">
            <CardContent className="flex items-center justify-between py-4">
              <span className="text-sm text-muted-foreground">Plan progress</span>
              <span className="font-semibold text-foreground">
                {stats.completedObjectives} of {stats.totalObjectives} objectives completed
              </span>
            </CardContent>
          </Card>
        )}

        {stats && stats.blockedObjectives.length > 0 && (
          <Card className="surface-card border-amber-500/40">
            <CardHeader className="flex flex-row items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              <CardTitle className="text-base">What's blocking you</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
              {stats.blockedObjectives.map(({ objective, goal }) => (
                <p key={objective.id} className="text-muted-foreground">
                  <span className="text-foreground">{objective.title}</span> — waiting on a prerequisite for{" "}
                  {goal.title}
                </p>
              ))}
            </CardContent>
          </Card>
        )}

        <div className="space-y-4">
          {goals.map(goal => (
            <Card key={goal.id} className="surface-card">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg">{goal.title}</CardTitle>
                  <p className="text-xs text-muted-foreground">{goal.rationale}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={PRIORITY_VARIANT[goal.priorityTier] ?? "outline"}>
                    {PRIORITY_LABEL[goal.priorityTier] ?? goal.priorityTier}
                  </Badge>
                  {goal.status !== "completed" && (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={updateGoal.isPending}
                      onClick={() => updateGoal.mutate({ goalId: goal.id, status: "completed" })}
                    >
                      Mark goal complete
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {goal.objectives.map(objective => (
                    <div key={objective.id} className="flex items-center justify-between gap-3 rounded-md bg-secondary/30 p-3">
                      <div className="flex items-center gap-2">
                        {objective.status === "completed" ? (
                          <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
                        ) : (
                          <Circle className="h-4 w-4 shrink-0 text-muted-foreground" />
                        )}
                        <span className={objective.status === "completed" ? "text-muted-foreground line-through" : "text-foreground"}>
                          {objective.title}
                        </span>
                      </div>
                      {objective.status !== "completed" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={updateObjective.isPending}
                          onClick={() => updateObjective.mutate({ objectiveId: objective.id, status: "completed" })}
                        >
                          Done
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
                <GoalResources goalId={goal.id} />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </PublicLayout>
  );
}
