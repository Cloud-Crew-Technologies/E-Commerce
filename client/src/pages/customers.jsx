import { useState, useEffect, useMemo } from "react";
import { useMutation } from "@tanstack/react-query";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
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
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import axios from "axios";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import Modal from "@mui/material/Modal";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import PersonIcon from "@mui/icons-material/Person";
import EmailIcon from "@mui/icons-material/Email";
import PhoneIcon from "@mui/icons-material/Phone";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import { useNavigate } from "react-router-dom";
const modalStyle = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 400,
  bgcolor: "background.paper",
  borderRadius: 2,
  boxShadow: 24,
  p: 4,
};

const InfoRow = ({ icon, label, value }) => (
  <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
    <IconButton size="small" color="primary" disabled sx={{ ml: -1 }}>
      {icon}
    </IconButton>
    <Typography variant="body2">
      <strong>{label}:</strong> {value || "N/A"}
    </Typography>
  </Stack>
);

export default function Customers() {
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState("");
  const { toast } = useToast();
  const [customers, setCustomers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  // const navigate = useNavigate();

  // Filter and pagination states
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [sortBy, setSortBy] = useState("date-desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const openModal = (customer) => {
    setSelectedCustomer(customer);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedCustomer(null);
  };

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get(
          "https://ecommerceapi.skillhiveinnovations.com/api/customers/get"
        );
        const data = Array.isArray(response.data)
          ? response.data
          : response.data?.data || [];
        const customersWithStatus = data.map((c) => ({
          ...c,
          isActive: c.isActive ?? true,
          id: c._id,
        }));
        setCustomers(customersWithStatus);
      } catch (error) {
        toast({
          title: "Error",
          description: error.message || "Failed to load customers",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchCustomers();
  }, [toast]);

  // Filter and sort logic
  const filteredAndSortedCustomers = useMemo(() => {
    let filtered = customers.filter(
      (c) =>
        c.name?.toLowerCase().includes(search.toLowerCase()) ||
        c.email?.toLowerCase().includes(search.toLowerCase())
    );

    // Apply status filter
    if (statusFilter !== "all") {
      if (statusFilter === "active") {
        filtered = filtered.filter((customer) => customer.isActive);
      } else if (statusFilter === "inactive") {
        filtered = filtered.filter((customer) => !customer.isActive);
      }
    }

    // Apply date filter
    if (dateFilter !== "all") {
      const now = new Date();
      const filterDate = new Date();

      switch (dateFilter) {
        case "today":
          filterDate.setHours(0, 0, 0, 0);
          filtered = filtered.filter(
            (customer) => new Date(customer.createdAt) >= filterDate
          );
          break;
        case "week":
          filterDate.setDate(now.getDate() - 7);
          filtered = filtered.filter(
            (customer) => new Date(customer.createdAt) >= filterDate
          );
          break;
        case "month":
          filterDate.setMonth(now.getMonth() - 1);
          filtered = filtered.filter(
            (customer) => new Date(customer.createdAt) >= filterDate
          );
          break;
        case "3months":
          filterDate.setMonth(now.getMonth() - 3);
          filtered = filtered.filter(
            (customer) => new Date(customer.createdAt) >= filterDate
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
        case "name-asc":
          return (a.name || "").localeCompare(b.name || "");
        case "name-desc":
          return (b.name || "").localeCompare(a.name || "");
        case "email-asc":
          return (a.email || "").localeCompare(b.email || "");
        case "email-desc":
          return (b.email || "").localeCompare(a.email || "");
        default:
          return new Date(b.createdAt) - new Date(a.createdAt);
      }
    });

    return filtered;
  }, [customers, search, statusFilter, dateFilter, sortBy]);

  // Pagination logic
  const totalItems = filteredAndSortedCustomers.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = filteredAndSortedCustomers.slice(startIndex, endIndex);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, dateFilter, sortBy]);

  const toggleCustomerStatusMutation = useMutation({
    mutationFn: ({ customerId, isActive }) =>
      apiRequest("PATCH", `/api/customers/${customerId}`, { isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      toast({
        title: "Customer status updated",
        description: "Customer status has been successfully updated.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update status",
        variant: "destructive",
      });
    },
  });

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setDateFilter("all");
    setSortBy("date-desc");
    setCurrentPage(1);
  };
  const saveToLocalStorage = (key, data) => {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (err) {
      console.error("Failed to save data to localStorage", err);
    }
  };

  // PDF Export function using jsPDF and autotable excluding "Actions" column
  const exportPDF = () => {
    if (
      !filteredAndSortedCustomers ||
      filteredAndSortedCustomers.length === 0
    ) {
      toast({
        title: "No data",
        description: "No products to export",
        variant: "destructive",
      });
      return;
    }

    saveToLocalStorage("exportedCustomerData", filteredAndSortedCustomers);
    const doc = new jsPDF();

    const columns = [
      { header: "Name", dataKey: "name" },
      { header: "Mail", dataKey: "mail" },
      { header: "Phone", dataKey: "phone" },
      { header: "Address", dataKey: "address" },
      { header: "City", dataKey: "city" },
      { header: "Pin Code", dataKey: "Pincode" },
      { header: "State", dataKey: "state" },
      { header: "Country", dataKey: "country" },
    ];

    const rows = filteredAndSortedCustomers.map((product) => ({
      name: product.name,
      mail: product.email,
      phone: product.phone,
      address: product.address,
      city: product.city,
      PinCode: product.pincode,
      state: product.state,
      country: product.country,
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
        6: { halign: "left" },
      },
    });

    doc.text("Customer Overview", 14, 15);
    doc.save("Customer-overview.pdf");
  };

  // Excel Export function using SheetJS and file-saver
  const exportExcel = () => {
    if (
      !filteredAndSortedCustomers ||
      filteredAndSortedCustomers.length === 0
    ) {
      toast({
        title: "No data",
        description: "No products to export",
        variant: "destructive",
      });
      return;
    }

    saveToLocalStorage("exportedCustomerData", filteredAndSortedCustomers);

    const wsData = filteredAndSortedCustomers.map((product) => ({
      Name: product.name,
      Mail: product.email,
      Phone: product.phone,
      Address: product.address,
      City: product.city,
      State: product.state,
      PinCode: product.pincode,
      Country: product.country,
    }));

    const worksheet = XLSX.utils.json_to_sheet(wsData);
    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, "Customer");

    XLSX.writeFile(workbook, "Customer-overview.xlsx");
  };

  return (
    <>
      <div className=" bg-grey-50">
        <Sidebar />
        <div className="ml-14 flex-1">
          <Header
            title="Customer Management"
            subtitle="View and manage customer accounts"
          />
          <main className="p-6">
            {/* Customer Table */}
            <Card className="material-elevation-2">
              <CardHeader>
                <CardTitle>Customer List</CardTitle>
                <div className="flex items-center gap-4 mt-4">
                  <div className="flex-1 relative">
                    <span className="material-icons absolute left-3 top-1/2 transform -translate-y-1/2 text-grey-400">
                      search
                    </span>
                    <Input
                      placeholder="Search customers by name or email..."
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
                <div className="flex flex-wrap gap-3 mt-4 p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-gray-500" />
                    <Select
                      value={statusFilter}
                      onValueChange={setStatusFilter}
                    >
                      <SelectTrigger className="h-9 w-36">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
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
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="h-9 w-40">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="date-desc">Joined (Newest)</SelectItem>
                      <SelectItem value="date-asc">Joined (Oldest)</SelectItem>
                      <SelectItem value="name-asc">Name A-Z</SelectItem>
                      <SelectItem value="name-desc">Name Z-A</SelectItem>
                      <SelectItem value="email-asc">Email A-Z</SelectItem>
                      <SelectItem value="email-desc">Email Z-A</SelectItem>
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
                    Showing {startIndex + 1}-{Math.min(endIndex, totalItems)} of{" "}
                    {totalItems} customers
                  </span>
                  {(search ||
                    statusFilter !== "all" ||
                    dateFilter !== "all") && (
                    <span className="text-primary-500">
                      Filtered results ({totalItems} of {customers.length} total
                      customers)
                    </span>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">
                    {Array.from({ length: 10 }).map((_, i) => (
                      <div key={i} className="flex items-center space-x-4">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="flex-1">
                          <Skeleton className="h-4 w-48 mb-1" />
                          <Skeleton className="h-3 w-32" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Customer</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Phone</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Joined</TableHead>
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
                                ? "No customers match your search criteria"
                                : "No customers found"}
                            </TableCell>
                          </TableRow>
                        ) : (
                          currentItems.map((customer) => (
                            <TableRow
                              key={customer.id}
                              className="hover:bg-grey-50"
                            >
                              <TableCell>
                                <Stack
                                  direction="row"
                                  spacing={2}
                                  alignItems="center"
                                >
                                  <Box
                                    sx={{
                                      bgcolor: "primary.light",
                                      p: 1,
                                      borderRadius: "50%",
                                    }}
                                  >
                                    <PersonIcon
                                      fontSize="large"
                                      color="primary"
                                    />
                                  </Box>
                                  <Typography
                                    variant="subtitle1"
                                    fontWeight="medium"
                                  >
                                    {customer.name}
                                  </Typography>
                                </Stack>
                              </TableCell>
                              <TableCell>{customer.email}</TableCell>
                              <TableCell>{customer.phone || "N/A"}</TableCell>
                              <TableCell>
                                <Badge
                                  color={
                                    customer.isActive ? "success" : "default"
                                  }
                                >
                                  {customer.isActive ? "Active" : "Inactive"}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {customer.createdAt
                                  ? new Date(
                                      customer.createdAt
                                    ).toLocaleDateString()
                                  : "N/A"}
                              </TableCell>
                              <TableCell>
                                <Button
                                  variant="outlined"
                                  size="sm"
                                  className="bg-white-100 hover:bg-grey-200 border border-grey-300"
                                  onClick={() => openModal(customer)}
                                >
                                  View Details
                                </Button>
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
                            {startIndex + 1}-{Math.min(endIndex, totalItems)} of{" "}
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
      </div>

      {/* Modal */}
      <Modal
        open={isModalOpen}
        onClose={closeModal}
        aria-labelledby="customer-details-title"
      >
        <Box sx={modalStyle}>
          {selectedCustomer ? (
            <>
              <Stack spacing={2} sx={{ maxWidth: 400 }}>
                <Stack direction="row" spacing={2} alignItems="center">
                  <PersonIcon fontSize="large" color="primary" />
                  <Typography variant="h5" fontWeight="bold">
                    {selectedCustomer.name}
                  </Typography>
                </Stack>

                <Stack spacing={1}>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <EmailIcon color="action" />
                    <Typography>{selectedCustomer.email}</Typography>
                  </Stack>

                  <Divider />

                  <Typography
                    variant="subtitle2"
                    fontWeight="medium"
                    color="text.secondary"
                  >
                    Contact Information
                  </Typography>

                  <Stack spacing={1} pl={2}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <PhoneIcon color="action" />
                      <Typography>{selectedCustomer.phone || "N/A"}</Typography>
                    </Stack>

                    <Stack direction="row" alignItems="center" spacing={1}>
                      <LocationOnIcon color="action" />
                      <Typography>
                        {selectedCustomer.address + ", " || "N/A"}
                        {selectedCustomer.city + ", " || "N/A"}{" "}
                        {selectedCustomer.state + ", " || "N/A"}
                        {selectedCustomer.country + ", " || "N/A"}
                        {selectedCustomer.pincode || "N/A"}
                      </Typography>
                    </Stack>
                  </Stack>

                  <Divider />

                  <Stack direction="row" alignItems="center" spacing={1}>
                    <CalendarTodayIcon color="action" />
                    <Typography>
                      Member since:{" "}
                      {selectedCustomer.createdAt
                        ? new Date(
                            selectedCustomer.createdAt
                          ).toLocaleDateString()
                        : "N/A"}
                    </Typography>
                  </Stack>
                </Stack>

                <Stack
                  direction="row"
                  spacing={2}
                  justifyContent="flex-end"
                  mt={3}
                >
                  <Button
                    variant="outlined"
                    size="sm"
                    className="bg-white-100 hover:bg-grey-200 border border-grey-300"
                    onClick={closeModal}
                  >
                    Close
                  </Button>
                  <Button
                    onClick={() => {
                      const email = selectedCustomer.email || "";
                      console.log("Storing email:", email);
                      localStorage.setItem("customerFilter", email);
                      closeModal();

                      // Use window.location instead of navigate
                      window.location.href = "/orders";
                    }}
                  >
                    View Orders
                  </Button>
                </Stack>
              </Stack>
            </>
          ) : (
            <Typography>No details available.</Typography>
          )}
        </Box>
      </Modal>
    </>
  );
}
