import { useQuery } from "@tanstack/react-query";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "wouter";
import { Plus, Home, Building2, MapPin, Calendar, DollarSign, ArrowRight, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import type { Listing } from "@shared/schema";

export default function MyListings() {
  const { data: listings, isLoading } = useQuery<Listing[]>({
    queryKey: ["/api/listings/my"],
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
      month: "short",
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

  const activeListings = listings?.filter((l) => l.status === "active") || [];
  const pendingListings = listings?.filter((l) => ["draft", "pending_authorization"].includes(l.status)) || [];
  const closedListings = listings?.filter((l) => ["transferred", "expired", "cancelled"].includes(l.status)) || [];

  const ListingCard = ({ listing }: { listing: Listing }) => (
    <Link href={`/listings/${listing.id}`}>
      <Card className="h-full hover-elevate cursor-pointer" data-testid={`my-listing-${listing.id}`}>
        <CardContent className="p-0">
          <div className="relative h-32 bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center rounded-t-lg">
            {listing.type === "residential" ? (
              <Home className="h-12 w-12 text-primary/50" />
            ) : (
              <Building2 className="h-12 w-12 text-primary/50" />
            )}
            <div className="absolute top-3 left-3">
              {getStatusBadge(listing.status)}
            </div>
          </div>
          <div className="p-4">
            <h3 className="font-semibold mb-2 line-clamp-1">{listing.title}</h3>
            <div className="space-y-1 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <MapPin className="h-3 w-3" />
                <span className="truncate">{listing.city}, {listing.state}</span>
              </div>
              <div className="flex items-center gap-2">
                <DollarSign className="h-3 w-3" />
                <span>{formatCurrency(listing.rent)}/mo</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-3 w-3" />
                <span>Expires {formatDate(listing.leaseExpiration)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="font-serif text-3xl font-bold mb-2">My Listings</h1>
              <p className="text-muted-foreground">
                Manage your lease transfer listings
              </p>
            </div>
            <Link href="/create-listing">
              <Button className="gap-2" data-testid="button-create-new">
                <Plus className="h-4 w-4" />
                New Listing
              </Button>
            </Link>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardContent className="p-0">
                    <Skeleton className="h-32 w-full rounded-t-lg" />
                    <div className="p-4 space-y-2">
                      <Skeleton className="h-5 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                      <Skeleton className="h-4 w-2/3" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : listings && listings.length > 0 ? (
            <Tabs defaultValue="all">
              <TabsList className="mb-6">
                <TabsTrigger value="all" data-testid="tab-all">
                  All ({listings.length})
                </TabsTrigger>
                <TabsTrigger value="active" data-testid="tab-active">
                  Active ({activeListings.length})
                </TabsTrigger>
                <TabsTrigger value="pending" data-testid="tab-pending">
                  Pending ({pendingListings.length})
                </TabsTrigger>
                <TabsTrigger value="closed" data-testid="tab-closed">
                  Closed ({closedListings.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="all">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {listings.map((listing) => (
                    <ListingCard key={listing.id} listing={listing} />
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="active">
                {activeListings.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {activeListings.map((listing) => (
                      <ListingCard key={listing.id} listing={listing} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <CheckCircle2 className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                    <p className="text-muted-foreground">No active listings</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="pending">
                {pendingListings.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {pendingListings.map((listing) => (
                      <ListingCard key={listing.id} listing={listing} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Clock className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                    <p className="text-muted-foreground">No pending listings</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="closed">
                {closedListings.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {closedListings.map((listing) => (
                      <ListingCard key={listing.id} listing={listing} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Building2 className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                    <p className="text-muted-foreground">No closed listings</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          ) : (
            <div className="text-center py-16">
              <Building2 className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-xl font-semibold mb-2">No listings yet</h3>
              <p className="text-muted-foreground mb-6">
                Create your first listing to start finding a replacement tenant.
              </p>
              <Link href="/create-listing">
                <Button className="gap-2" data-testid="button-first-listing">
                  <Plus className="h-4 w-4" />
                  Create Your First Listing
                </Button>
              </Link>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
