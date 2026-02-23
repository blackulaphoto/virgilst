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
      subtitle="Virgil St exists to make help faster, clearer, and easier to act on. If you want to support this work, start here."
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
                Virgil St helps people navigate housing, food, healthcare, treatment, legal guidance, jobs, and recovery options without the usual runaround.
              </p>
              <p>
                We focus on practical next steps, verified options, and clear pathways that real people can use immediately.
              </p>
              <p>
                Our goal is not just information. It is action: calls made, forms completed, appointments booked, and support reached.
              </p>
            </CardContent>
          </Card>
          <Card className="surface-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HandHeart className="h-5 w-5 text-[var(--cta)]" />
                Donate
              </CardTitle>
              <CardDescription>Support operations and platform growth.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <a href="mailto:support@virgilst.com?subject=Donation%20Support%20for%20Virgil%20St" target="_blank" rel="noopener noreferrer">
                <Button className="w-full bg-[var(--cta)] text-[var(--cta-foreground)] hover:opacity-95">Donate / Sponsor</Button>
              </a>
              <p className="text-xs text-muted-foreground">
                Until payment rails are connected, use this to start a donation or sponsorship conversation.
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
