import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import Sidebar from "@/components/layout/sidebar.jsx";
import Header from "@/components/layout/header.jsx";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast.js";
import { apiRequest, queryClient } from "@/lib/queryClient.js";
import { Settings, Save, Store } from "lucide-react";

export default function StoreSettings() {
  const { toast } = useToast();
  
  const { data: settings, isLoading } = useQuery({
    queryKey: ["/api/store-settings"],
  });

  const [formData, setFormData] = useState({
    storeName: "",
    description: "",
    address: "",
    contactEmail: "",
    contactPhone: "",
  });

  // Update form data when settings are loaded
  if (settings && !formData.storeName) {
    setFormData({
      storeName: settings.storeName || "",
      description: settings.description || "",
      address: settings.address || "",
      contactEmail: settings.contactEmail || "",
      contactPhone: settings.contactPhone || "",
    });
  }

  const updateMutation = useMutation({
    mutationFn: async (data) => {
      const res = await apiRequest("POST", "/api/store-settings", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["/api/store-settings"]);
      toast({
        title: "Settings Updated",
        description: "Store settings have been successfully updated.",
      });
    },
    onError: (error) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="flex min-h-screen bg-grey-50">
      <Sidebar />
      
      <div className="ml-64 flex-1">
        <Header title="Store Settings" subtitle="Configure your store information and preferences" />
        
        <main className="p-6">
          {/* Header Section */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-grey-900">Store Settings</h2>
              <p className="text-grey-600">Configure your store information and contact details</p>
            </div>
            <div className="flex items-center gap-2">
              <Store className="h-5 w-5 text-grey-500" />
              <span className="text-sm text-grey-600">Store Configuration</span>
            </div>
          </div>

          {/* Settings Form */}
          <div className="max-w-2xl">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Store Information
                </CardTitle>
                <CardDescription>
                  Update your store details, contact information, and business settings
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-6">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-10 w-full" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Store Name */}
                    <div className="space-y-2">
                      <Label htmlFor="storeName">Store Name *</Label>
                      <Input
                        id="storeName"
                        value={formData.storeName}
                        onChange={(e) => handleInputChange('storeName', e.target.value)}
                        placeholder="Enter your store name"
                        required
                      />
                    </div>

                    {/* Store Description */}
                    <div className="space-y-2">
                      <Label htmlFor="description">Store Description</Label>
                      <Textarea
                        id="description"
                        value={formData.description || ""}
                        onChange={(e) => handleInputChange('description', e.target.value)}
                        placeholder="Describe your store and what you sell..."
                        className="min-h-[100px]"
                      />
                    </div>

                    {/* Contact Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="contactEmail">Contact Email</Label>
                        <Input
                          id="contactEmail"
                          type="email"
                          value={formData.contactEmail || ""}
                          onChange={(e) => handleInputChange('contactEmail', e.target.value)}
                          placeholder="store@example.com"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="contactPhone">Contact Phone</Label>
                        <Input
                          id="contactPhone"
                          type="tel"
                          value={formData.contactPhone || ""}
                          onChange={(e) => handleInputChange('contactPhone', e.target.value)}
                          placeholder="+1 (555) 123-4567"
                        />
                      </div>
                    </div>

                    {/* Store Address */}
                    <div className="space-y-2">
                      <Label htmlFor="address">Store Address</Label>
                      <Textarea
                        id="address"
                        value={formData.address || ""}
                        onChange={(e) => handleInputChange('address', e.target.value)}
                        placeholder="Enter your complete store address..."
                        className="min-h-[80px]"
                      />
                    </div>

                    {/* Submit Button */}
                    <div className="flex justify-end pt-4">
                      <Button 
                        type="submit" 
                        disabled={updateMutation.isPending}
                        className="flex items-center gap-2"
                      >
                        <Save className="h-4 w-4" />
                        {updateMutation.isPending ? "Saving..." : "Save Settings"}
                      </Button>
                    </div>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}