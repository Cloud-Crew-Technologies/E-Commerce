import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useLocation } from "wouter";
import { Loader2 } from "lucide-react";
import axios from "axios";
import { sendEmail } from "@/lib/sendEmail";

export default function LoginPage() {
  const { user, loginMutation } = useAuth();
  const [, setLocation] = useLocation();

  const [loginData, setLoginData] = useState({ username: "", password: "" });

  if (user) {
    setLocation("/");
    return null;
  }

  const handleLogin = async (e) => {
    e.preventDefault();

    // Use the mutation and wait for it to complete
    loginMutation.mutate(loginData, {
      onSuccess: async () => {
        try {
          // First, get user data
          const userResponse = await axios.get(
            `http://localhost:3001/api/users/${loginData.username}`
          );
          const userData = userResponse.data.data;
          console.log("User data details:", userData);

          // Store user session data
          sessionStorage.setItem("name", loginData.username);
          const storename = userData.storename || userData.storeName;
          sessionStorage.setItem("storename", storename);

          console.log("Stored name:", sessionStorage.getItem("name"));
          console.log("Stored storename:", sessionStorage.getItem("storename"));

          // Then, get store settings using the storename we just retrieved
          if (storename) {
            try {
              const storeResponse = await axios.get(
                `http://localhost:3001/api/store-settings/get/${storename}`
              );
              const storeData = storeResponse.data.data;

              if (storeData && storeData.shipping) {
                sessionStorage.setItem("shipping", storeData.shipping);
                console.log(
                  "Stored shipping:",
                  sessionStorage.getItem("shipping")
                );
              } else {
                console.warn("No shipping data found in store settings");
                // Set a default shipping value
                sessionStorage.setItem("shipping", "50");
              }
            } catch (storeError) {
              console.error("Error fetching store settings:", storeError);
              // Set a default shipping value on error
              sessionStorage.setItem("shipping", "50");
            }
          }

          // Send welcome email (consider making this non-blocking)
          sendEmail({
            subject: "Welcome to Shop Manager",
            text: `Welcome to Shop Manager! Your login was successful.`,
            html: `<h1>Welcome to Shop Manager!</h1><p>Your login was successful.</p>`,
          }).catch((error) =>
            console.error("Failed to send welcome email:", error)
          );

          // Navigate to dashboard
          setLocation("/");
        } catch (error) {
          console.error("Error during login process:", error);
          alert(
            "Login successful but failed to load user data. Please try refreshing the page."
          );
        }
      },
      onError: (error) => {
        console.error("Login error:", error);
        alert(error.message || "Login failed. Please check your credentials.");
      },
    });
  };

  return (
    <div className="min-h-screen bg-grey-50 flex">
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <span className="material-icons text-primary-500 text-4xl mr-2">
                store
              </span>
              <h1 className="text-2xl font-bold text-grey-900">
                Admin Dashboard
              </h1>
            </div>
            <p className="text-grey-600">Access your store management system</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Login</CardTitle>
              <CardDescription>
                Enter your credentials to access the admin dashboard
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    type="text"
                    placeholder="Enter your username"
                    value={loginData.username}
                    onChange={(e) =>
                      setLoginData({
                        ...loginData,
                        username: e.target.value,
                      })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={loginData.password}
                    onChange={(e) =>
                      setLoginData({
                        ...loginData,
                        password: e.target.value,
                      })
                    }
                    required
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full bg-primary-500 hover:bg-primary-600"
                  disabled={loginMutation.isPending}
                >
                  {loginMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    "Sign In"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="hidden lg:flex flex-1 bg-primary-500 text-white p-8 items-center justify-center">
        <div className="text-center max-w-md">
          <span className="material-icons text-6xl mb-6 block">dashboard</span>
          <h2 className="text-3xl font-bold mb-4">
            Sri Sai Millets Store Management
          </h2>
          <p className="text-primary-100 text-lg mb-6">
            Manage your products, track inventory, handle orders, and grow your
            business with our comprehensive admin dashboard.
          </p>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="bg-primary-600 rounded-lg p-4">
              <span className="material-icons block mb-2">inventory</span>
              <span>Product Management</span>
            </div>
            <div className="bg-primary-600 rounded-lg p-4">
              <span className="material-icons block mb-2">trending_up</span>
              <span>Sales Analytics</span>
            </div>
            <div className="bg-primary-600 rounded-lg p-4">
              <span className="material-icons block mb-2">people</span>
              <span>Customer Management</span>
            </div>
            <div className="bg-primary-600 rounded-lg p-4">
              <span className="material-icons block mb-2">local_offer</span>
              <span>Coupon System</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
