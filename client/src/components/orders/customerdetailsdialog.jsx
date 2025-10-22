import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import axios from "axios";

/**
 * CustomerDetailsDialog - A dialog component for viewing customer details from orders
 * Fetches customer data from /api/customers/get/:id route
 * Displays customer information in read-only format
 */
export default function CustomerDetailsDialog({ open, onOpenChange, customerId }) {
  const { toast } = useToast();
  const [customerDetails, setCustomerDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Helper function to safely convert values to strings
  const safeString = (value) => {
    if (value === null || value === undefined) return "N/A";
    if (typeof value === "object") return JSON.stringify(value);
    return String(value);
  };

  useEffect(() => {
    if (!open || !customerId) return;

    const fetchCustomerDetails = async () => {
      setIsLoading(true);
      try {
        // Fetch customer details from the /get/:id route
        const response = await axios.get(
          `https://shisecommerce.skillhiveinnovations.com/api/customers/get/${customerId}`
        );
        
        if (response.data && response.data.data) {
          console.log("Customer data from API:", response.data.data);
          setCustomerDetails(response.data.data);
        } else if (response.data) {
          console.log("Customer data from API:", response.data);
          setCustomerDetails(response.data);
        } else {
          setCustomerDetails(null);
          toast({
            title: "Error",
            description: "Customer not found",
            variant: "destructive",
          });
        }
      } catch (error) {
        setCustomerDetails(null);
        console.error("Error fetching customer details:", error);
        toast({
          title: "Error",
          description: error.response?.data?.message || "Failed to load customer details",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchCustomerDetails();
  }, [open, customerId, toast]);

  const onClose = () => {
    onOpenChange(false);
    setCustomerDetails(null);
  };

  const getStatusBadge = (isActive) => {
    return isActive ? (
      <Badge className="status-chip status-active">Active</Badge>
    ) : (
      <Badge className="status-chip status-pending">Inactive</Badge>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Customer Details - {safeString(customerDetails?.name || customerId || "Unknown")}</DialogTitle>
          <DialogDescription>
            {isLoading && <p>Loading customer details...</p>}
            {!isLoading && customerDetails && (
              <div className="space-y-6">
                {/* Customer Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h4 className="font-semibold text-lg">Personal Information</h4>
                    <div className="space-y-2">
                      <p><strong>Name:</strong> {safeString(customerDetails.name)}</p>
                      <p><strong>Email:</strong> {safeString(customerDetails.email)}</p>
                      <p><strong>Phone:</strong> {safeString(customerDetails.phone)}</p>
                      <p><strong>Member Since:</strong> {customerDetails.createdAt ? new Date(customerDetails.createdAt).toLocaleDateString() : "N/A"}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-semibold text-lg">Address Information</h4>
                    <div className="space-y-2">
                      <p><strong>Address:</strong> {safeString(customerDetails.address)}</p>
                      <p><strong>City:</strong> {safeString(customerDetails.city)}</p>
                      <p><strong>State:</strong> {safeString(customerDetails.state)}</p>
                      <p><strong>Country:</strong> {safeString(customerDetails.country)}</p>
                      <p><strong>Pincode:</strong> {safeString(customerDetails.pincode)}</p>
                    </div>
                  </div>
                </div>

                {/* Status Section */}
                <div className="border-t pt-4">
                  <h4 className="font-semibold text-lg mb-3">Account Status</h4>
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <span className="text-sm font-medium">Account Status:</span>
                      {getStatusBadge(customerDetails.isActive)}
                    </div>
                  </div>
                </div>

                {/* Additional Information */}
                {customerDetails._id && (
                  <div className="border-t pt-4">
                    <h4 className="font-semibold text-lg mb-3">System Information</h4>
                    <div className="space-y-2 text-sm text-gray-600">
                      <p><strong>Customer ID:</strong> {safeString(customerDetails._id)}</p>
                      {customerDetails.updatedAt && (
                        <p><strong>Last Updated:</strong> {new Date(customerDetails.updatedAt).toLocaleString()}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {!isLoading && !customerDetails && <p>No details available.</p>}
          </DialogDescription>
          
          <div className="mt-6 flex justify-end">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}
