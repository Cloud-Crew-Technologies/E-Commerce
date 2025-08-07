import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Sidebar from "@/components/layout/sidebar.jsx";
import Header from "@/components/layout/header.jsx";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Search, ShoppingCart, Eye } from "lucide-react";

export default function Orders() {
  const [searchTerm, setSearchTerm] = useState("");
  
  const { data: orders, isLoading } = useQuery({
    queryKey: ["/api/orders"],
  });

  const filteredOrders = orders?.filter(order =>
    order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.id.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const getStatusBadge = (status) => {
    switch (status) {
      case "delivered":
        return { label: "Delivered", className: "status-delivered" };
      case "pending":
        return { label: "Processing", className: "status-pending" };
      case "shipped":
        return { label: "Shipped", className: "status-active" };
      case "cancelled":
        return { label: "Cancelled", className: "status-inactive" };
      default:
        return { label: status, className: "status-pending" };
    }
  };

  return (
    <div className="flex min-h-screen bg-grey-50">
      <Sidebar />
      
      <div className="ml-64 flex-1">
        <Header title="Order Management" subtitle="Track and manage customer orders" />
        
        <main className="p-6">
          {/* Header Section */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-grey-900">Orders</h2>
              <p className="text-grey-600">Track and fulfill customer orders</p>
            </div>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              New Order
            </Button>
          </div>

          {/* Search and Filter */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-grey-400" />
                  <Input
                    placeholder="Search orders by customer name or order ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button variant="outline">
                  Filter
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Orders Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Orders ({filteredOrders.length})
              </CardTitle>
              <CardDescription>
                Manage customer orders and track fulfillment
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
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order ID</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Items</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOrders.map((order) => {
                      const statusBadge = getStatusBadge(order.status);
                      const itemCount = order.items ? JSON.parse(order.items).length : 0;
                      
                      return (
                        <TableRow key={order.id}>
                          <TableCell className="font-mono text-sm">
                            #{order.id.slice(0, 8)}...
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{order.customerName}</div>
                              {order.customerId && (
                                <div className="text-sm text-grey-500">ID: {order.customerId.slice(0, 8)}...</div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">
                            ${order.total}
                          </TableCell>
                          <TableCell>
                            <Badge className={`status-chip ${statusBadge.className}`}>
                              {statusBadge.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm">
                            {new Date(order.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {itemCount} item{itemCount !== 1 ? 's' : ''}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button size="sm" variant="ghost">
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="outline">
                                Update Status
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
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