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
    { value: "confirmed", label: "Confirmed", color: "status-pending" },
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
      // Use FIFO endpoint for shipped status, regular endpoint for others
      if (selectedStatus === "shipped") {
        try {
          await apiRequest("PUT", `/api/orders/statusbyFIFO/${order._id}`, {
            status: selectedStatus,
          });
        } catch (fifoError) {
          // Handle FIFO inventory reduction errors
          if (fifoError.message && fifoError.message.includes("Product not found in any batch")) {
            // Extract product names from the error response
            let productList = "the ordered products";
            
            if (fifoError.errors && Array.isArray(fifoError.errors)) {
              const outOfStockProducts = fifoError.errors
                .filter(err => err.error === "Product not found in any batch")
                .map(err => err.productName || err.productID);
              
              if (outOfStockProducts.length > 0) {
                productList = outOfStockProducts.join(", ");
              }
            }
            
            toast({
              title: "Insufficient Stock",
              description: `The following products have no stock available: ${productList}. Please create a new batch with these products before shipping the order.`,
              variant: "destructive",
            });
            setIsUpdating(false);
            return; // Don't proceed with status update
          } else if (fifoError.message && fifoError.message.includes("Failed to reduce inventory using FIFO method")) {
            // Try to extract specific product errors from the response
            let errorDescription = "Unable to reduce inventory. Please check product stock levels and create batches if needed.";
            
            if (fifoError.errors && Array.isArray(fifoError.errors)) {
              const productErrors = fifoError.errors.map(err => {
                return err.productName || err.productID;
              });
              
              if (productErrors.length > 0) {
                errorDescription = `Unable to reduce inventory for: ${productErrors.join(", ")}. Please check stock levels and create batches if needed.`;
              }
            }
            
            toast({
              title: "Inventory Error",
              description: errorDescription,
              variant: "destructive",
            });
            setIsUpdating(false);
            return; // Don't proceed with status update
          } else if (fifoError.message && fifoError.message.includes("Batch validation failed")) {
            toast({
              title: "Batch Data Error",
              description: "Some batch data is incomplete. Please update the batch information with proper weight details before shipping.",
              variant: "destructive",
            });
            setIsUpdating(false);
            return; // Don't proceed with status update
          } else {
            // Re-throw other errors
            throw fifoError;
          }
        }
      } else {
        await apiRequest("PUT", `/api/orders/${order._id}`, {
          status: selectedStatus,
        });
      }
      
      if (selectedStatus == "shipped") {
        try {
          // Fetch detailed order information to get the phone number
          let customerPhone = null;
          let customerName = order.customerName;
          let orderID = order.orderID;
          
          console.log("Fetching detailed order info for WhatsApp notification:", order.orderID);
          
          try {
            const orderResponse = await axios.get(
              `https://shisecommerce.skillhiveinnovations.com/api/orders/orderbyID/${order.orderID}`
            );
            
            const orderData = orderResponse.data?.data || orderResponse.data;
            customerPhone = orderData?.customerPhone;
            customerName = orderData?.customerName || order.customerName;
            orderID = orderData?.orderID || order.orderID;
            
            console.log("Order data fetched for WhatsApp:", {
              customerPhone,
              customerName,
              orderID,
              fullOrderData: orderData
            });
          } catch (orderError) {
            console.error("Failed to fetch order details:", orderError);
            // Fallback to using the phone number from the order object if available
            customerPhone = order.customerPhone;
            console.log("Using fallback phone number from order object:", customerPhone);
          }
          
          if (!customerPhone) {
            console.warn("No phone number found for customer:", customerName);
            toast({
              title: "Warning",
              description: "Order status updated but no phone number found for WhatsApp notification",
              variant: "destructive",
            });
            return;
          }

          // Send WhatsApp message with the fetched phone number
          const message = await axios.post(
            "https://shisecommerce.skillhiveinnovations.com/api/whatsapp/ship",
            {
              name: customerName,
              phone: customerPhone,
              orderID: orderID,
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
                    <strong>Amount:</strong> ₹{order.total.toFixed(2)}
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
