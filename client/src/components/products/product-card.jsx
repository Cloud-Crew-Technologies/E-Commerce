import { Button } from "@/components/ui/button";

export default function ProductCard({ product, onEdit, onDelete }) {
  const getStockStatus = () => {
    if (product.quantity === 0) {
      return "status-chip bg-red-100 text-red-800";
    } else if (product.quantity <= 10) {
      return "status-chip status-low-stock";
    } else {
      return "status-chip status-active";
    }
  };

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
          className="w-full h-32 object-cover rounded-lg mb-3"
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
          <span className="text-lg font-bold text-primary-500">₹{product.price}</span>
          <span className={getStockStatus()}>{getStockText()}</span>
        </div>
        
        {/* Barcode Display */}
        <div className="bg-white p-2 rounded border mt-3">
          <p className="text-xs text-grey-600 mb-1">Barcode:</p>
          <div className="flex items-center justify-center bg-grey-100 h-8 rounded">
            <span className="text-xs font-mono">{product.barcode || "||||| |||| |||||"}</span>
          </div>
          <p className="text-xs text-center text-grey-500 mt-1">SKU: {product.sku}</p>
        </div>
        
        <div className="flex gap-2 mt-3">
          <Button
            onClick={() => onEdit(product.id)}
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
    </div>
  );
} 