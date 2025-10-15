import { useState, useEffect, useMemo } from "react";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Filter, ChevronLeft, ChevronRight } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import axios from "axios";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import OrderDetailsDialog from "@/components/orders/vieworderdialog";
import CustomerDetailsDialog from "@/components/orders/customerdetailsdialog";
import UpdateStatusDialog from "@/components/orders/updatestatusdialog";
// Removed API imports since we're using axios directly

// Company details (hardcoded) - Updated for Sri Sai Millets
const COMPANY_DETAILS = {
  name: "SRI SAI MILLETS",
  slogan: "+91 9489750185",
  address: "NO 2/32, 3rd STREET, Bridge Way Colony Extension,Tiruppur",
  city: "Tiruppur, Tamil Nadu, 641602",
  country: "India",
  gst: "33IFOPS2429C1ZB",
  phone: "+91 98942 35185",
  email: "srisaimilletstirupur23@gmail.com",
};

// Import company logo (you may need to adjust the path)
import image from "@/assets/logo.png";  

export default function Orders() {
  const [search, setSearch] = useState("");
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedOrderID, setSelectedOrderID] = useState(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const [selectedOrderForUpdate, setSelectedOrderForUpdate] = useState(null);
  const [exportModalOpen, setExportModalOpen] = useState(false);

  // New state for detailed order and product information
  const [detailedOrderData, setDetailedOrderData] = useState({});
  const [detailedProductData, setDetailedProductData] = useState({});
  const [loadingOrderDetails, setLoadingOrderDetails] = useState({});

  // Filter and pagination states
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [sortBy, setSortBy] = useState("date-desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const { toast } = useToast();

  // Helper function to extract decimal values from $numberDecimal format
  const extractDecimalValue = (value) => {
    if (typeof value === "object" && value.$numberDecimal) {
      return parseFloat(value.$numberDecimal);
    }
    return parseFloat(value) || 0;
  };

  // Function to fetch detailed order information
  const fetchDetailedOrderInfo = async (orderID) => {
    if (detailedOrderData[orderID] || loadingOrderDetails[orderID]) {
      return detailedOrderData[orderID];
    }

    try {
      setLoadingOrderDetails((prev) => ({ ...prev, [orderID]: true }));
      console.log(`Fetching detailed order info for ID: ${orderID}`);

      const response = await axios.get(
        `https://saiapi.skillhiveinnovations.com/api/orders/orderbyID/${orderID}`
      );
      console.log(`Order details for ${orderID}:`, response.data);

      if (response.data && response.data.success) {
        const orderDetails = response.data.data;
        setDetailedOrderData((prev) => ({ ...prev, [orderID]: orderDetails }));

        // Fetch detailed product information for each item
        await fetchDetailedProductInfo(orderDetails);

        return orderDetails;
      } else {
        console.error(
          `Failed to fetch order details for ${orderID}:`,
          response.data
        );
        return null;
      }
    } catch (error) {
      console.error(`Error fetching order details for ${orderID}:`, error);
      return null;
    } finally {
      setLoadingOrderDetails((prev) => ({ ...prev, [orderID]: false }));
    }
  };

  // Function to fetch detailed product information
  const fetchDetailedProductInfo = async (orderDetails) => {
    if (!orderDetails?.items || orderDetails.items.length === 0) return;

    console.log("=== FETCHING DETAILED PRODUCT INFORMATION ===");
    const newDetailedProductData = {};

    for (const item of orderDetails.items) {
      const productId = item.productID || item.productId;
      if (productId && !detailedProductData[productId]) {
        try {
          console.log(`Fetching detailed product info for ID: ${productId}`);
          const productResponse = await axios.get(
            `https://saiapi.skillhiveinnovations.com/api/products/product/${productId}`
          );
          console.log(`=== PRODUCT DETAILS FOR ${productId} ===`);
          console.log("Full Product Response:", productResponse);

          if (productResponse.data && productResponse.data.success) {
            const productData = productResponse.data.data;
            console.log("Product Name:", productData.name);
            console.log(
              "Retail Sales Price (rsalesprice):",
              productData.rsalesprice
            );
            console.log(
              "Wholesale Sales Price (wsalesprice):",
              productData.wsalesprice
            );
            console.log("Tax Rate:", productData.tax);
            console.log("=== END PRODUCT DETAILS ===");

            // Store the detailed product data
            newDetailedProductData[productId] = productData;
          } else {
            console.error(
              `Failed to fetch product details for ${productId}:`,
              productResponse
            );
          }
        } catch (error) {
          console.error(
            `Error fetching product details for ${productId}:`,
            error
          );
        }
      }
    }

    // Update the detailed product data state
    setDetailedProductData((prev) => ({ ...prev, ...newDetailedProductData }));
    console.log("=== END FETCHING DETAILED PRODUCT INFORMATION ===");
    console.log("Final detailed product data:", newDetailedProductData);
  };

  // Handle customer filter from localStorage when component mounts
  useEffect(() => {
    const customerFilter = localStorage.getItem("customerFilter");
    console.log("Retrieved customerFilter from localStorage:", customerFilter);

    if (customerFilter && customerFilter.trim()) {
      console.log("Setting search from localStorage:", customerFilter);
      setSearch(customerFilter.trim());

      toast({
        title: "Filtered by Customer",
        description: `Showing orders for ${customerFilter}`,
      });

      // Clear the localStorage after using it
      localStorage.removeItem("customerFilter");
    }
  }, []); // Empty dependency array - only run once when component mounts

  // Fetch orders
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get(
          "https://saiapi.skillhiveinnovations.com/api/orders/get"
        );
        const data = Array.isArray(response.data)
          ? response.data
          : response.data?.data || [];
        setOrders(data);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load orders",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchOrders();
  }, [toast]);

  // Cleanup localStorage on component unmount
  useEffect(() => {
    return () => {
      localStorage.removeItem("customerFilter");
    };
  }, []);

  // Filter and sort logic
  const filteredAndSortedOrders = useMemo(() => {
    let filtered = orders.filter(
      (order) =>
        order.orderID?.toLowerCase().includes(search.toLowerCase()) ||
        order.customerName?.toLowerCase().includes(search.toLowerCase()) ||
        order.customerEmail?.toLowerCase().includes(search.toLowerCase()) ||
        search === ""
    );

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((order) => order.status === statusFilter);
    }

    // Apply date filter
    if (dateFilter !== "all") {
      const now = new Date();
      const filterDate = new Date();

      switch (dateFilter) {
        case "today":
          filterDate.setHours(0, 0, 0, 0);
          filtered = filtered.filter(
            (order) => new Date(order.createdAt) >= filterDate
          );
          break;
        case "week":
          filterDate.setDate(now.getDate() - 7);
          filtered = filtered.filter(
            (order) => new Date(order.createdAt) >= filterDate
          );
          break;
        case "month":
          filterDate.setMonth(now.getMonth() - 1);
          filtered = filtered.filter(
            (order) => new Date(order.createdAt) >= filterDate
          );
          break;
        case "3months":
          filterDate.setMonth(now.getMonth() - 3);
          filtered = filtered.filter(
            (order) => new Date(order.createdAt) >= filterDate
          );
          break;
      }
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "date-desc":
          return new Date(b.createdAt) - new Date(a.createdAt);
        case "date-asc":
          return new Date(a.createdAt) - new Date(b.createdAt);
        case "amount-desc":
          return b.total - a.total;
        case "amount-asc":
          return a.total - b.total;
        case "customer-asc":
          return (a.customerName || "").localeCompare(b.customerName || "");
        case "customer-desc":
          return (b.customerName || "").localeCompare(a.customerName || "");
        case "orderid-asc":
          return (a.orderID || "").localeCompare(b.orderID || "");
        case "orderid-desc":
          return (b.orderID || "").localeCompare(a.orderID || "");
        default:
          return new Date(b.createdAt) - new Date(a.createdAt);
      }
    });

    return filtered;
  }, [orders, search, statusFilter, dateFilter, sortBy]);

  // Pagination logic
  const totalItems = filteredAndSortedOrders.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = filteredAndSortedOrders.slice(startIndex, endIndex);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, dateFilter, sortBy]);

  const onViewDetails = (orderID) => {
    setSelectedOrderID(orderID);
  };
  const onCloseDetails = () => {
    setSelectedOrderID(null);
  };

  const onViewCustomerDetails = (customerId) => {
    setSelectedCustomerId(customerId);
  };
  const onCloseCustomerDetails = () => {
    setSelectedCustomerId(null);
  };

  const onUpdateStatus = (order) => {
    setSelectedOrderForUpdate(order);
  };
  const onCloseStatusUpdate = () => {
    setSelectedOrderForUpdate(null);
  };

  const onStatusUpdated = () => {
    // Refresh the orders list after status update
    const fetchOrders = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get(
          "https://saiapi.skillhiveinnovations.com/api/orders/get"
        );
        const data = Array.isArray(response.data)
          ? response.data
          : response.data?.data || [];
        setOrders(data);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to refresh orders",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchOrders();
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "ordered":
        return <Badge className="status-chip status-pending">Ordered</Badge>;
      case "processing":
        return <Badge className="status-chip status-pending">Processing</Badge>;
      case "shipped":
        return <Badge className="status-chip status-active">Shipped</Badge>;
      case "delivered":
        return (
          <Badge className="status-chip status-delivered">Delivered</Badge>
        );
      case "cancelled":
        return <Badge className="status-chip status-pending">Cancelled</Badge>;
      default:
        return <Badge className="status-chip status-pending">{status}</Badge>;
    }
  };

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setDateFilter("all");
    setSortBy("date-desc");
    setCurrentPage(1);
  };

  // Save data to local storage helper
  const saveToLocalStorage = (key, data) => {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (err) {
      console.error("Failed to save data to localStorage", err);
    }
  };

  // PDF Export function
  const exportPDF = () => {
    if (!filteredAndSortedOrders || filteredAndSortedOrders.length === 0) {
      toast({
        title: "No data",
        description: "No orders to export",
        variant: "destructive",
      });
      return;
    }

    saveToLocalStorage("exportedOrderData", filteredAndSortedOrders);
    const doc = new jsPDF();

    const columns = [
      { header: "Order ID", dataKey: "orderID" },
      { header: "Customer Name", dataKey: "name" },
      { header: "Customer Mail", dataKey: "mail" },
      { header: "Customer Phone", dataKey: "phone" },
      { header: "Total Amount", dataKey: "total" },
      { header: "Status", dataKey: "status" },
    ];

    const rows = filteredAndSortedOrders.map((order) => ({
      orderID: order.orderID,
      name: order.customerName,
      mail: order.customerEmail,
      phone: order.customerPhone,
      total: order.total,
      status: order.status,
    }));

    autoTable(doc, {
      columns,
      body: rows,
      styles: { fontSize: 10 },
      headStyles: { fillColor: [22, 160, 133] },
      startY: 20,
      columnStyles: {
        0: { halign: "left", cellWidth: "auto" },
        1: { halign: "left", cellWidth: "auto" },
        2: { halign: "left", cellWidth: "auto" },
        3: { halign: "left", cellWidth: "auto" },
        4: { halign: "center" },
        5: { halign: "left" },
      },
    });

    doc.text("Order Overview", 14, 15);
    doc.save("Order-overview.pdf");
  };

  // Excel Export function
  const exportExcel = () => {
    if (!filteredAndSortedOrders || filteredAndSortedOrders.length === 0) {
      toast({
        title: "No data",
        description: "No orders to export",
        variant: "destructive",
      });
      return;
    }

    saveToLocalStorage("exportedOrderData", filteredAndSortedOrders);

    const wsData = filteredAndSortedOrders.map((order) => ({
      OrderID: order.orderID,
      Name: order.customerName,
      Mail: order.customerEmail,
      Phone: order.customerPhone,
      Total: order.total,
      Status: order.status,
    }));

    const worksheet = XLSX.utils.json_to_sheet(wsData);
    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, "Order");

    XLSX.writeFile(workbook, "Order-overview.xlsx");
  };
  const generatePDF = async (orderID) => {
    // Fetch detailed order information if not already available
    let orderDetails = detailedOrderData[orderID];
    if (!orderDetails) {
      orderDetails = await fetchDetailedOrderInfo(orderID);
      if (!orderDetails) {
        toast({
          title: "Error",
          description: "Failed to fetch order details for PDF generation",
          variant: "destructive",
        });
        return;
      }
    }

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    let yPosition = 10;

    // Define colors - Light green theme
    const primaryColor = [34, 197, 94]; // Green
    const secondaryColor = [71, 85, 105];
    const lightGray = [248, 250, 252];
    const darkGray = [51, 65, 85];
    const borderColor = [226, 232, 240];
    const whiteBg = [255, 255, 255];
    const accentColor = [74, 222, 128]; // Light green accent

    // Helper function to format currency with INR symbol
    const formatINR = (amount) => {
      return ` ${amount.toFixed(2)}`;
    };

    // Helper function to add a box with border
    const addBox = (
      x,
      y,
      width,
      height,
      fillColor = whiteBg,
      strokeColor = borderColor,
      strokeWidth = 0.5
    ) => {
      doc.setFillColor(...fillColor);
      doc.setDrawColor(...strokeColor);
      doc.setLineWidth(strokeWidth);
      doc.rect(x, y, width, height, "FD");
    };

    // Add Watermark
    const addWatermark = () => {
      doc.saveGraphicsState();
      doc.setGState(new doc.GState({ opacity: 0.1 }));

      // Center the watermark image
      const centerX = pageWidth / 2;
      const centerY = pageHeight / 2;
      const imgWidth = 120;
      const imgHeight = 150;

      try {
        doc.addImage(
          image,
          "PNG",
          centerX - imgWidth / 2,
          centerY - imgHeight / 2,
          imgWidth,
          imgHeight,
          null,
          "NONE"
        );
      } catch (error) {
        console.error("Error adding watermark image:", error);
        // Fallback to text watermark if image fails
        doc.setTextColor(...primaryColor);
        doc.setFontSize(60);
        doc.setFont("helvetica", "bold");
        doc.text("SSM", centerX, centerY, {
          align: "center",
          angle: 45,
        });
      }

      doc.restoreGraphicsState();
    };

    const gstStateCode = orderDetails?.gstStateCode || "33"; // Default to Tamil Nadu code if not available
    const isIntraState = gstStateCode === "33"; // Check if transaction is within Tamil Nadu

    // Calculate totals - will be calculated in the items loop below
    let totalQtySalesPrice = 0;
    let totalTaxValue = 0;
    let totalQty = 0;
    let freeGiftsCount = 0;
    const shippingtax = orderDetails?.deliveryTax || 0;

    console.log("PDF Totals:", {
      totalQtySalesPrice,
      totalTaxValue,
      totalQty,
      isIntraState,
      gstStateCode,
    });

    // GST calculation will be done after items loop
    let cgst = 0;
    let sgst = 0;
    let igst = 0;

    // Add watermark first (behind all content)
    addWatermark();

    // Header Section with gradient effect
    addBox(0, 0, pageWidth, 32, [240, 253, 244], borderColor, 0); // Light green background

    // Add decorative accent line
    doc.setDrawColor(...accentColor);
    doc.setLineWidth(0.5);
    doc.line(0, 32, pageWidth, 32);

    // Company Logo Area
    try {
      doc.addImage(image, "PNG", 5, 5, 20, 22);
    } catch (error) {
      console.error("Error adding logo image:", error);
      // Fallback to colored box with text if image fails
      doc.setFillColor(...primaryColor);
      doc.roundedRect(5, 5, 14, 14, 2, 2, "F");

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.text("SSM", 12, 13.5, { align: "center" });
    }

    // Company Name and Details
    doc.setTextColor(...primaryColor);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text(COMPANY_DETAILS.name, 26, 11);

    doc.setTextColor(...secondaryColor);
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.text(COMPANY_DETAILS.slogan, 26, 16);

    doc.setTextColor(...darkGray);
    doc.setFontSize(6.5);
    doc.text(COMPANY_DETAILS.address, 26, 20.5);
    doc.text(COMPANY_DETAILS.city, 26, 24);
    doc.text(`GSTIN: ${COMPANY_DETAILS.gst}`, 26, 27.5);

    // Invoice Title (top right) with accent background
    doc.setTextColor(...primaryColor);
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("INVOICE", pageWidth - 5, 12, { align: "right" });

    // Order ID and Date
    doc.setTextColor(...darkGray);
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    const formattedDate = new Date().toLocaleDateString("en-GB");
    doc.text(`Order ID: ${orderID}`, pageWidth - 5, 20, {
      align: "right",
    });
    doc.setFont("helvetica", "normal");
    doc.text(`Date: ${formattedDate}`, pageWidth - 5, 25, {
      align: "right",
    });

    yPosition = 35;

    // Get customer details
    const {
      name = "",
      email = "",
      phone = "",
      address = "",
      city = "",
      state = "",
      pincode = "",
      paymentMethod = "",
      shippingAddress = {},
      customerName = "",
      customerEmail = "",
      customerPhone = "",
    } = orderDetails;

    const finalName = name || customerName || shippingAddress.name || "";
    const finalEmail = email || customerEmail || shippingAddress.email || "";
    const finalPhone = phone || customerPhone || shippingAddress.phone || "";
    const finalAddress = address || shippingAddress.address || "";
    const finalCity = city || shippingAddress.city || "";
    const finalPincode = pincode || shippingAddress.pincode || "";

    // Bill To Section with enhanced styling
    addBox(5, yPosition, pageWidth - 10, 32, [252, 252, 253], borderColor, 0.5);

    // Bill To header bar
    doc.setFillColor(...accentColor);
    doc.setGState(new doc.GState({ opacity: 0.15 }));
    doc.rect(5, yPosition, pageWidth - 10, 6, "F");
    doc.setGState(new doc.GState({ opacity: 1 }));

    doc.setTextColor(...primaryColor);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("BILL TO", 8, yPosition + 4);

    const billToContentY = yPosition + 10;
    doc.setTextColor(...darkGray);
    doc.setFontSize(8.5);
    doc.setFont("helvetica", "bold");
    doc.text(finalName || "N/A", 8, billToContentY);

    doc.setFontSize(7.5);
    doc.setFont("helvetica", "normal");
    doc.text(finalEmail || "N/A", 8, billToContentY + 5);
    doc.text(finalPhone || "N/A", 8, billToContentY + 10);

    const fullAddress = `${finalAddress || ""}, ${finalCity || ""} - ${
      finalPincode || ""
    }`;
    const addressLines = doc.splitTextToSize(fullAddress, 95);
    doc.text(addressLines, 8, billToContentY + 15);

    // Payment method badge - TOP RIGHT
    const paymentText = paymentMethod === "razorpay" ? "Online" : "Online";
    const paymentBoxX = pageWidth - 45;
    const paymentBoxY = billToContentY;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.text("Payment:", paymentBoxX, paymentBoxY);

    doc.setFillColor(...accentColor);
    doc.setGState(new doc.GState({ opacity: 0.2 }));
    doc.roundedRect(paymentBoxX + 18, paymentBoxY - 3.5, 20, 4.5, 1, 1, "F");
    doc.setGState(new doc.GState({ opacity: 1 }));

    doc.setTextColor(...darkGray);
    doc.setFont("helvetica", "bold");
    doc.text(paymentText, paymentBoxX + 28, paymentBoxY, { align: "center" });

    yPosition += 35;

    // Items Table Header - Clean spreadsheet style
    addBox(5, yPosition, pageWidth - 10, 9, [248, 250, 252], borderColor, 0.5);

    doc.setTextColor(...darkGray);
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "bold");

    // Column headers with proper spacing
    doc.text("Item", 8, yPosition + 6);
    doc.text("Qty", 50, yPosition + 6, { align: "center" });
    doc.text("Retail Price", 70, yPosition + 6, { align: "center" });
    doc.text("Value", 100, yPosition + 6, { align: "center" });
    doc.text("Discount %", 125, yPosition + 6, { align: "center" });
    doc.text("Value After Discount", 150, yPosition + 6, { align: "center" });
    doc.text("Tax%", 180, yPosition + 6, { align: "center" });
    doc.text("Total", pageWidth - 8, yPosition + 6, { align: "right" });

    yPosition += 11;

    // Items rows - Clean spreadsheet style
    // Note: totalQty is already declared above
    let totalValue = 0;
    let totalValueAfterDiscount = 0;
    let totalItemTotals = 0; // For the final total column

    orderDetails.items?.forEach((item, index) => {
      if (yPosition > pageHeight - 100) {
        doc.addPage();
        addWatermark(); // Add watermark to new page
        yPosition = 10;
      }

      const isFreeItem = (item.price || 0) === 0;
      const rowHeight = 11;
      const rowBgColor = index % 2 === 0 ? whiteBg : [249, 250, 251];
      addBox(
        5,
        yPosition,
        pageWidth - 10,
        rowHeight,
        rowBgColor,
        borderColor,
        0.2
      );

      const itemName = item.name || item.productName || "Unknown Product";
      const displayName = isFreeItem ? `${itemName} (FREE GIFT)` : itemName;
      const isWholesaleEligible = orderDetails?.isWholesaleEligible || false;
      const productId = item.productID || item.productId;
      const detailedProduct = detailedProductData[productId];

      // Calculate pricing based on item type
      const retailPrice = isFreeItem
        ? 0
        : detailedProduct
        ? extractDecimalValue(detailedProduct.rsalesprice) || 0
        : extractDecimalValue(item.rsalesprice) || 0
          0;

      const wholesalePrice = isFreeItem
        ? 0
        : detailedProduct
        ? extractDecimalValue(detailedProduct.wprice) || 0
        : extractDecimalValue(item.wprice) || 0;

      const effectivePrice =
        isWholesaleEligible && wholesalePrice > 0
          ? wholesalePrice
          : retailPrice;

      // Calculate discount based on applied coupons
      let itemDiscountAmount = 0;
      let discountPercent = 0;

      const itemValue = effectivePrice * (item.quantity || 0);

      if (
        !isFreeItem &&
        orderDetails.appliedCoupons &&
        orderDetails.appliedCoupons.length > 0
      ) {
        // Calculate total item values for proportional discount distribution
        const totalItemValues = orderDetails.items
          .filter((item) => (item.price || 0) > 0)
          .reduce((sum, item) => {
            const productId = item.productID || item.productId;
            const detailedProduct = detailedProductData[productId];
            const retailPrice = detailedProduct
              ? extractDecimalValue(detailedProduct.rsalesprice) || 0
              : extractDecimalValue(item.rsalesprice) ||
                extractDecimalValue(item.price) ||
                0;
            return sum + retailPrice * (item.quantity || 0);
          }, 0);

        if (totalItemValues > 0) {
          const totalDiscount = orderDetails.appliedCoupons.reduce(
            (sum, coupon) => {
              return sum + (parseInt(coupon.discount) || 0);
            },
            0
          );
          discountPercent = totalItemValues > 0 ? totalDiscount : 0;
          itemDiscountAmount = itemValue * (totalDiscount / 100);
        }
      }

      const valueAfterDiscount = itemValue - itemDiscountAmount;

      const taxRate = parseInt(detailedProduct?.tax || item.tax || 0);
      const taxAmount = valueAfterDiscount * (taxRate / 100);
      const itemTotal = valueAfterDiscount + taxAmount;

      // Update totals
      totalQty += item.quantity || 0;
      totalValue += itemValue;
      totalValueAfterDiscount += valueAfterDiscount;
      totalItemTotals += itemTotal; // Add the final item total (valueAfterDiscount + tax)
      totalQtySalesPrice += itemValue;
      totalTaxValue += taxAmount;
      console.log(totalTaxValue);
      console.log(shippingtax);

      doc.setTextColor(...darkGray);
      doc.setFontSize(7.5);
      doc.setFont("helvetica", "normal");

      // Item name (left-aligned)
      const truncatedName =
        displayName.length > 15
          ? displayName.substring(0, 12) + "..."
          : displayName;
      doc.text(truncatedName, 8, yPosition + 7);

      // Quantity (center-aligned)
      doc.text((item.quantity || 0).toString(), 50, yPosition + 7, {
        align: "center",
      });

      // Retail Price (center-aligned)
      doc.text(effectivePrice.toFixed(2), 70, yPosition + 7, {
        align: "center",
      });

      // Value (center-aligned)
      doc.text(itemValue.toFixed(2), 100, yPosition + 7, { align: "center" });

      // Discount % (center-aligned)
      doc.text(discountPercent + "%", 125, yPosition + 7, { align: "center" });

      // Value After Discount (center-aligned)
      doc.text(valueAfterDiscount.toFixed(2), 150, yPosition + 7, {
        align: "center",
      });

      // Tax % (center-aligned)
      doc.text(taxRate + "%", 180, yPosition + 7, { align: "center" });

      // Total (right-aligned)
      doc.setFont("helvetica", "bold");
      doc.text(itemTotal.toFixed(2), pageWidth - 8, yPosition + 7, {
        align: "right",
      });

      yPosition += rowHeight;
    });

    yPosition += 3;

    // Calculate GST based on state code - NOW that totalTaxValue is calculated
    if (isIntraState) {
      // Intra-state: Split tax into CGST and SGST
      cgst = (totalTaxValue / 2).toFixed(2);
      sgst = (totalTaxValue / 2).toFixed(2);
    } else {
      // Inter-state: Use IGST
      igst = totalTaxValue.toFixed(2);
    }

    // Totals Row - matching the image style
    const totalsRowHeight = 11;
    addBox(
      5,
      yPosition,
      pageWidth - 10,
      totalsRowHeight,
      [248, 250, 252], // Light gray background
      borderColor,
      0.5
    );

    doc.setTextColor(...darkGray);
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "bold");

    // Total row data
    doc.text("Total", 8, yPosition + 7);
    doc.text(totalQty.toString(), 50, yPosition + 7, { align: "center" });
    doc.text("", 70, yPosition + 7, { align: "center" }); // Empty for retail price
    doc.text(totalValue.toFixed(2), 100, yPosition + 7, { align: "center" });
    doc.text("", 125, yPosition + 7, { align: "center" }); // Empty for discount %
    doc.text(totalValueAfterDiscount.toFixed(2), 150, yPosition + 7, {
      align: "center",
    });
    doc.text("", 180, yPosition + 7, { align: "center" }); // Empty for tax %
    doc.text(totalItemTotals.toFixed(2), pageWidth - 8, yPosition + 7, { align: "right" }); // Total of all item totals

    yPosition += totalsRowHeight + 5;

    // Applied Coupons Section (if any)

    // Totals Row - aligned with table columns with green theme
    const rowHeight = 1;
    // addBox(
    //   5,
    //   yPosition,
    //   pageWidth - 10,
    //   rowHeight,
    //   [220, 252, 231],
    //   accentColor
    // );

    // doc.setTextColor(...primaryColor);
    // doc.setFontSize(8);
    // doc.setFont("helvetica", "bold");

    // // Label for totals
    // doc.text("TOTAL:", 48, yPosition + 7);

    // // Total Qty (aligned with Qty column)
    // doc.text(totalQty.toString(), 90, yPosition + 7, {
    //   align: "center",
    // });

    // // Total Value (aligned with Value column)
    // doc.text(formatINR(totalQtySalesPrice), 140, yPosition + 7, {
    //   align: "center",
    // });

    yPosition += rowHeight + 5;

    // Calculate discount amount first
    const discountAmount =
      orderDetails.appliedCoupons?.reduce((sum, coupon) => {
        // Use 'discount' field if available, otherwise fallback to 'discountAmount'
        return sum + (coupon.discountAmount || 0);
      }, 0) || 0;

    // Order Summary Section - Clean format like the image
    const summaryBoxWidth = 120;
    const summaryBoxX = 35;
    const summaryBoxHeight = 50;

    addBox(
      summaryBoxX,
      yPosition,
      summaryBoxWidth,
      summaryBoxHeight,
      whiteBg,
      borderColor,
      0.5
    );

    const summaryContentY = yPosition + 6;
    const summaryLabelX = summaryBoxX + 4;
    const summaryValueX = summaryBoxX + summaryBoxWidth - 4;

    doc.setTextColor(...darkGray);
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "normal");

    // Product Value
    doc.text("Product Value:", summaryLabelX, summaryContentY);
    doc.setFont("helvetica", "bold");
    doc.text("Rs", summaryValueX - 10, summaryContentY, { align: "right" });
    doc.text(totalValue.toFixed(2), summaryValueX, summaryContentY, {
      align: "right",
    });

    // Discount - use the actual discount from coupons
    doc.setFont("helvetica", "normal");
    doc.text("Discount:", summaryLabelX, summaryContentY + 5);
    doc.setFont("helvetica", "bold");
    doc.text("Rs", summaryValueX - 10, summaryContentY + 5, { align: "right" });
    doc.text((totalValue-totalValueAfterDiscount).toFixed(2), summaryValueX, summaryContentY + 5, {
      align: "right",
    });

    // Sub Total
    doc.setFont("helvetica", "normal");
    doc.text("Sub Total:", summaryLabelX, summaryContentY + 10);
    doc.setFont("helvetica", "bold");
    doc.text("Rs", summaryValueX - 10, summaryContentY + 10, { align: "right" });
    doc.text(
      (totalValueAfterDiscount).toFixed(2),
      summaryValueX,
      summaryContentY + 10,
      { align: "right" }
    );

    // Delivery
    doc.setFont("helvetica", "normal");
    doc.text("Delivery:", summaryLabelX, summaryContentY + 15);
    doc.setFont("helvetica", "bold");
    doc.text("Rs", summaryValueX - 10, summaryContentY + 15, { align: "right" });
    doc.text(
      (orderDetails.delivery || 0).toFixed(2),
      summaryValueX,
      summaryContentY + 15,
      { align: "right" }
    );

    // GST Display - Conditional based on state
    const deliveryTax = (orderDetails.deliveryTax || 0); // 5% tax on delivery
    const totalGST = totalTaxValue + deliveryTax;
    
    if (isIntraState) {
      // Show CGST and SGST for intra-state (State Code 33)
      doc.setFont("helvetica", "normal");
      doc.text("SGST:", summaryLabelX, summaryContentY + 20);
      doc.setFont("helvetica", "bold");
      doc.text("Rs", summaryValueX - 10, summaryContentY + 20, { align: "right" });
      doc.text(`${(parseFloat(sgst) + parseFloat(shippingtax) / 2).toFixed(2)}`, summaryValueX, summaryContentY + 20, { align: "right" });

      doc.setFont("helvetica", "normal");
      doc.text("CGST:", summaryLabelX, summaryContentY + 25);
      doc.setFont("helvetica", "bold");
      doc.text("Rs", summaryValueX - 10, summaryContentY + 25, { align: "right" });
      doc.text(`${(parseFloat(cgst) + parseFloat(shippingtax) / 2).toFixed(2)}`, summaryValueX, summaryContentY + 25, { align: "right" });

      // Grand Total positioned lower for CGST+SGST
      doc.setFillColor(220, 252, 231);
      doc.rect(summaryBoxX, summaryContentY + 29, summaryBoxWidth, 8, "F");

      doc.setTextColor(...primaryColor);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.text("Invoice Total:", summaryLabelX, summaryContentY + 34);
      doc.setFontSize(9);
      doc.text("Rs", summaryValueX - 10, summaryContentY + 34, { align: "right" });
      doc.text(
        `${(orderDetails.total).toFixed(2)}`,
        summaryValueX,
        summaryContentY + 34,
        {
          align: "right",
        }
      );
    } else {
      // Show IGST for inter-state (Other State Codes)
      doc.setFont("helvetica", "normal");
      doc.text("IGST:", summaryLabelX, summaryContentY + 20);
      doc.setFont("helvetica", "bold");
      doc.text(`Rs ${igst}`, summaryValueX, summaryContentY + 20, { align: "right" });

      // Grand Total positioned normally for IGST
      doc.setFillColor(220, 252, 231);
      doc.rect(summaryBoxX, summaryContentY + 24, summaryBoxWidth, 8, "F");

      doc.setTextColor(...primaryColor);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.text("Invoice Total:", summaryLabelX, summaryContentY + 29);
      doc.setFontSize(9);
      doc.text(
        `Rs ${(totalValue - discountAmount + (orderDetails.delivery || 0) + totalGST).toFixed(2)}`,
        summaryValueX,
        summaryContentY + 29,
        {
          align: "right",
        }
      );
    }

    // Footer with design elements
    const footerY = pageHeight - 15;

    // Footer separator line
    doc.setDrawColor(...borderColor);
    doc.setLineWidth(0.5);
    doc.line(10, footerY - 3, pageWidth - 10, footerY - 3);

    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...primaryColor);
    doc.text(
      "Thank you for choosing Sri Sai Millets!",
      pageWidth / 2,
      footerY + 2,
      { align: "center" }
    );

    doc.setFontSize(6);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(148, 163, 184);
    doc.text(
      "This is a computer generated invoice. No signature required.",
      pageWidth / 2,
      footerY + 7,
      { align: "center" }
    );

    // Save the PDF
    doc.save(`invoice-${orderID}.pdf`);
  };

  return (
    <div className="bg-grey-50">
      <Sidebar />
      <div className="ml-14 flex-1">
        <Header
          title="Order Management"
          subtitle="View and manage customer orders"
        />
        <main className="p-6">
          <Card className="material-elevation-2">
            <CardHeader>
              <CardTitle>Order List</CardTitle>

              {/* Search */}
              <div className="flex items-center gap-4 mt-4">
                <div className="flex-1 relative">
                  <span className="material-icons absolute left-3 top-1/2 transform -translate-y-1/2 text-grey-400">
                    search
                  </span>
                  <Input
                    placeholder="Search orders by customer name, email, or order ID..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button
                  className="bg-primary-500 hover:bg-primary-600"
                  onClick={() => setExportModalOpen(true)}
                >
                  <span className="material-icons mr-2">file_download</span>
                  Export
                </Button>
                {exportModalOpen && (
                  <div className="export-modal bg-white shadow-md p-4 rounded absolute right-0 top-990 z-10 w-48">
                    <p className="mb-2 font-semibold">Select Export Format</p>
                    <Button
                      className="mb-2 w-full"
                      onClick={() => {
                        exportPDF();
                        setExportModalOpen(false);
                      }}
                    >
                      Export as PDF
                    </Button>
                    <Button
                      className="w-full"
                      onClick={() => {
                        exportExcel();
                        setExportModalOpen(false);
                      }}
                    >
                      Export as Excel
                    </Button>
                    <Button
                      variant="ghost"
                      className="mt-2 w-full text-sm"
                      onClick={() => setExportModalOpen(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                )}
              </div>

              {/* Advanced Filters */}
              <div className="flex flex-wrap gap-3 mt-4 p-4 rounded-lg">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-gray-500" />
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="h-9 w-36">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="ordered">Ordered</SelectItem>
                      <SelectItem value="processing">Processing</SelectItem>
                      <SelectItem value="shipped">Shipped</SelectItem>
                      <SelectItem value="delivered">Delivered</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Select value={dateFilter} onValueChange={setDateFilter}>
                  <SelectTrigger className="h-9 w-36">
                    <SelectValue placeholder="Date Range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="week">Last Week</SelectItem>
                    <SelectItem value="month">Last Month</SelectItem>
                    <SelectItem value="3months">Last 3 Months</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="h-9 w-40">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date-desc">Date (Newest)</SelectItem>
                    <SelectItem value="date-asc">Date (Oldest)</SelectItem>
                    <SelectItem value="amount-desc">Amount (High)</SelectItem>
                    <SelectItem value="amount-asc">Amount (Low)</SelectItem>
                    <SelectItem value="customer-asc">Customer A-Z</SelectItem>
                    <SelectItem value="customer-desc">Customer Z-A</SelectItem>
                    <SelectItem value="orderid-asc">Order ID A-Z</SelectItem>
                    <SelectItem value="orderid-desc">Order ID Z-A</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={itemsPerPage.toString()}
                  onValueChange={(value) => setItemsPerPage(parseInt(value))}
                >
                  <SelectTrigger className="h-9 w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  variant="outline"
                  onClick={clearFilters}
                  className="h-9"
                >
                  Clear Filters
                </Button>
              </div>

              {/* Results Summary */}
              <div className="flex items-center justify-between mt-4 text-sm text-gray-600">
                <span>
                  Showing {startIndex + 1} - {Math.min(endIndex, totalItems)} of{" "}
                  {totalItems} orders
                </span>
                {(search || statusFilter !== "all" || dateFilter !== "all") && (
                  <span className="text-primary-500">
                    Filtered results ({totalItems} of {orders.length} total
                    orders)
                  </span>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <div key={i} className="flex items-center space-x-4">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-6 w-16" />
                      <Skeleton className="h-8 w-12" />
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Order ID</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Mail ID</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {currentItems.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={6}
                            className="text-center text-grey-500 py-8"
                          >
                            {search ||
                            statusFilter !== "all" ||
                            dateFilter !== "all"
                              ? "No orders match your search criteria"
                              : "No orders found"}
                          </TableCell>
                        </TableRow>
                      ) : (
                        currentItems.map((order) => (
                          <TableRow
                            key={order.orderID || order._id}
                            className="hover:bg-grey-50"
                          >
                            <TableCell className="font-medium text-primary-500">
                              {order.orderID}
                            </TableCell>
                            <TableCell className="text-grey-900">
                              {order.customerName}
                            </TableCell>
                            <TableCell className="text-grey-600">
                              {order.customerEmail}
                            </TableCell>
                            <TableCell className="text-grey-600">
                              {order.customerPhone}
                            </TableCell>
                            <TableCell className="font-medium">
                              ₹{order.total?.toLocaleString()}
                            </TableCell>
                            <TableCell className="text-grey-600">
                              {new Date(order.createdAt).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              {getStatusBadge(order.status)}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => onViewDetails(order.orderID)}
                                >
                                  View Details
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => onUpdateStatus(order)}
                                >
                                  Update Status
                                </Button>
                                {/* {(order.customerId || order.customerEmail) && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                      onViewCustomerDetails(
                                        order.customerId || order.customerEmail
                                      )
                                    }
                                  >
                                    View Customer
                                  </Button>
                                )} */}
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => generatePDF(order.orderID)}
                                  disabled={loadingOrderDetails[order.orderID]}
                                >
                                  {loadingOrderDetails[order.orderID]
                                    ? "Loading..."
                                    : "Generate PDF"}
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-6 px-4 py-3 border-t border-gray-200">
                      <div className="flex items-center space-x-4">
                        <span className="text-sm text-gray-700">
                          Rows per page:
                        </span>
                        <Select
                          value={itemsPerPage.toString()}
                          onValueChange={(value) =>
                            setItemsPerPage(parseInt(value))
                          }
                        >
                          <SelectTrigger className="h-8 w-16 border-none shadow-none">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="5">5</SelectItem>
                            <SelectItem value="10">10</SelectItem>
                            <SelectItem value="25">25</SelectItem>
                            <SelectItem value="50">50</SelectItem>
                            <SelectItem value="100">100</SelectItem>
                          </SelectContent>
                        </Select>
                        <span className="text-sm text-gray-700">
                          {startIndex + 1} - {Math.min(endIndex, totalItems)} of{" "}
                          {totalItems}
                        </span>
                      </div>

                      <div className="flex items-center space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setCurrentPage(1)}
                          disabled={currentPage === 1}
                          className="w-8 h-8 p-0"
                        >
                          <span className="material-icons text-base">
                            first_page
                          </span>
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            setCurrentPage((prev) => Math.max(prev - 1, 1))
                          }
                          disabled={currentPage === 1}
                          className="w-8 h-8 p-0"
                        >
                          <span className="material-icons text-base">
                            chevron_left
                          </span>
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            setCurrentPage((prev) =>
                              Math.min(prev + 1, totalPages)
                            )
                          }
                          disabled={currentPage === totalPages}
                          className="w-8 h-8 p-0"
                        >
                          <span className="material-icons text-base">
                            chevron_right
                          </span>
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setCurrentPage(totalPages)}
                          disabled={currentPage === totalPages}
                          className="w-8 h-8 p-0"
                        >
                          <span className="material-icons text-base">
                            last_page
                          </span>
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
      {selectedOrderID && (
        <OrderDetailsDialog
          open={!!selectedOrderID}
          onOpenChange={onCloseDetails}
          orderID={selectedOrderID}
        />
      )}

      {selectedCustomerId && (
        <CustomerDetailsDialog
          open={!!selectedCustomerId}
          onOpenChange={onCloseCustomerDetails}
          customerId={selectedCustomerId}
        />
      )}

      {selectedOrderForUpdate && (
        <UpdateStatusDialog
          open={!!selectedOrderForUpdate}
          onOpenChange={onCloseStatusUpdate}
          order={selectedOrderForUpdate}
          onStatusUpdated={onStatusUpdated}
        />
      )}
    </div>
  );
}
