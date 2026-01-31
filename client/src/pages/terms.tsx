import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { Logo } from "@/components/logo";
import { Building2 } from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";

export default function Terms() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="sticky top-0 z-50 glass border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between gap-4">
            <Link href="/" className="flex items-center gap-2">
              <Logo className="h-7 w-7" />
              <span className="font-serif text-xl font-bold tracking-tight">Novy</span>
            </Link>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              {isAuthenticated ? (
                <Link href="/">
                  <Button>Dashboard</Button>
                </Link>
              ) : (
                <a href="/api/login">
                  <Button>Sign In</Button>
                </a>
              )}
            </div>
          </div>
        </div>
      </header>
      <main className="flex-1">
        <div className="bg-primary/5 py-16">
          <div className="container mx-auto px-4 text-center">
            <h1 className="font-serif text-4xl md:text-5xl font-bold mb-4">Terms of Service</h1>
            <p className="text-muted-foreground">Last updated: January 2026</p>
          </div>
        </div>

        <div className="container mx-auto px-4 py-16">
          <div className="max-w-3xl mx-auto prose prose-slate dark:prose-invert">
            <h2>1. Acceptance of Terms</h2>
            <p>
              By accessing or using Novy ("the Platform"), you agree to be bound by these Terms of Service. 
              If you do not agree to these terms, please do not use our services.
            </p>

            <h2>2. Description of Service</h2>
            <p>
              Novy is a lease transfer marketplace that connects current tenants (outgoing tenants) with 
              prospective tenants (incoming tenants) who wish to assume existing residential or commercial leases. 
              The Platform facilitates the connection between parties but does not act as a real estate broker, 
              agent, or legal representative.
            </p>

            <h2>3. User Responsibilities</h2>
            <p>Users of the Platform agree to:</p>
            <ul>
              <li>Provide accurate and truthful information in all listings and applications</li>
              <li>Obtain proper authorization from property owners before listing a lease for transfer</li>
              <li>Comply with all applicable local, state, and federal laws regarding lease transfers</li>
              <li>Not use the Platform for any fraudulent or illegal purposes</li>
            </ul>

            <h2>4. Platform Fees</h2>
            <p>
              Novy charges a one-time platform fee to incoming tenants upon successful lease transfer approval:
            </p>
            <ul>
              <li>Residential leases: $399</li>
              <li>Commercial leases: $2,500</li>
            </ul>
            <p>
              Fees are processed through Stripe and are non-refundable once the transfer process has been 
              initiated and approved by the property owner.
            </p>

            <h2>5. Owner Authorization</h2>
            <p>
              All listings require explicit authorization from the property owner or property manager before 
              being published on the Platform. Novy sends a secure authorization link to property owners to 
              verify their approval of the lease transfer listing.
            </p>

            <h2>6. Limitation of Liability</h2>
            <p>
              Novy is a marketplace platform only. We do not guarantee the success of any lease transfer, 
              the accuracy of any listing information, or the suitability of any tenant. Users are responsible 
              for conducting their own due diligence before entering into any agreements.
            </p>

            <h2>7. Privacy</h2>
            <p>
              Your use of the Platform is also governed by our Privacy Policy. Please review our Privacy Policy 
              to understand how we collect, use, and protect your information.
            </p>

            <h2>8. Modifications</h2>
            <p>
              Novy reserves the right to modify these Terms of Service at any time. Continued use of the 
              Platform after any changes constitutes acceptance of the new terms.
            </p>

            <h2>9. Contact</h2>
            <p>
              For questions about these Terms of Service, please contact us at support@novy.live.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
