import { useEffect } from "react"
import { useQuery, useMutation } from "@tanstack/react-query"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import Sidebar from "@/components/layout/sidebar"
import Header from "@/components/layout/header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { apiRequest, queryClient } from "@/lib/queryClient"
import { useToast } from "@/hooks/use-toast"
import { insertStoreSettingsSchema } from "@shared/schema"

export default function StoreSettings() {
  const { toast } = useToast()

  const { data: settings, isLoading } = useQuery({ queryKey: ["/api/store-settings"] })

  const form = useForm({
    resolver: zodResolver(insertStoreSettingsSchema),
    defaultValues: {
      storeName: "",
      description: "",
      contactEmail: "",
      contactPhone: "",
      address: "",
    },
  })

  useEffect(() => {
    if (settings) {
      form.reset({
        storeName: settings.storeName || "",
        description: settings.description || "",
        contactEmail: settings.contactEmail || "",
        contactPhone: settings.contactPhone || "",
        address: settings.address || "",
      })
    }
  }, [settings, form])

  const updateSettingsMutation = useMutation({
    mutationFn: async (data) => {
      const response = await apiRequest("POST", "/api/store-settings", data)
      return await response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/store-settings"] })
      toast({ title: "Settings updated", description: "Store settings have been successfully updated." })
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" })
    },
  })

  const onSubmit = (data) => {
    updateSettingsMutation.mutate(data)
  }

  return (
    <div className="flex min-h-screen bg-grey-50">
      <Sidebar />
      <div className="ml-64 flex-1">
        <Header title="Store Settings" subtitle="Configure your store information and preferences" />
        <main className="p-6 max-w-4xl">
          <div className="space-y-6">
            <Card className="material-elevation-2">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <span className="material-icons mr-2">store</span>
                  Store Information
                </CardTitle>
                <CardDescription>Basic information about your grocery store</CardDescription>
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
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                      <FormField
                        control={form.control}
                        name="storeName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Store Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter your store name" {...field} />
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
                              <Textarea placeholder="Describe your store..." className="min-h-[100px]" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Separator />

                      <div className="space-y-4">
                        <h3 className="text-lg font-medium text-grey-900 flex items-center">
                          <span className="material-icons mr-2">contact_mail</span>
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
                                  <Input type="email" placeholder="store@example.com" {...field} />
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
                                  <Input type="tel" placeholder="+1 (555) 123-4567" {...field} />
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
                                <Textarea placeholder="Enter your store address..." className="min-h-[80px]" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="flex justify-end">
                        <Button type="submit" className="bg-primary-500 hover:bg-primary-600" disabled={updateSettingsMutation.isPending}>
                          {updateSettingsMutation.isPending ? (
                            <>
                              <span className="material-icons mr-2 animate-spin">refresh</span>
                              Saving...
                            </>
                          ) : (
                            <>
                              <span className="material-icons mr-2">save</span>
                              Save Settings
                            </>
                          )}
                        </Button>
                      </div>
                    </form>
                  </Form>
                )}
              </CardContent>
            </Card>

            <Card className="material-elevation-2">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <span className="material-icons mr-2">settings</span>
                  System Settings
                </CardTitle>
                <CardDescription>Configure system-wide preferences</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">Low Stock Threshold</h4>
                      <p className="text-sm text-grey-600">Set the minimum quantity for low stock alerts</p>
                    </div>
                    <Input type="number" defaultValue={10} className="w-20" />
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">Currency</h4>
                      <p className="text-sm text-grey-600">Default currency for pricing</p>
                    </div>
                    <select className="border rounded-lg px-3 py-2">
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="GBP">GBP (£)</option>
                      <option value="INR">INR (₹)</option>
                      <option value="JPY">JPY (¥)</option>
                      <option value="AUD">AUD (A$)</option>
                      <option value="CAD">CAD (C$)</option>
                      <option value="CNY">CNY (¥)</option>
                      <option value="RUB">RUB (₽)</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">Tax Rate</h4>
                      <p className="text-sm text-grey-600">Default tax rate percentage</p>
                    </div>
                    <Input type="number" defaultValue={8.5} step="0.1" className="w-20" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="material-elevation-2">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <span className="material-icons mr-2">backup</span>
                  Data Management
                </CardTitle>
                <CardDescription>Backup and manage your store data</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">Export Data</h4>
                      <p className="text-sm text-grey-600">Export all store data as JSON</p>
                    </div>
                    <Button variant="outline">
                      <span className="material-icons mr-2">file_download</span>
                      Export
                    </Button>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">Generate Reports</h4>
                      <p className="text-sm text-grey-600">Create detailed business reports</p>
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
  )
}
