/**
 * services/api.js — Centralized API layer.
 *
 * WHY centralize API calls here instead of fetching inside components?
 * If your backend URL changes, you update ONE file — not 20 components.
 * If you want to add error handling for every request, you do it here
 * once via an interceptor — not repeated in every component.
 *
 * ─── What is axios? ───────────────────────────────────────────────────────────
 * Axios wraps the browser's fetch API with conveniences:
 *  - Automatically parses JSON responses
 *  - Base URL set once — all calls use it automatically
 *  - Interceptors — middleware that runs before/after every request
 *  - Better error handling (fetch doesn't throw on 404/500, axios does)
 */

import axios from "axios";

// Create a custom axios instance — all requests go through this
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  // import.meta.env is Vite's way of reading .env files (CRA uses process.env)
  // Vite requires the VITE_ prefix for variables exposed to the browser
});

/**
 * Request Interceptor — runs before EVERY outgoing request.
 *
 * Automatically attaches the JWT from localStorage to every request header.
 * Without this you'd manually write the Authorization header in every API call.
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
 *
 * If the server says 401 (expired/invalid token), automatically
 * clear the token and send user to login. This handles session
 * expiry without you needing to check it in every component.
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
