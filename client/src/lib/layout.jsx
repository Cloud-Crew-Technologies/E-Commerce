// Layout.jsx
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { useSidebar } from "./SidebarContext";

export default function Layout({ children }) {
  const { user, isLoading } = useAuth();
  const { isOpen, isMobile } = useSidebar();
  const [location] = useLocation();

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't show sidebar on auth page or for non-authenticated users
  if (location === "/auth" || !user) {
    return <div className="min-h-screen bg-gray-50">{children}</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <Header />

      {/* Main Content */}
      <main
        role="main"
        aria-label="Main content"
        className={`transition-all duration-300 ease-in-out ${
          isMobile
            ? "pt-16" // Add top padding for mobile header
            : isOpen
            ? "ml-72" // Desktop: margin when sidebar is open
            : "ml-0" // Desktop: no margin when sidebar is closed
        }`}
      >
        <div className="min-h-screen">{children}</div>
      </main>
    </div>
  );
}
