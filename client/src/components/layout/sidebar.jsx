import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useSidebar } from "@/lib/SidebarContext";
import { useEffect, useRef, useCallback, useMemo, memo } from "react";

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
  { path: "/coupons", icon: "local_offer", label: "Offers" },
  { path: "/reports", icon: "assessment", label: "Reports" },
  { path: "/settings", icon: "settings", label: "Store Settings" },
];

// Memoized Navigation Item Component
const NavigationItem = memo(({ item, isActive, onNavigate }) => {
  const handleClick = useCallback((event) => {
    onNavigate(item.path, event);
  }, [item.path, onNavigate]);

  return (
    <button
      onClick={handleClick}
      className={`w-full text-left px-4 py-3 text-grey-700 rounded-lg cursor-pointer transition-all duration-200 ease-in-out transform hover:scale-[1.02] flex items-center ${
        isActive
          ? "bg-primary-100 text-primary-700 shadow-sm"
          : "hover:bg-primary-50 hover:text-primary-600 hover:shadow-sm"
      }`}
    >
      <span className="material-icons mr-3 text-lg flex-shrink-0">
        {item.icon}
      </span>
      <span className="font-medium flex-1">
        {item.label}
      </span>
    </button>
  );
});

NavigationItem.displayName = 'NavigationItem';

export default function Sidebar() {
  const [location, setLocation] = useLocation();
  const { isOpen, toggleSidebar } = useSidebar();
  const { logoutMutation } = useAuth();
  const sidebarRef = useRef(null);

  const handleLogout = useCallback((event) => {
    event.stopPropagation();
    logoutMutation.mutate();
  }, [logoutMutation]);

  const handleNavigation = useCallback((path, event) => {
    event.stopPropagation();
    setLocation(path);
  }, [setLocation]);

  // Handle clicking outside sidebar to close it
  const handleClickOutside = useCallback((event) => {
    if (
      isOpen &&
      sidebarRef.current &&
      !sidebarRef.current.contains(event.target)
    ) {
      const hamburgerButton = event.target.closest("button[data-hamburger]");
      if (!hamburgerButton) {
        toggleSidebar();
      }
    }
  }, [isOpen, toggleSidebar]);

  useEffect(() => {
    if (!isOpen) return;

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, handleClickOutside]);

  return (
    <>
      {/* Overlay for mobile and desktop - positioned behind sidebar */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={toggleSidebar}
          style={{ pointerEvents: "auto" }}
        />
      )}

      {/* Hamburger Button */}
      <button
        onClick={toggleSidebar}
        data-hamburger
        className="fixed top-2 left-4 z-50 p-2 bg-primary-500 text-white rounded-md shadow-lg hover:bg-primary-600 transition-colors duration-300"
      >
        <span className="material-icons">{isOpen ? "close" : "menu"}</span>
      </button>

      {/* Sidebar */}
      <div
        ref={sidebarRef}
        className={`fixed inset-y-0 left-0 w-64 sm:w-72 bg-white material-elevation-4 z-40 transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between h-16 bg-primary-500 text-white px-4 text-right">
          <span className="material-icons text-primary-500 text-4xl mr-2">
            store
          </span>
          <h1 className="text-lg font-medium flex-1 truncate text-right">
            Sri Sai Dashboard
          </h1>
          <button
            onClick={toggleSidebar}
            className="md:hidden p-2 hover:bg-primary-600 rounded transition-colors flex-shrink-0 ml-2"
          >
            <span className="material-icons text-white text-xl">close</span>
          </button>
        </div>

        {/* Navigation Container with proper flex layout */}
        <div className="flex flex-col h-[calc(100vh-4rem)]">
          {/* Main Navigation */}
          <nav className="flex-1 overflow-y-auto">
            <div className="px-4 py-2 space-y-1">
              {menuItems.map((item) => {
                const isActive = location === item.path;
                return (
                  <NavigationItem
                    key={item.path}
                    item={item}
                    isActive={isActive}
                    onNavigate={handleNavigation}
                  />
                );
              })}
            </div>
          </nav>

          {/* Logout Button - Fixed at bottom */}
          <div className="flex-shrink-0 border-t border-grey-200 bg-white">
            <div className="px-4 py-3">
              <button
                onClick={handleLogout}
                className="w-full flex items-center px-4 py-3 text-grey-700 rounded-lg cursor-pointer hover:bg-grey-100 transition-colors"
              >
                <span className="material-icons mr-3 text-lg">logout</span>
                <span className="font-medium">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
