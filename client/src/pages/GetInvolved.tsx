import { useState } from "react";
import { Link } from "wouter";
import { HeartHandshake, HandHeart, Landmark, Users } from "lucide-react";
import PublicLayout from "@/components/PublicLayout";
import SectionBlock from "@/components/SectionBlock";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function GetInvolved() {
  const [requestType, setRequestType] = useState<"donation" | "volunteer" | "partner">("donation");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [organization, setOrganization] = useState("");
  const [message, setMessage] = useState("");

  const createMutation = trpc.communitySupport.create.useMutation({
    onSuccess: () => {
      toast.success("Thanks. Your request was received and sent to the admin team.");
      setName("");
      setEmail("");
      setPhone("");
      setOrganization("");
      setMessage("");
    },
    onError: (error) => {
      toast.error(error.message || "Unable to send request.");
    },
  });

  const submit = () => {
    if (!name.trim() || !email.trim()) {
      toast.error("Please enter your name and email.");
      return;
    }
    createMutation.mutate({
      requestType,
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim() || undefined,
      organization: organization.trim() || undefined,
      message: message.trim() || undefined,
    });
  };

  return (
    <PublicLayout
      title="Mission, Donations, and Community Support"
      subtitle="Support access. Support clarity. Support momentum."
      actions={
        <Link href="/">
          <Button variant="outline" size="sm">Back home</Button>
        </Link>
      }
    >
      <SectionBlock>
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="surface-card md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Landmark className="h-5 w-5 text-primary" />
                Our Mission
              </CardTitle>
              <CardDescription>Public infrastructure, redesigned for dignity.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>
                Virgil St exists because navigating housing, food, healthcare, treatment, and jobs should not require insider knowledge, endless phone calls, or luck.
              </p>
              <p>
                Too often, people spend hours being transferred between agencies, repeating their story, or chasing outdated information. The result is burnout, missed opportunities, and preventable crises.
              </p>
              <p>
                Virgil changes that.
              </p>
              <p>
                We turn complex systems into clear next steps. We prioritize verified options. We focus on action: calls made, forms completed, appointments scheduled, and real support reached.
              </p>
              <p>
                This platform is built to reduce friction, restore clarity, and give people momentum when they need it most.
              </p>
              <p className="font-medium text-foreground">
                Dignity is not a feature. It is the baseline.
              </p>
            </CardContent>
          </Card>
          <Card id="donate" className="surface-card scroll-mt-24">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HandHeart className="h-5 w-5 text-[var(--cta)]" />
                Donate
              </CardTitle>
              <CardDescription>Support access. Support clarity. Support momentum.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <a href="mailto:support@virgilst.com?subject=Donation%20Support%20for%20Virgil%20St" target="_blank" rel="noopener noreferrer">
                <Button className="w-full bg-[var(--cta)] text-[var(--cta-foreground)] hover:opacity-95">Donate / Sponsor</Button>
              </a>
              <p className="text-sm text-muted-foreground">
                Virgil St is free for the people who need it. That means housing seekers, individuals in recovery, families navigating healthcare, and anyone facing instability can use it without barriers.
              </p>
              <p className="text-sm text-muted-foreground">
                Your support keeps the platform running, expanding, and improving.
              </p>
              <div className="rounded-lg border border-border bg-secondary/40 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-primary">Donations fund</p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                  <li>Ongoing verification of resources</li>
                  <li>Platform hosting and AI support</li>
                  <li>Job and healthcare data access</li>
                  <li>Development of new navigation tools</li>
                  <li>Community moderation and review</li>
                </ul>
              </div>
              <p className="text-sm text-muted-foreground">
                Every contribution strengthens a piece of public infrastructure that thousands rely on.
              </p>
              <p className="text-sm text-muted-foreground">
                When you support Virgil, you are not donating to an idea. You are helping someone move forward today.
              </p>
              <p className="text-sm font-medium text-foreground">
                Real systems should work for real people. Help us build the version that does.
              </p>
            </CardContent>
          </Card>
        </div>
      </SectionBlock>

      <SectionBlock title="Get involved" subtitle="Volunteer, partner, or contribute resources. Requests go directly to the admin review queue.">
        <Card className="surface-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Submit a support request
            </CardTitle>
            <CardDescription>Tell us how you want to help and we will follow up.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div>
              <Label>Type</Label>
              <select
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={requestType}
                onChange={e => setRequestType(e.target.value as "donation" | "volunteer" | "partner")}
              >
                <option value="donation">Donation</option>
                <option value="volunteer">Volunteer</option>
                <option value="partner">Partnership</option>
              </select>
            </div>
            <div>
              <Label>Name *</Label>
              <Input value={name} onChange={e => setName(e.target.value)} />
            </div>
            <div>
              <Label>Email *</Label>
              <Input type="email" value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <div>
              <Label>Phone</Label>
              <Input value={phone} onChange={e => setPhone(e.target.value)} />
            </div>
            <div className="md:col-span-2">
              <Label>Organization</Label>
              <Input value={organization} onChange={e => setOrganization(e.target.value)} />
            </div>
            <div className="md:col-span-2">
              <Label>Message</Label>
              <Textarea
                rows={4}
                placeholder="How would you like to support Virgil St?"
                value={message}
                onChange={e => setMessage(e.target.value)}
              />
            </div>
            <div className="md:col-span-2 flex justify-end">
              <Button
                onClick={submit}
                disabled={createMutation.isPending}
                className="bg-[var(--cta)] text-[var(--cta-foreground)] hover:opacity-95"
              >
                <HeartHandshake className="mr-2 h-4 w-4" />
                {createMutation.isPending ? "Sending..." : "Send request"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </SectionBlock>
    </PublicLayout>
  );
}
