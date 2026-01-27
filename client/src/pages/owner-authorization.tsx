import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/theme-toggle";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Building2, MapPin, Calendar, DollarSign, CheckCircle2, XCircle, AlertCircle, Clock, Home, Shield } from "lucide-react";
import type { Listing, OwnerAuthorization } from "@shared/schema";

interface AuthorizationData {
  authorization: OwnerAuthorization;
  listing: Listing;
}

export default function OwnerAuthorizationPage() {
  const { token } = useParams<{ token: string }>();
  const { toast } = useToast();
  const [decision, setDecision] = useState<"approved" | "rejected" | null>(null);

  const { data, isLoading, error } = useQuery<AuthorizationData>({
    queryKey: ["/api/authorize", token],
    enabled: !!token,
  });

  const authorizeMutation = useMutation({
    mutationFn: async (approve: boolean) => {
      const response = await apiRequest("POST", `/api/authorize/${token}`, {
        approve,
      });
      return response.json();
    },
    onSuccess: (_, approve) => {
      setDecision(approve ? "approved" : "rejected");
      toast({
        title: approve ? "Listing Approved" : "Listing Rejected",
        description: approve
          ? "The listing is now active and visible to potential tenants."
          : "The listing has been rejected and will not be published.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to process authorization",
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading authorization details...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-16 w-16 mx-auto text-destructive mb-4" />
            <h2 className="text-xl font-bold mb-2">Invalid or Expired Link</h2>
            <p className="text-muted-foreground">
              This authorization link is invalid, has expired, or has already been used.
              Please contact the tenant for a new authorization request.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { authorization, listing } = data;

  if (authorization.status !== "pending" || decision) {
    const isApproved = authorization.status === "approved" || decision === "approved";
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            {isApproved ? (
              <>
                <CheckCircle2 className="h-16 w-16 mx-auto text-accent mb-4" />
                <h2 className="text-xl font-bold mb-2">Listing Approved</h2>
                <p className="text-muted-foreground">
                  Thank you! The listing is now active and potential tenants can apply.
                </p>
              </>
            ) : (
              <>
                <XCircle className="h-16 w-16 mx-auto text-destructive mb-4" />
                <h2 className="text-xl font-bold mb-2">Listing Rejected</h2>
                <p className="text-muted-foreground">
                  The listing has been rejected and will not be published.
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="h-6 w-6 text-primary" />
            <span className="font-serif text-lg font-bold">Novi</span>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <Badge variant="outline" className="mb-4">
            <Shield className="h-3 w-3 mr-1" />
            Owner Authorization Required
          </Badge>
          <h1 className="font-serif text-3xl font-bold mb-2">Lease Transfer Authorization</h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            A tenant has requested to list their lease for transfer on Novi.
            Please review the details and approve or reject this listing.
          </p>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Property Details</CardTitle>
            <CardDescription>Information about the property being listed for transfer</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-lg mb-4">{listing.title}</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-start gap-3">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p>{listing.address}</p>
                      <p className="text-muted-foreground">{listing.city}, {listing.state} {listing.zipCode}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <p>{formatCurrency(listing.rent)}/month</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <p>Lease expires {formatDate(listing.leaseExpiration)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    {listing.type === "residential" ? (
                      <Home className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                    )}
                    <p className="capitalize">{listing.type}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {listing.bedrooms && (
                  <div className="bg-muted/50 rounded-lg p-3">
                    <p className="text-sm text-muted-foreground">Bedrooms/Bathrooms</p>
                    <p className="font-semibold">{listing.bedrooms} bed, {listing.bathrooms} bath</p>
                  </div>
                )}
                {listing.squareFootage && (
                  <div className="bg-muted/50 rounded-lg p-3">
                    <p className="text-sm text-muted-foreground">Square Footage</p>
                    <p className="font-semibold">{listing.squareFootage.toLocaleString()} sq ft</p>
                  </div>
                )}
                {listing.allowedUse && (
                  <div className="bg-muted/50 rounded-lg p-3">
                    <p className="text-sm text-muted-foreground">Allowed Use</p>
                    <p className="font-semibold">{listing.allowedUse}</p>
                  </div>
                )}
              </div>
            </div>

            {listing.description && (
              <>
                <Separator className="my-6" />
                <div>
                  <h4 className="font-medium mb-2">Description</h4>
                  <p className="text-muted-foreground text-sm whitespace-pre-line">{listing.description}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>What This Means</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-3">
              <CheckCircle2 className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Approve the Listing</p>
                <p className="text-sm text-muted-foreground">
                  The property will be listed on Novi's marketplace. Potential tenants can apply to assume the lease.
                  You will review and approve any applicants before the transfer is finalized.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <XCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Reject the Listing</p>
                <p className="text-sm text-muted-foreground">
                  The listing will not be published and the tenant will be notified.
                  No further action will be taken.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Your Decision</CardTitle>
            <CardDescription>
              By approving, you confirm that you are authorized to make this decision for the property.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                size="lg"
                className="flex-1 gap-2"
                onClick={() => authorizeMutation.mutate(true)}
                disabled={authorizeMutation.isPending}
                data-testid="button-approve"
              >
                <CheckCircle2 className="h-5 w-5" />
                Approve Listing
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="flex-1 gap-2"
                onClick={() => authorizeMutation.mutate(false)}
                disabled={authorizeMutation.isPending}
                data-testid="button-reject"
              >
                <XCircle className="h-5 w-5" />
                Reject Listing
              </Button>
            </div>
            <p className="text-xs text-muted-foreground text-center mt-4">
              Your IP address and timestamp will be recorded for legal purposes.
            </p>
          </CardContent>
        </Card>

        <div className="text-center mt-8 text-sm text-muted-foreground">
          <p>
            Novi facilitates lease transfers only. We are not a real estate broker
            and do not negotiate rent. Owner approval is always required.
          </p>
        </div>
      </main>
    </div>
  );
}
