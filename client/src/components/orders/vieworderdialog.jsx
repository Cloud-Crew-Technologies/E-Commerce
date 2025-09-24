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
  const [productTaxValues, setProductTaxValues] = useState({});

  // Get shipping cost and user data from storage
  const shippings = sessionStorage.getItem("shipping") || "80"; // Default shipping cost
  const users = localStorage.getItem("user");
  const userData = users ? JSON.parse(users) : null;
  const userState = userData?.state || "";
  const userGstStateCode = userData?.gstStateCode || "";
  const isTamilNadu = userState === "Tamil Nadu" && userGstStateCode === "33";

  useEffect(() => {
    if (!open || !orderID) return;

    const fetchOrderDetails = async () => {
      setIsLoading(true);
      try {
        const response = await axios.get(
          `https://ecommerceapi.skillhiveinnovations.com/api/orders/orderbyID/${orderID}`
        );
        if (response.data && response.data.data) {
          setOrderDetails(response.data.data);

          // Fetch tax values for each product in the order
          if (response.data.data.items) {
            await fetchProductTaxValues(response.data.data.items);
          }
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

  const fetchProductTaxValues = async (items) => {
    const taxValues = {};

    for (const item of items) {
      const productId = item.productID;
      if (productId && !productTaxValues[productId]) {
        try {
          // Replace with your actual product API endpoint
          const productResponse = await axios.get(
            `https://ecommerceapi.skillhiveinnovations.com/api/products/product/${productId}`
          );

          if (
            productResponse.data?.success &&
            productResponse.data.data?.taxValue !== undefined
          ) {
            taxValues[productId] = productResponse.data.data.taxValue;
          }
        } catch (error) {
          console.error(
            `Error fetching tax value for product ${productId}:`,
            error
          );
          taxValues[productId] = 0; // Default to 0 if tax value can't be fetched
        }
      }
    }

    setProductTaxValues((prev) => ({ ...prev, ...taxValues }));
  };

  // Calculation functions based on checkout logic
  const calculateSubtotal = () => {
    if (!orderDetails?.items) return 0;
    return orderDetails.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
  };

  const calculateDelivery = () => {
    const subtotal = calculateSubtotal();
    return subtotal >= 1000 ? 0 : Number(shippings);
  };

  const calculateShippingTax = () => {
    return calculateDelivery() * (5 / 100);
  };

  const calculateTax = () => {
    if (!orderDetails?.items) return 0;

    const shippingTax = calculateShippingTax();

    const itemsTax = orderDetails.items.reduce((totalTax, item) => {
      const productId = item.productID;
      const rawTaxValue = productTaxValues[productId];
      const taxValue = rawTaxValue?.$numberDecimal
        ? parseFloat(rawTaxValue.$numberDecimal)
        : parseFloat(rawTaxValue) || 0;
      const itemTax = item.quantity * taxValue;
      return totalTax + itemTax;
    }, 0);

    return itemsTax + shippingTax;
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax() + calculateDelivery();
  };

  const onClose = () => {
    onOpenChange(false);
    setOrderDetails(null);
    setProductTaxValues({});
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Order Details - {orderID}</DialogTitle>
          <DialogDescription>
            {isLoading && <p>Loading order details...</p>}
            {!isLoading && orderDetails && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <p>
                    <strong>Customer:</strong> {orderDetails.customerName}
                  </p>
                  <p>
                    <strong>Email:</strong> {orderDetails.customerEmail}
                  </p>
                  <p>
                    <strong>Phone:</strong> {orderDetails.customerPhone}
                  </p>
                  <p>
                    <strong>Status:</strong>
                    <span
                      className={`ml-2 px-2 py-1 rounded text-xs ${
                        orderDetails.status === "processing"
                          ? "bg-yellow-100 text-yellow-800"
                          : orderDetails.status === "completed"
                          ? "bg-green-100 text-green-800"
                          : orderDetails.status === "cancelled"
                          ? "bg-red-100 text-red-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {orderDetails.status}
                    </span>
                  </p>
                  <p>
                    <strong>Placed At:</strong>{" "}
                    {new Date(orderDetails.createdAt).toLocaleString()}
                  </p>
                </div>

                {/* Items Table */}
                <div>
                  <h4 className="font-semibold mb-2">Order Items</h4>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product Name</TableHead>
                        <TableHead className="text-center">Quantity</TableHead>
                        <TableHead className="text-right">Unit Price</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orderDetails.items.map((item, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="font-medium">
                            {item.name}
                          </TableCell>
                          <TableCell className="text-center">
                            {item.quantity}
                          </TableCell>
                          <TableCell className="text-right">
                            ₹{item.price}
                          </TableCell>
                          <TableCell className="text-right">
                            ₹{(item.quantity * item.price).toFixed(2)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Order Summary */}
                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-3">Order Summary</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>₹{calculateSubtotal().toFixed(2)}</span>
                    </div>

                    <div className="flex justify-between">
                      <span>Delivery:</span>
                      <span
                        className={
                          calculateDelivery() === 0
                            ? "text-green-600 font-medium"
                            : ""
                        }
                      >
                        {calculateDelivery() === 0
                          ? "Free"
                          : `₹${calculateDelivery().toFixed(2)}`}
                      </span>
                    </div>

                    {/* Tax Breakdown */}
                    {isTamilNadu ? (
                      <>
                        <div className="flex justify-between">
                          <span>CGST (2.5%):</span>
                          <span>₹{(calculateTax() / 2).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>SGST (2.5%):</span>
                          <span>₹{(calculateTax() / 2).toFixed(2)}</span>
                        </div>
                      </>
                    ) : (
                      <div className="flex justify-between">
                        <span>IGST (5%):</span>
                        <span>₹{calculateTax().toFixed(2)}</span>
                      </div>
                    )}

                    {calculateDelivery() === 0 && (
                      <div className="text-green-600 text-xs">
                        🎉 Free delivery on orders over ₹1000
                      </div>
                    )}

                    <hr className="my-2" />

                    <div className="flex justify-between font-bold text-lg">
                      <span>Grand Total:</span>
                      <span className="text-green-600">
                        ₹{calculateTotal().toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {!isLoading && !orderDetails && <p>No details available.</p>}
          </DialogDescription>
          <div className="mt-6 flex justify-end">
            <Button variant="ghost" onClick={onClose}>
              Close
            </Button>
          </div>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}
