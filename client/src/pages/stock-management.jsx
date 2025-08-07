import { useQuery } from "@tanstack/react-query";
import Sidebar from "@/components/layout/sidebar.jsx";
import Header from "@/components/layout/header.jsx";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, TrendingDown, Package } from "lucide-react";

export default function StockManagement() {
  const { data: lowStockProducts, isLoading } = useQuery({
    queryKey: ["/api/products", "low-stock"],
  });

  const { data: allProducts, isLoading: allLoading } = useQuery({
    queryKey: ["/api/products"],
  });

  const totalProducts = allProducts?.length || 0;
  const lowStockCount = lowStockProducts?.length || 0;
  const outOfStockCount = allProducts?.filter(p => p.quantity === 0).length || 0;

  return (
    <div className="flex min-h-screen bg-grey-50">
      <Sidebar />
      
      <div className="ml-64 flex-1">
        <Header title="Stock Management" subtitle="Monitor and manage inventory levels" />
        
        <main className="p-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="bg-white material-elevation-2">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-grey-600">Total Products</p>
                    <p className="text-2xl font-bold text-grey-900">{totalProducts}</p>
                    <p className="text-sm text-blue-600 flex items-center">
                      <Package className="h-4 w-4 mr-1" />
                      Active inventory
                    </p>
                  </div>
                  <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                    <Package className="h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white material-elevation-2">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-grey-600">Low Stock Items</p>
                    <p className="text-2xl font-bold text-grey-900">{lowStockCount}</p>
                    <p className="text-sm text-orange-600 flex items-center">
                      <TrendingDown className="h-4 w-4 mr-1" />
                      Need attention
                    </p>
                  </div>
                  <div className="p-3 rounded-full bg-orange-100 text-orange-600">
                    <TrendingDown className="h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white material-elevation-2">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-grey-600">Out of Stock</p>
                    <p className="text-2xl font-bold text-grey-900">{outOfStockCount}</p>
                    <p className="text-sm text-red-600 flex items-center">
                      <AlertTriangle className="h-4 w-4 mr-1" />
                      Urgent action needed
                    </p>
                  </div>
                  <div className="p-3 rounded-full bg-red-100 text-red-600">
                    <AlertTriangle className="h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Low Stock Alert */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-600">
                <AlertTriangle className="h-5 w-5" />
                Low Stock Alert
              </CardTitle>
              <CardDescription>
                Products with low inventory levels that need restocking
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center justify-between p-4 border rounded">
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-48" />
                        <Skeleton className="h-3 w-32" />
                      </div>
                      <div className="flex gap-2">
                        <Skeleton className="h-6 w-16" />
                        <Skeleton className="h-8 w-20" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : lowStockProducts && lowStockProducts.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead>Current Stock</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last Updated</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lowStockProducts.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{product.name}</div>
                            <div className="text-sm text-grey-500">{product.category}</div>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {product.sku}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-orange-600">{product.quantity}</span>
                            <span className="text-grey-500 text-sm">units</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            className={`status-chip ${
                              product.quantity === 0 ? 'status-inactive' : 'status-low-stock'
                            }`}
                          >
                            {product.quantity === 0 ? 'Out of Stock' : 'Low Stock'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-grey-500">
                          {product.createdAt ? new Date(product.createdAt).toLocaleDateString() : 'N/A'}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button size="sm" className="bg-primary-500 hover:bg-primary-600">
                              Restock
                            </Button>
                            <Button size="sm" variant="outline">
                              Edit
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 mx-auto text-grey-400 mb-4" />
                  <h3 className="text-lg font-medium text-grey-900 mb-2">All Stock Levels Good!</h3>
                  <p className="text-grey-600">No products currently running low on inventory.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}