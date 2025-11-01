import { useState, useEffect, useMemo } from "react";
import { useMutation } from "@tanstack/react-query";
import CouponCard from "@/components/coupons/coupon-card";
import AddCouponDialog from "@/components/coupons/add-coupon-dialog";
import EditCouponDialog from "@/components/coupons/edit-coupon";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import axios from "axios";

export default function Coupons() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState(null);
  const [coupons, setCoupons] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // all | active | expiring | expired

  useEffect(() => {
    fetchCoupons();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchCoupons = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(
        "https://texapi.skillhiveinnovations.com/api/coupons/getall"
      );

      const couponsData = response.data;
      if (Array.isArray(couponsData)) {
        setCoupons(couponsData);
      } else if (couponsData && Array.isArray(couponsData.data)) {
        setCoupons(couponsData.data);
      } else {
        console.warn("Unexpected response structure:", couponsData);
        setCoupons([]);
      }
    } catch (error) {
      console.error("Error fetching coupons:", error);
      setCoupons([]);
      toast({
        title: "Error",
        description: "Failed to load coupons",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const deleteCouponMutation = useMutation({
    mutationFn: async (couponId) => {
      await apiRequest("DELETE", `/api/coupons/delete/${couponId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/coupons/getall"] });
      toast({
        title: "Coupon deleted",
        description: "Coupon has been successfully deleted.",
      });
      fetchCoupons();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleDelete = (id) => {
    deleteCouponMutation.mutate(id);
  };

  const handleEdit = (id) => {
    setSelectedCoupon(id);
    setIsEditDialogOpen(true);
  };

  // Derived: filtered coupons
  const filteredCoupons = useMemo(() => {
    const now = new Date();
    const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    return coupons.filter((c) => {
      const code = (c.code || "").toLowerCase();
      const name = (c.name || "").toLowerCase();
      const term = searchTerm.trim().toLowerCase();
      const matchesSearch = term
        ? code.includes(term) || name.includes(term)
        : true;

      const expiry = new Date(c.expiryDate);
      const isExpired = expiry < now;
      const isExpiringSoon = expiry <= weekFromNow && expiry > now;

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && !isExpired && !isExpiringSoon) ||
        (statusFilter === "expiring" && isExpiringSoon) ||
        (statusFilter === "expired" && isExpired);

      return matchesSearch && matchesStatus;
    });
  }, [coupons, searchTerm, statusFilter]);

  const resetFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
  };

  return (
    <div className="w-full">
      {/* Page Header */}
      <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4 mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-gray-900">Offers</h1>
            <p className="text-sm text-gray-600 mt-1">
              Manage your discount offers and promotional offers
            </p>
          </div>
          <Button
            onClick={() => setIsAddDialogOpen(true)}
            className="mt-4 sm:mt-0 px-4 py-2"
          >
            Create Offer
          </Button>
        </div>
      </div>

      <div className="px-4 sm:px-6">
          {/* Stats Section - Full Width, responsive */}
          {coupons.length > 0 && (
            <>
              {/* Mobile Stats */}
              <div className="mt-6 lg:hidden w-full">
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide w-full">
                  <div className="flex-shrink-0 bg-white rounded-lg border border-gray-200 p-4 min-w-[120px] w-full">
                    <div className="text-xl font-bold text-blue-600">
                      {coupons.length}
                    </div>
                    <div className="text-xs text-gray-600">Total</div>
                  </div>
                  <div className="flex-shrink-0 bg-white rounded-lg border border-gray-200 p-4 min-w-[140px] w-full">
                    <div className="text-xl font-bold text-green-600">
                      {
                        coupons.filter(
                          (c) => new Date(c.expiryDate) > new Date()
                        ).length
                      }
                    </div>
                    <div className="text-xs text-gray-600">Active</div>
                  </div>
                  <div className="flex-shrink-0 bg-white rounded-lg border border-gray-200 p-4 min-w-[140px] w-full">
                    <div className="text-xl font-bold text-orange-600">
                      {
                        coupons.filter((c) => {
                          const expiry = new Date(c.expiryDate);
                          const now = new Date();
                          const weekFromNow = new Date(
                            now.getTime() + 7 * 24 * 60 * 60 * 1000
                          );
                          return expiry <= weekFromNow && expiry > now;
                        }).length
                      }
                    </div>
                    <div className="text-xs text-gray-600">Expiring</div>
                  </div>
                </div>
              </div>

              {/* Desktop Stats */}
              <div className="mt-1 hidden lg:block w-full">
                <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-white rounded-lg border border-gray-200">
                  <div className="text-center">
                    <div className="text-3xl md:text-4xl font-bold text-blue-600">
                      {coupons.length}
                    </div>
                    <div className="text-sm text-gray-600">Total Offers</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl md:text-4xl font-bold text-green-600">
                      {
                        coupons.filter(
                          (c) => new Date(c.expiryDate) > new Date()
                        ).length
                      }
                    </div>
                    <div className="text-sm text-gray-600">Active Offers</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl md:text-4xl font-bold text-orange-600">
                      {
                        coupons.filter((c) => {
                          const expiry = new Date(c.expiryDate);
                          const now = new Date();
                          const weekFromNow = new Date(
                            now.getTime() + 7 * 24 * 60 * 60 * 1000
                          );
                          return expiry <= weekFromNow && expiry > now;
                        }).length
                      }
                    </div>
                    <div className="text-sm text-gray-600">Expiring Soon</div>
                  </div>
                </div>
              </div>
            </>
          )}


      {/* Filter Bar */}
      <div className="w-full bg-white border border-gray-200 rounded-lg p-3 sm:p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="col-span-1 md:col-span-1">
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by code or name"
              className="w-full"
            />
          </div>
          <div className="col-span-1 md:col-span-1">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-30">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="w-full">
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="expiring">Expiring soon</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="col-span-1  flex gap-2 justify-start md:justify-end">
            <Button variant="outline" onClick={resetFilters} className="w-full md:w-auto">Clear</Button>
          </div>
        </div>
        <div className="mt-2 text-xs text-gray-500">
          Showing {filteredCoupons.length} of {coupons.length} offers
        </div>
      </div>

      {/* Content Section: Responsive Coupon Card Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6 w-full">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton
              key={i}
              className="h-40 sm:h-48 md:h-52 lg:h-56 w-full rounded-xl"
            />
          ))}
        </div>
      ) : filteredCoupons.length === 0 ? (
        <div className="text-center py-8 sm:py-12 px-4 w-full">
          <div className="max-w-md mx-auto">
            <div className="w-22 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">
              No offers match your filters
            </h3>
            <p className="text-sm text-gray-600 mb-4 sm:mb-6">
              Try adjusting or resetting the filters.
            </p>
            <Button onClick={resetFilters} className="w-full sm:w-auto px-6 py-2">
              Clear Filters
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6 w-full mt-4">
          {filteredCoupons.map((coupon) => (
            <CouponCard
              key={coupon._id}
              coupon={coupon}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

        {/* Dialogs */}
        {isAddDialogOpen && (
          <AddCouponDialog
            open={isAddDialogOpen}
            onOpenChange={setIsAddDialogOpen}
          />
        )}

        {isEditDialogOpen && (
          <EditCouponDialog
            open={isEditDialogOpen}
            onOpenChange={setIsEditDialogOpen}
            couponDataID={selectedCoupon}
          />
        )}
      </div>
    </div>
  );
}
