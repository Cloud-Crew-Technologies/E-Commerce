import { useState, useEffect } from "react";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { CalendarIcon, Download, FileSpreadsheet, Filter } from "lucide-react";
import { format } from "date-fns";
import axios from "axios";
import * as XLSX from "xlsx";

export default function Report() {
  const [selectedReport, setSelectedReport] = useState("");
  const [dateRange, setDateRange] = useState({
    from: null,
    to: null,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const { toast } = useToast();

  // Filter states
  const [filters, setFilters] = useState({
    search: "",
    category: "all",
    types: "all",
    product: "all",
  });
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [types, setTypes] = useState([]);
  const [isLoadingFilters, setIsLoadingFilters] = useState(false);

  const reportTypes = [
    {
      value: "rbatch",
      label: "Production Report",
      description:
        "Export Production information with products and expiry dates",
      icon: "📦",
      requiresDate: false,
    },
    {
      value: "orders",
      label: "Orders Report",
      description: "Export order details with customer information",
      icon: "🛒",
      requiresDate: true,
    },
  ];

  // Fetch filter data
  useEffect(() => {
    fetchFilterData();
  }, []);

  const fetchFilterData = async () => {
    setIsLoadingFilters(true);
    try {
      // Fetch products
      const productsResponse = await axios.get(
        "https://saiapi.skillhiveinnovations.com/api/products/get"
      );
      const productsData = productsResponse.data;
      setProducts(
        Array.isArray(productsData?.data)
          ? productsData.data
          : Array.isArray(productsData)
          ? productsData
          : []
      );

      // Fetch categories
      const categoriesResponse = await axios.get(
        "https://saiapi.skillhiveinnovations.com/api/categories/get"
      );
      const categoriesData = categoriesResponse.data;
      setCategories(
        Array.isArray(categoriesData?.data)
          ? categoriesData.data
          : Array.isArray(categoriesData)
          ? categoriesData
          : []
      );

      // Fetch types
      const typesResponse = await axios.get(
        "https://saiapi.skillhiveinnovations.com/api/types/get"
      );
      const typesData = typesResponse.data;
      setTypes(
        Array.isArray(typesData?.data)
          ? typesData.data
          : Array.isArray(typesData)
          ? typesData
          : []
      );
    } catch (error) {
      console.error("Error fetching filter data:", error);
      toast({
        title: "Error",
        description: "Failed to load filter options. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingFilters(false);
    }
  };

  const fetchReportData = async () => {
    if (!selectedReport) {
      toast({
        title: "Error",
        description: "Please select a report type",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      let url = `https://saiapi.skillhiveinnovations.com/api/${selectedReport}/get`;

      // Add date filtering for orders and customers
      if (
        (selectedReport === "orders" || selectedReport === "customers") &&
        dateRange.from &&
        dateRange.to
      ) {
        const fromDate = format(dateRange.from, "yyyy-MM-dd");
        const toDate = format(dateRange.to, "yyyy-MM-dd");
        url += `?from=${fromDate}&to=${toDate}`;
      }

      const response = await axios.get(url);

      if (response.data && response.data.success) {
        let processedData = response.data.data;

        // For batch reports, fetch current stock data and calculate current stock
        if (selectedReport === "rbatch") {
          try {
            // Fetch current stock data from batch endpoint
            const batchResponse = await axios.get(
              "https://saiapi.skillhiveinnovations.com/api/batch/get"
            );
            const batchData = batchResponse.data;

            // Normalize batches array from various shapes
            const batches = Array.isArray(batchData?.data)
              ? batchData.data
              : Array.isArray(batchData)
              ? batchData
              : [];

            // Flatten into products with current stock data
            const currentStockProducts = batches.flatMap((b) => {
              const prods = Array.isArray(b?.products) ? b.products : [];
              return prods.map((p) => ({
                ...p,
                batch: b.batch,
                batchCreatedAt: b.createdAt,
                batchId: b._id,
              }));
            });

            // Merge with original batch data to get current stock from the same batch
            processedData = processedData.map((batch) => ({
              ...batch,
              products:
                batch.products?.map((product) => {
                  // Find the current stock product from the same batch
                  const currentStockProduct = currentStockProducts.find(
                    (cp) =>
                      cp.batch === batch.batch &&
                      (cp._id === product._id ||
                        cp.productID === product.productID)
                  );
                  return {
                    ...product,
                    currentStock: currentStockProduct?.quantity || 0,
                    producedStock: product.quantity || 0,
                    stockDifference:
                      (currentStockProduct?.quantity || 0) -
                      (product.quantity || 0),
                  };
                }) || [],
            }));

            // Apply filters to the processed data
            if (
              filters.search ||
              filters.category !== "all" ||
              filters.types !== "all" ||
              filters.product !== "all"
            ) {
              processedData = processedData
                .map((batch) => ({
                  ...batch,
                  products:
                    batch.products?.filter((product) => {
                      const matchesSearch =
                        !filters.search ||
                        product.name
                          ?.toLowerCase()
                          .includes(filters.search.toLowerCase()) ||
                        product.description
                          ?.toLowerCase()
                          .includes(filters.search.toLowerCase());

                      const matchesCategory =
                        filters.category === "all" ||
                        product.category === filters.category;
                      const matchesTypes =
                        filters.types === "all" ||
                        product.type === filters.types;
                      const matchesProduct =
                        filters.product === "all" ||
                        product._id === filters.product;

                      return (
                        matchesSearch &&
                        matchesCategory &&
                        matchesTypes &&
                        matchesProduct
                      );
                    }) || [],
                }))
                .filter((batch) => batch.products && batch.products.length > 0);
            }
          } catch (batchError) {
            console.error("Error fetching current stock data:", batchError);
            // Continue with original data if batch fetch fails
          }
        }

        setReportData(processedData);
        toast({
          title: "Success",
          description: `Report data loaded successfully. ${processedData.length} records found.`,
        });
      } else {
        throw new Error("Failed to fetch report data");
      }
    } catch (error) {
      console.error("Error fetching report data:", error);
      toast({
        title: "Error",
        description: "Failed to fetch report data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const exportToExcel = () => {
    if (!reportData || reportData.length === 0) {
      toast({
        title: "Error",
        description: "No data to export. Please load report data first.",
        variant: "destructive",
      });
      return;
    }

    try {
      let worksheetData = [];
      let fileName = "";

      switch (selectedReport) {
        case "rbatch":
          // Flatten products from all batches for detailed export
          const allProducts = reportData.flatMap(
            (batch) =>
              batch.products?.map((product) => ({
                ...product,
                batch: batch.batch,
                batchCreatedAt: batch.createdAt,
                batchId: batch._id,
              })) || []
          );

          worksheetData = allProducts.map((product) => ({
            "Batch Created Date": product.batchCreatedAt
              ? new Date(product.batchCreatedAt).toLocaleDateString()
              : "N/A",
            Batch: product.batch,
            "Product Name": product.name,
            Description: product.description,
            Category: product.category,
            Type: product.type,
            "Produced Stock": product.producedStock || product.quantity,
            "Current Stock": product.currentStock || 0,
            "Retail Price": product.rprice,
            "Wholesale Price": product.wprice,
            "Expiry Date": product.expiryDate || "N/A",
            Status:
              (product.currentStock || 0) === 0
                ? "Out of Stock"
                : (product.currentStock || 0) <= (product.lowstock || 10)
                ? "Low Stock"
                : "In Stock",
          }));
          fileName = `batch_report_${format(new Date(), "dd-MM-yyyy")}.xlsx`;
          break;

        case "orders":
          worksheetData = reportData.map((order) => ({
            "Order ID": order.orderID || order._id,
            "Customer Name": order.customerName || "N/A",
            "Customer Email": order.customerEmail || "N/A",
            "Customer Phone": order.customerPhone || "N/A",
            Status: order.status || "N/A",
            "Total Amount": order.total || 0,
            "Order Date": order.createdAt
              ? new Date(order.createdAt).toLocaleDateString()
              : "N/A",
            "Order Time": order.createdAt
              ? new Date(order.createdAt).toLocaleTimeString()
              : "N/A",
            Address: order.address || "N/A",
            City: order.city || "N/A",
            State: order.state || "N/A",
            Pincode: order.pincode || "N/A",
            Country: order.country || "N/A",
            "GST State Code": order.gstStateCode || "N/A",
            "Items Count": order.items?.length || 0,
            "Items Details":
              order.items
                ?.map(
                  (item) =>
                    `${item.name} (Qty: ${item.quantity}, Price: ₹${item.price})`
                )
                .join("; ") || "N/A",
          }));
          fileName = `orders_report_${format(new Date(), "yyyy-MM-dd")}.xlsx`;
          break;

        case "customers":
          worksheetData = reportData.map((customer) => ({
            "Customer ID": customer._id,
            Name: customer.name || "N/A",
            Email: customer.email || "N/A",
            "Primary Phone": customer.primaryPhone || customer.phone || "N/A",
            "Phone Numbers":
              customer.phoneNumbers
                ?.map((p) => `${p.phone} (${p.label})`)
                .join(", ") || "N/A",
            "Primary Address":
              customer.primaryAddress?.address || customer.address || "N/A",
            Addresses:
              customer.addresses
                ?.map(
                  (addr) =>
                    `${addr.address}, ${addr.city}, ${addr.state} - ${addr.pincode}`
                )
                .join("; ") || "N/A",
            City: customer.city || "N/A",
            State: customer.state || "N/A",
            Pincode: customer.pincode || "N/A",
            Country: customer.country || "N/A",
            "GST State Code": customer.gstStateCode || "N/A",
            "Registration Date": customer.createdAt
              ? new Date(customer.createdAt).toLocaleDateString()
              : "N/A",
            "Registration Time": customer.createdAt
              ? new Date(customer.createdAt).toLocaleTimeString()
              : "N/A",
            "Total Addresses": customer.addresses?.length || 0,
            "Total Phone Numbers": customer.phoneNumbers?.length || 0,
          }));
          fileName = `customers_report_${format(
            new Date(),
            "yyyy-MM-dd"
          )}.xlsx`;
          break;

        default:
          throw new Error("Invalid report type");
      }

      // Create workbook and worksheet
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(worksheetData);

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, "Report Data");

      // For batch reports, add a batch summary worksheet
      if (selectedReport === "rbatch") {
        const batchSummary = reportData.map((batch) => ({
          "Created Date": batch.createdAt
            ? new Date(batch.createdAt).toLocaleDateString()
            : "N/A",
          "Batch Name": batch.batch,
          "Product Count": batch.products?.length || 0,
          "Total Products": batch.products?.length || 0,
          "Active Products":
            batch.products?.filter((p) => p.isActive).length || 0,
          "Low Stock Products (Current)":
            batch.products?.filter(
              (p) => (p.currentStock || 0) <= (p.lowstock || 10)
            ).length || 0,
          "Out of Stock Products (Current)":
            batch.products?.filter((p) => (p.currentStock || 0) === 0).length ||
            0,
          "Total Produced Stock":
            batch.products?.reduce(
              (total, p) => total + (p.producedStock || p.quantity || 0),
              0
            ) || 0,
          "Total Current Stock":
            batch.products?.reduce(
              (total, p) => total + (p.currentStock || 0),
              0
            ) || 0,
          "Total Stock Value (Current)":
            batch.products?.reduce(
              (total, p) => total + (p.currentStock || 0) * p.rprice,
              0
            ) || 0,
          // "Stock Difference": batch.products?.reduce((total, p) => total + (p.stockDifference || 0), 0) || 0,
        }));

        if (batchSummary.length > 0) {
          const batchWorksheet = XLSX.utils.json_to_sheet(batchSummary);
          XLSX.utils.book_append_sheet(
            workbook,
            batchWorksheet,
            "Batch Summary"
          );
        }
      }

      // For orders, add a detailed items worksheet
      if (selectedReport === "orders") {
        const itemDetails = [];
        reportData.forEach((order) => {
          if (order.items && order.items.length > 0) {
            order.items.forEach((item) => {
              itemDetails.push({
                "Order ID": order.orderID || order._id,
                "Order Date": order.createdAt
                  ? new Date(order.createdAt).toLocaleDateString()
                  : "N/A",
                "Customer Name": order.customerName,
                "Customer Email": order.customerEmail,
                "Customer Phone": order.customerPhone,
                "Product Name": item.name,
                "Product ID": item.productID,
                Quantity: item.quantity,
                "Unit Price": item.price,
                "Total Price": item.quantity * item.price,
                "Order Status": order.status,
                "Order Total": order.total,
              });
            });
          }
        });

        if (itemDetails.length > 0) {
          const itemWorksheet = XLSX.utils.json_to_sheet(itemDetails);
          XLSX.utils.book_append_sheet(workbook, itemWorksheet, "Order Items");
        }
      }

      // Generate Excel file
      XLSX.writeFile(workbook, fileName);

      toast({
        title: "Success",
        description: `Report exported successfully as ${fileName}`,
      });
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      toast({
        title: "Error",
        description: "Failed to export report. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getSelectedReportInfo = () => {
    return reportTypes.find((report) => report.value === selectedReport);
  };

  const selectedReportInfo = getSelectedReportInfo();

  return (
    <div className="bg-grey-50">
      <Sidebar />
      <div className="ml-14 flex-1">
        <Header
          title="Reports"
          subtitle="Generate and export reports for your business data"
        />
        <main className="p-6">
          <div className="w-full">
            {/* Compact Report Selection and Filters */}
            <div className="grid gap-4">
              <Card className="material-elevation-2">
                <CardContent className="p-4">
                  <div className="flex flex-wrap items-center gap-4">
                    {/* Report Type Selection */}
                    <div className="flex-1 min-w-48">
                      <Label htmlFor="report-type" className="text-sm font-medium">Report Type</Label>
                      <Select value={selectedReport} onValueChange={setSelectedReport}>
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder="Choose a report type" />
                        </SelectTrigger>
                        <SelectContent>
                          {reportTypes.map((report) => (
                            <SelectItem key={report.value} value={report.value}>
                              <div className="flex items-center gap-2">
                                <span>{report.icon}</span>
                                <span>{report.label}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {/* Date Range for Orders */}
                    {selectedReportInfo?.requiresDate && (
                      <div className="flex gap-2">
                        <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
                          <PopoverTrigger asChild>
                            <Button variant="outline" size="sm" className="h-9">
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {dateRange.from ? format(dateRange.from, "MMM dd") : "From"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={dateRange.from}
                              onSelect={(date) => {
                                setDateRange((prev) => ({ ...prev, from: date }));
                                setIsDatePickerOpen(false);
                              }}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>

                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" size="sm" className="h-9">
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {dateRange.to ? format(dateRange.to, "MMM dd") : "To"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={dateRange.to}
                              onSelect={(date) => {
                                setDateRange((prev) => ({ ...prev, to: date }));
                              }}
                              disabled={(date) => dateRange.from && date < dateRange.from}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                    )}

                    {/* Load Data Button */}
                    <Button
                      onClick={fetchReportData}
                      disabled={!selectedReport || isLoading}
                      className="h-9 bg-blue-600 text-white hover:bg-blue-700"
                    >
                      <Filter className="h-4 w-4 mr-2" />
                      {isLoading ? "Loading..." : "Load Data"}
                    </Button>
                  </div>

                  {/* Compact Filters Row */}
                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2">
                      <Label className="text-sm font-medium">Filters:</Label>
                    </div>
                    
                    {/* Search */}
                    <div className="min-w-48">
                      <Input
                        placeholder="Search products..."
                        value={filters.search}
                        onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                        className="h-9"
                      />
                    </div>

                    {/* Category */}
                    <div className="min-w-32">
                      <Select value={filters.category} onValueChange={(value) => setFilters({ ...filters, category: value })}>
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder="Category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Categories</SelectItem>
                          {categories.map((category) => (
                            <SelectItem key={category._id} value={category.name}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Type */}
                    <div className="min-w-32">
                      <Select value={filters.types} onValueChange={(value) => setFilters({ ...filters, types: value })}>
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder="Type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Types</SelectItem>
                          {types.map((type) => (
                            <SelectItem key={type._id} value={type.name}>
                              {type.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Clear Filters */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setFilters({ search: "", category: "all", types: "all", product: "all" })}
                      className="h-9"
                    >
                      Clear
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Report Data Preview */}
              {reportData && (
                <Card className="material-elevation-2">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Report Preview</span>
                      <Badge variant="secondary">
                        {reportData.length} records
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <p className="text-sm text-gray-600">
                          Data loaded successfully. Click export to download as
                          Excel.
                        </p>
                        <Button
                          onClick={exportToExcel}
                          className="flex items-center gap-2"
                        >
                          <Download className="h-4 w-4" />
                          Export to Excel
                        </Button>
                      </div>

                      {/* Data Preview Table */}
                      <div className="border rounded-lg overflow-hidden material-elevation-1">
                        <div className=" overflow-y-auto">
                          <table className="w-full text-sm bg-white">
                            <thead className="bg-gray-50 sticky top-0">
                              <tr>
                                {selectedReport === "rbatch" ? (
                                  <>
                                    <th className="px-4 py-2 text-left font-medium text-gray-700">
                                      Created Date
                                    </th>
                                    <th className="px-4 py-2 text-left font-medium text-gray-700">
                                      Batch
                                    </th>
                                    <th className="px-4 py-2 text-left font-medium text-gray-700">
                                      Product
                                    </th>
                                    <th className="px-4 py-2 text-left font-medium text-gray-700">
                                      Category
                                    </th>
                                    <th className="px-4 py-2 text-left font-medium text-gray-700">
                                      Type
                                    </th>
                                    <th className="px-4 py-2 text-left font-medium text-gray-700">
                                      Produced Stock
                                    </th>
                                    <th className="px-4 py-2 text-left font-medium text-gray-700">
                                      Current Stock
                                    </th>
                                    <th className="px-4 py-2 text-left font-medium text-gray-700">
                                      Retail Price
                                    </th>
                                    <th className="px-4 py-2 text-left font-medium text-gray-700">
                                      Expiry Date
                                    </th>
                                    <th className="px-4 py-2 text-left font-medium text-gray-700">
                                      Status
                                    </th>
                                  </>
                                ) : selectedReport === "orders" ? (
                                  <>
                                    <th className="px-4 py-2 text-left font-medium text-gray-700">
                                      Order ID
                                    </th>
                                    <th className="px-4 py-2 text-left font-medium text-gray-700">
                                      Customer
                                    </th>
                                    <th className="px-4 py-2 text-left font-medium text-gray-700">
                                      Status
                                    </th>
                                    <th className="px-4 py-2 text-left font-medium text-gray-700">
                                      Amount
                                    </th>
                                    <th className="px-4 py-2 text-left font-medium text-gray-700">
                                      Date
                                    </th>
                                  </>
                                ) : (
                                  <>
                                    <th className="px-4 py-2 text-left font-medium text-gray-700">
                                      Customer ID
                                    </th>
                                    <th className="px-4 py-2 text-left font-medium text-gray-700">
                                      Name
                                    </th>
                                    <th className="px-4 py-2 text-left font-medium text-gray-700">
                                      Email
                                    </th>
                                    <th className="px-4 py-2 text-left font-medium text-gray-700">
                                      Phone
                                    </th>
                                  </>
                                )}
                              </tr>
                            </thead>
                            <tbody>
                              {selectedReport === "rbatch"
                                ? // Flatten products from all batches for preview
                                  reportData
                                    .flatMap(
                                      (batch) =>
                                        batch.products?.map((product) => ({
                                          ...product,
                                          batch: batch.batch,
                                          batchCreatedAt: batch.createdAt,
                                        })) || []
                                    )
                                    .slice(0, 10)
                                    .map((product, index) => (
                                      <tr
                                        key={index}
                                        className="border-t hover:bg-gray-50"
                                      >
                                        <td className="px-4 py-2">
                                          {product.batchCreatedAt
                                            ? new Date(
                                                product.batchCreatedAt
                                              ).toLocaleDateString()
                                            : "N/A"}
                                        </td>
                                        <td className="px-4 py-2">
                                          {product.batch}
                                        </td>
                                        <td className="px-4 py-2">
                                          <div>
                                            <div className="font-medium text-gray-900">
                                              {product.name}
                                            </div>
                                            <div className="text-xs text-gray-600 truncate w-40">
                                              {product.description}
                                            </div>
                                          </div>
                                        </td>
                                        <td className="px-4 py-2">
                                          <Badge variant="outline">
                                            {product.category}
                                          </Badge>
                                        </td>
                                        <td className="px-4 py-2">
                                          <Badge variant="outline">
                                            {product.type}
                                          </Badge>
                                        </td>
                                        <td className="px-4 py-2 font-medium">
                                          {product.producedStock ||
                                            product.quantity}{" "}
                                          Units
                                        </td>
                                        <td className="px-4 py-2 font-medium">
                                          {product.currentStock || 0} Units
                                        </td>

                                        <td className="px-4 py-2 font-mono text-sm">
                                          ₹{product.rprice}
                                        </td>
                                        <td className="px-4 py-2 font-mono text-sm">
                                          {product.expiryDate || "N/A"}
                                        </td>
                                        <td className="px-4 py-2">
                                          <Badge
                                            className={
                                              (product.currentStock || 0) === 0
                                                ? "bg-red-100 text-red-800"
                                                : (product.currentStock || 0) <=
                                                  (product.lowstock || 10)
                                                ? "bg-yellow-100 text-yellow-800"
                                                : "bg-green-100 text-green-800"
                                            }
                                          >
                                            {(product.currentStock || 0) === 0
                                              ? "Out of Stock"
                                              : (product.currentStock || 0) <=
                                                (product.lowstock || 10)
                                              ? "Low Stock"
                                              : "In Stock"}
                                          </Badge>
                                        </td>
                                      </tr>
                                    ))
                                : selectedReport === "orders"
                                ? reportData.slice(0, 10).map((item, index) => (
                                    <tr
                                      key={index}
                                      className="border-t hover:bg-gray-50"
                                    >
                                      <td className="px-4 py-2">
                                        {item.orderID ||
                                          item._id?.substring(0, 8)}
                                        ...
                                      </td>
                                      <td className="px-4 py-2">
                                        {item.customerName || "N/A"}
                                      </td>
                                      <td className="px-4 py-2">
                                        <Badge
                                          variant={
                                            item.status === "completed"
                                              ? "default"
                                              : item.status === "processing"
                                              ? "secondary"
                                              : "outline"
                                          }
                                        >
                                          {item.status}
                                        </Badge>
                                      </td>
                                      <td className="px-4 py-2">
                                        ₹{item.total || 0}
                                      </td>
                                      <td className="px-4 py-2">
                                        {item.createdAt
                                          ? new Date(
                                              item.createdAt
                                            ).toLocaleDateString()
                                          : "N/A"}
                                      </td>
                                    </tr>
                                  ))
                                : reportData.slice(0, 10).map((item, index) => (
                                    <tr
                                      key={index}
                                      className="border-t hover:bg-gray-50"
                                    >
                                      <td className="px-4 py-2">
                                        {item._id?.substring(0, 8)}...
                                      </td>
                                      <td className="px-4 py-2">
                                        {item.name || "N/A"}
                                      </td>
                                      <td className="px-4 py-2">
                                        {item.email || "N/A"}
                                      </td>
                                      <td className="px-4 py-2">
                                        {item.primaryPhone ||
                                          item.phone ||
                                          "N/A"}
                                      </td>
                                    </tr>
                                  ))}
                            </tbody>
                          </table>
                        </div>
                        {reportData.length > 10 && (
                          <div className="px-4 py-2 bg-gray-50 text-center text-sm text-gray-600">
                            {selectedReport === "rbatch"
                              ? `Showing first 10 of ${
                                  reportData.flatMap(
                                    (batch) => batch.products || []
                                  ).length
                                } products`
                              : `Showing first 10 of ${reportData.length} records`}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Loading State */}
              {isLoading && (
                <Card className="material-elevation-2">
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                      <Skeleton className="h-4 w-5/6" />
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
