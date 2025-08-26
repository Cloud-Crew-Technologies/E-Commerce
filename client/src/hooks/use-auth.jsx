import { createContext, useContext, useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      // Check if token exists first
      const token = localStorage.getItem("token");
      if (!token) {
        setUser(null);
        setIsLoading(false);
        return;
      }

      const response = await apiRequest("GET", "/api/users/get");
      const userData = await response.json();
      setUser(userData);
    } catch (err) {
      console.error("Auth check failed:", err);
      // Clear invalid token
      localStorage.removeItem("token");
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const loginMutation = useMutation({
    mutationFn: async (loginData) => {
      const response = await apiRequest("POST", "/api/users/login", loginData);
      const responseData = await response.json();
      return responseData;
    },
    onSuccess: (response) => {
      // The response includes { message, data, token }
      setUser(response.data);
      setError(null);
      // Store the token
      if (response.token) {
        localStorage.setItem("token", response.token);
      }
      queryClient.invalidateQueries({ queryKey: ["/api/users/get"] });
    },
    onError: (err) => {
      console.error("Login error:", err);
      setError(err);
      // Clear any existing token on login failure
      localStorage.removeItem("token");
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      try {
        await apiRequest("POST", "/api/users/logout");
      } catch (err) {
        // Even if logout fails on server, we should clear local state
        console.warn("Logout request failed:", err);
      }
    },
    onSuccess: () => {
      setUser(null);
      localStorage.removeItem("token");
      queryClient.clear();
    },
    onError: () => {
      // Clear local state even if server logout fails
      setUser(null);
      localStorage.removeItem("token");
      queryClient.clear();
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (userData) => {
      const response = await apiRequest(
        "POST",
        "/api/users/register",
        userData
      );
      const newUser = await response.json();
      return newUser;
    },
    onSuccess: (userData) => {
      setUser(userData);
      setError(null);
      // If registration returns a token, store it
      if (userData.token) {
        localStorage.setItem("token", userData.token);
      }
    },
    onError: (err) => {
      console.error("Registration error:", err);
      setError(err);
    },
  });

  const value = {
    user,
    isLoading,
    error,
    loginMutation,
    logoutMutation,
    registerMutation,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
