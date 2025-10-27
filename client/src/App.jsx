import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import SidebarProvider from "@/lib/SidebarContext";
import Layout from "./lib/layout"; // add this import
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import LoginPage from "@/pages/login";
import RegistrationPage from "@/pages/registration";
import Dashboard from "@/pages/dashboard";
import Products from "@/pages/products";
import StockManagement from "@/pages/stock-management";
import Coupons from "@/pages/coupons";
import Orders from "@/pages/orders";
import Customers from "@/pages/customers";
import StoreSettings from "@/pages/store-settings";
import Categories from "@/pages/categories";
import Types from "@/pages/types";
import { ProtectedRoute } from "./lib/protected-route";
import GroupedProducts from "@/pages/grouped-products";
import CreateBatch from "@/pages/create-batch";
import Report from "@/pages/Report";
import ForgotPasswordPage from "./pages/PasswordReset";

function Router() {
  return (
    <Layout>
      <Switch>
        <ProtectedRoute path="/" component={Dashboard} />
        <ProtectedRoute path="/products" component={Products} />
        <ProtectedRoute path="/stock" component={StockManagement} />
        <ProtectedRoute path="/grouped-products" component={GroupedProducts} />
        <ProtectedRoute path="/create-Stock" component={CreateBatch} />
        <ProtectedRoute path="/coupons" component={Coupons} />
        <ProtectedRoute path="/orders" component={Orders} />
        <ProtectedRoute path="/customers" component={Customers} />
        <ProtectedRoute path="/reports" component={Report} />
        <ProtectedRoute path="/settings" component={StoreSettings} />
        <ProtectedRoute path="/categories" component={Categories} />
        <ProtectedRoute path="/types" component={Types} />
        <Route path="/login" component={LoginPage} />
        <ProtectedRoute path="/register" component={RegistrationPage} />
        <Route path="/auth" component={AuthPage} />
        <Route path="/forgot-password" component={ForgotPasswordPage} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SidebarProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </SidebarProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
