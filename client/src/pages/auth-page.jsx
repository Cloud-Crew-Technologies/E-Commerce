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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLocation } from "wouter";
import { Loader2 } from "lucide-react";
import axios from "axios";
import { sendEmail } from "@/lib/sendEmail";

export default function AuthPage() {
  const { user, loginMutation, registerMutation } = useAuth();
  const [, setLocation] = useLocation();

  const [loginData, setLoginData] = useState({ username: "", password: "" });
  const [registerData, setRegisterData] = useState({
    username: "",
    password: "",
    confirmPassword: "",
    storeName: "",
    storeaddress: "",
    mobileNumber: "",
    email: "",
  });

  if (user) {
    setLocation("/");
    return null;
  }

  const handleLogin = (e) => {
    e.preventDefault();
    loginMutation.mutate(loginData, {
      onSuccess: () => setLocation("/"),
      onError: (error) => {
        console.error("Login error:", error);
        alert(error.message || "Login failed. Please check your credentials.");
      },
    });
    axios
      .get(`https://texapi.skillhiveinnovations.com/api/users/${loginData.username}`)
      .then((response) => {
        const userData = response.data.data;
        console.log("User data details:", userData); // Debug log to see exact data structure
        sessionStorage.setItem("name", loginData.username);
        sessionStorage.setItem(
          "storename",
          userData.storename || userData.storeName
        );
        console.log("Stored name:", sessionStorage.getItem("name"));
        console.log("Stored storename:", sessionStorage.getItem("storename"));
      });
    // Send welcome email
    sendEmail({
      subject: "Welcome to Shop Manager",
      text: `Welcome to Shop Manager! Your login was successful.`,
      html: `<h1>Welcome to Shop Manager!</h1><p>Your login was successful.</p>`,
    }).catch((error) => console.error("Failed to send welcome email:", error));
  };

  const handleRegister = (e) => {
    e.preventDefault();
    if (registerData.password !== registerData.confirmPassword) {
      return;
    }
    axios
      .post("https://texapi.skillhiveinnovations.com/api/users/create", {
        username: registerData.username,
        password: registerData.password,
        storeName: registerData.storeName,
        role: "admin",
      })
      .then(() => {
        setLocation("/");
      })
      .catch((error) => {
        console.error("Registration failed:", error);
        alert("Registration failed. Please try again.");
      });
    axios
      .post("https://texapi.skillhiveinnovations.com/api/store-settings/create", {
        storeName: registerData.storeName,
        description: "",
        address: registerData.storeaddress,
        contactEmail: registerData.email,
        contactPhone: registerData.mobileNumber,
      })
      .then(() => {
        console.log("stored");
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

          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
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
                      <a
                        href="/forgot-password"
                        className="text-sm text-primary-500 hover:underline text-right block"
                      >
                        Forgot password?
                      </a>
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
            </TabsContent>

            <TabsContent value="register">
              <Card>
                <CardHeader>
                  <CardTitle>Register</CardTitle>
                  <CardDescription>Create a new admin account</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleRegister} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="reg-username">Username</Label>
                      <Input
                        id="reg-username"
                        type="text"
                        placeholder="Choose a username"
                        value={registerData.username}
                        onChange={(e) =>
                          setRegisterData({
                            ...registerData,
                            username: e.target.value,
                          })
                        }
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reg-password">Password</Label>
                      <Input
                        id="reg-password"
                        type="password"
                        placeholder="Create a password"
                        value={registerData.password}
                        onChange={(e) =>
                          setRegisterData({
                            ...registerData,
                            password: e.target.value,
                          })
                        }
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirm-password">Confirm Password</Label>
                      <Input
                        id="confirm-password"
                        type="password"
                        placeholder="Confirm your password"
                        value={registerData.confirmPassword}
                        onChange={(e) =>
                          setRegisterData({
                            ...registerData,
                            confirmPassword: e.target.value,
                          })
                        }
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm text-grey-600">
                        Store Name
                        <Input
                          id="Store Name"
                          type="text"
                          placeholder="Store Name"
                          value={registerData.storeName}
                          onChange={(e) =>
                            setRegisterData({
                              ...registerData,
                              storeName: e.target.value,
                            })
                          }
                          required
                        />
                      </Label>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm text-grey-600">
                        Store Address
                        <Input
                          id="Store Address"
                          type="text"
                          placeholder="Store Address"
                          value={registerData.storeaddress}
                          onChange={(e) =>
                            setRegisterData({
                              ...registerData,
                              storeaddress: e.target.value,
                            })
                          }
                          required
                        />
                      </Label>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm text-grey-600">
                        Mobile Number
                        <Input
                          id="Mobile Number"
                          type="text"
                          placeholder="Mobile Number"
                          value={registerData.mobileNumber}
                          onChange={(e) =>
                            setRegisterData({
                              ...registerData,
                              mobileNumber: e.target.value,
                            })
                          }
                          required
                        />
                      </Label>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm text-grey-600">
                        Email
                        <Input
                          id="Email"
                          type="text"
                          placeholder="Email"
                          value={registerData.email}
                          onChange={(e) =>
                            setRegisterData({
                              ...registerData,
                              email: e.target.value,
                            })
                          }
                          required
                        />
                      </Label>
                    </div>
                    <Button
                      type="submit"
                      className="w-full bg-primary-500 hover:bg-primary-600"
                      disabled={registerMutation.isPending}
                    >
                      {registerMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating account...
                        </>
                      ) : (
                        "Create Account"
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <div className="hidden lg:flex flex-1 bg-primary-500 text-white p-8 items-center justify-center">
        <div className="text-center max-w-md">
          <span className="material-icons text-6xl mb-6 block">dashboard</span>
          <h2 className="text-3xl font-bold mb-4">
            Tex Store Management
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
