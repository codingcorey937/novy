import { Footer } from "@/components/footer";
import { AlertTriangle, Building2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";

export default function Disclaimer() {
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
            <h1 className="font-serif text-4xl md:text-5xl font-bold mb-4">Legal Disclaimer</h1>
            <p className="text-muted-foreground">Non-Broker Disclosure</p>
          </div>
        </div>

        <div className="container mx-auto px-4 py-16">
          <div className="max-w-3xl mx-auto">
            <Card className="mb-8 border-amber-500/50 bg-amber-50/50 dark:bg-amber-950/20">
              <CardContent className="p-6 flex gap-4">
                <AlertTriangle className="w-8 h-8 text-amber-600 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-lg mb-2">Important Notice</h3>
                  <p className="text-muted-foreground">
                    Novy is NOT a licensed real estate broker, agent, or legal representative. 
                    We are a technology platform that facilitates connections between parties 
                    interested in lease transfers.
                  </p>
                </div>
              </CardContent>
            </Card>

            <div className="prose prose-slate dark:prose-invert">
              <h2>Non-Broker Disclosure</h2>
              <p>
                Novy operates as a marketplace platform only. By using our services, you acknowledge 
                and agree to the following:
              </p>

              <h3>What Novy Does:</h3>
              <ul>
                <li>Provides a platform for outgoing tenants to list their leases for transfer</li>
                <li>Connects incoming tenants with available lease transfer opportunities</li>
                <li>Facilitates secure authorization from property owners</li>
                <li>Enables communication between verified parties</li>
                <li>Processes platform fees through secure payment systems</li>
              </ul>

              <h3>What Novy Does NOT Do:</h3>
              <ul>
                <li>Act as a real estate broker or agent</li>
                <li>Negotiate rent, lease terms, or other contractual matters</li>
                <li>Provide legal, financial, or real estate advice</li>
                <li>Guarantee the success or legality of any lease transfer</li>
                <li>Verify the creditworthiness or background of any party</li>
                <li>Assume responsibility for the actions of users</li>
                <li>Handle or manage any lease documents or contracts</li>
              </ul>

              <h2>User Responsibility</h2>
              <p>
                All users of the Novy platform are solely responsible for:
              </p>
              <ul>
                <li>Ensuring compliance with their existing lease agreements</li>
                <li>Obtaining all necessary approvals from landlords and property managers</li>
                <li>Verifying the accuracy of all information provided by other parties</li>
                <li>Conducting their own due diligence before entering into any agreements</li>
                <li>Seeking independent legal counsel if needed</li>
                <li>Understanding and complying with local laws regarding lease assignments and transfers</li>
              </ul>

              <h2>No Guarantees</h2>
              <p>
                Novy makes no representations or warranties regarding:
              </p>
              <ul>
                <li>The accuracy or completeness of any listing information</li>
                <li>The suitability, reliability, or trustworthiness of any user</li>
                <li>The success of any lease transfer arrangement</li>
                <li>The enforceability of any agreements made between users</li>
              </ul>

              <h2>Limitation of Liability</h2>
              <p>
                Novy shall not be liable for any damages arising from:
              </p>
              <ul>
                <li>Lease transfers that fail to complete</li>
                <li>Disputes between tenants, landlords, or property managers</li>
                <li>Inaccurate or misleading information provided by users</li>
                <li>Any breach of lease terms by any party</li>
                <li>Financial losses incurred through the use of our platform</li>
              </ul>

              <h2>Acknowledgment</h2>
              <p>
                By using the Novy platform, you acknowledge that you have read, understood, and agree 
                to this Legal Disclaimer. If you do not agree with any part of this disclaimer, 
                please do not use our services.
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
