import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Footer } from "@/components/footer";
import { ThemeToggle } from "@/components/theme-toggle";
import { Building2, Shield, Clock, CheckCircle2, ArrowRight, Users, FileCheck, CreditCard } from "lucide-react";
import { Link } from "wouter";

export default function Landing() {
  const features = [
    {
      icon: Shield,
      title: "Owner Approved",
      description: "Every listing requires property owner authorization before going live, ensuring legal compliance.",
    },
    {
      icon: Users,
      title: "Verified Applicants",
      description: "Incoming tenants submit documents for review by both the outgoing tenant and property owner.",
    },
    {
      icon: FileCheck,
      title: "Secure Documents",
      description: "Upload lease agreements and verification documents securely with encrypted storage.",
    },
    {
      icon: CreditCard,
      title: "Simple Pricing",
      description: "Platform fee charged only to incoming tenant upon successful transfer. No hidden costs.",
    },
    {
      icon: Clock,
      title: "Fast Process",
      description: "Streamlined workflow gets your lease transferred quickly with our guided process.",
    },
    {
      icon: CheckCircle2,
      title: "Legal Protection",
      description: "We facilitate transfers only—not brokerage. Owner approval is always required.",
    },
  ];

  const steps = [
    { step: 1, title: "List Your Lease", description: "Create a listing with your property details and upload your current lease." },
    { step: 2, title: "Owner Approval", description: "Property owner receives a secure link to authorize the listing." },
    { step: 3, title: "Find Applicants", description: "Qualified tenants browse and apply to assume your lease." },
    { step: 4, title: "Complete Transfer", description: "Owner approves applicant, incoming tenant pays fee, transfer completes." },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-50 glass border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between gap-4">
            <Link href="/" className="flex items-center gap-2" data-testid="landing-logo">
              <Building2 className="h-7 w-7 text-primary" />
              <span className="font-serif text-xl font-bold tracking-tight">Novy</span>
            </Link>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <a href="/api/login">
                <Button variant="ghost" data-testid="button-signin">Sign In</Button>
              </a>
              <a href="/api/login">
                <Button data-testid="button-getstarted">Get Started</Button>
              </a>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="relative py-20 md:py-32 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-radial from-primary/10 to-transparent rounded-full blur-3xl" />
          
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto">
              <Badge variant="secondary" className="mb-6" data-testid="badge-hero">
                Residential & Commercial Leases
              </Badge>
              
              <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
                Transfer Your Lease{" "}
                <span className="text-primary">Seamlessly</span>
              </h1>
              
              <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                Novy connects outgoing tenants with qualified replacements. 
                Owner-approved transfers ensure everyone's interests are protected.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a href="/api/login">
                  <Button size="lg" className="gap-2 w-full sm:w-auto" data-testid="button-list-lease">
                    List Your Lease
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </a>
                <Link href="/listings">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto" data-testid="button-browse">
                    Browse Listings
                  </Button>
                </Link>
              </div>

              <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-accent" />
                  <span>No brokerage fees</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-accent" />
                  <span>Owner approval required</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-accent" />
                  <span>Secure document handling</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-20 bg-card/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="font-serif text-3xl md:text-4xl font-bold mb-4">How It Works</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Four simple steps to transfer your lease legally and securely.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {steps.map((item, index) => (
                <div key={item.step} className="relative">
                  <Card className="h-full hover-elevate">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                          {item.step}
                        </div>
                        {index < steps.length - 1 && (
                          <div className="hidden lg:block absolute top-12 left-[calc(100%-1rem)] w-8 h-0.5 bg-border" />
                        )}
                      </div>
                      <h3 className="font-semibold mb-2">{item.title}</h3>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="font-serif text-3xl md:text-4xl font-bold mb-4">Why Choose Novy</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Built for legal compliance and peace of mind.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature) => (
                <Card key={feature.title} className="hover-elevate">
                  <CardContent className="pt-6">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                      <feature.icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="font-semibold mb-2">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 bg-card/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <Badge variant="secondary" className="mb-4">Platform Fees</Badge>
                <h2 className="font-serif text-3xl md:text-4xl font-bold mb-4">
                  Simple, Transparent Pricing
                </h2>
                <p className="text-muted-foreground mb-6">
                  We only charge the incoming tenant a one-time platform fee upon successful lease transfer. 
                  Outgoing tenants and property owners pay nothing.
                </p>
                <div className="space-y-4">
                  <Card>
                    <CardContent className="py-4 flex justify-between items-center">
                      <div>
                        <h4 className="font-semibold">Residential Transfer</h4>
                        <p className="text-sm text-muted-foreground">Apartments, houses, condos</p>
                      </div>
                      <div className="text-2xl font-bold text-primary">$399</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="py-4 flex justify-between items-center">
                      <div>
                        <h4 className="font-semibold">Commercial Transfer</h4>
                        <p className="text-sm text-muted-foreground">Offices, retail, industrial</p>
                      </div>
                      <div className="text-2xl font-bold text-primary">$2,500</div>
                    </CardContent>
                  </Card>
                </div>
              </div>
              <div className="bg-gradient-to-br from-primary/10 to-accent/10 rounded-2xl p-8 md:p-12">
                <h3 className="font-serif text-2xl font-bold mb-4">Ready to transfer your lease?</h3>
                <p className="text-muted-foreground mb-6">
                  Create your listing in minutes. We'll handle owner authorization and applicant screening.
                </p>
                <a href="/api/login">
                  <Button size="lg" className="gap-2" data-testid="button-cta-start">
                    Get Started Free
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
