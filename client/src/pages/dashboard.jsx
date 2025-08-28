import { useQuery } from "@tanstack/react-query";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import StatCard from "@/components/dashboard/stat-card";
import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useLocation } from "wouter";
import axios from "axios";

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const [recentOrders, setProduct] = useState([]);
  const [ordersLoading, setIsLoading] = useState(false);
  const [value, setValue] = useState(0);

  useEffect(() => {
    fetchCategories();
  }, [100]);

  const fetchCategories = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get("http://localhost:3000/api/orders/get");

      // Ensure we set an array - handle different response structures
      const categoryData = response.data;
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
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/dashboard/stats"],
  });

  // const { data: recentOrders, isLoading: ordersLoading } = useQuery({
  //   queryKey: ["/api/orders", "recent"],
  // });

  const { data: lowStockItems, isLoading: stockLoading } = useQuery({
    queryKey: ["/api/products", "low-stock"],
  });
const totalSum = recentOrders.reduce((acc, curr) => acc + curr.total, 0);
  const getStatusBadge = (status) => {
    switch (status) {
      case "delivered":
        return (
          <Badge className="status-chip status-delivered">Delivered</Badge>
        );
      case "pending":
        return <Badge className="status-chip status-pending">Processing</Badge>;
      case "shipped":
        return <Badge className="status-chip status-active">Shipped</Badge>;
      default:
        return <Badge className="status-chip status-pending">{status}</Badge>;
    }
  };

  const handleViewAllOrdersClick = () => {
    setLocation("/orders");
  };

  const handleAddProductClick = () => {
    setLocation("/products");
  };

  const handleCreateCouponClick = () => {
    setLocation("/coupons");
  };

  const handleViewReportsClick = () => {
    setLocation("/orders");
  };

  const handleRestockClick = () => {
    setLocation("/stock");
  };

  const handleFabClick = () => {
    setLocation("/products");
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
                  value={`₹${totalSum || "0"}`}
                  icon="attach_money"
                  color="green"
                  trend="+12% from last month"
                />
                <StatCard
                  title="Total Orders"
                  value={recentOrders.length || "0"}
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
                  value={stats?.lowStockCount?.toString() || "0"}
                  icon="inventory"
                  color="red"
                  trend="Needs attention"
                  isWarning
                />
              </>
            )}
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Orders */}
            <div className="lg:col-span-2">
              <Card className="material-elevation-2">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Recent Orders</CardTitle>
                  </div>
                  <Button
                    onClick={handleViewAllOrdersClick}
                    variant="ghost"
                    className="text-primary-500 hover:text-primary-600"
                  >
                    View All
                  </Button>
                </CardHeader>
                <CardContent>
                  {ordersLoading ? (
                    <div className="space-y-4">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="flex items-center space-x-4">
                          <Skeleton className="h-4 w-20" />
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-4 w-16" />
                          <Skeleton className="h-4 w-20" />
                          <Skeleton className="h-4 w-24" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Order ID</TableHead>
                          <TableHead>Customer</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {recentOrders?.map((order) => (
                          <TableRow key={order.id} className="hover:bg-grey-50">
                            <TableCell className="font-medium text-primary-500">
                              #{order._id}
                            </TableCell>
                            <TableCell>{order.customerName}</TableCell>
                            <TableCell>₹{order.total}</TableCell>
                            <TableCell>
                              {getStatusBadge(order.status)}
                            </TableCell>
                            <TableCell className="text-grey-600">
                              {new Date(order.createdAt).toLocaleDateString()}
                            </TableCell>
                          </TableRow>
                        ))}
                        {(!recentOrders || recentOrders.length === 0) && (
                          <TableRow>
                            <TableCell
                              colSpan={5}
                              className="text-center text-grey-500 py-8"
                            >
                              No recent orders found
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions & Low Stock Alert */}
            <div className="space-y-6">
              {/* Quick Actions */}
              <Card className="material-elevation-2">
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    onClick={handleAddProductClick}
                    variant="outline"
                    className="w-full justify-between bg-primary-50 hover:bg-primary-100 text-primary-700 border-primary-200"
                  >
                    <div className="flex items-center">
                      <span className="material-icons mr-3">add</span>
                      <span className="font-medium">Add Product</span>
                    </div>
                    <span className="material-icons">chevron_right</span>
                  </Button>

                  <Button
                    onClick={handleCreateCouponClick}
                    variant="outline"
                    className="w-full justify-between bg-success-light hover:bg-green-100 text-green-700 border-green-200"
                  >
                    <div className="flex items-center">
                      <span className="material-icons mr-3">local_offer</span>
                      <span className="font-medium">Create Coupon</span>
                    </div>
                    <span className="material-icons">chevron_right</span>
                  </Button>

                  <Button
                    onClick={handleViewReportsClick}
                    variant="outline"
                    className="w-full justify-between bg-warning-light hover:bg-orange-100 text-orange-700 border-orange-200"
                  >
                    <div className="flex items-center">
                      <span className="material-icons mr-3">assessment</span>
                      <span className="font-medium">View Reports</span>
                    </div>
                    <span className="material-icons">chevron_right</span>
                  </Button>
                </CardContent>
              </Card>

              {/* Low Stock Alert */}
              <Card className="material-elevation-2">
                <CardHeader>
                  <CardTitle className="flex items-center text-red-600">
                    <span className="material-icons mr-2">warning</span>
                    Low Stock Alert
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {stockLoading ? (
                    <div className="space-y-3">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="p-3 bg-error-light rounded-lg">
                          <Skeleton className="h-4 w-32 mb-1" />
                          <Skeleton className="h-3 w-24" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {lowStockItems?.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between p-3 bg-error-light rounded-lg"
                        >
                          <div>
                            <p className="font-medium text-grey-900">
                              {item.name}
                            </p>
                            <p className="text-sm text-red-600">
                              Only {item.quantity} left
                            </p>
                          </div>
                          <Button
                            onClick={handleRestockClick}
                            variant="ghost"
                            className="text-primary-500 text-sm hover:text-primary-600"
                          >
                            Restock
                          </Button>
                        </div>
                      ))}
                      {(!lowStockItems || lowStockItems.length === 0) && (
                        <p className="text-center text-grey-500 py-4">
                          All items are well stocked!
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>

      {/* Floating Action Button */}
      <Button
        onClick={handleFabClick}
        className="fixed bottom-6 right-6 w-14 h-14 bg-secondary-500 hover:bg-secondary-600 rounded-full shadow-lg hover:shadow-xl z-40"
        size="icon"
      >
        <span className="material-icons">add</span>
      </Button>
    </div>
  );
}
