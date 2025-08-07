import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient.js";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth.jsx";
import NotFound from "@/pages/not-found.jsx";
import AuthPage from "@/pages/auth-page.jsx";
import Dashboard from "@/pages/dashboard.jsx";
import Products from "@/pages/products.jsx";
import StockManagement from "@/pages/stock-management.jsx";
import Coupons from "@/pages/coupons.jsx";
import Orders from "@/pages/orders.jsx";
import Customers from "@/pages/customers.jsx";
import StoreSettings from "@/pages/store-settings.jsx";
import { ProtectedRoute } from "./lib/protected-route.jsx";

function Router() {
  return (
    <Switch>
      <ProtectedRoute path="/" component={Dashboard} />
      <ProtectedRoute path="/products" component={Products} />
      <ProtectedRoute path="/stock" component={StockManagement} />
      <ProtectedRoute path="/coupons" component={Coupons} />
      <ProtectedRoute path="/orders" component={Orders} />
      <ProtectedRoute path="/customers" component={Customers} />
      <ProtectedRoute path="/settings" component={StoreSettings} />
      <Route path="/auth" component={AuthPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;