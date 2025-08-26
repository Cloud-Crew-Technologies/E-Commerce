import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";

const menuItems = [
  { path: "/", icon: "dashboard", label: "Dashboard" },
  { path: "/products", icon: "inventory", label: "Products" },
  { path: "/categories", icon: "category", label: "Categories" },
  { path: "/stock", icon: "trending_down", label: "Stock Management" },
  { path: "/coupons", icon: "local_offer", label: "Coupons" },
  { path: "/orders", icon: "shopping_cart", label: "Orders" },
  { path: "/customers", icon: "people", label: "Customers" },
  { path: "/settings", icon: "settings", label: "Store Settings" },
];

export default function Sidebar() {
  const [location, setLocation] = useLocation();
  const { logoutMutation } = useAuth();

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <div className="fixed inset-y-0 left-0 w-64 bg-white material-elevation-4 z-50">
      <div className="flex items-center justify-center h-16 bg-primary-500 text-white">
        <span className="material-icons mr-2">store</span>
        <h1 className="text-lg font-medium">SHIS Dashboard</h1>
      </div>
      
      <nav className="mt-8">
        <div className="px-4 space-y-2">
          {menuItems.map((item) => {
            const isActive = location === item.path;
            return (
              <div
                key={item.path}
                onClick={() => setLocation(item.path)}
                className={`nav-item flex items-center px-4 py-3 text-grey-700 rounded-lg cursor-pointer ${
                  isActive ? "active" : ""
                }`}
              >
                <span className="material-icons mr-3">{item.icon}</span>
                <span className="font-medium">{item.label}</span>
              </div>
            );
          })}
        </div>
        
        <div className="absolute bottom-4 left-4 right-4">
          <div
            onClick={handleLogout}
            className="flex items-center px-4 py-3 text-grey-700 rounded-lg cursor-pointer border-t border-grey-200 hover:bg-grey-100 transition-colors"
          >
            <span className="material-icons mr-3">logout</span>
            <span className="font-medium">Logout</span>
          </div>
        </div>
      </nav>
    </div>
  );
}