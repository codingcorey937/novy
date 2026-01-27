import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Building2, Home, ArrowLeft, ArrowRight, Upload, CheckCircle2 } from "lucide-react";
import { Link } from "wouter";

const listingSchema = z.object({
  type: z.enum(["residential", "commercial"]),
  title: z.string().min(5, "Title must be at least 5 characters"),
  address: z.string().min(5, "Address is required"),
  city: z.string().min(2, "City is required"),
  state: z.string().min(2, "State is required"),
  zipCode: z.string().min(5, "Zip code is required"),
  rent: z.coerce.number().min(1, "Rent amount is required"),
  leaseExpiration: z.string().min(1, "Lease expiration date is required"),
  allowedUse: z.string().optional(),
  squareFootage: z.coerce.number().optional(),
  bedrooms: z.coerce.number().optional(),
  bathrooms: z.coerce.number().optional(),
  description: z.string().optional(),
  amenities: z.string().optional(),
  ownerEmail: z.string().email("Valid email required for owner authorization"),
  ownerName: z.string().optional(),
});

type ListingFormData = z.infer<typeof listingSchema>;

export default function CreateListing() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [step, setStep] = useState(1);

  const form = useForm<ListingFormData>({
    resolver: zodResolver(listingSchema),
    defaultValues: {
      type: "residential",
      title: "",
      address: "",
      city: "",
      state: "",
      zipCode: "",
      rent: 0,
      leaseExpiration: "",
      allowedUse: "",
      squareFootage: undefined,
      bedrooms: undefined,
      bathrooms: undefined,
      description: "",
      amenities: "",
      ownerEmail: "",
      ownerName: "",
    },
  });

  const watchType = form.watch("type");

  const createMutation = useMutation({
    mutationFn: async (data: ListingFormData) => {
      const response = await apiRequest("POST", "/api/listings", {
        ...data,
        leaseExpiration: new Date(data.leaseExpiration).toISOString(),
      });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/listings/my"] });
      toast({
        title: "Listing created!",
        description: "An authorization request has been sent to the property owner.",
      });
      navigate(`/listings/${data.id}`);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create listing",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ListingFormData) => {
    createMutation.mutate(data);
  };

  const nextStep = async () => {
    const fieldsToValidate = step === 1 
      ? ["type", "title", "address", "city", "state", "zipCode"] as const
      : step === 2 
      ? ["rent", "leaseExpiration"] as const
      : [];
    
    const valid = await form.trigger(fieldsToValidate);
    if (valid) setStep(step + 1);
  };

  const prevStep = () => setStep(step - 1);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <Link href="/dashboard">
              <Button variant="ghost" className="gap-2 mb-4" data-testid="button-back">
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </Button>
            </Link>
            <h1 className="font-serif text-3xl font-bold mb-2">Create a Listing</h1>
            <p className="text-muted-foreground">
              List your lease for transfer. We'll send an authorization request to your property owner.
            </p>
          </div>

          <div className="flex items-center justify-between mb-8">
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                    s < step
                      ? "bg-primary text-primary-foreground"
                      : s === step
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {s < step ? <CheckCircle2 className="h-5 w-5" /> : s}
                </div>
                {s < 4 && (
                  <div className={`w-16 md:w-24 h-1 ${s < step ? "bg-primary" : "bg-muted"}`} />
                )}
              </div>
            ))}
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              {step === 1 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Property Details</CardTitle>
                    <CardDescription>Tell us about the property you're looking to transfer.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <FormField
                      control={form.control}
                      name="type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Property Type</FormLabel>
                          <div className="grid grid-cols-2 gap-4">
                            <button
                              type="button"
                              onClick={() => field.onChange("residential")}
                              className={`p-6 rounded-lg border-2 flex flex-col items-center gap-2 transition-colors ${
                                field.value === "residential"
                                  ? "border-primary bg-primary/5"
                                  : "border-border hover:border-primary/50"
                              }`}
                              data-testid="button-type-residential"
                            >
                              <Home className="h-8 w-8" />
                              <span className="font-medium">Residential</span>
                              <span className="text-xs text-muted-foreground">Apartments, houses, condos</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => field.onChange("commercial")}
                              className={`p-6 rounded-lg border-2 flex flex-col items-center gap-2 transition-colors ${
                                field.value === "commercial"
                                  ? "border-primary bg-primary/5"
                                  : "border-border hover:border-primary/50"
                              }`}
                              data-testid="button-type-commercial"
                            >
                              <Building2 className="h-8 w-8" />
                              <span className="font-medium">Commercial</span>
                              <span className="text-xs text-muted-foreground">Offices, retail, industrial</span>
                            </button>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Listing Title</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g., Spacious 2BR in Downtown"
                              {...field}
                              data-testid="input-title"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Street Address</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="123 Main Street, Apt 4B"
                              {...field}
                              data-testid="input-address"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="city"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>City</FormLabel>
                            <FormControl>
                              <Input placeholder="New York" {...field} data-testid="input-city" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="state"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>State</FormLabel>
                            <FormControl>
                              <Input placeholder="NY" {...field} data-testid="input-state" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="zipCode"
                        render={({ field }) => (
                          <FormItem className="col-span-2 md:col-span-1">
                            <FormLabel>Zip Code</FormLabel>
                            <FormControl>
                              <Input placeholder="10001" {...field} data-testid="input-zip" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="flex justify-end">
                      <Button type="button" onClick={nextStep} className="gap-2" data-testid="button-next-1">
                        Continue
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {step === 2 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Lease Information</CardTitle>
                    <CardDescription>Provide details about your current lease.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="rent"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Monthly Rent ($)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="2500"
                                {...field}
                                data-testid="input-rent"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="leaseExpiration"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Lease Expiration Date</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} data-testid="input-expiration" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {watchType === "residential" ? (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <FormField
                          control={form.control}
                          name="bedrooms"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Bedrooms</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  placeholder="2"
                                  {...field}
                                  data-testid="input-bedrooms"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="bathrooms"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Bathrooms</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  placeholder="1"
                                  {...field}
                                  data-testid="input-bathrooms"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="squareFootage"
                          render={({ field }) => (
                            <FormItem className="col-span-2 md:col-span-1">
                              <FormLabel>Sq Ft (optional)</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  placeholder="850"
                                  {...field}
                                  data-testid="input-sqft"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="squareFootage"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Square Footage</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  placeholder="2000"
                                  {...field}
                                  data-testid="input-sqft-commercial"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="allowedUse"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Allowed Use</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="e.g., Retail, Office, Restaurant"
                                  {...field}
                                  data-testid="input-allowed-use"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    )}

                    <div className="flex justify-between">
                      <Button type="button" variant="outline" onClick={prevStep} className="gap-2" data-testid="button-back-2">
                        <ArrowLeft className="h-4 w-4" />
                        Back
                      </Button>
                      <Button type="button" onClick={nextStep} className="gap-2" data-testid="button-next-2">
                        Continue
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {step === 3 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Description & Amenities</CardTitle>
                    <CardDescription>Help potential tenants understand what makes this property special.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Property Description</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Describe the property, neighborhood, and any unique features..."
                              className="min-h-32"
                              {...field}
                              data-testid="input-description"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="amenities"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Amenities</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="e.g., In-unit laundry, gym access, parking included, pet-friendly..."
                              {...field}
                              data-testid="input-amenities"
                            />
                          </FormControl>
                          <FormDescription>List amenities separated by commas</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex justify-between">
                      <Button type="button" variant="outline" onClick={prevStep} className="gap-2" data-testid="button-back-3">
                        <ArrowLeft className="h-4 w-4" />
                        Back
                      </Button>
                      <Button type="button" onClick={nextStep} className="gap-2" data-testid="button-next-3">
                        Continue
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {step === 4 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Owner Authorization</CardTitle>
                    <CardDescription>
                      We'll send an authorization request to your property owner. The listing will only
                      go live after they approve it.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="ownerName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Owner/Manager Name (optional)</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="John Smith"
                                {...field}
                                data-testid="input-owner-name"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="ownerEmail"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Owner/Manager Email</FormLabel>
                            <FormControl>
                              <Input
                                type="email"
                                placeholder="owner@example.com"
                                {...field}
                                data-testid="input-owner-email"
                              />
                            </FormControl>
                            <FormDescription>Authorization request will be sent here</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="bg-muted/50 rounded-lg p-4">
                      <h4 className="font-medium mb-2">What happens next?</h4>
                      <ul className="text-sm text-muted-foreground space-y-2">
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 text-accent mt-0.5 flex-shrink-0" />
                          <span>Property owner receives an authorization email</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 text-accent mt-0.5 flex-shrink-0" />
                          <span>They review the lease summary and approve or reject</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 text-accent mt-0.5 flex-shrink-0" />
                          <span>Once approved, your listing goes live</span>
                        </li>
                      </ul>
                    </div>

                    <div className="flex justify-between">
                      <Button type="button" variant="outline" onClick={prevStep} className="gap-2" data-testid="button-back-4">
                        <ArrowLeft className="h-4 w-4" />
                        Back
                      </Button>
                      <Button type="submit" disabled={createMutation.isPending} className="gap-2" data-testid="button-submit">
                        {createMutation.isPending ? "Creating..." : "Create Listing"}
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </form>
          </Form>
        </div>
      </main>

      <Footer />
    </div>
  );
}
