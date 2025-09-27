import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import axios from "axios";

/**
 * UpdateStatusDialog - A dialog component for updating order status
 * Allows changing order status with proper validation and API calls
 */
export default function UpdateStatusDialog({
  open,
  onOpenChange,
  order,
  onStatusUpdated,
}) {
  const { toast } = useToast();
  const [selectedStatus, setSelectedStatus] = useState(order?.status || "");
  const [isUpdating, setIsUpdating] = useState(false);

  const statusOptions = [
    { value: "ordered", label: "Ordered", color: "status-pending" },
    { value: "processing", label: "Processing", color: "status-pending" },
    { value: "shipped", label: "Shipped", color: "status-active" },
    { value: "delivered", label: "Delivered", color: "status-delivered" },
    { value: "cancelled", label: "Cancelled", color: "status-pending" },
  ];

  const getStatusBadge = (status) => {
    const statusOption = statusOptions.find((opt) => opt.value === status);
    if (!statusOption)
      return <Badge className="status-chip status-pending">{status}</Badge>;

    return (
      <Badge className={`status-chip ${statusOption.color}`}>
        {statusOption.label}
      </Badge>
    );
  };

  const handleStatusUpdate = async () => {
    if (!order || !selectedStatus) return;

    console.log("Order data for WhatsApp:", order);
    setIsUpdating(true);
    try {
      // Update order status via API
      await apiRequest("PUT", `/api/orders/${order._id}`, {
        status: selectedStatus,
      });
      if (selectedStatus == "shipped") {
        try {
          // First, fetch customer details to get the phone number
          let customerPhone = null;
          
          // Try to get customer ID from order data
          const customerId = order.customerId || order.customer?._id || order.customer?.id;
          
          console.log("Looking for customer ID in order:", {
            customerId: order.customerId,
            customer: order.customer,
            customerIdFound: customerId
          });
          
          if (customerId) {
            try {
              const customerResponse = await axios.get(
                `http://localhost:3001/api/customers/get/${customerId._id}`
              );
              
              const customerData = customerResponse.data?.data || customerResponse.data;
              customerPhone = customerData?.phone;
              
              console.log("Customer data fetched:", customerData);
            } catch (customerError) {
              console.error("Failed to fetch customer data:", customerError);
            }
          } else if (order.customerEmail) {
            // Fallback: try to find customer by email if no customer ID
            try {
              console.log("No customer ID found, trying to fetch by email:", order.customerEmail);
              // You might need to implement a different API endpoint for fetching by email
              // For now, we'll log this case
              console.warn("Customer ID not found, email-based lookup not implemented yet");
            } catch (emailError) {
              console.error("Failed to fetch customer by email:", emailError);
            }
          }
          
          if (!customerPhone) {
            console.warn("No phone number found for customer:", order.customerName);
            toast({
              title: "Warning",
              description: "Order status updated but no phone number found for WhatsApp notification",
              variant: "destructive",
            });
            return;
          }

          // Send WhatsApp message with the fetched phone number
          const message = await axios.post(
            "http://localhost:3001/api/whatsapp/ship",
            {
              name: order.customerName,
              phone: customerPhone,
              orderID: order.orderID,
            }
          );
          console.log("WhatsApp message sent successfully:", message.data);
        } catch (whatsappError) {
          console.error("Failed to send WhatsApp message:", whatsappError);
          // Don't fail the entire status update if WhatsApp fails
          toast({
            title: "Warning",
            description: "Order status updated but WhatsApp notification failed",
            variant: "destructive",
          });
        }
      }

      toast({
        title: "Success",
        description: `Order status updated to ${
          statusOptions.find((opt) => opt.value === selectedStatus)?.label
        }`,
      });

      // Call the callback to refresh the orders list
      if (onStatusUpdated) {
        onStatusUpdated();
      }

      onOpenChange(false);
    } catch (error) {
      console.error("Error updating order status:", error);
      toast({
        title: "Error",
        description:
          error.response?.data?.message || "Failed to update order status",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const onClose = () => {
    onOpenChange(false);
    setSelectedStatus(order?.status || "");
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Update Order Status</DialogTitle>
          <DialogDescription>
            {order && (
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p>
                    <strong>Order ID:</strong> #{order.orderID}
                  </p>
                  <p>
                    <strong>Customer:</strong> {order.customerName}
                  </p>
                  <p>
                    <strong>Amount:</strong> ₹{order.total}
                  </p>
                  <p>
                    <strong>Current Status:</strong>{" "}
                    {getStatusBadge(order.status)}
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">New Status:</label>
                  <Select
                    value={selectedStatus}
                    onValueChange={setSelectedStatus}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select new status" />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          <div className="flex items-center space-x-2">
                            <Badge className={`status-chip ${option.color}`}>
                              {option.label}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </DialogDescription>

          <div className="mt-6 flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose} disabled={isUpdating}>
              Cancel
            </Button>
            <Button
              onClick={handleStatusUpdate}
              disabled={
                isUpdating ||
                !selectedStatus ||
                selectedStatus === order?.status
              }
              className="bg-primary-500 hover:bg-primary-600"
            >
              {isUpdating ? "Updating..." : "Update Status"}
            </Button>
          </div>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}
