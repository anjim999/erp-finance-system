import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000",
  withCredentials: true
});

api.interceptors.request.use(
  (config) => {
    if (config.url && config.url.startsWith("/api/auth/")) {
      return config;
    }

    const stored = localStorage.getItem("auth");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed.token) {
          config.headers.Authorization = `Bearer ${parsed.token}`;
        }
      } catch (e) {
        console.error("Failed to parse auth from localStorage", e);
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const failingUrl = error.config?.url || 'unknown';
      console.error(`[401 Error] Request to ${failingUrl} returned 401`);
      console.error('[401 Error] Response:', error.response?.data);

      // Don't auto-logout if we're already on auth pages
      if (window.location.pathname === '/login' ||
        window.location.pathname === '/register' ||
        window.location.pathname === '/forgot-password') {
        return Promise.reject(error);
      }

      // Check if auth token exists - if it does and we got 401, token is invalid
      const stored = localStorage.getItem("auth");
      if (stored) {
        console.warn("Token appears invalid. Clearing auth and redirecting to login.");
        console.warn("Failing endpoint:", failingUrl);
        localStorage.removeItem("auth");
        // Small delay to ensure console logs are visible
        setTimeout(() => {
          window.location.href = "/login";
        }, 100);
      }
    }
    return Promise.reject(error);
  }
);

export default api;
