import { useState, type FormEvent } from "react";
import { Link } from "wouter";
import { getLoginUrl } from "@/const";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Twitter, Instagram, Linkedin } from "lucide-react";

type FooterLink = { label: string; href: string };

const explore: FooterLink[] = [
  { label: "All Resources", href: "/resources" },
  { label: "Resource Map", href: "/resources/map" },
  { label: "Categories", href: "/resources" },
  { label: "Treatment Centers", href: "/treatment" },
  { label: "Community Events", href: "/events" },
];

const getHelp: FooterLink[] = [
  { label: "AI Case Manager", href: "/case-manager" },
  { label: "How It Works", href: "/case-manager" },
  { label: "Jobs", href: "/jobs" },
];

const about: FooterLink[] = [
  { label: "About Virgil St.", href: "/get-involved" },
  { label: "Data & Transparency", href: "/get-involved" },
  { label: "Contact Us", href: "/get-involved" },
  { label: "For Partners", href: "/get-involved" },
];

const support: FooterLink[] = [
  { label: "Help Center", href: "/articles" },
  { label: "Contact Us", href: "/get-involved" },
  { label: "Report an Issue", href: "/get-involved" },
];

const legalLinks: FooterLink[] = [
  { label: "Privacy Policy", href: "/get-involved" },
  { label: "Terms of Service", href: "/get-involved" },
  { label: "Accessibility", href: "/get-involved" },
];

function FooterColumn({ title, links }: { title: string; links: FooterLink[] }) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-vst-text">{title}</h3>
      <ul className="mt-4 space-y-3">
        {links.map(link => (
          <li key={link.label}>
            <Link href={link.href} className="text-sm text-vst-text-muted transition-colors hover:text-vst-teal">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function Footer() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubscribe = (event: FormEvent) => {
    event.preventDefault();
    // No newsletter backend exists yet — this just confirms the interaction
    // locally rather than claiming an email list signup that isn't real.
    setSubmitted(true);
    setEmail("");
  };

  return (
    <footer className="border-t border-vst-border/60 bg-vst-bg text-vst-text">
      <div className="container py-14">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.8fr_0.8fr_0.8fr_0.8fr_1.1fr]">
          <div>
            <Link href="/" className="inline-flex items-center gap-2">
              <img src="/brand/virgil-logo-on-dark.svg" alt="Virgil St" className="h-8 w-auto" />
            </Link>
            <p className="mt-4 max-w-xs text-sm text-vst-text-muted">
              Public infrastructure for human services. Built for Los Angeles.
            </p>
            <div className="mt-5 flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-full border border-vst-border text-vst-text-muted">
                <Twitter className="h-4 w-4" aria-hidden="true" />
              </span>
              <span className="flex h-9 w-9 items-center justify-center rounded-full border border-vst-border text-vst-text-muted">
                <Instagram className="h-4 w-4" aria-hidden="true" />
              </span>
              <span className="flex h-9 w-9 items-center justify-center rounded-full border border-vst-border text-vst-text-muted">
                <Linkedin className="h-4 w-4" aria-hidden="true" />
              </span>
              <span className="sr-only">Social links coming soon</span>
            </div>
          </div>

          <FooterColumn title="Explore" links={explore} />
          <FooterColumn title="Get Help" links={getHelp} />
          <FooterColumn title="About" links={about} />
          <FooterColumn title="Support" links={support} />

          <div>
            <h3 className="text-sm font-semibold text-vst-text">Stay informed</h3>
            <p className="mt-4 text-sm text-vst-text-muted">
              Get updates on new programs and resources in LA County.
            </p>
            <form onSubmit={handleSubscribe} className="mt-4 space-y-2">
              <label htmlFor="footer-newsletter-email" className="sr-only">
                Email address
              </label>
              <Input
                id="footer-newsletter-email"
                type="email"
                required
                placeholder="Email address"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="border-vst-border bg-vst-bg-elevated text-vst-text placeholder:text-vst-text-muted"
              />
              <Button type="submit" className="w-full bg-vst-cta-bg text-vst-cta-text hover:opacity-90">
                Subscribe
              </Button>
              {submitted && (
                <p className="text-xs text-vst-teal" role="status">
                  Thanks — we'll be in touch.
                </p>
              )}
            </form>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-vst-border/60 pt-6 text-sm text-vst-text-muted sm:flex-row">
          <p>&copy; {new Date().getFullYear()} Virgil St. All rights reserved.</p>
          <p className="flex flex-wrap items-center justify-center gap-4">
            {legalLinks.map(link => (
              <Link key={link.label} href={link.href} className="transition-colors hover:text-vst-teal">
                {link.label}
              </Link>
            ))}
          </p>
        </div>
      </div>
    </footer>
  );
}
