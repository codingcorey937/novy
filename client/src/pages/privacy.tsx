import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { Building2 } from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";

export default function Privacy() {
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
            <h1 className="font-serif text-4xl md:text-5xl font-bold mb-4">Privacy Policy</h1>
            <p className="text-muted-foreground">Last updated: January 2026</p>
          </div>
        </div>

        <div className="container mx-auto px-4 py-16">
          <div className="max-w-3xl mx-auto prose prose-slate dark:prose-invert">
            <h2>1. Information We Collect</h2>
            <p>We collect information you provide directly to us, including:</p>
            <ul>
              <li>Account information (name, email address, profile photo)</li>
              <li>Listing information (property details, lease terms, contact information)</li>
              <li>Application information (cover letters, move-in dates, contact details)</li>
              <li>Payment information (processed securely through Stripe)</li>
              <li>Communications through our messaging system</li>
            </ul>

            <h2>2. How We Use Your Information</h2>
            <p>We use the information we collect to:</p>
            <ul>
              <li>Provide, maintain, and improve our services</li>
              <li>Process transactions and send related information</li>
              <li>Send technical notices, updates, and administrative messages</li>
              <li>Respond to your comments, questions, and requests</li>
              <li>Facilitate communication between users</li>
              <li>Monitor and analyze trends, usage, and activities</li>
            </ul>

            <h2>3. Information Sharing</h2>
            <p>We may share your information in the following circumstances:</p>
            <ul>
              <li>With other users as necessary to facilitate lease transfers (e.g., sharing applicant information with listing owners)</li>
              <li>With property owners for authorization verification</li>
              <li>With service providers who assist in our operations (e.g., Stripe for payment processing)</li>
              <li>In response to legal process or government requests</li>
              <li>To protect the rights, property, and safety of Novy and our users</li>
            </ul>

            <h2>4. Data Security</h2>
            <p>
              We implement appropriate technical and organizational measures to protect your personal information, 
              including:
            </p>
            <ul>
              <li>Encryption of data in transit and at rest</li>
              <li>Secure authentication through our identity provider</li>
              <li>Hashed storage of sensitive tokens</li>
              <li>Regular security audits and monitoring</li>
            </ul>

            <h2>5. Data Retention</h2>
            <p>
              We retain your information for as long as your account is active or as needed to provide you services. 
              We may also retain certain information as required by law or for legitimate business purposes.
            </p>

            <h2>6. Your Rights</h2>
            <p>You have the right to:</p>
            <ul>
              <li>Access your personal information</li>
              <li>Correct inaccurate information</li>
              <li>Request deletion of your information</li>
              <li>Object to processing of your information</li>
              <li>Data portability</li>
            </ul>

            <h2>7. Cookies and Tracking</h2>
            <p>
              We use cookies and similar technologies to maintain user sessions, remember preferences, 
              and analyze how our services are used. You can control cookie settings through your browser.
            </p>

            <h2>8. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of any changes by 
              posting the new policy on this page and updating the "Last updated" date.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
