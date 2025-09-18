import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import axios from "axios";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Typography } from "@mui/material";
import ViewProductDialog from "@/batch/product_details";
import EditBatchDialog from "@/batch/edit-batch";

export default function StockManagement() {
  const [search, setSearch] = useState("");
  const { toast } = useToast();
  const [products, setProduct] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [types, setTypes] = useState([]);
  const [isLoadingTypes, setIsLoadingTypes] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [categoriesData, setCategoriesData] = useState([]);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);

  const [filters, setFilters] = useState({
    search: "",
    category: "all",
    types: "all",
    priceRange: [0, 10000],
    sortBy: "",
    stockLevel: "all", // 'all', 'no-stock', 'low-stock', 'full-stock'
    batch: "all", // new: batch filter
  });
  const [batchProductId, setBatchProductId] = useState("");

  useEffect(() => {
    fetchCategoriesData();
    fetchCategories();
    fetchTypes();
  }, []);
  const fetchTypes = async () => {
    try {
      setIsLoadingTypes(true);
      const response = await axios.get("http://localhost:3000/api/types/get");

      if (
        response.data &&
        response.data.success &&
        Array.isArray(response.data.data)
      ) {
        setTypes(response.data.data);
      } else if (Array.isArray(response.data)) {
        setTypes(response.data);
      } else {
        setTypes([]);
      }
    } catch (error) {
      console.error("Failed to fetch types:", error);
      setTypes([]);
      toast({
        title: "Error",
        description: "Failed to load types. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingTypes(false);
    }
  };
  const fetchCategories = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get("http://localhost:3000/api/batch/get");

      const payload = response.data;
      console.log("Fetched Batches:", payload);

      // Normalize batches array from various shapes
      const batches = Array.isArray(payload?.data)
        ? payload.data
        : Array.isArray(payload)
        ? payload
        : [];

      // Flatten into products with `batch` attached
      const list = batches.flatMap((b) => {
        const prods = Array.isArray(b?.products) ? b.products : [];
        return prods.map((p) => ({ ...p, batch: b.batch }));
      });

      setProduct(list);
    } catch (error) {
      console.error("Error fetching Products:", error);
      setProduct([]);
      toast({
        title: "Error",
        description: "Failed to load Products",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCategoriesData = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(
        "http://localhost:3000/api/categories/get"
      );
      const categoryData = response.data;
      console.log(categoriesData);
      if (Array.isArray(categoryData)) {
        setCategoriesData(categoryData);
      } else if (categoryData && Array.isArray(categoryData.data)) {
        setCategoriesData(categoryData.data);
      } else {
        console.warn("Unexpected response structure:", categoryData);
        setCategoriesData([]);
      }
    } catch (error) {
      console.error("Error fetching Categories:", error);
      setCategoriesData([]);
      toast({
        title: "Error",
        description: "Failed to load Categories",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const maxPrice = Math.max(
    ...products.map((product) => product.rprice || 0),
    10000
  );
  const categories = categoriesData?.map((c) => c.name) || ["Other"];
  const type = types?.map((c) => c.name) || ["Other"];

  // Unique batch list from products
  const batches = Array.from(
    new Set((products || []).map((p) => p.batch).filter(Boolean))
  );

  // Products for selected batch
  const productsForBatch =
    (filters.batch === "all"
      ? []
      : (products || []).filter((p) => p.batch === filters.batch)) || [];

  const filteredProducts = products?.filter((product) => {
    const matchesSearch = product.name
      .toLowerCase()
      .includes(filters.search.toLowerCase());
    const matchesCategory =
      filters.category === "all" || product.category === filters.category;
    const matchesTypes =
      filters.types === "all" || product.type === filters.types;
    const matchesPrice =
      product.rprice >= filters.priceRange[0] &&
      product.rprice <= filters.priceRange[1];

    // Stock level filtering
    const stockLevel = product.quantity || 0;
    const matchesStockLevel =
      filters.stockLevel === "all" ||
      (filters.stockLevel === "no-stock" && stockLevel < 1) ||
      (filters.stockLevel === "low-stock" &&
        stockLevel >= 1 &&
        stockLevel <= 10) ||
      (filters.stockLevel === "full-stock" && stockLevel > 10);

    // Batch filter
    const matchesBatch =
      filters.batch === "all" || product.batch === filters.batch;

    // Batch product filter (optional)
    const matchesBatchProduct =
      !batchProductId || product._id === batchProductId;

    return (
      matchesSearch &&
      matchesCategory &&
      matchesTypes &&
      matchesPrice &&
      matchesStockLevel &&
      matchesBatch &&
      matchesBatchProduct
    );
  });

  const stock = filteredProducts?.reduce((acc, product) => {
    return acc + (product.stock || 0);
  }, 0);

  // Sort products after filtering
  const sortedProducts = [...(filteredProducts || [])].sort((a, b) => {
    switch (filters.sortBy) {
      case "default":
        return 0;
      case "price-low":
        return a.rprice - b.rprice;
      case "price-high":
        return b.rprice - a.rprice;
      case "name":
        return a.name.localeCompare(b.name);
      case "rating":
        return (b.rating || 0) - (a.rating || 0);
      default:
        return 0;
    }
  });

  const clearFilters = () => {
    setFilters({
      search: "",
      category: "all",
      types: "all",
      priceRange: [0, maxPrice],
      sortBy: "",
      stockLevel: "all",
      batch: "all",
    });
    setBatchProductId("");
  };
  const details = (product) => {
    if (!product) return;
    const { _id, batch } = product;
    setSelectedProduct(_id);
    setSelectedBatch(batch || null);
    setIsViewDialogOpen(true);
  };

  const updateStockMutation = useMutation({
    mutationFn: async ({ productId, quantity }) => {
      await apiRequest("PATCH", `/api/products/${productId}`, { quantity });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({
        title: "Stock updated",
        description: "Product stock has been successfully updated.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getStockStatus = (quantity) => {
    if (quantity === 0) return "Out of Stock";
    if (quantity <= 10) return "Low Stock";
    return "In Stock";
  };

  const getStockColor = (quantity) => {
    if (quantity === 0) return "status-chip status-inactive";
    if (quantity <= 10) return "status-chip status-low-stock";
    return "status-chip status-active";
  };

  const lowStockProducts =
    filteredProducts?.filter((product) => product.quantity <= 10) || [];
  const outOfStockProducts =
    filteredProducts?.filter((product) => product.quantity === 0) || [];

  const handleEditProduct = (product) => {
    if (!product) return;
    const { _id, batch } = product;
    setSelectedProduct(_id);
    setSelectedBatch(batch || null);
    setIsEditDialogOpen(true);
  };

  // Save data to local storage helper
  const saveToLocalStorage = (key, data) => {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (err) {
      console.error("Failed to save data to localStorage", err);
    }
  };

  // PDF Export function using jsPDF and autotable excluding "Actions" column
  const exportPDF = () => {
    if (!filteredProducts || filteredProducts.length === 0) {
      toast({
        title: "No data",
        description: "No products to export",
        variant: "destructive",
      });
      return;
    }

    saveToLocalStorage("exportedInventoryData", filteredProducts);
    const doc = new jsPDF();

    const columns = [
      { header: "Batch", dataKey: "batch" },
      { header: "Product", dataKey: "name" },
      { header: "Description", dataKey: "description" },
      { header: "Category", dataKey: "category" },
      { header: "Type", dataKey: "type" },
      { header: "Current Stock", dataKey: "quantity" },
      { header: "Retail Price", dataKey: "rprice" },
      { header: "Whole Price", dataKey: "wprice" },
      { header: "Status", dataKey: "status" },
    ];

    const rows = filteredProducts.map((product) => ({
      batch: product.batch,
      name: product.name,
      description: product.description,
      category: product.category,
      type: product.type,
      quantity: product.quantity + " units",
      rprice: `${product.rprice}`,
      wprice: `${product.wprice}`,
      status: getStockStatus(product.quantity),
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
        6: { halign: "left" },
      },
    });

    doc.text("Inventory Overview", 14, 15);
    doc.save("inventory-overview.pdf");
  };

  // Excel Export function using SheetJS and file-saver
  const exportExcel = () => {
    if (!filteredProducts || filteredProducts.length === 0) {
      toast({
        title: "No data",
        description: "No products to export",
        variant: "destructive",
      });
      return;
    }

    saveToLocalStorage("exportedInventoryData", filteredProducts);

    const wsData = filteredProducts.map((product) => ({
      Batch: product.batch,
      Product: product.name,
      Description: product.description,
      Category: product.category,
      Type: product.type,
      "Current Stock": product.quantity,
      "Retail Price": product.rprice,
      "Whole Price": product.wprice,
      Status: getStockStatus(product.quantity),
    }));

    const worksheet = XLSX.utils.json_to_sheet(wsData);
    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, "Inventory");

    XLSX.writeFile(workbook, "inventory-overview.xlsx");
  };

  return (
    <div className="flex min-h-screen bg-grey-50">
      <Sidebar />
      <div className="ml-64 flex-1">
        <Header
          title="Stock Management"
          subtitle="Monitor and manage inventory levels"
        />

        <main className="p-6">
          {/* Stock Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="material-elevation-2">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-grey-600">
                      Total Products
                    </p>
                    <p className="text-2xl font-bold text-grey-900">
                      {isLoading ? "..." : filteredProducts?.length || 0}
                    </p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-full">
                    <span className="material-icons text-blue-600">
                      inventory
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="material-elevation-2">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-grey-600">
                      In Stock
                    </p>
                    <p className="text-2xl font-bold text-green-600">
                      {isLoading
                        ? "..."
                        : filteredProducts?.filter((p) => p.quantity > 10)
                            .length || 0}
                    </p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-full">
                    <span className="material-icons text-green-600">
                      check_circle
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="material-elevation-2">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-grey-600">
                      Low Stock
                    </p>
                    <p className="text-2xl font-bold text-orange-600">
                      {isLoading ? "..." : lowStockProducts.length || 0}
                    </p>
                  </div>
                  <div className="p-3 bg-orange-100 rounded-full">
                    <span className="material-icons text-orange-600">
                      warning
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="material-elevation-2">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-grey-600">
                      Out of Stock
                    </p>
                    <p className="text-2xl font-bold text-red-600">
                      {isLoading ? "..." : outOfStockProducts.length || 0}
                    </p>
                  </div>
                  <div className="p-3 bg-red-100 rounded-full">
                    <span className="material-icons text-red-600">cancel</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Stock Table */}
          <Card className="material-elevation-2">
            <CardHeader>
              <CardTitle>Inventory Overview</CardTitle>

              {/* Filters and Actions */}
              <div className="mt-4 w-full flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="relative w-full sm:w-72">
                    <span className="material-icons absolute left-3 top-1/2 transform -translate-y-1/2 text-grey-400">
                      search
                    </span>
                    <Input
                      placeholder="Search products..."
                      value={filters.search}
                      onChange={(e) =>
                        setFilters({ ...filters, search: e.target.value })
                      }
                      className="pl-10 pr-4"
                    />
                  </div>
                  <Select
                    value={filters.category}
                    onValueChange={(value) =>
                      setFilters({ ...filters, category: value })
                    }
                  >
                    <SelectTrigger className="w-56">
                      <SelectValue placeholder="Select Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories.map((catName) => (
                        <SelectItem key={catName} value={catName}>
                          {catName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={filters.types}
                    onValueChange={(value) =>
                      setFilters({ ...filters, types: value })
                    }
                  >
                    <SelectTrigger className="w-56">
                      <SelectValue placeholder="Select Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      {type.map((typName) => (
                        <SelectItem key={typName} value={typName}>
                          {typName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={filters.sortBy}
                    onValueChange={(value) =>
                      setFilters({ ...filters, sortBy: value })
                    }
                  >
                    <SelectTrigger className="w-44">
                      <SelectValue placeholder="Sort By" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">Default</SelectItem>
                      <SelectItem value="price-low">
                        Price: Low to High
                      </SelectItem>
                      <SelectItem value="price-high">
                        Price: High to Low
                      </SelectItem>
                      <SelectItem value="name">Name</SelectItem>
                      <SelectItem value="rating">Rating</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select
                    value={filters.batch}
                    onValueChange={(value) =>
                      setFilters({ ...filters, batch: value })
                    }
                  >
                    <SelectTrigger className="w-56">
                      <SelectValue placeholder="Choose a batch" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Select a Batch</SelectItem>
                      {batches.map((batchValue) => (
                        <SelectItem key={batchValue} value={batchValue}>
                          {batchValue}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={filters.stockLevel}
                    onValueChange={(value) =>
                      setFilters({ ...filters, stockLevel: value })
                    }
                  >
                    <SelectTrigger className="w-44">
                      <SelectValue placeholder="Stock Level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Stock Levels</SelectItem>
                      <SelectItem value="no-stock">Out of Stock</SelectItem>
                      <SelectItem value="low-stock">Low Stock (≤10)</SelectItem>
                      <SelectItem value="full-stock">
                        Full Stock (&gt;10)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="flex justify-start w-full gap-4 mr-6 mt-4">
                    <Button
                      variant="outline"
                      onClick={() => clearFilters()}
                      className="flex items-center gap-1"
                    >
                      Clear Filters
                    </Button>
                    <div className="relative">
                      <Button
                        className="bg-primary-500 hover:bg-primary-600"
                        onClick={() => setExportModalOpen(true)}
                      >
                        <span className="material-icons mr-2">
                          file_download
                        </span>
                        Export
                      </Button>

                      {exportModalOpen && (
                        <div className="export-modal bg-white shadow-md p-4 rounded absolute right-0 top-full mt-2 z-10 w-48">
                          <p className="mb-2 font-semibold">
                            Select Export Format
                          </p>
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
                    <div className="flex justify-end w-full">
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        className="text-right"
                      >
                        Showing {filteredProducts?.length} of {products?.length}{" "}
                        products
                      </Typography>
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <div key={i} className="flex items-center space-x-4">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-6 w-16" />
                      <Skeleton className="h-8 w-12" />
                    </div>
                  ))}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Batch</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Current Stock</TableHead>
                      <TableHead>Retail Price</TableHead>
                      {/* <TableHead>Wholesale Price</TableHead> */}
                      <TableHead>Expiry Date </TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-center">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedProducts?.map((product) => (
                      <TableRow key={product._id} className="hover:bg-grey-50">
                        <TableCell>{product.batch}</TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium text-grey-900">
                              {product.name}
                            </div>
                            <div className="text-sm text-grey-600 truncate w-40">
                              {product.description}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{product.category}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{product.type}</Badge>
                        </TableCell>
                        <TableCell className="font-medium">
                          {product.quantity} units
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {"₹"}
                          {product.rprice}
                        </TableCell>
                        {/* <TableCell className="font-mono text-sm">
                          {"₹"}
                          {product.wprice}
                        </TableCell> */}
                        <TableCell className="font-mono text-sm ">
                          {product.expiryDate}
                        </TableCell>
                        <TableCell>
                          <Badge className={getStockColor(product.quantity)}>
                            {getStockStatus(product.quantity)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditProduct(product)}
                            >
                              Update stock
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => details(product)}
                            >
                              View Details
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {(!filteredProducts || filteredProducts.length === 0) && (
                      <TableRow>
                        <TableCell
                          colSpan={8}
                          className="text-center text-grey-500 py-8"
                        >
                          {filters.search
                            ? "No products match your search criteria"
                            : "No products found"}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </main>
      </div>

      <ViewProductDialog
        open={isViewDialogOpen}
        onOpenChange={setIsViewDialogOpen}
        productId={selectedProduct}
        batch={selectedBatch}
      />
      <EditBatchDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        productId={selectedProduct}
        batch={selectedBatch}
      />
    </div>
  );
}
