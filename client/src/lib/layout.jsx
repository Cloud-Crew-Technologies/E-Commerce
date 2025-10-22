// Layout.jsx
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { useSidebar } from "./SidebarContext";

export default function Layout({ children }) {
  const { user } = useAuth();
  const { isOpen, isMobile } = useSidebar();
  const [location] = useLocation();

  // Don't show sidebar on auth page
  if (location === "/auth") {
    return children;
  }

  // Only show sidebar for authenticated users
  if (!user) {
    return children;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <Header />

      {/* Main Content */}
      <main className={`transition-all duration-300 ${
        isMobile 
          ? "pt-16" // Add top padding for mobile header
          : isOpen 
            ? "ml-72" // Desktop: margin when sidebar is open
            : "ml-0" // Desktop: no margin when sidebar is closed
      }`}>
        <div className="min-h-screen">
          {children}
        </div>
      </main>
    </div>
  );
}
