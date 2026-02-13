import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { getLoginUrl } from "@/const";
import { Link } from "wouter";
import {
  MessageSquare,
  BookOpen,
  Map,
  Users,
  Video,
  Search,
  ArrowRight,
  MapPin,
  Heart,
  Shield,
  Building2,
  CalendarDays,
  UtensilsCrossed,
  Home as HomeIcon,
  Bus,
  Stethoscope,
  LogIn,
  LogOut,
  User,
} from "lucide-react";

export default function Home() {
  const { isAuthenticated, user, logout } = useAuth();

  return (
    <div className="min-h-screen">
      {/* Top Navigation Bar */}
      <nav className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center justify-between">
          <div className="flex items-center gap-2">
            <Heart className="h-6 w-6 text-primary" />
            <span className="font-bold text-lg">Virgil St</span>
          </div>

          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <>
                <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
                  <User className="h-4 w-4" />
                  <span>{user?.name || 'User'}</span>
                </div>
                <Link href="/admin">
                  <Button variant="ghost" size="sm">
                    Admin
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => logout()}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </>
            ) : (
              <Button
                size="sm"
                onClick={() => {
                  window.location.href = getLoginUrl();
                }}
              >
                <LogIn className="h-4 w-4 mr-2" />
                Sign In
              </Button>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-background via-background/95 to-card py-20 md:py-32">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,oklch(0.75_0.18_85),transparent)]" />
        </div>
        
        <div className="container relative z-10">
          <div className="mx-auto max-w-4xl text-center">
            <h1 className="mb-6 text-5xl font-black tracking-tight text-foreground md:text-7xl">
              SIMPLIFY THE{" "}
              <span className="text-primary">SYSTEM</span>
            </h1>
            <p className="mb-8 text-xl text-muted-foreground md:text-2xl">
              Social Services — Housing — Food Banks — Healthcare
            </p>
            <p className="mb-12 text-lg text-muted-foreground">
              Your digital survival companion for navigating social services, homelessness, and community support.
            </p>
            
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
              <Link href="/chat">
                <Button 
                  size="lg" 
                  className="group w-full bg-primary text-primary-foreground hover:bg-primary/90 sm:w-auto"
                >
                  Talk to Virgil
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
              <Link href="/resources">
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="w-full border-primary/50 text-foreground hover:bg-primary/10 sm:w-auto"
                >
                  Find Resources
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20">
        <div className="container">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold text-foreground md:text-4xl">
              Everything You Need to Navigate
            </h2>
            <p className="text-lg text-muted-foreground">
              Built for people in chaos. Fast, clear, and always available.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* AI Case Manager */}
            <Link href="/chat">
              <Card className="group cursor-pointer border-border bg-card transition-all hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10">
                <CardContent className="p-6">
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <MessageSquare className="h-6 w-6" />
                  </div>
                  <h3 className="mb-2 text-xl font-bold text-card-foreground">AI Case Manager</h3>
                  <p className="text-muted-foreground">
                    Get instant answers about benefits, housing, legal issues, and more. Virgil knows the system.
                  </p>
                </CardContent>
              </Card>
            </Link>

            {/* Resource Library */}
            <Link href="/library">
              <Card className="group cursor-pointer border-border bg-card transition-all hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10">
                <CardContent className="p-6">
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <BookOpen className="h-6 w-6" />
                  </div>
                  <h3 className="mb-2 text-xl font-bold text-card-foreground">Resource Library</h3>
                  <p className="text-muted-foreground">
                    Step-by-step guides for GR, Medi-Cal, Section 8, and everything else you need to know.
                  </p>
                </CardContent>
              </Card>
            </Link>

            {/* Camp Map */}
            <Link href="/map">
              <Card className="group cursor-pointer border-border bg-card transition-all hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10">
                <CardContent className="p-6">
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Map className="h-6 w-6" />
                  </div>
                  <h3 className="mb-2 text-xl font-bold text-card-foreground">Camp Map</h3>
                  <p className="text-muted-foreground">
                    Find safe zones, resources, food, water, and community-shared locations near you.
                  </p>
                </CardContent>
              </Card>
            </Link>

            {/* Community Forum */}
            <Link href="/forum">
              <Card className="group cursor-pointer border-border bg-card transition-all hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10">
                <CardContent className="p-6">
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Users className="h-6 w-6" />
                  </div>
                  <h3 className="mb-2 text-xl font-bold text-card-foreground">Community Forum</h3>
                  <p className="text-muted-foreground">
                    Share tips, warnings, and support. Connect with others who understand.
                  </p>
                </CardContent>
              </Card>
            </Link>

            {/* Food Resources */}
            <Link href="/resources">
              <Card className="bg-zinc-900 border-zinc-800 hover:border-green-500 transition-all cursor-pointer group">
                <CardHeader>
                  <UtensilsCrossed className="w-12 h-12 text-green-400 mb-4 group-hover:scale-110 transition-transform" />
                  <CardTitle className="text-white text-2xl mb-2">FOOD & GROCERIES</CardTitle>
                  <CardDescription className="text-zinc-400">
                    179 food banks, pantries, and meal programs across LA County
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>

            {/* Housing Resources */}
            <Link href="/resources">
              <Card className="bg-zinc-900 border-zinc-800 hover:border-blue-500 transition-all cursor-pointer group">
                <CardHeader>
                  <HomeIcon className="w-12 h-12 text-blue-400 mb-4 group-hover:scale-110 transition-transform" />
                  <CardTitle className="text-white text-2xl mb-2">HOUSING HELP</CardTitle>
                  <CardDescription className="text-zinc-400">
                    Section 8, shelter, rental assistance, and permanent housing programs
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>

            {/* Transportation */}
            <Link href="/resources">
              <Card className="bg-zinc-900 border-zinc-800 hover:border-purple-500 transition-all cursor-pointer group">
                <CardHeader>
                  <Bus className="w-12 h-12 text-purple-400 mb-4 group-hover:scale-110 transition-transform" />
                  <CardTitle className="text-white text-2xl mb-2">TRANSPORTATION</CardTitle>
                  <CardDescription className="text-zinc-400">
                    Free bus passes, Metro access, and travel assistance programs
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>

            {/* Healthcare */}
            <Link href="/resources">
              <Card className="bg-zinc-900 border-zinc-800 hover:border-red-500 transition-all cursor-pointer group">
                <CardHeader>
                  <Stethoscope className="w-12 h-12 text-red-400 mb-4 group-hover:scale-110 transition-transform" />
                  <CardTitle className="text-white text-2xl mb-2">HEALTHCARE & DENTAL</CardTitle>
                  <CardDescription className="text-zinc-400">
                    Free and low-cost medical and dental clinics
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>

            {/* Medi-Cal Providers */}
            <Link href="/medical-providers">
              <Card className="bg-zinc-900 border-zinc-800 hover:border-blue-500 transition-all cursor-pointer group">
                <CardHeader>
                  <Stethoscope className="w-12 h-12 text-blue-400 mb-4 group-hover:scale-110 transition-transform" />
                  <CardTitle className="text-white text-2xl mb-2">MEDI-CAL PROVIDERS</CardTitle>
                  <CardDescription className="text-zinc-400">
                    3,326 verified Medi-Cal providers across LA County - find doctors by specialty, location, and language
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>

            {/* Treatment Directory */}
              <Link href="/treatment">
                <Card className="bg-zinc-900 border-zinc-800 hover:border-amber-500 transition-all cursor-pointer group">
                  <CardHeader>
                    <Building2 className="w-12 h-12 text-amber-400 mb-4 group-hover:scale-110 transition-transform" />
                    <CardTitle className="text-white text-2xl mb-2">TREATMENT DIRECTORY</CardTitle>
                    <CardDescription className="text-zinc-400">
                      Sober living, detox, and treatment centers that accept Medi-Cal
                    </CardDescription>
                  </CardHeader>
                </Card>
              </Link>

              <Link href="/meetings">
                <Card className="bg-zinc-900 border-zinc-800 hover:border-amber-500 transition-all cursor-pointer group">
                  <CardHeader>
                    <Users className="w-12 h-12 text-green-400 mb-4 group-hover:scale-110 transition-transform" />
                    <CardTitle className="text-white text-2xl mb-2">RECOVERY MEETINGS</CardTitle>
                    <CardDescription className="text-zinc-400">
                      Find AA, NA, CMA, and SMART Recovery meetings in San Fernando Valley
                    </CardDescription>
                  </CardHeader>
                </Card>
              </Link>

              <Link href="/events">
                <Card className="bg-zinc-900 border-zinc-800 hover:border-amber-500 transition-all cursor-pointer group">
                  <CardHeader>
                    <CalendarDays className="w-12 h-12 text-blue-400 mb-4 group-hover:scale-110 transition-transform" />
                    <CardTitle className="text-white text-2xl mb-2">COMMUNITY EVENTS</CardTitle>
                    <CardDescription className="text-zinc-400">
                      Find monthly resource fairs, workshops, and service events
                    </CardDescription>
                  </CardHeader>
                </Card>
              </Link>

              <Link href="/videos">
              <Card className="group cursor-pointer border-border bg-card transition-all hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10">
                <CardContent className="p-6">
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Video className="h-6 w-6" />
                  </div>
                  <h3 className="mb-2 text-xl font-bold text-card-foreground">Video Library</h3>
                  <p className="text-muted-foreground">
                    Watch how-to guides, legal help videos, and recovery stories from people who've been there.
                  </p>
                </CardContent>
              </Card>
            </Link>

            {/* Search */}
            <Link href="/search">
              <Card className="group cursor-pointer border-border bg-card transition-all hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10">
                <CardContent className="p-6">
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Search className="h-6 w-6" />
                  </div>
                  <h3 className="mb-2 text-xl font-bold text-card-foreground">Search Everything</h3>
                  <p className="text-muted-foreground">
                    Find what you need across articles, forum posts, and resources in one place.
                  </p>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="border-t border-border bg-card/50 py-20">
        <div className="container">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="mb-12 text-3xl font-bold text-card-foreground md:text-4xl">
              Built with Respect
            </h2>
            
            <div className="grid gap-8 md:grid-cols-3">
              <div className="flex flex-col items-center">
                <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Shield className="h-8 w-8" />
                </div>
                <h3 className="mb-2 text-lg font-bold text-card-foreground">Dignity First</h3>
                <p className="text-sm text-muted-foreground">
                  No judgment. No stigma. Just real help for real people.
                </p>
              </div>

              <div className="flex flex-col items-center">
                <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <MapPin className="h-8 w-8" />
                </div>
                <h3 className="mb-2 text-lg font-bold text-card-foreground">Always Accessible</h3>
                <p className="text-sm text-muted-foreground">
                  Works on cheap phones, slow connections, and offline when needed.
                </p>
              </div>

              <div className="flex flex-col items-center">
                <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Heart className="h-8 w-8" />
                </div>
                <h3 className="mb-2 text-lg font-bold text-card-foreground">Community Powered</h3>
                <p className="text-sm text-muted-foreground">
                  Your experiences help others. Together we're stronger.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container">
          <div className="mx-auto max-w-2xl rounded-lg border border-primary/30 bg-gradient-to-br from-card to-primary/5 p-8 text-center md:p-12">
            <h2 className="mb-4 text-3xl font-bold text-card-foreground">
              Ready to Get Started?
            </h2>
            <p className="mb-8 text-lg text-muted-foreground">
              Talk to Virgil now and get the help you need.
            </p>
            <Link href="/chat">
              <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90">
                Start Conversation
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
