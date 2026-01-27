import { useQuery } from "@tanstack/react-query";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "wouter";
import { FileText, Clock, CheckCircle2, XCircle, ArrowRight, Calendar, Building2 } from "lucide-react";
import type { Application, Listing } from "@shared/schema";

interface ApplicationWithListing extends Application {
  listing?: Listing;
}

export default function Applications() {
  const { data: applications, isLoading } = useQuery<ApplicationWithListing[]>({
    queryKey: ["/api/applications/my"],
  });

  const getStatusConfig = (status: string) => {
    const config: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; icon: typeof CheckCircle2; label: string }> = {
      pending: { variant: "outline", icon: Clock, label: "Pending Review" },
      under_review: { variant: "secondary", icon: Clock, label: "Under Review" },
      approved: { variant: "default", icon: CheckCircle2, label: "Approved" },
      rejected: { variant: "destructive", icon: XCircle, label: "Rejected" },
      withdrawn: { variant: "secondary", icon: XCircle, label: "Withdrawn" },
    };
    return config[status] || { variant: "secondary", icon: Clock, label: status };
  };

  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const pendingApps = applications?.filter((a) => ["pending", "under_review"].includes(a.status)) || [];
  const approvedApps = applications?.filter((a) => a.status === "approved") || [];
  const closedApps = applications?.filter((a) => ["rejected", "withdrawn"].includes(a.status)) || [];

  const ApplicationCard = ({ application }: { application: ApplicationWithListing }) => {
    const { variant, icon: Icon, label } = getStatusConfig(application.status);
    
    return (
      <Link href={`/applications/${application.id}`}>
        <Card className="hover-elevate cursor-pointer" data-testid={`application-${application.id}`}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant={variant} className="gap-1">
                    <Icon className="h-3 w-3" />
                    {label}
                  </Badge>
                </div>
                <h3 className="font-semibold mb-1 truncate">
                  {application.listing?.title || `Application #${application.id.slice(0, 8)}`}
                </h3>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3 w-3" />
                    <span>Applied {formatDate(application.createdAt)}</span>
                  </div>
                  {application.moveInDate && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-3 w-3" />
                      <span>Move-in: {formatDate(application.moveInDate)}</span>
                    </div>
                  )}
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
            </div>
          </CardContent>
        </Card>
      </Link>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="font-serif text-3xl font-bold mb-2">My Applications</h1>
            <p className="text-muted-foreground">
              Track your lease transfer applications
            </p>
          </div>

          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <Skeleton className="h-6 w-24 mb-2" />
                    <Skeleton className="h-5 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : applications && applications.length > 0 ? (
            <Tabs defaultValue="all">
              <TabsList className="mb-6">
                <TabsTrigger value="all" data-testid="tab-all">
                  All ({applications.length})
                </TabsTrigger>
                <TabsTrigger value="pending" data-testid="tab-pending">
                  Pending ({pendingApps.length})
                </TabsTrigger>
                <TabsTrigger value="approved" data-testid="tab-approved">
                  Approved ({approvedApps.length})
                </TabsTrigger>
                <TabsTrigger value="closed" data-testid="tab-closed">
                  Closed ({closedApps.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="all">
                <div className="space-y-4">
                  {applications.map((application) => (
                    <ApplicationCard key={application.id} application={application} />
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="pending">
                {pendingApps.length > 0 ? (
                  <div className="space-y-4">
                    {pendingApps.map((application) => (
                      <ApplicationCard key={application.id} application={application} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Clock className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                    <p className="text-muted-foreground">No pending applications</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="approved">
                {approvedApps.length > 0 ? (
                  <div className="space-y-4">
                    {approvedApps.map((application) => (
                      <ApplicationCard key={application.id} application={application} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <CheckCircle2 className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                    <p className="text-muted-foreground">No approved applications yet</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="closed">
                {closedApps.length > 0 ? (
                  <div className="space-y-4">
                    {closedApps.map((application) => (
                      <ApplicationCard key={application.id} application={application} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <XCircle className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                    <p className="text-muted-foreground">No closed applications</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          ) : (
            <div className="text-center py-16">
              <FileText className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-xl font-semibold mb-2">No applications yet</h3>
              <p className="text-muted-foreground mb-6">
                Browse available listings and apply to assume a lease.
              </p>
              <Link href="/listings">
                <Button data-testid="button-browse">Browse Listings</Button>
              </Link>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
