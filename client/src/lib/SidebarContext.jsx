// SidebarContext.jsx
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";

const SidebarContext = createContext();

export default function SidebarProvider({ children }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const resizeTimeoutRef = useRef(null);

  // Check if device is mobile with debouncing
  useEffect(() => {
    const checkMobile = () => {
      // SSR guard
      if (typeof window === "undefined") return;

      const mobile = window.innerWidth < 768;
      setIsMobile((prev) => {
        // Only update if value actually changed
        if (prev !== mobile) return mobile;
        return prev;
      });
    };

    // Initial check
    checkMobile();

    // Debounced resize handler
    const debouncedCheck = () => {
      clearTimeout(resizeTimeoutRef.current);
      resizeTimeoutRef.current = setTimeout(checkMobile, 150);
    };

    window.addEventListener("resize", debouncedCheck);

    return () => {
      clearTimeout(resizeTimeoutRef.current);
      window.removeEventListener("resize", debouncedCheck);
    };
  }, []);

  // Auto-close sidebar when switching to mobile (optional UX enhancement)
  // Disabled by default - uncomment if you want auto-close behavior
  /*
  useEffect(() => {
    if (isMobile && isOpen) {
      // Close sidebar when resizing to mobile to prevent overlay confusion
      const timer = setTimeout(() => {
        setIsOpen(false);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isMobile, isOpen]);
  */

  const toggleSidebar = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const closeSidebar = useCallback(() => {
    setIsOpen(false);
  }, []);

  const openSidebar = useCallback(() => {
    setIsOpen(true);
  }, []);

  return (
    <SidebarContext.Provider
      value={{
        isOpen,
        toggleSidebar,
        closeSidebar,
        openSidebar,
        isMobile,
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (!context) {
    console.error("useSidebar must be used within a SidebarProvider");
    // Return a default context to prevent crashes
    return {
      isOpen: false,
      toggleSidebar: () => {},
      closeSidebar: () => {},
      openSidebar: () => {},
      isMobile: false,
    };
  }
  return context;
}
