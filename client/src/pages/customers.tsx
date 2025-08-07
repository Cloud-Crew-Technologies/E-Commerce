import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Customer } from "@shared/schema";

export default function Customers() {
  const [search, setSearch] = useState("");
  const { toast } = useToast();

  const { data: customers, isLoading } = useQuery<Customer[]>({
    queryKey: ["/api/customers", { search }],
  });

  const toggleCustomerStatusMutation = useMutation({
    mutationFn: async ({ customerId, isActive }: { customerId: string; isActive: boolean }) => {
      await apiRequest("PATCH", `/api/customers/${customerId}`, { isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      toast({
        title: "Customer status updated",
        description: "Customer status has been successfully updated.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const filteredCustomers = customers?.filter(customer =>
    customer.name.toLowerCase().includes(search.toLowerCase()) ||
    customer.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex min-h-screen bg-grey-50">
      <Sidebar />
      
      <div className="ml-64 flex-1">
        <Header title="Customer Management" subtitle="View and manage customer accounts" />
        
        <main className="p-6">
          {/* Customer Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="material-elevation-2">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-grey-600">Total Customers</p>
                    <p className="text-2xl font-bold text-grey-900">
                      {isLoading ? "..." : customers?.length || 0}
                    </p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-full">
                    <span className="material-icons text-blue-600">people</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="material-elevation-2">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-grey-600">Active Customers</p>
                    <p className="text-2xl font-bold text-green-600">
                      {isLoading ? "..." : customers?.filter(c => c.isActive).length || 0}
                    </p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-full">
                    <span className="material-icons text-green-600">person</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="material-elevation-2">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-grey-600">Inactive Customers</p>
                    <p className="text-2xl font-bold text-red-600">
                      {isLoading ? "..." : customers?.filter(c => !c.isActive).length || 0}
                    </p>
                  </div>
                  <div className="p-3 bg-red-100 rounded-full">
                    <span className="material-icons text-red-600">person_off</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="material-elevation-2">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-grey-600">New This Month</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {isLoading ? "..." : customers?.filter(c => {
                        if (!c.createdAt) return false;
                        const customerDate = new Date(c.createdAt);
                        const now = new Date();
                        return customerDate.getMonth() === now.getMonth() && 
                               customerDate.getFullYear() === now.getFullYear();
                      }).length || 0}
                    </p>
                  </div>
                  <div className="p-3 bg-purple-100 rounded-full">
                    <span className="material-icons text-purple-600">person_add</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Customers Table */}
          <Card className="material-elevation-2">
            <CardHeader>
              <CardTitle>Customer List</CardTitle>
              
              {/* Search */}
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
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="flex-1">
                        <Skeleton className="h-4 w-48 mb-1" />
                        <Skeleton className="h-3 w-32" />
                      </div>
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-6 w-16" />
                      <Skeleton className="h-8 w-12" />
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
                    {filteredCustomers?.map((customer) => (
                      <TableRow key={customer.id} className="hover:bg-grey-50">
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                              <span className="material-icons text-primary-600 text-lg">person</span>
                            </div>
                            <div className="font-medium text-grey-900">{customer.name}</div>
                          </div>
                        </TableCell>
                        <TableCell className="text-grey-600">{customer.email}</TableCell>
                        <TableCell className="text-grey-600">{customer.phone || "N/A"}</TableCell>
                        <TableCell>
                          <Badge className={customer.isActive ? "status-chip status-active" : "status-chip status-low-stock"}>
                            {customer.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-grey-600">
                          {customer.createdAt 
                            ? new Date(customer.createdAt).toLocaleDateString()
                            : "N/A"
                          }
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Switch
                              checked={customer.isActive}
                              onCheckedChange={(checked) => 
                                toggleCustomerStatusMutation.mutate({
                                  customerId: customer.id,
                                  isActive: checked
                                })
                              }
                              disabled={toggleCustomerStatusMutation.isPending}
                            />
                            <Button variant="outline" size="sm">
                              View Orders
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {(!filteredCustomers || filteredCustomers.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-grey-500 py-8">
                          {search 
                            ? "No customers match your search criteria"
                            : "No customers found"
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
