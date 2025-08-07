import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import Dashboard from "@/pages/dashboard";
import Products from "@/pages/products";
import StockManagement from "@/pages/stock-management";
import Coupons from "@/pages/coupons";
import Orders from "@/pages/orders";
import Customers from "@/pages/customers";
import StoreSettings from "@/pages/store-settings";
import { ProtectedRoute } from "./lib/protected-route";

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
