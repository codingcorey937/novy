import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Shield, Users, Building2, FileText, DollarSign, Search, MoreVertical, CheckCircle2, XCircle, Clock } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Listing, Application, Payment } from "@shared/schema";
import type { User } from "@shared/models/auth";

export default function Admin() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: users, isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
  });

  const { data: listings, isLoading: listingsLoading } = useQuery<Listing[]>({
    queryKey: ["/api/admin/listings"],
  });

  const { data: applications, isLoading: applicationsLoading } = useQuery<Application[]>({
    queryKey: ["/api/admin/applications"],
  });

  const { data: payments, isLoading: paymentsLoading } = useQuery<Payment[]>({
    queryKey: ["/api/admin/payments"],
  });

  const { data: stats } = useQuery<{
    totalUsers: number;
    totalListings: number;
    activeListings: number;
    totalApplications: number;
    totalPayments: number;
    revenue: number;
  }>({
    queryKey: ["/api/admin/stats"],
  });

  const updateListingMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const response = await apiRequest("PATCH", `/api/admin/listings/${id}`, { status });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/listings"] });
      toast({ title: "Listing updated" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update listing", variant: "destructive" });
    },
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(amount / 100);
  };

  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      active: "default",
      pending: "outline",
      pending_authorization: "outline",
      approved: "default",
      completed: "default",
      rejected: "destructive",
      cancelled: "destructive",
      expired: "destructive",
      failed: "destructive",
    };
    return <Badge variant={variants[status] || "secondary"}>{status.replace(/_/g, " ")}</Badge>;
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <Shield className="h-8 w-8 text-primary" />
              <h1 className="font-serif text-3xl font-bold">Admin Panel</h1>
            </div>
            <p className="text-muted-foreground">
              Manage users, listings, applications, and payments
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Users</p>
                    <p className="text-2xl font-bold">{stats?.totalUsers ?? 0}</p>
                  </div>
                  <Users className="h-8 w-8 text-primary/50" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Active Listings</p>
                    <p className="text-2xl font-bold">{stats?.activeListings ?? 0}</p>
                  </div>
                  <Building2 className="h-8 w-8 text-primary/50" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Applications</p>
                    <p className="text-2xl font-bold">{stats?.totalApplications ?? 0}</p>
                  </div>
                  <FileText className="h-8 w-8 text-primary/50" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Revenue</p>
                    <p className="text-2xl font-bold">{formatCurrency((stats?.revenue ?? 0) * 100)}</p>
                  </div>
                  <DollarSign className="h-8 w-8 text-accent/50" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="users">
            <TabsList className="mb-6">
              <TabsTrigger value="users" className="gap-2" data-testid="tab-users">
                <Users className="h-4 w-4" />
                Users
              </TabsTrigger>
              <TabsTrigger value="listings" className="gap-2" data-testid="tab-listings">
                <Building2 className="h-4 w-4" />
                Listings
              </TabsTrigger>
              <TabsTrigger value="applications" className="gap-2" data-testid="tab-applications">
                <FileText className="h-4 w-4" />
                Applications
              </TabsTrigger>
              <TabsTrigger value="payments" className="gap-2" data-testid="tab-payments">
                <DollarSign className="h-4 w-4" />
                Payments
              </TabsTrigger>
            </TabsList>

            <TabsContent value="users">
              <Card>
                <CardHeader>
                  <CardTitle>Users</CardTitle>
                  <CardDescription>Manage all registered users</CardDescription>
                </CardHeader>
                <CardContent>
                  {usersLoading ? (
                    <div className="space-y-2">
                      {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-12 w-full" />
                      ))}
                    </div>
                  ) : users && users.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Joined</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {users.map((user) => (
                          <TableRow key={user.id} data-testid={`user-row-${user.id}`}>
                            <TableCell className="font-medium">
                              {user.firstName} {user.lastName}
                            </TableCell>
                            <TableCell>{user.email}</TableCell>
                            <TableCell>{formatDate(user.createdAt)}</TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem>View Details</DropdownMenuItem>
                                  <DropdownMenuItem className="text-destructive">Disable Account</DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <p className="text-center py-8 text-muted-foreground">No users found</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="listings">
              <Card>
                <CardHeader>
                  <CardTitle>Listings</CardTitle>
                  <CardDescription>Manage all lease transfer listings</CardDescription>
                </CardHeader>
                <CardContent>
                  {listingsLoading ? (
                    <div className="space-y-2">
                      {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-12 w-full" />
                      ))}
                    </div>
                  ) : listings && listings.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Title</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Rent</TableHead>
                          <TableHead>Created</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {listings.map((listing) => (
                          <TableRow key={listing.id} data-testid={`listing-row-${listing.id}`}>
                            <TableCell className="font-medium max-w-[200px] truncate">
                              {listing.title}
                            </TableCell>
                            <TableCell className="capitalize">{listing.type}</TableCell>
                            <TableCell>{getStatusBadge(listing.status)}</TableCell>
                            <TableCell>${listing.rent.toLocaleString()}</TableCell>
                            <TableCell>{formatDate(listing.createdAt)}</TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => updateListingMutation.mutate({ id: listing.id, status: "active" })}>
                                    <CheckCircle2 className="mr-2 h-4 w-4" />
                                    Activate
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => updateListingMutation.mutate({ id: listing.id, status: "cancelled" })} className="text-destructive">
                                    <XCircle className="mr-2 h-4 w-4" />
                                    Cancel
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <p className="text-center py-8 text-muted-foreground">No listings found</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="applications">
              <Card>
                <CardHeader>
                  <CardTitle>Applications</CardTitle>
                  <CardDescription>View all lease transfer applications</CardDescription>
                </CardHeader>
                <CardContent>
                  {applicationsLoading ? (
                    <div className="space-y-2">
                      {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-12 w-full" />
                      ))}
                    </div>
                  ) : applications && applications.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>ID</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Payment</TableHead>
                          <TableHead>Applied</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {applications.map((application) => (
                          <TableRow key={application.id} data-testid={`application-row-${application.id}`}>
                            <TableCell className="font-mono text-sm">
                              {application.id.slice(0, 8)}
                            </TableCell>
                            <TableCell>{getStatusBadge(application.status)}</TableCell>
                            <TableCell>{getStatusBadge(application.paymentStatus || "pending")}</TableCell>
                            <TableCell>{formatDate(application.createdAt)}</TableCell>
                            <TableCell>
                              <Button variant="ghost" size="sm">View</Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <p className="text-center py-8 text-muted-foreground">No applications found</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="payments">
              <Card>
                <CardHeader>
                  <CardTitle>Payments</CardTitle>
                  <CardDescription>View payment transaction logs</CardDescription>
                </CardHeader>
                <CardContent>
                  {paymentsLoading ? (
                    <div className="space-y-2">
                      {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-12 w-full" />
                      ))}
                    </div>
                  ) : payments && payments.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>ID</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {payments.map((payment) => (
                          <TableRow key={payment.id} data-testid={`payment-row-${payment.id}`}>
                            <TableCell className="font-mono text-sm">
                              {payment.id.slice(0, 8)}
                            </TableCell>
                            <TableCell className="font-semibold">
                              {formatCurrency(payment.amount)}
                            </TableCell>
                            <TableCell>{getStatusBadge(payment.status)}</TableCell>
                            <TableCell>{formatDate(payment.createdAt)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <p className="text-center py-8 text-muted-foreground">No payments found</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />
    </div>
  );
}
