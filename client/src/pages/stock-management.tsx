import { useQuery } from "@tanstack/react-query";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import type { Product } from "@shared/schema";

export default function StockManagement() {
  const { data: products, isLoading } = useQuery<Product[]>({
    queryKey: ["/api/products", "stock"],
  });

  const { data: lowStockItems } = useQuery<Product[]>({
    queryKey: ["/api/products", "low-stock"],
  });

  const getStockStatus = (quantity: number) => {
    if (quantity === 0) {
      return <Badge className="status-chip bg-red-100 text-red-800">Out of Stock</Badge>;
    } else if (quantity <= 10) {
      return <Badge className="status-chip status-low-stock">Low Stock</Badge>;
    } else if (quantity <= 50) {
      return <Badge className="status-chip status-pending">Medium Stock</Badge>;
    } else {
      return <Badge className="status-chip status-active">Well Stocked</Badge>;
    }
  };

  const getStockColor = (quantity: number) => {
    if (quantity === 0) return "text-red-600";
    if (quantity <= 10) return "text-red-500";
    if (quantity <= 50) return "text-orange-500";
    return "text-green-600";
  };

  return (
    <div className="flex min-h-screen bg-grey-50">
      <Sidebar />
      
      <div className="ml-64 flex-1">
        <Header title="Stock Management" subtitle="Monitor and manage inventory levels" />
        
        <main className="p-6">
          {/* Stock Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="material-elevation-2">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-grey-600">Total Products</p>
                    <p className="text-2xl font-bold text-grey-900">
                      {isLoading ? "..." : products?.length || 0}
                    </p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-full">
                    <span className="material-icons text-blue-600">inventory</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="material-elevation-2">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-grey-600">Low Stock Items</p>
                    <p className="text-2xl font-bold text-red-600">
                      {isLoading ? "..." : lowStockItems?.length || 0}
                    </p>
                  </div>
                  <div className="p-3 bg-red-100 rounded-full">
                    <span className="material-icons text-red-600">warning</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="material-elevation-2">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-grey-600">Total Stock Value</p>
                    <p className="text-2xl font-bold text-green-600">
                      ${isLoading ? "..." : products?.reduce((sum, p) => sum + (parseFloat(p.price) * p.quantity), 0).toLocaleString() || "0"}
                    </p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-full">
                    <span className="material-icons text-green-600">attach_money</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="material-elevation-2">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-grey-600">Out of Stock</p>
                    <p className="text-2xl font-bold text-red-600">
                      {isLoading ? "..." : products?.filter(p => p.quantity === 0).length || 0}
                    </p>
                  </div>
                  <div className="p-3 bg-red-100 rounded-full">
                    <span className="material-icons text-red-600">error</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Stock Table */}
          <Card className="material-elevation-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Inventory Overview</CardTitle>
              <Button className="bg-primary-500 hover:bg-primary-600">
                <span className="material-icons mr-2">file_download</span>
                Export Report
              </Button>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <div key={i} className="flex items-center space-x-4">
                      <Skeleton className="h-12 w-12 rounded" />
                      <div className="flex-1">
                        <Skeleton className="h-4 w-48 mb-2" />
                        <Skeleton className="h-3 w-32" />
                      </div>
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-6 w-24" />
                      <Skeleton className="h-8 w-20" />
                    </div>
                  ))}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16"></TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products?.map((product) => (
                      <TableRow key={product.id} className="hover:bg-grey-50">
                        <TableCell>
                          {product.imageUrl ? (
                            <img
                              src={product.imageUrl}
                              alt={product.name}
                              className="w-12 h-12 object-cover rounded"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-grey-200 rounded flex items-center justify-center">
                              <span className="material-icons text-grey-400">image</span>
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium text-grey-900">{product.name}</div>
                            <div className="text-sm text-grey-500 truncate max-w-xs">
                              {product.description}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-sm">{product.sku}</TableCell>
                        <TableCell>{product.category}</TableCell>
                        <TableCell>${product.price}</TableCell>
                        <TableCell className={`font-semibold ${getStockColor(product.quantity)}`}>
                          {product.quantity}
                        </TableCell>
                        <TableCell>{getStockStatus(product.quantity)}</TableCell>
                        <TableCell>
                          <Button variant="outline" size="sm" className="mr-2">
                            Update Stock
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {(!products || products.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center text-grey-500 py-8">
                          No products found
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
