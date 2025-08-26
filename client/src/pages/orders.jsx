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

export default function Orders() {
  const [search, setSearch] = useState("");
  const [orders, setProduct] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // const { data: orders, isLoading } = useQuery({
  //   queryKey: ["/api/orders/getall", { search }],
  // });

  useEffect(() => {
    fetchCategories();
  }, [100]);

  const fetchCategories = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(
        "http://localhost:3000/api/orders/get"
      );

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

  const updateOrderStatusMutation = useMutation({
    mutationFn: async ({ orderId, status }) => {
      await apiRequest("PATCH", `/api/orders/${orderId}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({
        title: "Order status updated",
        description: "Order status has been successfully updated.",
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

  const filteredOrders = orders?.filter(
    (order) =>
      order.customerName.toLowerCase().includes(search.toLowerCase()) ||
      order.id
  );

  return (
    <div className="flex min-h-screen bg-grey-50">
      <Sidebar />

      <div className="ml-64 flex-1">
        <Header
          title="Order Management"
          subtitle="View and manage customer orders"
        />

        <main className="p-6">
          {/* Order Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="material-elevation-2">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-grey-600">
                      Total Orders
                    </p>
                    <p className="text-2xl font-bold text-grey-900">
                      {isLoading ? "..." : orders?.length || 0}
                    </p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-full">
                    <span className="material-icons text-blue-600">
                      shopping_cart
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
                      Pending Orders
                    </p>
                    <p className="text-2xl font-bold text-orange-600">
                      {isLoading
                        ? "..."
                        : orders?.filter((o) => o.status === "pending")
                            .length || 0}
                    </p>
                  </div>
                  <div className="p-3 bg-orange-100 rounded-full">
                    <span className="material-icons text-orange-600">
                      pending
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
                      Shipped Orders
                    </p>
                    <p className="text-2xl font-bold text-blue-600">
                      {isLoading
                        ? "..."
                        : orders?.filter((o) => o.status === "shipped")
                            .length || 0}
                    </p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-full">
                    <span className="material-icons text-blue-600">
                      local_shipping
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
                      Delivered Orders
                    </p>
                    <p className="text-2xl font-bold text-green-600">
                      {isLoading
                        ? "..."
                        : orders?.filter((o) => o.status === "delivered")
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
          </div>

          {/* Orders Table */}
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
                    placeholder="Search orders by customer name or order ID..."
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
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order ID</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOrders?.map((order) => (
                      <TableRow key={order.id} className="hover:bg-grey-50">
                        <TableCell className="font-medium text-primary-500">
                          #{order._id}
                        </TableCell>
                        <TableCell className="text-grey-900">
                          {order.customerName}
                        </TableCell>
                        <TableCell className="font-medium">
                          ₹{order.total}
                        </TableCell>
                        <TableCell className="text-grey-600">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>{getStatusBadge(order.status)}</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button variant="outline" size="sm">
                              View Details
                            </Button>
                            <Button variant="outline" size="sm">
                              Update Status
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {(!filteredOrders || filteredOrders.length === 0) && (
                      <TableRow>
                        <TableCell
                          colSpan={6}
                          className="text-center text-grey-500 py-8"
                        >
                          {search
                            ? "No orders match your search criteria"
                            : "No orders found"}
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
