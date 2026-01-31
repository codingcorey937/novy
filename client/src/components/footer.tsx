import { Logo } from "@/components/logo";
import { Link } from "wouter";

export function Footer() {
  return (
    <footer className="border-t bg-card/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4" data-testid="footer-logo">
              <Logo className="h-6 w-6" />
              <span className="font-serif text-lg font-bold">Novy</span>
            </Link>
            <p className="text-sm text-muted-foreground max-w-sm">
              Novy facilitates lease transfers between tenants, subject to owner approval. 
              We are not a real estate broker and do not negotiate rent.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Platform</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/listings" className="hover:text-foreground transition-colors" data-testid="footer-browse">
                  Browse Listings
                </Link>
              </li>
              <li>
                <Link href="/create-listing" className="hover:text-foreground transition-colors" data-testid="footer-create">
                  Create Listing
                </Link>
              </li>
              <li>
                <Link href="/how-it-works" className="hover:text-foreground transition-colors" data-testid="footer-how">
                  How It Works
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Legal</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/terms" className="hover:text-foreground transition-colors" data-testid="footer-terms">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-foreground transition-colors" data-testid="footer-privacy">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/disclaimer" className="hover:text-foreground transition-colors" data-testid="footer-disclaimer">
                  Legal Disclaimer
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t mt-8 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Novy. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground">
            Novy is not a real estate broker and does not negotiate rent.
          </p>
        </div>
      </div>
    </footer>
  );
}
