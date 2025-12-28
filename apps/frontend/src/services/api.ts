import axios from "axios";

const apiUrl = import.meta.env.VITE_API_URL || "https://api.augenpay.com/api";

export const api = axios.create({
  baseURL: apiUrl,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  }
})

// Optional: Add interceptors
api.interceptors.request.use(
  (config) => {
    // Add auth token if available (only in browser)
    const token = typeof window !== 'undefined' ? localStorage.getItem("token") : null;
    // Ensure headers exist
    if (!config.headers) {
      config.headers = {} as any;
    }
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);