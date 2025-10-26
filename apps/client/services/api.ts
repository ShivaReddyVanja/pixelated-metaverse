import axios from "axios";

const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export const api = axios.create({
    baseURL:apiUrl,
    timeout:10000,
    headers:{
        'Content-Type': 'application/json',
    }
})

// Optional: Add interceptors
api.interceptors.request.use(
    (config) => {
      // Add auth token if available
      const token = localStorage.getItem("token")
          // Ensure headers exist
      config.headers = config.headers || {};
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );