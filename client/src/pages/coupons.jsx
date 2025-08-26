import { useState, useEffect } from "react"
import { useQuery, useMutation } from "@tanstack/react-query"
import Sidebar from "@/components/layout/sidebar"
import Header from "@/components/layout/header"
import CouponCard from "@/components/coupons/coupon-card"
import AddCouponDialog from "@/components/coupons/add-coupon-dialog"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { apiRequest, queryClient } from "@/lib/queryClient"
import { useToast } from "@/hooks/use-toast"
import axios from "axios"

export default function Coupons() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [coupons,setCoupons] = useState([])
  const [isLoading,setIsLoading] = useState(false)
  const { toast } = useToast()

  // const { data: coupons, isLoading } = useQuery({
  //   queryKey: ["/api/coupons/getall"],
  // })

  useEffect(() => {
    fetchCategories();
  }, [100]);

  const fetchCategories = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(
        "http://localhost:3000/api/coupons/getall"
      );

      // Ensure we set an array - handle different response structures
      const categoryData = response.data;
      if (Array.isArray(categoryData)) {
        setCoupons(categoryData);
      } else if (categoryData && Array.isArray(categoryData.data)) {
        setCoupons(categoryData.data);
      } else {
        console.warn("Unexpected response structure:", categoryData);
        setCoupons([]);
      }
    } catch (error) {
      console.error("Error fetching Products:", error);
      setCoupons([]);
      toast({
        title: "Error",
        description: "Failed to load Products",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };


  const deleteCouponMutation = useMutation({
    mutationFn: async (couponId) => {
      await apiRequest("DELETE", `/api/coupons/${couponId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/coupons/getall"] })
      toast({
        title: "Coupon deleted",
        description: "Coupon has been successfully deleted.",
      })
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    },
  })

  return (
    <div className="flex min-h-screen bg-grey-50">
      <Sidebar />
      <div className="ml-64 flex-1">
        <Header title="Coupon Management" subtitle="Create and manage discount coupons" />
        <main className="p-6">
          <div className="bg-white rounded-lg material-elevation-2 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-medium text-grey-900">Active Coupons</h3>
              <Button onClick={() => setIsAddDialogOpen(true)} className="bg-secondary-500 hover:bg-secondary-600 text-white">
                <span className="material-icons mr-2">add</span>
                Create Coupon
              </Button>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="border border-grey-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <Skeleton className="h-6 w-20" />
                      <Skeleton className="h-4 w-12" />
                    </div>
                    <Skeleton className="h-5 w-32 mb-2" />
                    <div className="space-y-1">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-4 w-28" />
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Skeleton className="h-8 flex-1" />
                      <Skeleton className="h-8 flex-1" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {coupons?.map((coupon) => (
                  <CouponCard
                    key={coupon.id}
                    coupon={coupon}
                    onDelete={(id) => deleteCouponMutation.mutate(id)}
                    onEdit={() => {}}
                  />
                ))}
                {(!coupons || coupons.length === 0) && (
                  <div className="col-span-full text-center py-12">
                    <span className="material-icons text-6xl text-grey-400 mb-4 block">local_offer</span>
                    <p className="text-grey-500 text-lg mb-2">No coupons created yet</p>
                    <p className="text-grey-400">Create your first coupon to boost sales</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>

      <AddCouponDialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen} />
    </div>
  )
}

