import { Button } from "@/components/ui/button";
import EditProductDialog from "./Product Edit";
import { useState, useEffect } from "react";

export default function ProductCard({ product, onEdit, onDelete }) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editProductId, setEditProductId] = useState(null);
  const getStockStatus = () => {
    if (product.quantity === 0) {
      return "status-chip bg-red-100 text-red-800";
    } else if (product.quantity <= 10) {
      return "status-chip status-low-stock";
    } else {
      return "status-chip status-active";
    }
  };

  const edit = (id) => {
    setIsAddDialogOpen(true);
    setEditProductId(product._id); // Use the current product's ID
  }

  const getStockText = () => {
    if (product.quantity === 0) return "Out of Stock";
    if (product.quantity <= 10) return `Low: ${product.quantity}`;
    return `In Stock: ${product.quantity}`;
  };

  return (
    <div className="bg-grey-50 rounded-lg p-4 hover:shadow-lg transition-shadow">
      {product.imageUrl ? (
        <img
          src={product.imageUrl}
          alt={product.name}
          className="w-full h-40 object-cover rounded-lg mb-3"
        />
      ) : (
        <div className="w-full h-32 bg-grey-200 rounded-lg mb-3 flex items-center justify-center">
          <span className="material-icons text-grey-400 text-4xl">image</span>
        </div>
      )}

      <div className="space-y-2">
        <h4 className="font-medium text-grey-900">{product.name}</h4>
        <p className="text-sm text-grey-600">Category: {product.category}</p>
        <div className="flex justify-between items-center">
          <span className="text-lg font-bold text-primary-500">
            ₹{product.price}
          </span>
          <span className={getStockStatus()}>{getStockText()}</span>
        </div>

        {/* Barcode Display */}

        <div className="flex gap-2 mt-3">
          <Button
            onClick={() => edit(onEdit)}
            className="flex-1 bg-primary-500 hover:bg-primary-600 text-white py-1 px-3 rounded text-sm"
          >
            Edit
          </Button>
          <Button
            onClick={() => onDelete(product.id)}
            variant="destructive"
            className="flex-1 py-1 px-3 rounded text-sm"
          >
            Delete
          </Button>
        </div>
      </div>
      <EditProductDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        productId={editProductId}
      />
    </div>
  );
}
