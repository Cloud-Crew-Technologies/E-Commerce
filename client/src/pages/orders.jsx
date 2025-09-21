import { useState, useEffect } from "react";
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
import OrderDetailsDialog from "@/components/orders/vieworderdialog";
import CustomerDetailsDialog from "@/components/orders/customerdetailsdialog";
import UpdateStatusDialog from "@/components/orders/updatestatusdialog";

export default function Orders() {
  const [search, setSearch] = useState("");
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedOrderID, setSelectedOrderID] = useState(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const [selectedOrderForUpdate, setSelectedOrderForUpdate] = useState(null);
  const { toast } = useToast();

  // Parse URL query parameters for filtering by customer name/email
  const getQueryParam = (param) => {
    const params = new URLSearchParams(window.location.search);
    return params.get(param) || "";
  };
  const baseurl = "https://ecommerceapi.skillhiveinnovations.com";

  const filterName = getQueryParam("name").toLowerCase();
  const filterEmail = getQueryParam("email").toLowerCase();

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get(
          "https://ecommerceapi.skillhiveinnovations.com/api/orders/get"
        );
        const data = Array.isArray(response.data)
          ? response.data
          : response.data?.data || [];
        setOrders(data);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load orders",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchOrders();
  }, [toast]);

  const filteredOrders = orders.filter(
    (order) =>
      (order.customerName?.toLowerCase().includes(filterName) ||
        filterName === "") &&
      (order.customerEmail?.toLowerCase().includes(filterEmail) ||
        filterEmail === "") &&
      (order.id || true)
  );
  const onViewDetails = (orderID) => {
    setSelectedOrderID(orderID);
  };
  const onCloseDetails = () => {
    setSelectedOrderID(null);
  };

  const onViewCustomerDetails = (customerId) => {
    setSelectedCustomerId(customerId);
  };
  const onCloseCustomerDetails = () => {
    setSelectedCustomerId(null);
  };

  const onUpdateStatus = (order) => {
    setSelectedOrderForUpdate(order);
  };
  const onCloseStatusUpdate = () => {
    setSelectedOrderForUpdate(null);
  };

  const onStatusUpdated = () => {
    // Refresh the orders list after status update
    const fetchOrders = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get(
          "https://ecommerceapi.skillhiveinnovations.com/api/orders/get"
        );
        const data = Array.isArray(response.data)
          ? response.data
          : response.data?.data || [];
        setOrders(data);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to refresh orders",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchOrders();
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "ordered":
        return <Badge className="status-chip status-pending">Ordered</Badge>;
      case "processing":
        return <Badge className="status-chip status-pending">Processing</Badge>;
      case "shipped":
        return <Badge className="status-chip status-active">Shipped</Badge>;
      case "delivered":
        return (
          <Badge className="status-chip status-delivered">Delivered</Badge>
        );
      case "cancelled":
        return <Badge className="status-chip status-pending">Cancelled</Badge>;
      default:
        return <Badge className="status-chip status-pending">{status}</Badge>;
    }
  };

  return (
    <div className="flex min-h-screen bg-grey-50">
      <Sidebar />
      <div className="ml-64 flex-1">
        <Header
          title="Order Management"
          subtitle="View and manage customer orders"
        />
        <main className="p-6">
          {/* Order Stats - you can add as needed */}

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
                    {filteredOrders.length === 0 ? (
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
                    ) : (
                      filteredOrders.map((order) => (
                        <TableRow
                          key={order.orderID || order._id}
                          className="hover:bg-grey-50"
                        >
                          <TableCell className="font-medium text-primary-500">
                            #{order.orderID}
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
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onViewDetails(order.orderID)}
                              >
                                View Details
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => onUpdateStatus(order)}
                              >
                                Update Status
                              </Button>
                              {(order.customerId || order.customerEmail) && (
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => onViewCustomerDetails(order.customerId || order.customerEmail)}
                                >
                                  View Customer
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
      {selectedOrderID && (
        <OrderDetailsDialog
          open={!!selectedOrderID}
          onOpenChange={onCloseDetails}
          orderID={selectedOrderID}
        />
      )}

      {selectedCustomerId && (
        <CustomerDetailsDialog
          open={!!selectedCustomerId}
          onOpenChange={onCloseCustomerDetails}
          customerId={selectedCustomerId}
        />
      )}

      {selectedOrderForUpdate && (
        <UpdateStatusDialog
          open={!!selectedOrderForUpdate}
          onOpenChange={onCloseStatusUpdate}
          order={selectedOrderForUpdate}
          onStatusUpdated={onStatusUpdated}
        />
      )}
    </div>
  );
}
