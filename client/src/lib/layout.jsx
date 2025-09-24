// Layout.jsx
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import Sidebar from "@/components/layout/sidebar";
import { useSidebar } from "./SidebarContext";

export default function Layout({ children }) {
  const { user } = useAuth();
  const { isOpen } = useSidebar();
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
    <div className="min-h-screen bg-grey-50">
      <Sidebar />
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}
