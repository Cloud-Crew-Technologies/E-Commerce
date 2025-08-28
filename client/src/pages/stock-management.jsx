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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Box,
  Collapse,
  Grid,
  FormControl,
  InputLabel,
  MenuItem,
  Typography,
  Slider,
} from "@mui/material";
import ViewProductDialog from "@/components/products/product_details";
import EditProductDialog from "@/components/products/Product Edit";

export default function StockManagement() {
  const [search, setSearch] = useState("");
  const { toast } = useToast();
  const [products, setProduct] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [categoriesData, setCategoriesData] = useState([]);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [filters, setFilters] = useState({
    search: "",
    category: "all",
    priceRange: [0, 10000],
    sortBy: "",
    stockLevel: "all", // 'all', 'no-stock', 'low-stock', 'full-stock'
  });

  useEffect(() => {
    fetchCategoriesData();
    fetchCategories();
  }, []); // fixed dependency to empty array to run once on mount

  const fetchCategories = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(
        "http://localhost:3000/api/products/get"
      );

      const categoryData = response.data;
      console.log("Fetched Products:", categoryData);
      if (Array.isArray(categoryData)) {
        setProduct(categoryData);
      } else if (categoryData && Array.isArray(categoryData.data)) {
        setProduct(categoryData.data);
      } else {
        console.warn("Unexpected response structure:", categoryData);
        setProduct([]);
      }
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
    ...products.map((product) => product.price || 0),
    10000
  );
  const categories = categoriesData?.map((c) => c.name) || ["Other"];

  const filteredProducts = products?.filter((product) => {
    const matchesSearch = product.name
      .toLowerCase()
      .includes(filters.search.toLowerCase());
    const matchesCategory =
      filters.category === "all" || product.category === filters.category;
    const matchesPrice =
      product.price >= filters.priceRange[0] &&
      product.price <= filters.priceRange[1];

    // Stock level filtering
    const stockLevel = product.quantity || 0;
    const matchesStockLevel =
      filters.stockLevel === "all" ||
      (filters.stockLevel === "no-stock" && stockLevel < 1) ||
      (filters.stockLevel === "low-stock" &&
        stockLevel >= 1 &&
        stockLevel <= 10) ||
      (filters.stockLevel === "full-stock" && stockLevel > 10);

    return (
      matchesSearch && matchesCategory && matchesPrice && matchesStockLevel
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
        return a.price - b.price;
      case "price-high":
        return b.price - a.price;
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
      priceRange: [0, maxPrice],
      sortBy: "",
      stockLevel: "all",
    });
  };
  const details = (id) => {
    setSelectedProduct(id);
    setIsViewDialogOpen(true);
    console.log(id);
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

  const handleEditProduct = (id) => {
    setSelectedProduct(id);
    setIsEditDialogOpen(true);
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

    const doc = new jsPDF();

    // Define columns to export with dataKeys and alignment
    const columns = [
      { header: "Product", dataKey: "name" },
      { header: "Description", dataKey: "description" },
      { header: "Category", dataKey: "category" },
      { header: "Current Stock", dataKey: "quantity" },
      { header: "Price (INR)", dataKey: "price" },
      { header: "Status", dataKey: "status" },
    ];

    // Prepare row data with truncated description and INR symbol fix
    const rows = filteredProducts.map((product) => {
      return {
        name: product.name,
        description: product.description,
        category: product.category,
        quantity: product.quantity + " units",
        price: `${product.price}`, // proper INR symbol
        status: getStockStatus(product.quantity),
      };
    });

    autoTable(doc, {
      columns,
      body: rows,
      styles: { fontSize: 10 },
      headStyles: { fillColor: [22, 160, 133] },
      startY: 20,
      columnStyles: {
        0: { halign: "left", cellWidth: 30 }, // Product
        1: { halign: "left", cellWidth: 50 }, // Description
        2: { halign: "left" }, // Category
        3: { halign: "left", cellWidth: 20 }, // Current Stock
        4: { halign: "center" }, // Price
        5: { halign: "left" }, // Status
      },
    });

    doc.text("Inventory Overview", 14, 15);
    doc.save("inventory-overview.pdf");
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

              {/* Search and Export */}
              <div className="flex items-center gap-4 mt-4 w-full">
                <div className="flex flex-col  gap-4 mb-6 w-full">
                  <div className="flex-1 relative">
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
                  <div className="flex gap-2">
                    <Select
                      value={filters.category}
                      onValueChange={(value) =>
                        setFilters({ ...filters, category: value })
                      }
                    >
                      <SelectTrigger className="w-40">
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
                      value={filters.sortBy}
                      onValueChange={(value) =>
                        setFilters({ ...filters, sortBy: value })
                      }
                    >
                      <SelectTrigger className="w-40">
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
                      value={filters.stockLevel}
                      onValueChange={(value) =>
                        setFilters({ ...filters, stockLevel: value })
                      }
                    >
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Stock Level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Stock Levels</SelectItem>
                        <SelectItem value="no-stock">Out of Stock</SelectItem>
                        <SelectItem value="low-stock">
                          Low Stock (≤10)
                        </SelectItem>
                        <SelectItem value="full-stock">
                          Full Stock (&gt;10)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Typography variant="body2" color="text.secondary">
                    Showing {filteredProducts?.length} of {products?.length}{" "}
                    products
                  </Typography>
                </div>
                <div className="text-align-right">
                  <Button
                    variant="outline"
                    onClick={() => clearFilters()}
                    className="flex items-right gap-1"
                  >
                    Clear Filters
                  </Button>
                </div>
                <div className="text-align-right">
                  <Button
                    className="bg-primary-500 hover:bg-primary-600"
                    onClick={exportPDF}
                  >
                    <span className="material-icons mr-2">file_download</span>
                    Export as PDF
                  </Button>
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
                      <TableHead>Product</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Current Stock</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProducts?.map((product) => (
                      <TableRow key={product.id} className="hover:bg-grey-50">
                        <TableCell>
                          <div>
                            <div className="font-medium text-grey-900">
                              {product.name}
                            </div>
                            <div className="text-sm text-grey-600 truncate w-64">
                              {product.description}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{product.category}</Badge>
                        </TableCell>
                        <TableCell className="font-medium">
                          {product.quantity} units
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {"₹"}
                          {product.price}
                        </TableCell>
                        <TableCell>
                          <Badge className={getStockColor(product.quantity)}>
                            {getStockStatus(product.quantity)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditProduct(product._id)}
                            >
                              Restock
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => details(product._id)}
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
                          colSpan={6}
                          className="text-center text-grey-500 py-8"
                        >
                          {search
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
      />
      <EditProductDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        productId={selectedProduct}
      />
    </div>
  );
}
