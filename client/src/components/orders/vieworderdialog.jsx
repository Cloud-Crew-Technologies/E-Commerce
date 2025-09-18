import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import axios from "axios";

export default function OrderDetailsDialog({ open, onOpenChange, orderID }) {
  const { toast } = useToast();
  const [orderDetails, setOrderDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!open || !orderID) return;

    const fetchOrderDetails = async () => {
      setIsLoading(true);
      try {
        // Adjust endpoint as per your API - assuming this returns full order with product details
        const response = await axios.get(
          `https://ecommerceapi.skillhiveinnovations.com/api/orders/orderbyID/${orderID}`
        );
        if (response.data && response.data.data) {
          setOrderDetails(response.data.data);
        } else {
          setOrderDetails(null);
          toast({
            title: "Error",
            description: "Order not found",
            variant: "destructive",
          });
        }
      } catch (error) {
        setOrderDetails(null);
        toast({
          title: "Error",
          description: "Failed to load order details",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrderDetails();
  }, [open, orderID, toast]);

  const onClose = () => {
    onOpenChange(false);
    setOrderDetails(null);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Order Details - {orderID}</DialogTitle>
          <DialogDescription>
            {isLoading && <p>Loading order details...</p>}
            {!isLoading && orderDetails && (
              <>
                <p>
                  <strong>Customer:</strong> {orderDetails.customerName}
                </p>
                <p>
                  <strong>Email:</strong> {orderDetails.customerEmail}
                </p>
                <p>
                  <strong>Status:</strong> {orderDetails.status}
                </p>
                <p>
                  <strong>Placed At:</strong>{" "}
                  {new Date(orderDetails.createdAt).toLocaleString()}
                </p>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product Name</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orderDetails.items.map((item, idx) => (
                      <TableRow key={idx}>
                        <TableCell>{item.name}</TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>{item.price}</TableCell>
                        <TableCell>{item.quantity * item.price}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow>
                      <TableCell colSpan={3} className="font-bold">
                        Grand Total
                      </TableCell>
                      <TableCell className="font-bold">
                        {orderDetails.total}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </>
            )}

            {!isLoading && !orderDetails && <p>No details available.</p>}
          </DialogDescription>
          <div className="mt-4 flex justify-end">
            <Button variant="ghost" onClick={onClose}>
              Close
            </Button>
          </div>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}
