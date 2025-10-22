// SidebarContext.jsx
import { createContext, useContext, useState, useEffect, useCallback } from "react";

const SidebarContext = createContext();

export default function SidebarProvider({ children }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Check if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
    };

    // Initial check
    checkMobile();
    
    // Add resize listener
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []); // Remove isOpen dependency to prevent multiple checks

  const toggleSidebar = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  const closeSidebar = useCallback(() => {
    setIsOpen(false);
  }, []);

  const openSidebar = useCallback(() => {
    setIsOpen(true);
  }, []);

  // Debug: Log when state actually changes (disabled in production)
  // useEffect(() => {
  //   console.log('Sidebar state changed - isOpen:', isOpen, 'isMobile:', isMobile);
  // }, [isOpen, isMobile]);

  // Close sidebar when switching to mobile if it was open
  // Removed this useEffect as it was causing infinite loop
  // The sidebar should be allowed to stay open on mobile when toggled

  return (
    <SidebarContext.Provider value={{ 
      isOpen, 
      toggleSidebar, 
      closeSidebar, 
      openSidebar, 
      isMobile 
    }}>
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
      isMobile: false
    };
  }
  return context;
}