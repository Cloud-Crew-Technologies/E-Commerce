import { useQuery } from "@tanstack/react-query";
import Sidebar from "@/components/layout/sidebar.jsx";
import Header from "@/components/layout/header.jsx";
import StatCard from "@/components/dashboard/stat-card.jsx";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/dashboard/stats"],
  });

  const { data: recentOrders, isLoading: ordersLoading } = useQuery({
    queryKey: ["/api/orders", "recent"],
  });

  const { data: lowStockItems, isLoading: stockLoading } = useQuery({
    queryKey: ["/api/products", "low-stock"],
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case "delivered":
        return <Badge className="status-chip status-delivered">Delivered</Badge>;
      case "pending":
        return <Badge className="status-chip status-pending">Processing</Badge>;
      case "shipped":
        return <Badge className="status-chip status-active">Shipped</Badge>;
      default:
        return <Badge className="status-chip status-pending">{status}</Badge>;
    }
  };

  return (
    <div className="flex min-h-screen bg-grey-50">
      <Sidebar />
      
      <div className="ml-64 flex-1">
        <Header title="Dashboard Overview" subtitle="Welcome back, Admin" />
        
        <main className="p-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {statsLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <Card key={i} className="p-6">
                  <Skeleton className="h-4 w-24 mb-2" />
                  <Skeleton className="h-8 w-20 mb-2" />
                  <Skeleton className="h-3 w-32" />
                </Card>
              ))
            ) : (
              <>
                <StatCard
                  title="Total Revenue"
                  value={`$${stats?.totalRevenue?.toLocaleString() || "0"}`}
                  icon="attach_money"
                  color="green"
                  trend="+12% from last month"
                />
                <StatCard
                  title="Total Orders"
                  value={stats?.totalOrders?.toLocaleString() || "0"}
                  icon="shopping_cart"
                  color="blue"
                  trend="+8% from last month"
                />
                <StatCard
                  title="Total Customers"
                  value={stats?.totalCustomers?.toLocaleString() || "0"}
                  icon="people"
                  color="purple"
                  trend="+15% from last month"
                />
                <StatCard
                  title="Low Stock Items"
                  value={stats?.lowStockCount?.toLocaleString() || "0"}
                  icon="warning"
                  color="orange"
                  trend="Need attention"
                />
              </>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Orders */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Recent Orders</CardTitle>
                  <CardDescription>Latest customer orders</CardDescription>
                </div>
                <Button variant="outline" size="sm">
                  View All
                </Button>
              </CardHeader>
              <CardContent>
                {ordersLoading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="flex justify-between items-center">
                        <div className="space-y-1">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-3 w-20" />
                        </div>
                        <Skeleton className="h-6 w-16" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Customer</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recentOrders?.map((order) => (
                        <TableRow key={order.id}>
                          <TableCell className="font-medium">
                            {order.customerName}
                          </TableCell>
                          <TableCell>${order.total}</TableCell>
                          <TableCell>{getStatusBadge(order.status)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            {/* Low Stock Items */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Low Stock Alert</CardTitle>
                  <CardDescription>Products running low on inventory</CardDescription>
                </div>
                <Button variant="outline" size="sm">
                  Manage Stock
                </Button>
              </CardHeader>
              <CardContent>
                {stockLoading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="flex justify-between items-center">
                        <div className="space-y-1">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-3 w-20" />
                        </div>
                        <Skeleton className="h-6 w-16" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>Stock</TableHead>
                        <TableHead>Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {lowStockItems?.map((product) => (
                        <TableRow key={product.id}>
                          <TableCell className="font-medium">
                            {product.name}
                          </TableCell>
                          <TableCell>
                            <Badge className="status-chip status-low-stock">
                              {product.quantity} left
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button size="sm" variant="outline">
                              Restock
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}