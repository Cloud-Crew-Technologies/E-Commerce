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
import { Plus, Search, Ticket, Edit, Trash2 } from "lucide-react";

export default function Coupons() {
  const [searchTerm, setSearchTerm] = useState("");
  
  const { data: coupons, isLoading } = useQuery({
    queryKey: ["/api/coupons"],
  });

  const filteredCoupons = coupons?.filter(coupon =>
    coupon.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    coupon.code.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const getStatusBadge = (coupon) => {
    const now = new Date();
    const expiryDate = new Date(coupon.expiryDate);
    
    if (!coupon.isActive) {
      return { label: "Inactive", variant: "destructive" };
    }
    if (expiryDate < now) {
      return { label: "Expired", variant: "destructive" };
    }
    if (coupon.usageCount >= coupon.usageLimit) {
      return { label: "Limit Reached", variant: "warning" };
    }
    return { label: "Active", variant: "success" };
  };

  return (
    <div className="flex min-h-screen bg-grey-50">
      <Sidebar />
      
      <div className="ml-64 flex-1">
        <Header title="Coupon Management" subtitle="Create and manage discount coupons" />
        
        <main className="p-6">
          {/* Header Section */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-grey-900">Coupons</h2>
              <p className="text-grey-600">Manage discount codes and promotions</p>
            </div>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Create Coupon
            </Button>
          </div>

          {/* Search and Filter */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-grey-400" />
                  <Input
                    placeholder="Search coupons by name or code..."
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

          {/* Coupons Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Ticket className="h-5 w-5" />
                Coupons ({filteredCoupons.length})
              </CardTitle>
              <CardDescription>
                Manage your promotional codes and discounts
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
                      <TableHead>Coupon</TableHead>
                      <TableHead>Code</TableHead>
                      <TableHead>Discount</TableHead>
                      <TableHead>Usage</TableHead>
                      <TableHead>Expires</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCoupons.map((coupon) => {
                      const status = getStatusBadge(coupon);
                      return (
                        <TableRow key={coupon.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{coupon.name}</div>
                              <div className="text-sm text-grey-500">
                                Created {new Date(coupon.createdAt).toLocaleDateString()}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <code className="bg-grey-100 px-2 py-1 rounded text-sm font-mono">
                              {coupon.code}
                            </code>
                          </TableCell>
                          <TableCell className="font-medium">
                            {coupon.discount}% off
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{coupon.usageCount}</span>
                              <span className="text-grey-500">/</span>
                              <span className="text-grey-500">{coupon.usageLimit}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">
                            {new Date(coupon.expiryDate).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <Badge 
                              className={`status-chip ${
                                status.variant === 'destructive' ? 'status-inactive' :
                                status.variant === 'warning' ? 'status-pending' :
                                'status-active'
                              }`}
                            >
                              {status.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button size="sm" variant="ghost">
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="ghost" className="text-red-600">
                                <Trash2 className="h-4 w-4" />
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