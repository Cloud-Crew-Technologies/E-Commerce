import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function CouponCard({ coupon, onEdit, onDelete }) {
  const isExpired = new Date(coupon.expiryDate) < new Date();
  const isExpiringSoon = new Date(coupon.expiryDate) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  
  const getBadgeColor = () => {
    if (isExpired) return "bg-red-100 text-red-800";
    if (isExpiringSoon) return "bg-orange-100 text-orange-800";
    if (coupon.code.includes("SAVE")) return "bg-green-100 text-green-800";
    if (coupon.code.includes("WELCOME")) return "bg-blue-100 text-blue-800";
    return "bg-purple-100 text-purple-800";
  };

  const getStatusText = () => {
    if (isExpired) return "Expired";
    if (isExpiringSoon) return "Expiring Soon";
    return "Active";
  };

  const getStatusColor = () => {
    if (isExpired) return "text-red-500";
    if (isExpiringSoon) return "text-orange-500";
    return "text-grey-500";
  };

  return (
    <div className="border border-grey-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <Badge className={`px-3 py-1 rounded-full text-sm font-medium ${getBadgeColor()}`}>
          {coupon.code}
        </Badge>
        <span className={`text-sm ${getStatusColor()}`}>{getStatusText()}</span>
      </div>
      
      <h4 className="font-medium text-grey-900 mb-2">{coupon.name}</h4>
      
      <div className="space-y-1 text-sm text-grey-600">
        <p>Discount: {coupon.discount}%</p>
        <p>Used: {coupon.usageCount}/{coupon.usageLimit}</p>
        <p>Expires: {new Date(coupon.expiryDate).toLocaleDateString()}</p>
      </div>
      
      <div className="flex gap-2 mt-4">
        <Button
          onClick={() => onEdit(coupon.id)}
          variant="outline"
          className="flex-1 text-primary-500 border-primary-500 hover:bg-primary-50"
        >
          Edit
        </Button>
        <Button
          onClick={() => onDelete(coupon.id)}
          variant="outline"
          className="flex-1 text-red-500 border-red-500 hover:bg-red-50"
        >
          Delete
        </Button>
      </div>
    </div>
  );
} 