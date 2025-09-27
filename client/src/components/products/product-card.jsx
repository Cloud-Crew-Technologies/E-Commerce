import { Button } from "@/components/ui/button";
import EditProductDialog from "./producteditwoqty";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";

export default function ProductCard({ product, onEdit, onDelete }) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editProductId, setEditProductId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const getStockStatusClasses = () => {
    if (product.quantity === 0) {
      return "bg-red-50 text-red-700 border-red-200";
    } else if (product.quantity <= 10) {
      return "bg-orange-50 text-orange-700 border-orange-200";
    } else {
      return "bg-green-50 text-green-700 border-green-200";
    }
  };

  const getStockText = () => {
    if (product.quantity === 0) return "Out of stock";
    if (product.quantity <= 10) return `Low: ${product.quantity}`;
    return `In stock: ${product.quantity}`;
  };

  const edit = (id) => {
    setIsAddDialogOpen(true);
    setEditProductId(id);
  };

  // Function to check if product can be deleted
  const checkProductDeletion = async (productId) => {
    setIsDeleting(true);

    try {
      // Check batch quantities
      const batchResponse = await fetch(
        "http://localhost:3001/api/batch/get"
      );
      const batchData = await batchResponse.json();

      if (batchData.success && batchData.data) {
        // Check if product has any quantity in any batch
        const hasQuantity = batchData.data.some((batch) =>
          batch.products.some(
            (p) => p.productID === productId && p.quantity > 0
          )
        );

        if (hasQuantity) {
          toast({
            title: "Cannot Delete Product",
            description:
              "Product still has quantity in inventory.",
            variant: "destructive",
          });
          setIsDeleting(false);
          return;
        }
      }

      // Check active orders
      const ordersResponse = await fetch(
        "http://localhost:3001/api/orders/get"
      );
      const ordersData = await ordersResponse.json();

      if (ordersData.success && ordersData.data) {
        // Check if product exists in any active orders (ordered, processing, shipped)
        const activeStatuses = ["ordered", "processing", "shipped"];
        const isInActiveOrder = ordersData.data.some(
          (order) =>
            activeStatuses.includes(order.status.toLowerCase()) &&
            order.items.some((item) => item.productID === productId)
        );

        if (isInActiveOrder) {
          toast({
            title: "Cannot Delete Product",
            description:
              "Product is part of active orders (ordered/processing/shipped). Please wait for orders to be completed.",
            variant: "destructive",
          });
          setIsDeleting(false);
          return;
        }
      }

      // If all checks pass, proceed with deletion
      const confirmDelete = window.confirm(
        "Are you sure you want to delete this product? This action cannot be undone."
      );
      if (confirmDelete) {
        onDelete(productId);
      }
    } catch (error) {
      console.error("Error checking product deletion validity:", error);
      toast({
        title: "Error",
        description: "Error checking product status. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDelete = () => {
    const productId = product?.productID || product?._id || product?.id;
    if (productId) {
      checkProductDeletion(productId);
    }
  };

  return (
    <div className="group bg-white border border-gray-200 rounded-xl p-4 sm:p-5 hover:shadow-xl shadow-md transition-all duration-300 w-full h-full flex flex-col">
      {/* Image */}
      {product.imageUrl ? (
        <img
          src={product.imageUrl}
          alt={product.name}
          className="w-full h-30 sm:h-28 object-cover rounded-lg mb-3"
          loading="lazy"
        />
      ) : (
        <div className="w-full h-32 sm:h-40 bg-grey-200 rounded-lg mb-4 flex items-center justify-center">
          <span className="material-icons text-grey-400 text-4xl">image</span>
        </div>
      )}

      {/* Title & Meta */}
      <div className="flex-1">
        <h4 className="font-semibold text-grey-900 text-base sm:text-lg line-clamp-2 mb-1">
          {product.name}
        </h4>
        <div className="flex flex-wrap gap-2 text-xs sm:text-sm mb-3">
          {product.category && (
            <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
              {product.category}
            </span>
          )}
          {product.type && (
            <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
              {product.type}
            </span>
          )}
        </div>

        {/* Prices */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
            <div className="text-xs text-gray-500">Retail Price</div>
            <div className="text-base sm:text-lg font-bold text-primary-500 truncate">
              ₹{product.rprice}
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
            <div className="text-xs text-gray-500">Wholesale Price</div>
            <div className="text-base sm:text-lg font-bold text-primary-500 truncate">
              ₹{product.wprice}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 mt-auto">
          <Button
            onClick={() => edit(product?._id || product?.id)}
            className="flex-1 bg-primary-500 hover:bg-primary-600 text-white py-2 rounded text-sm sm:text-base"
          >
            Edit
          </Button>
          <Button
            onClick={handleDelete}
            variant="destructive"
            className="flex-1 py-2 rounded text-sm sm:text-base"
            disabled={isDeleting}
          >
            {isDeleting ? "Checking..." : "Delete"}
          </Button>
        </div>
      </div>

      {/* Edit Dialog */}
      <EditProductDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        productId={editProductId}
      />
    </div>
  );
}
