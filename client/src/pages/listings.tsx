import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { Search, MapPin, Calendar, DollarSign, Building2, Home, ArrowRight, Filter } from "lucide-react";
import type { Listing } from "@shared/schema";

export default function Listings() {
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("newest");

  const { data: listings, isLoading } = useQuery<Listing[]>({
    queryKey: ["/api/listings", { status: "active" }],
  });

  const filteredListings = listings?.filter((listing) => {
    const matchesSearch =
      listing.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      listing.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      listing.city.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === "all" || listing.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const sortedListings = filteredListings?.sort((a, b) => {
    switch (sortBy) {
      case "price-low":
        return a.rent - b.rent;
      case "price-high":
        return b.rent - a.rent;
      case "newest":
      default:
        return new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime();
    }
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

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1">
        <div className="bg-gradient-to-b from-primary/5 to-background py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8">
              <h1 className="font-serif text-3xl md:text-4xl font-bold mb-4">Browse Available Leases</h1>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Find your next residential or commercial space. All listings are owner-approved and ready for transfer.
              </p>
            </div>

            <div className="flex flex-col md:flex-row gap-4 max-w-4xl mx-auto">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by address, city, or title..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  data-testid="input-search"
                />
              </div>

              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full md:w-[180px]" data-testid="select-type">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Property type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="residential">Residential</SelectItem>
                  <SelectItem value="commercial">Commercial</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full md:w-[180px]" data-testid="select-sort">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="price-low">Price: Low to High</SelectItem>
                  <SelectItem value="price-high">Price: High to Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i}>
                  <CardContent className="p-0">
                    <Skeleton className="h-48 w-full rounded-t-lg" />
                    <div className="p-4 space-y-3">
                      <Skeleton className="h-6 w-3/4" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : sortedListings && sortedListings.length > 0 ? (
            <>
              <div className="flex items-center justify-between mb-6">
                <p className="text-muted-foreground">
                  Showing {sortedListings.length} {sortedListings.length === 1 ? "listing" : "listings"}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sortedListings.map((listing) => (
                  <Link key={listing.id} href={`/listings/${listing.id}`}>
                    <Card className="h-full overflow-hidden hover-elevate cursor-pointer group" data-testid={`listing-card-${listing.id}`}>
                      <CardContent className="p-0">
                        <div className="relative h-48 bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                          {listing.type === "residential" ? (
                            <Home className="h-16 w-16 text-primary/50" />
                          ) : (
                            <Building2 className="h-16 w-16 text-primary/50" />
                          )}
                          <div className="absolute top-3 left-3">
                            <Badge variant="secondary" className="capitalize">
                              {listing.type}
                            </Badge>
                          </div>
                          <div className="absolute top-3 right-3">
                            <Badge className="bg-primary">
                              {formatCurrency(listing.rent)}/mo
                            </Badge>
                          </div>
                        </div>

                        <div className="p-4">
                          <h3 className="font-semibold text-lg mb-2 line-clamp-1 group-hover:text-primary transition-colors">
                            {listing.title}
                          </h3>
                          
                          <div className="space-y-2 text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 flex-shrink-0" />
                              <span className="truncate">{listing.address}, {listing.city}, {listing.state}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 flex-shrink-0" />
                              <span>Lease expires {formatDate(listing.leaseExpiration)}</span>
                            </div>
                            {listing.squareFootage && (
                              <div className="flex items-center gap-2">
                                <Building2 className="h-4 w-4 flex-shrink-0" />
                                <span>{listing.squareFootage.toLocaleString()} sq ft</span>
                              </div>
                            )}
                            {listing.bedrooms && (
                              <div className="flex items-center gap-2">
                                <Home className="h-4 w-4 flex-shrink-0" />
                                <span>{listing.bedrooms} bed, {listing.bathrooms} bath</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter className="pt-0 pb-4 px-4">
                        <Button variant="outline" className="w-full gap-2 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                          View Details
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </CardFooter>
                    </Card>
                  </Link>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-16">
              <Building2 className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-xl font-semibold mb-2">No listings found</h3>
              <p className="text-muted-foreground mb-6">
                {searchQuery || typeFilter !== "all"
                  ? "Try adjusting your search or filters"
                  : "Be the first to list a property for transfer"}
              </p>
              <Link href="/create-listing">
                <Button data-testid="button-create-listing">Create a Listing</Button>
              </Link>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
