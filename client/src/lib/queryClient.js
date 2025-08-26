import { QueryClient } from "@tanstack/react-query";

const API_BASE = "http://localhost:3000";

export async function throwIfResNotOk(res) {
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(errorText);
  }
  return res;
}

export async function apiRequest(method, url, data) {
  // Get token from localStorage if it exists
  const token = localStorage.getItem("token");

  const options = {
    method: method,
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include", // Important for CORS with credentials
  };

  // Add Authorization header if token exists
  if (token) {
    options.headers.Authorization = `Bearer ${token}`;
  }

  if (data) {
    options.body = JSON.stringify(data);
  }

  // Build absolute server URL so requests hit the backend port directly
  const path = url.startsWith("/api")
    ? url
    : `/api${url.startsWith("/") ? "" : "/"}${url}`;
  const fullUrl = path.startsWith("http") ? path : `${API_BASE}${path}`;

  const res = await fetch(fullUrl, options);
  return throwIfResNotOk(res);
}

export const getQueryFn =
  ({ on401 }) =>
  async ({ queryKey }) => {
    const token = localStorage.getItem("token");

    const path0 =
      typeof queryKey[0] === "string" ? queryKey[0] : String(queryKey[0]);
    const path = path0.startsWith("/api")
      ? path0
      : `/api${path0.startsWith("/") ? "" : "/"}${path0}`;
    const fullUrl = path.startsWith("http") ? path : `${API_BASE}${path}`;

    const headers = {
      "Content-Type": "application/json",
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const res = await fetch(fullUrl, {
      credentials: "include",
      headers: headers,
    });

    if (res.status === 401) {
      // Clear invalid token
      localStorage.removeItem("token");
      if (on401 === "returnNull") {
        return null;
      }
      throw new Error("Unauthorized");
    }

    return throwIfResNotOk(res).then((res) => res.json());
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});
