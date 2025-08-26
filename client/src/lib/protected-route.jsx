import { useEffect } from "react"
import { useAuth } from "@/hooks/use-auth";
import { Route, useLocation } from "wouter";

export function ProtectedRoute({ path, component: Component }) {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && !user) {
      setLocation("/auth");
    }
  }, [isLoading, user, setLocation]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return <Route path={path} component={Component} />;
}