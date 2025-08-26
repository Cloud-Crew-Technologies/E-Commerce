import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { insertStoreSettingsSchema } from "@shared/schema";
import axios from "axios";

export default function StoreSettings() {
  const { toast } = useToast();
  const storename = sessionStorage.getItem("storename");
  const [settings, setSettings] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  // const { data: settings, isLoading } = useQuery({ queryKey: [`/api/store-settings/${storename}`] })

  const form = useForm({
    resolver: zodResolver(insertStoreSettingsSchema),
    defaultValues: {
      storeName: settings?.storeName||"",
      description: "",
      contactEmail: "",
      contactPhone: "",
      address: "",
    },
  });
  useEffect(() => {
    fetchSettings();
  }, []); 

  const fetchSettings = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(
        `http://localhost:3000/api/store-settings/get/${storename}`
      );

      if (response.data.success && response.data.data) {
        const settingsData = response.data.data;
        setSettings(settingsData);

        // Update form with the fetched values
        form.reset({
          storeName: settingsData.storeName || "",
          description: settingsData.description || "",
          contactEmail: settingsData.contactEmail || "",
          contactPhone: settingsData.contactPhone || "",
          address: settingsData.address || "",
        });
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
      setSettings(null);
      toast({
        title: "Error", 
        description: "Failed to load store settings",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateSettingsMutation = useMutation({
    mutationFn: async (data) => {
      const response = await apiRequest(
        "PUT",
        `/api/store-settings/put/${settings._id}`,
        data
      );
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/store-settings"] });
      toast({
        title: "Settings updated",
        description: "Store settings have been successfully updated.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data) => {
    updateSettingsMutation.mutate(data);
  };

  return (
    <div className="flex min-l-screen bg-grey-50">
      <Sidebar />
      <div className="ml-64 flex-1 ">
        <Header
          title="Store Settings"
          subtitle="Configure your store information and preferences"
        />
        <main className="p-6 max-w-9xl ">
          <div className="space-y-6 ">
            <Card className="material-elevation-2 bg-lightblue-50">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <span className="material-icons mr-2">store</span>
                  Store Information
                </CardTitle>
                <CardDescription>
                  Basic information about your grocery store
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">
                    <div>
                      <Skeleton className="h-4 w-20 mb-2" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                    <div>
                      <Skeleton className="h-4 w-24 mb-2" />
                      <Skeleton className="h-24 w-full" />
                    </div>
                  </div>
                ) : (
                  <Form {...form}>
                    <form
                      onSubmit={form.handleSubmit(onSubmit)}
                      className="space-y-6"
                    >
                      <FormField
                        control={form.control}
                        name="storeName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Store Name</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Enter your store name"
                                {...field}
                                className="border border-grey-300 rounded-md p-2 bg-grey-50"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Describe your store..."
                                className="min-h-[100px] border border-grey-300 rounded-md p-2 bg-grey-50"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Separator />

                      <div className="space-y-4">
                        <h3 className="text-lg font-medium text-grey-900 flex items-center">
                          <span className="material-icons mr-2">
                            contact_mail
                          </span>
                          Contact Information
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="contactEmail"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Contact Email</FormLabel>
                                <FormControl>
                                  <Input
                                    type="email"
                                    placeholder="store@example.com"
                                    className="border border-grey-300 rounded-md p-2 bg-grey-50"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="contactPhone"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Contact Phone</FormLabel>
                                <FormControl>
                                  <Input
                                    type="tel"
                                    placeholder="+1 (555) 123-4567"
                                    className="border border-grey-300 rounded-md p-2 bg-grey-50"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <FormField
                          control={form.control}
                          name="address"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Store Address</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Enter your store address..."
                                  className="min-h-[80px] border border-grey-300 rounded-md p-2 bg-grey-50"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="flex justify-end">
                        <Button
                          type="submit"
                          className="bg-primary-500 hover:bg-primary-600"
                          disabled={updateSettingsMutation.isPending}
                        >
                          {updateSettingsMutation.isPending ? (
                            <>
                              <span className="material-icons mr-2 animate-spin">
                                refresh
                              </span>
                              Saving...
                            </>
                          ) : (
                            <>
                              <span className="material-icons mr-2">save</span>
                              Update Store
                            </>
                          )}
                        </Button>
                      </div>
                    </form>
                  </Form>
                )}
              </CardContent>
            </Card>


            <Card className="material-elevation-2 bg-lightblue-50">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <span className="material-icons mr-2">backup</span>
                  Data Management
                </CardTitle>
                <CardDescription>
                  Backup and manage your store data
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">Export Data</h4>
                      <p className="text-sm text-grey-600">
                        Export all store data as JSON
                      </p>
                    </div>
                    <Button variant="outline">
                      <span className="material-icons mr-2">file_download</span>
                      Export
                    </Button>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">Generate Reports</h4>
                      <p className="text-sm text-grey-600">
                        Create detailed business reports
                      </p>
                    </div>
                    <Button variant="outline">
                      <span className="material-icons mr-2">assessment</span>
                      Generate
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
