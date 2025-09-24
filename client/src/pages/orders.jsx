import { useState, useEffect, useMemo } from "react";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { Search, Filter, ChevronLeft, ChevronRight } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import axios from "axios";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
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
  const [exportModalOpen, setExportModalOpen] = useState(false);

  // Filter and pagination states
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [sortBy, setSortBy] = useState("date-desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const { toast } = useToast();

  // Handle customer filter from localStorage when component mounts
  useEffect(() => {
    const customerFilter = localStorage.getItem("customerFilter");
    console.log("Retrieved customerFilter from localStorage:", customerFilter);

    if (customerFilter && customerFilter.trim()) {
      console.log("Setting search from localStorage:", customerFilter);
      setSearch(customerFilter.trim());

      toast({
        title: "Filtered by Customer",
        description: `Showing orders for ${customerFilter}`,
      });

      // Clear the localStorage after using it
      localStorage.removeItem("customerFilter");
    }
  }, []); // Empty dependency array - only run once when component mounts

  // Fetch orders
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

  // Cleanup localStorage on component unmount
  useEffect(() => {
    return () => {
      localStorage.removeItem("customerFilter");
    };
  }, []);

  // Filter and sort logic
  const filteredAndSortedOrders = useMemo(() => {
    let filtered = orders.filter(
      (order) =>
        order.orderID?.toLowerCase().includes(search.toLowerCase()) ||
        order.customerName?.toLowerCase().includes(search.toLowerCase()) ||
        order.customerEmail?.toLowerCase().includes(search.toLowerCase()) ||
        search === ""
    );

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((order) => order.status === statusFilter);
    }

    // Apply date filter
    if (dateFilter !== "all") {
      const now = new Date();
      const filterDate = new Date();

      switch (dateFilter) {
        case "today":
          filterDate.setHours(0, 0, 0, 0);
          filtered = filtered.filter(
            (order) => new Date(order.createdAt) >= filterDate
          );
          break;
        case "week":
          filterDate.setDate(now.getDate() - 7);
          filtered = filtered.filter(
            (order) => new Date(order.createdAt) >= filterDate
          );
          break;
        case "month":
          filterDate.setMonth(now.getMonth() - 1);
          filtered = filtered.filter(
            (order) => new Date(order.createdAt) >= filterDate
          );
          break;
        case "3months":
          filterDate.setMonth(now.getMonth() - 3);
          filtered = filtered.filter(
            (order) => new Date(order.createdAt) >= filterDate
          );
          break;
      }
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "date-desc":
          return new Date(b.createdAt) - new Date(a.createdAt);
        case "date-asc":
          return new Date(a.createdAt) - new Date(b.createdAt);
        case "amount-desc":
          return b.total - a.total;
        case "amount-asc":
          return a.total - b.total;
        case "customer-asc":
          return (a.customerName || "").localeCompare(b.customerName || "");
        case "customer-desc":
          return (b.customerName || "").localeCompare(a.customerName || "");
        case "orderid-asc":
          return (a.orderID || "").localeCompare(b.orderID || "");
        case "orderid-desc":
          return (b.orderID || "").localeCompare(a.orderID || "");
        default:
          return new Date(b.createdAt) - new Date(a.createdAt);
      }
    });

    return filtered;
  }, [orders, search, statusFilter, dateFilter, sortBy]);

  // Pagination logic
  const totalItems = filteredAndSortedOrders.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = filteredAndSortedOrders.slice(startIndex, endIndex);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, dateFilter, sortBy]);

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

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setDateFilter("all");
    setSortBy("date-desc");
    setCurrentPage(1);
  };

  // Save data to local storage helper
  const saveToLocalStorage = (key, data) => {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (err) {
      console.error("Failed to save data to localStorage", err);
    }
  };

  // PDF Export function
  const exportPDF = () => {
    if (!filteredAndSortedOrders || filteredAndSortedOrders.length === 0) {
      toast({
        title: "No data",
        description: "No orders to export",
        variant: "destructive",
      });
      return;
    }

    saveToLocalStorage("exportedOrderData", filteredAndSortedOrders);
    const doc = new jsPDF();

    const columns = [
      { header: "Order ID", dataKey: "orderID" },
      { header: "Customer Name", dataKey: "name" },
      { header: "Customer Mail", dataKey: "mail" },
      { header: "Customer Phone", dataKey: "phone" },
      { header: "Total Amount", dataKey: "total" },
      { header: "Status", dataKey: "status" },
    ];

    const rows = filteredAndSortedOrders.map((order) => ({
      orderID: order.orderID,
      name: order.customerName,
      mail: order.customerEmail,
      phone: order.customerPhone,
      total: order.total,
      status: order.status,
    }));

    autoTable(doc, {
      columns,
      body: rows,
      styles: { fontSize: 10 },
      headStyles: { fillColor: [22, 160, 133] },
      startY: 20,
      columnStyles: {
        0: { halign: "left", cellWidth: "auto" },
        1: { halign: "left", cellWidth: "auto" },
        2: { halign: "left", cellWidth: "auto" },
        3: { halign: "left", cellWidth: "auto" },
        4: { halign: "center" },
        5: { halign: "left" },
      },
    });

    doc.text("Order Overview", 14, 15);
    doc.save("Order-overview.pdf");
  };

  // Excel Export function
  const exportExcel = () => {
    if (!filteredAndSortedOrders || filteredAndSortedOrders.length === 0) {
      toast({
        title: "No data",
        description: "No orders to export",
        variant: "destructive",
      });
      return;
    }

    saveToLocalStorage("exportedOrderData", filteredAndSortedOrders);

    const wsData = filteredAndSortedOrders.map((order) => ({
      OrderID: order.orderID,
      Name: order.customerName,
      Mail: order.customerEmail,
      Phone: order.customerPhone,
      Total: order.total,
      Status: order.status,
    }));

    const worksheet = XLSX.utils.json_to_sheet(wsData);
    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, "Order");

    XLSX.writeFile(workbook, "Order-overview.xlsx");
  };

  return (
    <div className="bg-grey-50">
      <Sidebar />
      <div className="ml-14 flex-1">
        <Header
          title="Order Management"
          subtitle="View and manage customer orders"
        />
        <main className="p-6">
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
                    placeholder="Search orders by customer name, email, or order ID..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button
                  className="bg-primary-500 hover:bg-primary-600"
                  onClick={() => setExportModalOpen(true)}
                >
                  <span className="material-icons mr-2">file_download</span>
                  Export
                </Button>
                {exportModalOpen && (
                  <div className="export-modal bg-white shadow-md p-4 rounded absolute right-0 top-990 z-10 w-48">
                    <p className="mb-2 font-semibold">Select Export Format</p>
                    <Button
                      className="mb-2 w-full"
                      onClick={() => {
                        exportPDF();
                        setExportModalOpen(false);
                      }}
                    >
                      Export as PDF
                    </Button>
                    <Button
                      className="w-full"
                      onClick={() => {
                        exportExcel();
                        setExportModalOpen(false);
                      }}
                    >
                      Export as Excel
                    </Button>
                    <Button
                      variant="ghost"
                      className="mt-2 w-full text-sm"
                      onClick={() => setExportModalOpen(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                )}
              </div>

              {/* Advanced Filters */}
              <div className="flex flex-wrap gap-3 mt-4 p-4 rounded-lg">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-gray-500" />
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="h-9 w-36">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="ordered">Ordered</SelectItem>
                      <SelectItem value="processing">Processing</SelectItem>
                      <SelectItem value="shipped">Shipped</SelectItem>
                      <SelectItem value="delivered">Delivered</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Select value={dateFilter} onValueChange={setDateFilter}>
                  <SelectTrigger className="h-9 w-36">
                    <SelectValue placeholder="Date Range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="week">Last Week</SelectItem>
                    <SelectItem value="month">Last Month</SelectItem>
                    <SelectItem value="3months">Last 3 Months</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="h-9 w-40">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date-desc">Date (Newest)</SelectItem>
                    <SelectItem value="date-asc">Date (Oldest)</SelectItem>
                    <SelectItem value="amount-desc">Amount (High)</SelectItem>
                    <SelectItem value="amount-asc">Amount (Low)</SelectItem>
                    <SelectItem value="customer-asc">Customer A-Z</SelectItem>
                    <SelectItem value="customer-desc">Customer Z-A</SelectItem>
                    <SelectItem value="orderid-asc">Order ID A-Z</SelectItem>
                    <SelectItem value="orderid-desc">Order ID Z-A</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={itemsPerPage.toString()}
                  onValueChange={(value) => setItemsPerPage(parseInt(value))}
                >
                  <SelectTrigger className="h-9 w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  variant="outline"
                  onClick={clearFilters}
                  className="h-9"
                >
                  Clear Filters
                </Button>
              </div>

              {/* Results Summary */}
              <div className="flex items-center justify-between mt-4 text-sm text-gray-600">
                <span>
                  Showing {startIndex + 1} - {Math.min(endIndex, totalItems)} of{" "}
                  {totalItems} orders
                </span>
                {(search || statusFilter !== "all" || dateFilter !== "all") && (
                  <span className="text-primary-500">
                    Filtered results ({totalItems} of {orders.length} total
                    orders)
                  </span>
                )}
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
                <>
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
                      {currentItems.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={6}
                            className="text-center text-grey-500 py-8"
                          >
                            {search ||
                            statusFilter !== "all" ||
                            dateFilter !== "all"
                              ? "No orders match your search criteria"
                              : "No orders found"}
                          </TableCell>
                        </TableRow>
                      ) : (
                        currentItems.map((order) => (
                          <TableRow
                            key={order.orderID || order._id}
                            className="hover:bg-grey-50"
                          >
                            <TableCell className="font-medium text-primary-500">
                              {order.orderID}
                            </TableCell>
                            <TableCell className="text-grey-900">
                              {order.customerName}
                            </TableCell>
                            <TableCell className="font-medium">
                              ₹{order.total?.toLocaleString()}
                            </TableCell>
                            <TableCell className="text-grey-600">
                              {new Date(order.createdAt).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              {getStatusBadge(order.status)}
                            </TableCell>
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
                                    onClick={() =>
                                      onViewCustomerDetails(
                                        order.customerId || order.customerEmail
                                      )
                                    }
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

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-6 px-4 py-3 border-t border-gray-200">
                      <div className="flex items-center space-x-4">
                        <span className="text-sm text-gray-700">
                          Rows per page:
                        </span>
                        <Select
                          value={itemsPerPage.toString()}
                          onValueChange={(value) =>
                            setItemsPerPage(parseInt(value))
                          }
                        >
                          <SelectTrigger className="h-8 w-16 border-none shadow-none">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="5">5</SelectItem>
                            <SelectItem value="10">10</SelectItem>
                            <SelectItem value="25">25</SelectItem>
                            <SelectItem value="50">50</SelectItem>
                            <SelectItem value="100">100</SelectItem>
                          </SelectContent>
                        </Select>
                        <span className="text-sm text-gray-700">
                          {startIndex + 1} - {Math.min(endIndex, totalItems)} of{" "}
                          {totalItems}
                        </span>
                      </div>

                      <div className="flex items-center space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setCurrentPage(1)}
                          disabled={currentPage === 1}
                          className="w-8 h-8 p-0"
                        >
                          <span className="material-icons text-base">
                            first_page
                          </span>
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            setCurrentPage((prev) => Math.max(prev - 1, 1))
                          }
                          disabled={currentPage === 1}
                          className="w-8 h-8 p-0"
                        >
                          <span className="material-icons text-base">
                            chevron_left
                          </span>
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            setCurrentPage((prev) =>
                              Math.min(prev + 1, totalPages)
                            )
                          }
                          disabled={currentPage === totalPages}
                          className="w-8 h-8 p-0"
                        >
                          <span className="material-icons text-base">
                            chevron_right
                          </span>
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setCurrentPage(totalPages)}
                          disabled={currentPage === totalPages}
                          className="w-8 h-8 p-0"
                        >
                          <span className="material-icons text-base">
                            last_page
                          </span>
                        </Button>
                      </div>
                    </div>
                  )}
                </>
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
