/**
 * context/AuthContext.jsx — Global authentication state.
 */

import { createContext, useContext, useState, useEffect } from "react";
import { authAPI } from "../services/api";

// Step 1: Context object (just a container, no value yet)
const AuthContext = createContext(null);

// Step 2: Provider — this is what wraps the app and holds state
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // true while checking stored token

 
  useEffect(() => {
    const restoreSession = async () => {
      const token = localStorage.getItem("zync_token");

      if (!token) {
        setLoading(false);
        return;
      }

      try {
        // Token exists — verify it's still valid by hitting /api/auth/me
        const { data } = await authAPI.getMe();
        setUser(data.user);
      } catch {
        // Token expired or invalid — clear it and start fresh
        localStorage.removeItem("zync_token");
      } finally {
        setLoading(false); // done checking either way
      }
    };

    restoreSession();
  }, []);

  // Called after a successful login or register API response
  const login = (token, userData) => {
    localStorage.setItem("zync_token", token);
    setUser(userData);
  };

  // Called when user clicks "Sign out"
  const logout = () => {
    localStorage.removeItem("zync_token");
    setUser(null);
  };

  // The value object — everything components get when they call useAuth()
  const value = {
    user,       // null = not logged in, object = logged in user
    loading,    // true while we're checking — show a spinner, not the app
    login,
    logout,
    isAuthenticated: !!user, // !! converts user object to boolean
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Step 3: Custom hook 
// Usage in any component: const { user, login, logout } = useAuth();
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside <AuthProvider>");
  }
  return context;
};
