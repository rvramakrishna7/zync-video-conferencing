/**
 * App.jsx — The routing layer. Maps URLs to page components.
 *
 * ─── How React Router works ────────────────────────────────────────────────
 *
 * React apps are "Single Page Applications" — the browser loads one HTML file.
 * React Router intercepts URL changes and swaps which component renders,
 * WITHOUT actually reloading the page. That's what makes it feel app-like.
 *
 * <Routes>        → container, looks at current URL
 *   <Route path="/" element={<Landing />} />    → if URL is "/", render Landing
 *   <Route path="/login" element={<Login />} />  → if URL is "/login", render Login
 *
 * ─── ProtectedRoute ──────────────────────────────────────────────────────────
 *
 * Some pages (like /room) should only be accessible to logged-in users.
 * ProtectedRoute checks auth state — if not logged in, redirects to /login.
 * This is a pattern called "route guards" and is standard in every real app.
 */

import { Routes, Route, Navigate } from "react-router-dom";
import { CircularProgress, Box } from "@mui/material";

import { useAuth } from "./context/AuthContext";

// Pages
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Room from "./pages/Room";

/**
 * ProtectedRoute — wraps any route that requires authentication.
 *
 * If still loading (checking token) → show spinner
 * If not authenticated → redirect to /login
 * If authenticated → render the actual page
 */
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <CircularProgress sx={{ color: "primary.main" }} />
      </Box>
    );
  }

 // Pass the current URL as ?redirect= so Login knows where to send them after
  // window.location.pathname gives us "/room/ABC123" which we encode as a query param
  return isAuthenticated ? children : (
    <Navigate
      to={`/login?redirect=${encodeURIComponent(window.location.pathname)}`}
      replace
    />
  );
};

const App = () => {
  return (
    <Routes>
      {/* Public routes — anyone can access */}
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Protected route — must be logged in */}
      <Route
        path="/room/:roomCode"
        element={
          <ProtectedRoute>
            <Room />
          </ProtectedRoute>
        }
      />

      {/* Catch-all — redirect unknown URLs to home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;
