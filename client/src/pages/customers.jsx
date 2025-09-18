import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
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
          "http://localhost:3000/api/customers/get"
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

  const filteredCustomers = customers.filter(
    (c) =>
      c.name?.toLowerCase().includes(search.toLowerCase()) ||
      c.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <div className="flex min-h-screen bg-grey-50">
        <Sidebar />
        <div className="ml-64 flex-1">
          <Header
            title="Customer Management"
            subtitle="View and manage customer accounts"
          />
          <main className="p-6">
            {/* Existing Stats Cards */}
            {/* Keep your existing cards here */}

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
                    onClick={() =>
                      alert("Export functionality not implemented")
                    }
                  >
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
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="flex-1">
                          <Skeleton className="h-4 w-48 mb-1" />
                          <Skeleton className="h-3 w-32" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
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
                      {filteredCustomers.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={6}
                            className="text-center text-grey-500"
                          >
                            {search
                              ? "No customers match your criteria"
                              : "No customers found"}
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredCustomers.map((customer) => (
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
                    variant="contained"
                    size="sm"
                    className="bg-white-100 hover:bg-grey-200 border border-grey-300"
                    onClick={() => {
                      const name = encodeURIComponent(selectedCustomer.name);
                      const email = encodeURIComponent(selectedCustomer.email);
                      window.location.href = `/orders?name=${name}&email=${email}`;
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
