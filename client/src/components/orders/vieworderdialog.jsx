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

  // Get GST state code from order data
  const orderGstStateCode = orderDetails?.gstStateCode || "";
  const isTamilNadu = orderGstStateCode === "33";

  useEffect(() => {
    if (!open || !orderID) return;

    const fetchOrderDetails = async () => {
      setIsLoading(true);
      try {
        const response = await axios.get(
          `https://texapi.skillhiveinnovations.com/api/orders/orderbyID/${orderID}`
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
        // Use tax value from order data first, only fetch from API if missing
        if (item.taxValue !== undefined) {
          taxValues[productId] = item.taxValue;
          console.log(`Using tax value from order data for product ${productId}:`, item.taxValue);
        } else {
          try {
            // Only fetch from API if tax value is missing from order data
            console.log(`Fetching tax value from API for product ${productId}`);
            const productResponse = await axios.get(
              `https://texapi.skillhiveinnovations.com/api/products/product/${productId}`
            );

            if (
              productResponse.data?.success &&
              productResponse.data.data?.taxValue !== undefined
            ) {
              taxValues[productId] = productResponse.data.data.taxValue;
            } else {
              taxValues[productId] = 0; // Default to 0 if tax value can't be fetched
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
    }

    setProductTaxValues((prev) => ({ ...prev, ...taxValues }));
  };

  // Helper function to extract decimal values from $numberDecimal format
  const extractDecimalValue = (value) => {
    if (typeof value === "object" && value.$numberDecimal) {
      return parseFloat(value.$numberDecimal);
    }
    return parseFloat(value) || 0;
  };

  // Enhanced calculation functions based on checkout logic
  const calculateSubtotal = () => {
    if (!orderDetails?.items) return 0;
    
    // Calculate subtotal using sales prices (retail or wholesale)
    return orderDetails.items.reduce((sum, item) => {
      const isFreeItem = (item.price || 0) === 0;
      if (isFreeItem) return sum; // Skip free items in subtotal
      
      // Use sales prices from order data first, fallback to regular prices
      const salesPrice = extractDecimalValue(item.rsalesprice || item.rprice || item.price || 0);
      return sum + salesPrice * (item.quantity || 0);
    }, 0);
  };

  const calculateRetailTotal = () => {
    if (!orderDetails?.items) return 0;
    
    // Calculate retail total (before wholesale discount)
    return orderDetails.items.reduce((sum, item) => {
      const isFreeItem = (item.price || 0) === 0;
      if (isFreeItem) return sum; // Skip free items
      
      // Use retail price from order data
      const retailPrice = extractDecimalValue(item.rprice || item.price || 0);
      return sum + retailPrice * (item.quantity || 0);
    }, 0);
  };

  const calculateWholesaleSavings = () => {
    const retailTotal = calculateRetailTotal();
    const subtotal = calculateSubtotal();
    return retailTotal - subtotal;
  };

  const calculateDelivery = () => {
    // Use delivery amount from order data directly
    return extractDecimalValue(orderDetails?.delivery || 0);
  };

  const calculateShippingTax = () => {
    // Use deliveryTax from order data directly
    return extractDecimalValue(orderDetails?.deliveryTax || 0);
  };

  const calculateTax = () => {
    if (!orderDetails?.items) return 0;

    const shippingTax = calculateShippingTax();

    // Calculate tax on items using sales prices
    const itemsTax = orderDetails.items.reduce((totalTax, item) => {
      const isFreeItem = (item.price || 0) === 0;
      if (isFreeItem) return totalTax; // No tax on free items
      
      const productId = item.productID;
      // Use tax value from order data first, fallback to productTaxValues
      const rawTaxValue = item.taxValue || productTaxValues[productId];
      const taxValue = rawTaxValue?.$numberDecimal
        ? parseFloat(rawTaxValue.$numberDecimal)
        : parseFloat(rawTaxValue) || 0;
      
      // Use sales price for tax calculation
      const salesPrice = extractDecimalValue(item.rsalesprice || item.rprice || item.price || 0);
      const itemTax = salesPrice * (item.quantity || 0) * (taxValue / 100);
      return totalTax + itemTax;
    }, 0);

    return itemsTax + shippingTax;
  };

  const calculateDiscount = () => {
    // Calculate discount from applied coupons using the same logic as PDF generation
    if (!orderDetails?.appliedCoupons || orderDetails.appliedCoupons.length === 0) {
      return 0;
    }
    
    let totalDiscount = 0;
    
    // Calculate discount item by item (like PDF generation)
    orderDetails.items.forEach((item) => {
      const isFreeItem = (item.price || 0) === 0;
      if (isFreeItem) return; // Skip free items
      
      const productId = item.productID;
      const salesPrice = extractDecimalValue(item.rsalesprice || item.rprice || item.price || 0);
      const itemValue = salesPrice * (item.quantity || 0);
      
      // Find applicable coupons for this specific item
      const applicableCoupons = orderDetails.appliedCoupons.filter(coupon => {
        return coupon.discountProduct === "Any" || coupon.discountProduct === productId;
      });
      
      // Apply discounts sequentially
      let currentItemValue = itemValue;
      
      for (const coupon of applicableCoupons) {
        const couponDiscountPercent = parseFloat(coupon.discount || 0);
        if (couponDiscountPercent > 0) {
          const couponDiscountAmount = currentItemValue * (couponDiscountPercent / 100);
          currentItemValue -= couponDiscountAmount;
          totalDiscount += couponDiscountAmount;
        }
      }
    });
    
    return totalDiscount;
  };

  const calculateTotal = () => {
    // Use the total from order data directly for consistency
    return extractDecimalValue(orderDetails?.total || 0);
  };

  // Calculate the breakdown using the same logic as PDF generation
  const calculateOrderBreakdown = () => {
    if (!orderDetails?.items) return {
      totalValue: 0,
      totalValueAfterDiscount: 0,
      totalTaxValue: 0,
      totalItemTotals: 0,
      discountAmount: 0
    };

    let totalValue = 0;
    let totalValueAfterDiscount = 0;
    let totalTaxValue = 0;
    let totalItemTotals = 0;

    // Calculate item totals using the same logic as PDF
    orderDetails.items.forEach((item) => {
      const isFreeItem = (item.price || 0) === 0;
      if (isFreeItem) return; // Skip free items

      const productId = item.productID;
      const retailPrice = extractDecimalValue(item.rsalesprice || item.rprice || item.price || 0);
      const itemValue = retailPrice * (item.quantity || 0);
      
      // Calculate discount for this item using the same logic as PDF
      let itemDiscountAmount = 0;
      if (orderDetails.appliedCoupons && orderDetails.appliedCoupons.length > 0) {
        // Find applicable coupons for this specific item
        const applicableCoupons = orderDetails.appliedCoupons.filter(coupon => {
          return coupon.discountProduct === "Any" || coupon.discountProduct === productId;
        });
        
        // Apply discounts sequentially
        let currentItemValue = itemValue;
        
        for (const coupon of applicableCoupons) {
          const couponDiscountPercent = parseFloat(coupon.discount || 0);
          if (couponDiscountPercent > 0) {
            const couponDiscountAmount = currentItemValue * (couponDiscountPercent / 100);
            currentItemValue -= couponDiscountAmount;
            itemDiscountAmount += couponDiscountAmount;
          }
        }
      }

      const valueAfterDiscount = itemValue - itemDiscountAmount;
      const taxRate = parseInt(item.tax || 0);
      const taxAmount = valueAfterDiscount * (taxRate / 100);
      const itemTotal = valueAfterDiscount + taxAmount;

      totalValue += itemValue;
      totalValueAfterDiscount += valueAfterDiscount;
      totalTaxValue += taxAmount;
      totalItemTotals += itemTotal;
    });

    // Calculate total discount amount using the same logic as PDF
    const discountAmount = totalValue - totalValueAfterDiscount;

    return {
      totalValue,
      totalValueAfterDiscount,
      totalTaxValue,
      totalItemTotals,
      discountAmount
    };
  };

  // Check if wholesale pricing is applied
  const isWholesaleEligible = () => {
    const retailTotal = calculateRetailTotal();
    return retailTotal >= 10000; // Same threshold as checkout
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
                      {orderDetails.items.map((item, idx) => {
                        const isFreeItem = (item.price || 0) === 0;
                        // Use sales price from order data with proper decimal extraction
                        const rawSalesPrice = item.rsalesprice || item.rprice || item.price || 0;
                        const salesPrice = rawSalesPrice?.$numberDecimal 
                          ? parseFloat(rawSalesPrice.$numberDecimal) 
                          : parseFloat(rawSalesPrice) || 0;
                        const rawRetailPrice = item.rprice || item.price || 0;
                        const retailPrice = rawRetailPrice?.$numberDecimal 
                          ? parseFloat(rawRetailPrice.$numberDecimal) 
                          : parseFloat(rawRetailPrice) || 0;
                        const isWholesale = isWholesaleEligible() && salesPrice < retailPrice;
                        
                        return (
                          <TableRow key={idx} className={isFreeItem ? "bg-green-50" : ""}>
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                <span>{item.name}</span>
                                {isFreeItem && (
                                  <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-semibold">
                                    🎁 FREE GIFT
                                  </span>
                                )}
                                {isWholesale && !isFreeItem && (
                                  <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-semibold">
                                    WHOLESALE
                                  </span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              {item.quantity}
                            </TableCell>
                            <TableCell className="text-right">
                              {isFreeItem ? (
                                <div className="flex flex-col items-end">
                                  <span className="text-gray-400 line-through text-sm">
                                    ₹{retailPrice.toFixed(2)}
                                  </span>
                                  <span className="text-green-600 font-semibold">FREE</span>
                                </div>
                              ) : isWholesale ? (
                                <div className="flex flex-col items-end">
                                  <span className="text-gray-400 line-through text-sm">
                                    ₹{retailPrice.toFixed(2)}
                                  </span>
                                  <span className="text-blue-600 font-semibold">
                                    ₹{salesPrice.toFixed(2)}
                                  </span>
                                </div>
                              ) : (
                                <span>₹{salesPrice.toFixed(2)}</span>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              {isFreeItem ? (
                                <span className="text-green-600 font-semibold">FREE</span>
                              ) : (
                                <span>₹{(item.quantity * salesPrice).toFixed(2)}</span>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>

                {/* Order Summary */}
                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-3">Order Summary</h4>
                  <div className="space-y-2 text-sm">
                    {(() => {
                      const breakdown = calculateOrderBreakdown();
                      const delivery = calculateDelivery();
                      const deliveryTax = calculateShippingTax();
                      const totalTax = breakdown.totalTaxValue + deliveryTax;
                      
                      return (
                        <>
                          {/* Wholesale Pricing Information */}
                          {isWholesaleEligible() && (
                            <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-3">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-green-600 font-semibold">🎉 Wholesale Pricing Applied!</span>
                              </div>
                              <div className="text-green-700 text-xs">
                                You saved ₹{calculateWholesaleSavings().toFixed(2)} with wholesale pricing
                              </div>
                            </div>
                          )}

                          {/* Applied Discounts */}
                          {(breakdown.totalValue - breakdown.totalValueAfterDiscount) > 0 && (
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-3">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-yellow-700 font-semibold">💰 Discount Applied!</span>
                              </div>
                              {orderDetails.appliedCoupons?.map((coupon, index) => {
                                // Calculate discount amount for this specific coupon
                                let couponDiscountAmount = 0;
                                orderDetails.items.forEach((item) => {
                                  const isFreeItem = (item.price || 0) === 0;
                                  if (isFreeItem) return;
                                  
                                  const productId = item.productID;
                                  const salesPrice = extractDecimalValue(item.rsalesprice || item.rprice || item.price || 0);
                                  const itemValue = salesPrice * (item.quantity || 0);
                                  
                                  // Check if this coupon applies to this item
                                  if (coupon.discountProduct === "Any" || coupon.discountProduct === productId) {
                                    const couponDiscountPercent = parseFloat(coupon.discount || 0);
                                    if (couponDiscountPercent > 0) {
                                      couponDiscountAmount += itemValue * (couponDiscountPercent / 100);
                                    }
                                  }
                                });
                                
                                return (
                                  <div key={index} className="text-yellow-700 text-xs">
                                    {coupon.couponCode || coupon.name}: {coupon.discount || 0}% off 
                                    {coupon.discountProduct !== "Any" && (
                                      <span className="text-yellow-600"> (Product-specific)</span>
                                    )}
                                    <span className="font-semibold"> - ₹{couponDiscountAmount.toFixed(2)}</span>
                                  </div>
                                );
                              })}
                              <div className="text-yellow-700 text-xs font-semibold">
                                Total Discount: ₹{(breakdown.totalValue - breakdown.totalValueAfterDiscount).toFixed(2)}
                              </div>
                            </div>
                          )}

                          {/* Product Value */}
                          <div className="flex justify-between">
                            <span>
                              {isWholesaleEligible() ? "Wholesale Product Value:" : "Product Value:"}
                            </span>
                            <span>₹{breakdown.totalValue.toFixed(2)}</span>
                          </div>

                          {/* Show original retail value if wholesale is applied */}
                          {isWholesaleEligible() && (
                            <div className="flex justify-between text-gray-500">
                              <span className="line-through">Retail Value:</span>
                              <span className="line-through">₹{calculateRetailTotal().toFixed(2)}</span>
                            </div>
                          )}

                          {/* Discount */}
                          {(breakdown.totalValue - breakdown.totalValueAfterDiscount) > 0 && (
                            <div className="flex justify-between text-yellow-700">
                              <span>Discount:</span>
                              <span>-₹{(breakdown.totalValue - breakdown.totalValueAfterDiscount).toFixed(2)}</span>
                            </div>
                          )}

                          {/* Subtotal after discount */}
                          {(breakdown.totalValue - breakdown.totalValueAfterDiscount) > 0 && (
                            <div className="flex justify-between">
                              <span>Subtotal:</span>
                              <span>₹{breakdown.totalValueAfterDiscount.toFixed(2)}</span>
                            </div>
                          )}

                          {/* Delivery */}
                          <div className="flex justify-between">
                            <span>Delivery:</span>
                            <span
                              className={
                                delivery === 0
                                  ? "text-green-600 font-medium"
                                  : ""
                              }
                            >
                              {delivery === 0
                                ? "Free"
                                : `₹${delivery.toFixed(2)}`}
                            </span>
                          </div>

                          {/* Tax Breakdown */}
                          {isTamilNadu ? (
                            <>
                              <div className="flex justify-between">
                                <span>CGST (2.5%):</span>
                                <span>₹{(breakdown.totalTaxValue / 2 + deliveryTax / 2).toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>SGST (2.5%):</span>
                                <span>₹{(breakdown.totalTaxValue / 2 + deliveryTax / 2).toFixed(2)}</span>
                              </div>
                            </>
                          ) : (
                            <div className="flex justify-between">
                              <span>IGST (5%):</span>
                              <span>₹{totalTax.toFixed(2)}</span>
                            </div>
                          )}

                          {/* Free delivery message */}
                          {delivery === 0 && (
                            <div className="text-green-600 text-xs">
                              🎉 Free delivery applied
                            </div>
                          )}

                          {/* Wholesale savings message */}
                          {isWholesaleEligible() && (
                            <div className="text-green-600 text-xs">
                              🎉 Wholesale pricing applied. ₹{calculateWholesaleSavings().toFixed(2)} saved
                            </div>
                          )}

                          <hr className="my-2" />

                          <div className="flex justify-between font-bold text-lg">
                            <span>Grand Total:</span>
                            <span className="text-green-600">
                              ₹{calculateTotal().toFixed(2)}
                            </span>
                          </div>
                        </>
                      );
                    })()}
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
