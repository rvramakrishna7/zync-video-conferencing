/**
 * services/api.js — Centralized API layer.
 */

import axios from "axios";

// Custom axios instance — all requests go through this
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
});

/**
 * Request Interceptor — runs before EVERY outgoing request.
 */
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("zync_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/**
 * Response Interceptor — runs after EVERY response comes back.
 * Handles session expiry without you needing to check it in every component.
 */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("zync_token");
      if (!window.location.pathname.includes("/login")) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

// ─── Auth API ─────────────────────────────────────────────────────────────────

export const authAPI = {
  register: (data) => api.post("/auth/register", data),
  login: (data) => api.post("/auth/login", data),
  googleAuth: (data) => api.post("/auth/google", data),
  getMe: () => api.get("/auth/me"),
};

// ─── Room API ─────────────────────────────────────────────────────────────────

export const roomAPI = {
  create: (data) => api.post("/rooms", data),
  get: (roomCode) => api.get(`/rooms/${roomCode}`),
  join: (roomCode, data) => api.post(`/rooms/${roomCode}/join`, data),
  end: (roomCode) => api.patch(`/rooms/${roomCode}/end`),
};

// ─── User API ─────────────────────────────────────────────────────────────────

export const userAPI = {
  getUser: (id) => api.get(`/users/${id}`),
  updateProfile: (data) => api.put("/users/profile", data),
};

export default api;
