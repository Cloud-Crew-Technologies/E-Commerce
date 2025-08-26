import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
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

export default function StockManagement() {
  const [search, setSearch] = useState("");
  const { toast } = useToast();
  const [products, setProduct] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // const { data: products, isLoading } = useQuery({
  //   queryKey: ["/api/products/get", { search }],
  // });

  useEffect(() => {
    fetchCategories();
  }, [100]);

  const fetchCategories = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(
        "http://localhost:3000/api/products/get"
      );

      // Ensure we set an array - handle different response structures
      const categoryData = response.data;
      console.log("Fetched Products:", categoryData);
      if (Array.isArray(categoryData)) {
        setProduct(categoryData);
        console.log("Products set successfully:", products);
      } else if (categoryData && Array.isArray(categoryData.data)) {
        setProduct(categoryData.data);
        console.log("Products set successfully:", products);
      } else {
        console.warn("Unexpected response structure:", categoryData);
        setProduct([]);
        console.log(products, "Products set to empty due to unexpected structure");
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

  const filteredProducts = products?.filter(
    (product) =>
      product.name.toLowerCase().includes(search.toLowerCase()) ||
      product.category.toLowerCase().includes(search.toLowerCase()) ||
      product.sku.toLowerCase().includes(search.toLowerCase())
  );

  const lowStockProducts =
    filteredProducts?.filter((product) => product.quantity <= 10) || [];
  const outOfStockProducts =
    filteredProducts?.filter((product) => product.quantity === 0) || [];

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

              {/* Search */}
              <div className="flex items-center gap-4 mt-4">
                <div className="flex-1 relative">
                  <span className="material-icons absolute left-3 top-1/2 transform -translate-y-1/2 text-grey-400">
                    search
                  </span>
                  <Input
                    placeholder="Search products by name, category, or SKU..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button className="bg-primary-500 hover:bg-primary-600">
                  <span className="material-icons mr-2">file_download</span>
                  Export
                </Button>
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
                      <TableHead>SKU</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Current Stock</TableHead>
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
                            <div className="text-sm text-grey-600">
                              {product.description}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {product.sku}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{product.category}</Badge>
                        </TableCell>
                        <TableCell className="font-medium">
                          {product.quantity} units
                        </TableCell>
                        <TableCell>
                          <Badge className={getStockColor(product.quantity)}>
                            {getStockStatus(product.quantity)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button variant="outline" size="sm">
                              Restock
                            </Button>
                            <Button variant="outline" size="sm">
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
    </div>
  );
}
