import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useState, useEffect } from "react";
import EditCouponDialog from "./edit-coupon";
import axios from "axios";

export default function CouponCard({ coupon, onEdit, onDelete }) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState(null);
  const [products, setProducts] = useState([]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await axios.get(
          "https://saiapi.skillhiveinnovations.com/api/products/get"
        );
        
        if (response.data && response.data.success && Array.isArray(response.data.data)) {
          setProducts(response.data.data);
        } else if (response.data && Array.isArray(response.data.products)) {
          setProducts(response.data.products);
        } else if (Array.isArray(response.data)) {
          setProducts(response.data);
        }
      } catch (error) {
        console.error("Error fetching products:", error);
      }
    };
    fetchProducts();
  }, []);

  const isExpired = new Date(coupon.expiryDate) < new Date();
  const isExpiringSoon =
    new Date(coupon.expiryDate) <=
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const getBadgeColor = () => {
    if (isExpired) return "bg-red-100 text-red-800 border-red-300";
    if (isExpiringSoon)
      return "bg-orange-100 text-orange-800 border-orange-300";
    if (coupon.code.includes("SAVE"))
      return "bg-green-100 text-green-800 border-green-300";
    if (coupon.code.includes("WELCOME"))
      return "bg-blue-100 text-blue-800 border-blue-300";
    return "bg-purple-100 text-purple-800 border-purple-300";
  };

  const getStatusText = () => {
    if (isExpired) return "Expired";
    if (isExpiringSoon) return "Expiring Soon";
    return "Active";
  };

  const handleEditClick = () => {
    setSelectedCoupon(coupon._id);
    setIsEditDialogOpen(true);
  };

  const usagePercent = Math.min(
    100,
    Math.round(
      ((Number(coupon.usageCount) || 0) / Math.max(1, Number(coupon.usageLimit) || 1)) * 100
    )
  );

  return (
    <>
      <div className="group coupon-card bg-white border border-gray-200 rounded-xl shadow-lg hover:shadow-2xl transition-transform duration-300 p-5 sm:p-6 md:p-8 h-full w-full flex flex-col justify-between min-h-[200px] hover:-translate-y-0.5">
        {/* Header strip */}
        <div className="mb-4 rounded-lg p-3 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border border-gray-100 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-lg sm:text-xl md:text-2xl font-extrabold tracking-tight break-words text-gray-900">
              {coupon.code}
            </h3>
            <p className="text-gray-700 mt-1 text-sm sm:text-base line-clamp-2">
              {coupon.name}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={`border ${getBadgeColor()} font-medium px-3 py-1 rounded-full text-xs sm:text-sm`}>{getStatusText()}</Badge>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-start gap-5 sm:gap-6">
          {/* Left Info Section */}
          <div className="flex-grow min-w-0">
            {/* Discount and Usage */}
            <div className="flex flex-wrap items-center gap-3 mb-4">
              {coupon.offerType === "discount" ? (
                <span className="bg-green-50 text-green-700 px-3 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap shadow-sm">
                  {coupon.discount}% OFF
                </span>
              ) : ( // product offer
                <div className="flex flex-col gap-2">
                  <span className="bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap shadow-sm">
                    Buy: {products.find(p => p._id === coupon.buyProduct)?.name} ({coupon.buyProductQuantity})
                  </span>
                  <span className="bg-purple-50 text-purple-700 px-3 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap shadow-sm">
                    Get: {products.find(p => p._id === coupon.getProduct)?.name} ({coupon.getProductQuantity})
                  </span>
                </div>
              )}

              <span className="bg-gray-100 text-gray-800 px-3 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap shadow-sm">
                Used: {coupon.usageCount} / {coupon.usageLimit}
              </span>
            </div>

            {/* Usage progress */}
            <div className="mb-4 w-full">
              <div className="flex items-center justify-between mb-2 text-xs sm:text-sm text-gray-600">
                <span>Usage</span>
                <span>{usagePercent}%</span>
              </div>
              <Progress value={usagePercent} className="h-2" />
            </div>

            {/* Expiry */}
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <span className="text-gray-500 whitespace-nowrap">
                Expires: {new Date(coupon.expiryDate).toLocaleDateString()}
              </span>
            </div>
          </div>

          {/* Right Actions Section */}
          <div className="flex flex-row sm:flex-col gap-3 items-stretch sm:items-end w-full sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              className="w-full sm:w-auto min-w-[104px] transition-colors duration-200 hover:bg-blue-100 focus:ring-2 focus:ring-blue-200 px-4 py-2 text-sm"
              onClick={handleEditClick}
            >
              Edit
            </Button>
            <Button
              variant="destructive"
              size="sm"
              className="w-full sm:w-auto min-w-[104px] transition-colors duration-200 hover:bg-red-100 focus:ring-2 focus:ring-red-200 px-4 py-2 text-sm"
              onClick={() => onDelete(coupon._id)}
            >
              Delete
            </Button>
          </div>
        </div>
      </div>

      {isEditDialogOpen && (
        <EditCouponDialog
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          couponDataID={selectedCoupon}
        />
      )}
    </>
  );
}
