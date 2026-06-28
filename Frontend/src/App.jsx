/**
 * App.jsx — The routing layer. Maps URLs to page components.
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
 * ProtectedRoute 
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
