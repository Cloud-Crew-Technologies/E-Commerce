import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import type { Order } from "@shared/schema";

export default function Orders() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateRange, setDateRange] = useState("all");

  const { data: orders, isLoading } = useQuery<Order[]>({
    queryKey: ["/api/orders", { search, statusFilter, dateRange }],
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "delivered":
        return <Badge className="status-chip status-delivered">Delivered</Badge>;
      case "pending":
        return <Badge className="status-chip status-pending">Processing</Badge>;
      case "shipped":
        return <Badge className="status-chip status-active">Shipped</Badge>;
      case "cancelled":
        return <Badge className="status-chip status-low-stock">Cancelled</Badge>;
      default:
        return <Badge className="status-chip status-pending">{status}</Badge>;
    }
  };

  const filteredOrders = orders?.filter(order => {
    const matchesSearch = 
      order.id.toLowerCase().includes(search.toLowerCase()) ||
      order.customerName.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    
    let matchesDate = true;
    if (dateRange !== "all" && order.createdAt) {
      const orderDate = new Date(order.createdAt);
      const now = new Date();
      const daysDiff = Math.floor((now.getTime() - orderDate.getTime()) / (1000 * 60 * 60 * 24));
      
      switch (dateRange) {
        case "today":
          matchesDate = daysDiff === 0;
          break;
        case "week":
          matchesDate = daysDiff <= 7;
          break;
        case "month":
          matchesDate = daysDiff <= 30;
          break;
      }
    }
    
    return matchesSearch && matchesStatus && matchesDate;
  });

  return (
    <div className="flex min-h-screen bg-grey-50">
      <Sidebar />
      
      <div className="ml-64 flex-1">
        <Header title="Order Management" subtitle="Track and manage customer orders" />
        
        <main className="p-6">
          {/* Order Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="material-elevation-2">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-grey-600">Total Orders</p>
                    <p className="text-2xl font-bold text-grey-900">
                      {isLoading ? "..." : orders?.length || 0}
                    </p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-full">
                    <span className="material-icons text-blue-600">shopping_cart</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="material-elevation-2">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-grey-600">Pending Orders</p>
                    <p className="text-2xl font-bold text-orange-600">
                      {isLoading ? "..." : orders?.filter(o => o.status === "pending").length || 0}
                    </p>
                  </div>
                  <div className="p-3 bg-orange-100 rounded-full">
                    <span className="material-icons text-orange-600">pending</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="material-elevation-2">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-grey-600">Delivered Orders</p>
                    <p className="text-2xl font-bold text-green-600">
                      {isLoading ? "..." : orders?.filter(o => o.status === "delivered").length || 0}
                    </p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-full">
                    <span className="material-icons text-green-600">check_circle</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="material-elevation-2">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-grey-600">Total Revenue</p>
                    <p className="text-2xl font-bold text-green-600">
                      ${isLoading ? "..." : orders?.reduce((sum, o) => sum + parseFloat(o.total), 0).toLocaleString() || "0"}
                    </p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-full">
                    <span className="material-icons text-green-600">attach_money</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Orders Table */}
          <Card className="material-elevation-2">
            <CardHeader>
              <CardTitle>Order History</CardTitle>
              
              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-4 mt-4">
                <div className="flex-1 relative">
                  <span className="material-icons absolute left-3 top-1/2 transform -translate-y-1/2 text-grey-400">
                    search
                  </span>
                  <Input
                    placeholder="Search orders by ID or customer..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="shipped">Shipped</SelectItem>
                    <SelectItem value="delivered">Delivered</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={dateRange} onValueChange={setDateRange}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="week">This Week</SelectItem>
                    <SelectItem value="month">This Month</SelectItem>
                  </SelectContent>
                </Select>
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
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-8 w-20" />
                    </div>
                  ))}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order ID</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Items</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOrders?.map((order) => (
                      <TableRow key={order.id} className="hover:bg-grey-50">
                        <TableCell className="font-medium text-primary-500">
                          #{order.id.slice(-6)}
                        </TableCell>
                        <TableCell>{order.customerName}</TableCell>
                        <TableCell>
                          {JSON.parse(order.items).length} items
                        </TableCell>
                        <TableCell>${order.total}</TableCell>
                        <TableCell>{getStatusBadge(order.status)}</TableCell>
                        <TableCell className="text-grey-600">
                          {order.createdAt 
                            ? new Date(order.createdAt).toLocaleDateString()
                            : "N/A"
                          }
                        </TableCell>
                        <TableCell>
                          <Button variant="outline" size="sm">
                            View Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {(!filteredOrders || filteredOrders.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-grey-500 py-8">
                          {search || statusFilter !== "all" || dateRange !== "all"
                            ? "No orders match your search criteria"
                            : "No orders found"
                          }
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
