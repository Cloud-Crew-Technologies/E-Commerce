import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useSidebar } from "@/lib/SidebarContext";

const menuItems = [
  { path: "/", icon: "dashboard", label: "Dashboard" },
  { path: "/categories", icon: "category", label: "Categories" },
  { path: "/types", icon: "format_list_bulleted", label: "Type" },
  { path: "/products", icon: "inventory", label: "Products" },
  { path: "/create-Stock", icon: "add_box", label: "Create/Add Stock" },
  { path: "/stock", icon: "trending_down", label: "Stock Management" },
  { path: "/grouped-products", icon: "view_list", label: "Grouped Stock" },
  { path: "/orders", icon: "shopping_cart", label: "Orders" },
  { path: "/customers", icon: "people", label: "Customers" },
  { path: "/settings", icon: "settings", label: "Store Settings" },
];

export default function Sidebar() {
  const [location, setLocation] = useLocation();
  const { isOpen, toggleSidebar } = useSidebar(); // use context instead of local state
  const { logoutMutation } = useAuth();

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <>
      {/* Hamburger Button */}
      <button
        onClick={toggleSidebar}
        className="fixed top-2 left-4 z-50 p-2 bg-primary-500 text-white rounded-md shadow-lg hover:bg-primary-600 transition-colors duration-300"
      >
        <span className="material-icons">{isOpen ? "close" : "menu"}</span>
      </button>

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 w-64 bg-white material-elevation-4 z-40 transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-center h-16 bg-primary-500 text-white ">
          <h1 className="text-lg font-medium ml-3">Sri Sai Dashboard</h1>
        </div>

        <nav className="mt-2">
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

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
          onClick={toggleSidebar}
        />
      )}
    </>
  );
}
