import { useAuth } from "@/hooks/use-auth";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Logo } from "@/components/logo";
import { Plus, Home, FileText, MessageSquare, ArrowRight, Building2, TrendingUp, Users, Clock } from "lucide-react";
import type { Listing, Application } from "@shared/schema";

export default function Dashboard() {
  const { user } = useAuth();

  const { data: myListings, isLoading: listingsLoading } = useQuery<Listing[]>({
    queryKey: ["/api/listings/my"],
  });

  const { data: myApplications, isLoading: applicationsLoading } = useQuery<Application[]>({
    queryKey: ["/api/applications/my"],
  });

  const { data: stats } = useQuery<{ totalListings: number; pendingApplications: number; unreadMessages: number }>({
    queryKey: ["/api/dashboard/stats"],
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      draft: "secondary",
      pending_authorization: "outline",
      active: "default",
      transferred: "secondary",
      expired: "destructive",
      cancelled: "destructive",
    };
    return <Badge variant={variants[status] || "secondary"}>{status.replace(/_/g, " ")}</Badge>;
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="font-serif text-3xl font-bold mb-2">
              Welcome back, {user?.firstName || "there"}
            </h1>
            <p className="text-muted-foreground">
              Manage your lease transfers and applications from your dashboard.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Active Listings</p>
                    <p className="text-3xl font-bold">{stats?.totalListings ?? 0}</p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Logo className="h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Pending Applications</p>
                    <p className="text-3xl font-bold">{stats?.pendingApplications ?? 0}</p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-accent/10 flex items-center justify-center">
                    <Users className="h-6 w-6 text-accent" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Unread Messages</p>
                    <p className="text-3xl font-bold">{stats?.unreadMessages ?? 0}</p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-yellow-500/10 flex items-center justify-center">
                    <MessageSquare className="h-6 w-6 text-yellow-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Home className="h-5 w-5" />
                    My Listings
                  </CardTitle>
                  <CardDescription>Properties you're looking to transfer</CardDescription>
                </div>
                <Link href="/create-listing">
                  <Button size="sm" className="gap-1" data-testid="button-new-listing">
                    <Plus className="h-4 w-4" />
                    New
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                {listingsLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-20 w-full" />
                    ))}
                  </div>
                ) : myListings && myListings.length > 0 ? (
                  <div className="space-y-3">
                    {myListings.slice(0, 5).map((listing) => (
                      <Link key={listing.id} href={`/listings/${listing.id}`}>
                        <div className="flex items-center justify-between p-4 rounded-lg border hover-elevate cursor-pointer" data-testid={`listing-item-${listing.id}`}>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{listing.title}</p>
                            <p className="text-sm text-muted-foreground truncate">{listing.address}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            {getStatusBadge(listing.status)}
                            <ArrowRight className="h-4 w-4 text-muted-foreground" />
                          </div>
                        </div>
                      </Link>
                    ))}
                    {myListings.length > 5 && (
                      <Link href="/my-listings">
                        <Button variant="ghost" className="w-full" data-testid="button-view-all-listings">
                          View all {myListings.length} listings
                        </Button>
                      </Link>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Building2 className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                    <p className="text-muted-foreground mb-4">No listings yet</p>
                    <Link href="/create-listing">
                      <Button data-testid="button-create-first-listing">Create Your First Listing</Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    My Applications
                  </CardTitle>
                  <CardDescription>Leases you've applied to assume</CardDescription>
                </div>
                <Link href="/listings">
                  <Button size="sm" variant="outline" data-testid="button-browse-listings">
                    Browse
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                {applicationsLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-20 w-full" />
                    ))}
                  </div>
                ) : myApplications && myApplications.length > 0 ? (
                  <div className="space-y-3">
                    {myApplications.slice(0, 5).map((application) => (
                      <Link key={application.id} href={`/applications/${application.id}`}>
                        <div className="flex items-center justify-between p-4 rounded-lg border hover-elevate cursor-pointer" data-testid={`application-item-${application.id}`}>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium">Application #{application.id.slice(0, 8)}</p>
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {new Date(application.createdAt!).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge variant={application.status === "approved" ? "default" : "secondary"}>
                              {application.status}
                            </Badge>
                            <ArrowRight className="h-4 w-4 text-muted-foreground" />
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                    <p className="text-muted-foreground mb-4">No applications yet</p>
                    <Link href="/listings">
                      <Button variant="outline" data-testid="button-find-lease">Find a Lease</Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card className="mt-8">
            <CardContent className="py-6">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Need to transfer your lease quickly?</h3>
                    <p className="text-sm text-muted-foreground">Create a listing and reach qualified applicants today.</p>
                  </div>
                </div>
                <Link href="/create-listing">
                  <Button className="gap-2" data-testid="button-quick-listing">
                    <Plus className="h-4 w-4" />
                    Create Listing
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}
