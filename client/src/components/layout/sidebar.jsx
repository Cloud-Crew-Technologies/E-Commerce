// Sidebar.jsx
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useSidebar } from "@/lib/SidebarContext";
import { useEffect, useRef, useCallback, memo } from "react";

const menuItems = [
  { path: "/", icon: "dashboard", label: "Dashboard", badge: null },
  { path: "/categories", icon: "category", label: "Categories", badge: null },
  { path: "/types", icon: "format_list_bulleted", label: "Type", badge: null },
  { path: "/products", icon: "inventory", label: "Products", badge: null },
  {
    path: "/create-Stock",
    icon: "add_box",
    label: "Create/Add Stock",
    badge: null,
  },
  {
    path: "/stock",
    icon: "trending_down",
    label: "Stock Management",
    badge: null,
  },
  {
    path: "/grouped-products",
    icon: "view_list",
    label: "Grouped Stock",
    badge: null,
  },
  { path: "/orders", icon: "shopping_cart", label: "Orders", badge: null },
  { path: "/customers", icon: "people", label: "Customers", badge: null },
  { path: "/coupons", icon: "local_offer", label: "Offers", badge: null },
  { path: "/reports", icon: "assessment", label: "Reports", badge: null },
  { path: "/settings", icon: "settings", label: "Store Settings", badge: null },
];

// Memoized Navigation Item Component
const NavigationItem = memo(({ item, isActive, onNavigate }) => {
  const handleClick = useCallback(
    (event) => {
      event.preventDefault();
      event.stopPropagation();
      console.log("Navigation clicked:", item.path); // Debug log
      onNavigate(item.path);
    },
    [item.path, onNavigate]
  );

  return (
    <button
      onClick={handleClick}
      type="button"
      aria-current={isActive ? "page" : undefined}
      className={`group relative w-full text-left px-4 py-3 text-gray-700 rounded-xl cursor-pointer transition-all duration-300 ease-in-out flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
        isActive
          ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25"
          : "hover:bg-gray-100 hover:text-gray-900 hover:shadow-md"
      }`}
    >
      <div className="flex items-center flex-1 min-w-0">
        <span
          className={`material-icons mr-3 text-lg flex-shrink-0 transition-transform duration-200 ${
            isActive ? "text-white" : "text-gray-500 group-hover:text-gray-700"
          }`}
          aria-hidden="true"
        >
          {item.icon}
        </span>
        <span
          className={`font-medium flex-1 transition-colors duration-200 truncate ${
            isActive ? "text-white" : "text-gray-700 group-hover:text-gray-900"
          }`}
        >
          {item.label}
        </span>
      </div>
      {item.badge && (
        <span
          className={`px-2 py-1 text-xs rounded-full font-semibold flex-shrink-0 ml-2 ${
            isActive ? "bg-white/20 text-white" : "bg-blue-100 text-blue-600"
          }`}
        >
          {item.badge}
        </span>
      )}
      {isActive && (
        <div
          className="absolute right-0 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-white rounded-l-full"
          aria-hidden="true"
        ></div>
      )}
    </button>
  );
});

NavigationItem.displayName = "NavigationItem";

export default function Sidebar() {
  const [location, setLocation] = useLocation();
  const { isOpen, toggleSidebar, closeSidebar, isMobile } = useSidebar();
  const { logoutMutation, user } = useAuth();
  const sidebarRef = useRef(null);

  const handleNavigation = useCallback(
    (path) => {
      console.log("handleNavigation called with path:", path); // Debug log

      // Navigate first
      setLocation(path);

      // Then close sidebar on mobile with a small delay
      if (isMobile) {
        setTimeout(() => {
          closeSidebar();
        }, 100);
      }
    },
    [setLocation, isMobile, closeSidebar]
  );

  const handleLogout = useCallback(
    (event) => {
      event.preventDefault();
      event.stopPropagation();
      logoutMutation.mutate();
      closeSidebar();
    },
    [logoutMutation, closeSidebar]
  );

  // Handle clicking outside sidebar to close it
  useEffect(() => {
    if (!isOpen || !isMobile) return;

    const handleClickOutside = (event) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target)) {
        const hamburgerButton = event.target.closest("button[data-hamburger]");
        if (!hamburgerButton) {
          closeSidebar();
        }
      }
    };

    // Use a small delay before adding the listener to prevent immediate closure
    const timer = setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timer);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, isMobile, closeSidebar]);

  // Handle escape key to close sidebar
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        closeSidebar();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, closeSidebar]);

  return (
    <>
      {/* Desktop Toggle Button */}
      {!isMobile && (
        <button
          onClick={toggleSidebar}
          aria-label={isOpen ? "Close sidebar" : "Open sidebar"}
          aria-expanded={isOpen}
          aria-controls="main-sidebar"
          type="button"
          className={`fixed top-4 z-[95] p-2 bg-blue-600 text-white rounded-lg shadow-lg hover:bg-blue-700 transition-[left,background-color] duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
            isOpen ? "left-72" : "left-2"
          }`}
        >
          <span className="material-icons text-xl">
            {isOpen ? "chevron_left" : "menu"}
          </span>
        </button>
      )}

      {/* Overlay for mobile */}
      {isOpen && isMobile && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[90] transition-opacity duration-300"
          onClick={closeSidebar}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        id="main-sidebar"
        ref={sidebarRef}
        role="navigation"
        aria-label="Main navigation"
        aria-hidden={!isOpen}
        className={`fixed inset-y-0 left-0 z-[100] transition-transform duration-300 ease-in-out ${
          isMobile ? "w-80 pt-16" : "w-72"
        }`}
        style={{
          transform: isOpen ? "translateX(0)" : "translateX(-100%)",
        }}
      >
        <div className="h-full bg-white shadow-2xl border-r border-gray-200 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between h-16 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 border-b border-blue-500/20">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                <span
                  className="material-icons text-white text-xl"
                  aria-hidden="true"
                >
                  store
                </span>
              </div>
              <div>
                <h1 className="text-lg font-bold">Sri Sai Millets</h1>{" "}
                <p className="text-xs text-blue-100">Dashboard</p>
              </div>
            </div>
            <button
              onClick={closeSidebar}
              aria-label="Close sidebar"
              type="button"
              className="p-2 hover:bg-white/20 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-white/50"
            >
              <span className="material-icons text-white text-xl">close</span>
            </button>
          </div>

          {/* User Info */}
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                <span
                  className="material-icons text-white text-lg"
                  aria-hidden="true"
                >
                  person
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {user?.name || "Admin User"}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {user?.email || "admin@srisai.com"}
                </p>
              </div>
            </div>
          </div>

          {/* Navigation Container */}
          <div className="flex-1 overflow-y-auto">
            <nav className="px-4 py-4 space-y-2">
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
            </nav>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 bg-gray-50">
            <div className="px-4 py-3">
              <button
                onClick={handleLogout}
                disabled={logoutMutation.isPending}
                type="button"
                className="w-full flex items-center px-4 py-3 text-gray-700 rounded-xl cursor-pointer hover:bg-red-50 hover:text-red-600 transition-all duration-200 group disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              >
                <span
                  className="material-icons mr-3 text-lg group-hover:text-red-500"
                  aria-hidden="true"
                >
                  {logoutMutation.isPending ? "hourglass_empty" : "logout"}
                </span>
                <span className="font-medium">
                  {logoutMutation.isPending ? "Logging out..." : "Logout"}
                </span>
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
