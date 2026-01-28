import { Footer } from "@/components/footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { FileText, Search, CheckCircle, Key, DollarSign, Building2 } from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";

export default function HowItWorks() {
  const steps = [
    {
      icon: FileText,
      title: "1. List Your Lease",
      description: "Current tenants create a listing with property details, lease terms, and owner contact information. The listing is submitted for owner authorization."
    },
    {
      icon: CheckCircle,
      title: "2. Owner Authorization",
      description: "Property owners receive a secure link via email to review and approve the listing. This ensures all transfers are legitimate and authorized."
    },
    {
      icon: Search,
      title: "3. Find Your Match",
      description: "Once approved, listings go live. Incoming tenants browse active listings and apply to those that fit their needs."
    },
    {
      icon: DollarSign,
      title: "4. Application & Payment",
      description: "When an owner approves an applicant, the incoming tenant pays the one-time platform fee ($399 residential, $2,500 commercial) to finalize."
    },
    {
      icon: Key,
      title: "5. Complete the Transfer",
      description: "After payment, both parties can communicate directly through the platform to coordinate the lease transfer with the property owner."
    }
  ];

  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="sticky top-0 z-50 glass border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between gap-4">
            <Link href="/" className="flex items-center gap-2">
              <Building2 className="h-7 w-7 text-primary" />
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
            <h1 className="font-serif text-4xl md:text-5xl font-bold mb-4">How Novy Works</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              A simple, secure process to transfer your lease to a qualified replacement tenant.
            </p>
          </div>
        </div>

        <div className="container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto space-y-8">
            {steps.map((step, index) => (
              <Card key={index} className="overflow-hidden">
                <CardContent className="p-6 flex gap-6 items-start">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <step.icon className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                    <p className="text-muted-foreground">{step.description}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-16 text-center">
            <Card className="max-w-2xl mx-auto">
              <CardContent className="p-8">
                <h2 className="text-2xl font-semibold mb-4">Important Notes</h2>
                <ul className="text-left text-muted-foreground space-y-3">
                  <li>Novy is a marketplace platform only - we do not act as a real estate broker.</li>
                  <li>We do not negotiate rent or lease terms between parties.</li>
                  <li>All lease transfers require explicit approval from the property owner.</li>
                  <li>Platform fees are non-refundable once the transfer process begins.</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
