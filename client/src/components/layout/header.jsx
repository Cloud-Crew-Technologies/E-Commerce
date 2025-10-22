import { useSidebar } from "@/lib/SidebarContext";
import { useAuth } from "@/hooks/use-auth";

export default function Header() {
  const { isOpen, isMobile, toggleSidebar } = useSidebar();
  const { user } = useAuth();

  const handleToggle = () => {
    toggleSidebar();
  };

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 bg-white shadow-sm border-b border-gray-200 ${
      isMobile ? "block" : "hidden"
    }`}>
      <div className="flex items-center justify-between h-16 px-4">
        {/* Hamburger Menu Button */}
        <button
          onClick={handleToggle}
          data-hamburger
          className="p-2 bg-blue-600 text-white rounded-lg shadow-lg hover:bg-blue-700 transition-colors duration-200"
        >
          <span className="material-icons text-xl">
            {isOpen ? "close" : "menu"}
          </span>
        </button>

        {/* Logo and Title */}
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
            <span className="material-icons text-white text-sm">store</span>
          </div>
          <h1 className="text-lg font-bold text-gray-900">Sri Sai</h1>
        </div>

        {/* User Avatar */}
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
            <span className="material-icons text-white text-sm">person</span>
          </div>
          <span className="text-sm font-medium text-gray-700 hidden sm:block">
            {user?.name || "Admin"}
          </span>
        </div>
      </div>
    </header>
  );
}