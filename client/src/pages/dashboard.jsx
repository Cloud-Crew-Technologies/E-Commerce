import { useQuery } from "@tanstack/react-query";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import StatCard from "@/components/dashboard/stat-card";
import { useState, useEffect, useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { Search, Filter } from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "../hooks/use-toast";
import axios from "axios";

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const [recentOrders, setProduct] = useState([]);
  const [ordersLoading, setIsLoading] = useState(false);
  const [value, setValue] = useState(0);
  const [lowstock, setLow] = useState([]);
  const [isLoadings, setIsLoadings] = useState(false);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [isloadingg, setIsLoadingg] = useState(false);
  const [customerGrowth, setCustomerGrowth] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [revenueGrowthPercentage, setRevenueGrowthPercentage] = useState(0);
  const [totalOrders, setTotalOrders] = useState(0);
  const [ordersGrowthPercentage, setOrdersGrowthPercentage] = useState(0);
  const [customers, setCustomers] = useState(0);
  const [customerGrowthPercentage, setCustomerGrowthPercentage] = useState(0);

  // Filter states for the table
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("date");

  useEffect(() => {
    fetchCategories();
    fetchCategoriesDatas();
    fetchCustomers();
  }, [100]);

  const fetchCustomers = async () => {
    try {
      setIsLoadingg(true);
      const response = await axios.get(
        "https://ecommerceapi.skillhiveinnovations.com/api/customers/get"
      );
      const data = Array.isArray(response.data)
        ? response.data
        : response.data?.data || [];

      // Calculate current month and last month date ranges
      const now = new Date();
      const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

      // Filter customers for current month and last month
      const currentMonthCustomers = data.filter((customer) => {
        const customerDate = new Date(
          customer.createdAt || customer.registeredAt || customer.dateCreated
        );
        return customerDate >= currentMonthStart;
      });

      const lastMonthCustomers = data.filter((customer) => {
        const customerDate = new Date(
          customer.createdAt || customer.registeredAt || customer.dateCreated
        );
        return customerDate >= lastMonthStart && customerDate <= lastMonthEnd;
      });

      // Calculate growth percentage
      const currentMonthCount = currentMonthCustomers.length;
      const lastMonthCount = lastMonthCustomers.length;

      let growthPercentage = 0;
      if (lastMonthCount > 0) {
        growthPercentage =
          ((currentMonthCount - lastMonthCount) / lastMonthCount) * 100;
      } else if (currentMonthCount > 0) {
        growthPercentage = 100;
      }

      setCustomers(data.length);
      setCustomerGrowthPercentage(Math.round(growthPercentage));

      console.log(`Total customers: ${data.length}`);
      console.log(`Growth: ${growthPercentage.toFixed(1)}%`);
    } catch (error) {
      console.log(error);
      toast({
        title: "Error",
        description: error.message || "Failed to load customers",
        variant: "destructive",
      });
    } finally {
      setIsLoadingg(false);
    }
  };

  const fetchCategoriesDatas = async () => {
    try {
      setIsLoadings(true);
      const response = await axios.get(
        "https://ecommerceapi.skillhiveinnovations.com/api/products/get"
      );

      // Ensure we set an array - handle different response structures
      const categoryData = response.data;
      let allProducts = [];

      if (Array.isArray(categoryData)) {
        allProducts = categoryData;
      } else if (categoryData && Array.isArray(categoryData.data)) {
        allProducts = categoryData.data;
      } else {
        console.warn("Unexpected response structure:", categoryData);
        setLow([]);
        return;
      }

      // Filter products with quantity <= 10
      const lowStockProducts = allProducts.filter(
        (product) => product.quantity <= 10
      );
      console.log(lowStockProducts.length);
      setLow(lowStockProducts);

      // Set the count of low stock items
      setLowStockCount(lowStockProducts.length);
    } catch (error) {
      console.error("Error fetching Products:", error);
      setLow([]);
      toast({
        title: "Error",
        description: "Failed to load Products",
        variant: "destructive",
      });
    } finally {
      setIsLoadings(false);
    }
  };

  const fetchCategories = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(
        "https://ecommerceapi.skillhiveinnovations.com/api/orders/get"
      );

      // Ensure we set an array - handle different response structures
      const categoryData = response.data;
      let allOrders = [];

      if (Array.isArray(categoryData)) {
        allOrders = categoryData;
      } else if (categoryData && Array.isArray(categoryData.data)) {
        allOrders = categoryData.data;
      } else {
        console.warn("Unexpected response structure:", categoryData);
        setProduct([]);
        return;
      }

      setProduct(allOrders);

      // Calculate current month and last month date ranges
      const now = new Date();
      const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

      // Filter orders for current month and last month
      const currentMonthOrders = allOrders.filter((order) => {
        const orderDate = new Date(
          order.createdAt || order.orderDate || order.dateCreated
        );
        return orderDate >= currentMonthStart;
      });

      const lastMonthOrders = allOrders.filter((order) => {
        const orderDate = new Date(
          order.createdAt || order.orderDate || order.dateCreated
        );
        return orderDate >= lastMonthStart && orderDate <= lastMonthEnd;
      });

      // Calculate total revenue for both months
      const currentMonthRevenue = currentMonthOrders.reduce(
        (acc, curr) => acc + (curr.total || 0),
        0
      );
      const lastMonthRevenue = lastMonthOrders.reduce(
        (acc, curr) => acc + (curr.total || 0),
        0
      );

      // Calculate total orders count for both months
      const currentMonthOrdersCount = currentMonthOrders.length;
      const lastMonthOrdersCount = lastMonthOrders.length;

      // Calculate overall totals
      const totalRevenue = allOrders.reduce(
        (acc, curr) => acc + (curr.total || 0),
        0
      );
      const totalOrdersCount = allOrders.length;

      // Calculate revenue growth percentage
      let revenueGrowthPercentage = 0;
      if (lastMonthRevenue > 0) {
        revenueGrowthPercentage =
          ((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100;
      } else if (currentMonthRevenue > 0) {
        revenueGrowthPercentage = 100;
      }

      // Calculate orders growth percentage
      let ordersGrowthPercentage = 0;
      if (lastMonthOrdersCount > 0) {
        ordersGrowthPercentage =
          ((currentMonthOrdersCount - lastMonthOrdersCount) /
            lastMonthOrdersCount) *
          100;
      } else if (currentMonthOrdersCount > 0) {
        ordersGrowthPercentage = 100;
      }

      // Set the data with just percentages
      setTotalRevenue(totalRevenue);
      setRevenueGrowthPercentage(Math.round(revenueGrowthPercentage));

      setTotalOrders(totalOrdersCount);
      setOrdersGrowthPercentage(Math.round(ordersGrowthPercentage));

      console.log(`Total Revenue: ${totalRevenue}`);
      console.log(`Revenue Growth: ${revenueGrowthPercentage.toFixed(1)}%`);
      console.log(`Total Orders: ${totalOrdersCount}`);
      console.log(`Orders Growth: ${ordersGrowthPercentage.toFixed(1)}%`);
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

  // Filter and sort logic for recent orders - limit to 10 most recent orders
  const filteredAndSortedOrders = useMemo(() => {
    let filtered = recentOrders || [];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (order) =>
          order.orderID?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.customerName?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((order) => order.status === statusFilter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "date":
          return new Date(b.createdAt) - new Date(a.createdAt);
        case "amount-high":
          return b.total - a.total;
        case "amount-low":
          return a.total - b.total;
        case "customer":
          return (a.customerName || "").localeCompare(b.customerName || "");
        default:
          return new Date(b.createdAt) - new Date(a.createdAt);
      }
    });

    // Limit to 10 recent orders
    return filtered.slice(0, 10);
  }, [recentOrders, searchTerm, statusFilter, sortBy]);

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/dashboard/stats"],
  });

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
    <div className=" bg-grey-50">
        <Sidebar />

      <div className="ml-14">
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
                  icon="currency_rupee"
                  color="green"
                  trend={`+${revenueGrowthPercentage}% from last month`}
                />
                <StatCard
                  title="Total Orders"
                  value={recentOrders.length || "0"}
                  icon="shopping_cart"
                  color="blue"
                  trend={`+${ordersGrowthPercentage}% from last month`}
                />
                <StatCard
                  title="Total Customers"
                  value={customers || "0"}
                  icon="people"
                  color="purple"
                  trend={`+${customerGrowthPercentage}% from last month`}
                />
                <StatCard
                  title="Low Stock Items"
                  value={lowStockCount || "0"}
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
                    <>
                      {/* Filter Controls */}
                      <div className="flex flex-wrap gap-3 p-3 rounded-lg">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <Search className="w-4 h-4 text-gray-500" />
                          <Input
                            placeholder="Search orders or customers..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="h-8"
                          />
                        </div>

                        <div className="flex items-center gap-2">
                          <Select
                            value={statusFilter}
                            onValueChange={setStatusFilter}
                          >
                            <SelectTrigger className="h-8 w-32">
                              <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Status</SelectItem>
                              <SelectItem value="Ordered">Ordered</SelectItem>
                              <SelectItem value="processing">
                                Processing
                              </SelectItem>
                              <SelectItem value="shipped">Shipped</SelectItem>
                              <SelectItem value="delivered">
                                Delivered
                              </SelectItem>
                              <SelectItem value="cancelled">
                                Cancelled
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <Select value={sortBy} onValueChange={setSortBy}>
                          <SelectTrigger className="h-8 w-36">
                            <SelectValue placeholder="Sort by" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="date">Latest First</SelectItem>
                            <SelectItem value="amount-high">
                              Amount (High)
                            </SelectItem>
                            <SelectItem value="amount-low">
                              Amount (Low)
                            </SelectItem>
                            <SelectItem value="customer">
                              Customer A-Z
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Table */}
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
                          {filteredAndSortedOrders?.map((order) => (
                            <TableRow
                              key={order.id}
                              className="hover:bg-grey-50"
                            >
                              <TableCell className="font-medium text-primary-500">
                                {order.orderID}
                              </TableCell>
                              <TableCell>{order.customerName}</TableCell>
                              <TableCell>
                                ₹{order.total?.toLocaleString()}
                              </TableCell>
                              <TableCell>
                                {getStatusBadge(order.status)}
                              </TableCell>
                              <TableCell className="text-grey-600">
                                {new Date(order.createdAt).toLocaleDateString()}
                              </TableCell>
                            </TableRow>
                          ))}
                          {(!filteredAndSortedOrders ||
                            filteredAndSortedOrders.length === 0) && (
                            <TableRow>
                              <TableCell
                                colSpan={5}
                                className="text-center text-grey-500 py-8"
                              >
                                {searchTerm || statusFilter !== "all"
                                  ? "No orders match your filters"
                                  : "No recent orders found"}
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>

                      {/* Results Summary */}
                      {(searchTerm || statusFilter !== "all") && (
                        <div className="mt-3 text-sm text-gray-600">
                          Showing {filteredAndSortedOrders.length} of{" "}
                          {(recentOrders || []).length} orders
                          {filteredAndSortedOrders.length === 10 &&
                            (recentOrders || []).length > 10 && (
                              <span className="ml-2 text-primary-500">
                                (Limited to 10 recent orders)
                              </span>
                            )}
                        </div>
                      )}
                    </>
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
                      {lowstock?.map((item) => (
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
                      {(!lowstock || lowstock.length === 0) && (
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
