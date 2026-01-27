import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, Link, useLocation } from "wouter";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { MapPin, Calendar, DollarSign, Building2, Home, ArrowLeft, Send, FileText, Clock, User, CheckCircle2, AlertCircle } from "lucide-react";
import { useState } from "react";
import type { Listing } from "@shared/schema";

export default function ListingDetail() {
  const { id } = useParams<{ id: string }>();
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [coverLetter, setCoverLetter] = useState("");
  const [applyDialogOpen, setApplyDialogOpen] = useState(false);

  const { data: listing, isLoading } = useQuery<Listing>({
    queryKey: ["/api/listings", id],
    enabled: !!id,
  });

  const applyMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/applications", {
        listingId: id,
        coverLetter,
      });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/applications/my"] });
      toast({
        title: "Application submitted!",
        description: "The property owner and current tenant have been notified.",
      });
      setApplyDialogOpen(false);
      navigate(`/applications/${data.id}`);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to submit application",
        variant: "destructive",
      });
    },
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; icon: typeof CheckCircle2 }> = {
      draft: { variant: "secondary", icon: Clock },
      pending_authorization: { variant: "outline", icon: Clock },
      active: { variant: "default", icon: CheckCircle2 },
      transferred: { variant: "secondary", icon: CheckCircle2 },
      expired: { variant: "destructive", icon: AlertCircle },
      cancelled: { variant: "destructive", icon: AlertCircle },
    };
    const { variant, icon: Icon } = config[status] || { variant: "secondary", icon: Clock };
    return (
      <Badge variant={variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {status.replace(/_/g, " ")}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-1">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Skeleton className="h-8 w-48 mb-4" />
            <Skeleton className="h-64 w-full rounded-lg mb-6" />
            <div className="grid md:grid-cols-3 gap-6">
              <div className="md:col-span-2 space-y-4">
                <Skeleton className="h-40 w-full" />
                <Skeleton className="h-32 w-full" />
              </div>
              <Skeleton className="h-64 w-full" />
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Building2 className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
            <h2 className="text-2xl font-bold mb-2">Listing not found</h2>
            <p className="text-muted-foreground mb-6">This listing may have been removed or doesn't exist.</p>
            <Link href="/listings">
              <Button data-testid="button-back-to-listings">Browse Listings</Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const isOwner = user?.id === listing.userId;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Link href="/listings">
            <Button variant="ghost" className="gap-2 mb-4" data-testid="button-back">
              <ArrowLeft className="h-4 w-4" />
              Back to Listings
            </Button>
          </Link>

          <div className="relative h-64 md:h-80 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mb-8 overflow-hidden">
            {listing.type === "residential" ? (
              <Home className="h-24 w-24 text-primary/40" />
            ) : (
              <Building2 className="h-24 w-24 text-primary/40" />
            )}
            <div className="absolute top-4 left-4 flex gap-2">
              <Badge variant="secondary" className="capitalize">
                {listing.type}
              </Badge>
              {getStatusBadge(listing.status)}
            </div>
            <div className="absolute bottom-4 right-4">
              <div className="bg-card/90 backdrop-blur rounded-lg px-4 py-2">
                <span className="text-2xl font-bold text-primary">{formatCurrency(listing.rent)}</span>
                <span className="text-muted-foreground">/month</span>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-6">
              <div>
                <h1 className="font-serif text-3xl font-bold mb-2">{listing.title}</h1>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>{listing.address}, {listing.city}, {listing.state} {listing.zipCode}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-card rounded-lg p-4 text-center">
                  <DollarSign className="h-5 w-5 mx-auto mb-1 text-primary" />
                  <p className="text-sm text-muted-foreground">Rent</p>
                  <p className="font-semibold">{formatCurrency(listing.rent)}</p>
                </div>
                <div className="bg-card rounded-lg p-4 text-center">
                  <Calendar className="h-5 w-5 mx-auto mb-1 text-primary" />
                  <p className="text-sm text-muted-foreground">Expires</p>
                  <p className="font-semibold">{formatDate(listing.leaseExpiration)}</p>
                </div>
                {listing.squareFootage && (
                  <div className="bg-card rounded-lg p-4 text-center">
                    <Building2 className="h-5 w-5 mx-auto mb-1 text-primary" />
                    <p className="text-sm text-muted-foreground">Sq Ft</p>
                    <p className="font-semibold">{listing.squareFootage.toLocaleString()}</p>
                  </div>
                )}
                {listing.bedrooms && (
                  <div className="bg-card rounded-lg p-4 text-center">
                    <Home className="h-5 w-5 mx-auto mb-1 text-primary" />
                    <p className="text-sm text-muted-foreground">Bed/Bath</p>
                    <p className="font-semibold">{listing.bedrooms}/{listing.bathrooms}</p>
                  </div>
                )}
              </div>

              {listing.description && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Description</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground whitespace-pre-line">{listing.description}</p>
                  </CardContent>
                </Card>
              )}

              {listing.amenities && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Amenities</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {listing.amenities.split(",").map((amenity, i) => (
                        <Badge key={i} variant="secondary">{amenity.trim()}</Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {listing.allowedUse && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Allowed Use</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{listing.allowedUse}</p>
                  </CardContent>
                </Card>
              )}
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Transfer Fee</CardTitle>
                  <CardDescription>
                    Paid by incoming tenant upon successful transfer
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-primary mb-4">
                    {listing.type === "residential" ? "$399" : "$2,500"}
                  </div>
                  
                  {!isAuthenticated ? (
                    <a href="/api/login">
                      <Button className="w-full gap-2" data-testid="button-login-to-apply">
                        Sign in to Apply
                      </Button>
                    </a>
                  ) : isOwner ? (
                    <Link href={`/listings/${id}/manage`}>
                      <Button className="w-full gap-2" data-testid="button-manage-listing">
                        Manage Listing
                      </Button>
                    </Link>
                  ) : listing.status === "active" ? (
                    <Dialog open={applyDialogOpen} onOpenChange={setApplyDialogOpen}>
                      <DialogTrigger asChild>
                        <Button className="w-full gap-2" data-testid="button-apply">
                          <Send className="h-4 w-4" />
                          Apply to Transfer
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Apply for Lease Transfer</DialogTitle>
                          <DialogDescription>
                            Submit your application to assume this lease. You'll need to provide documents for verification.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="py-4">
                          <label className="text-sm font-medium mb-2 block">Cover Letter (optional)</label>
                          <Textarea
                            placeholder="Introduce yourself and explain why you're a good fit for this property..."
                            value={coverLetter}
                            onChange={(e) => setCoverLetter(e.target.value)}
                            className="min-h-32"
                            data-testid="input-cover-letter"
                          />
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setApplyDialogOpen(false)} data-testid="button-cancel-apply">
                            Cancel
                          </Button>
                          <Button
                            onClick={() => applyMutation.mutate()}
                            disabled={applyMutation.isPending}
                            data-testid="button-submit-application"
                          >
                            {applyMutation.isPending ? "Submitting..." : "Submit Application"}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  ) : (
                    <Button className="w-full" disabled>
                      Not Available
                    </Button>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-accent" />
                    Owner Verified
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  <p>This listing has been authorized by the property owner/manager.</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">How It Works</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                      1
                    </div>
                    <p className="text-muted-foreground">Submit your application with required documents</p>
                  </div>
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                      2
                    </div>
                    <p className="text-muted-foreground">Current tenant and owner review your application</p>
                  </div>
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                      3
                    </div>
                    <p className="text-muted-foreground">Pay platform fee and complete the transfer</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
