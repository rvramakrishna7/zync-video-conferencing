/**
 * context/AuthContext.jsx — Global authentication state.
 *
 * ─── What is React Context? ───────────────────────────────────────────────────
 *
 * Imagine you're logged in as "Ramakrishna". The Navbar needs your name.
 * The Room page needs to know if you're logged in. The Profile page needs
 * your avatar. Without Context, you'd pass user data as props through
 * every component in between — called "prop drilling" and it's messy.
 *
 * Context = a global store any component can READ from or WRITE to
 * without passing props manually through the tree.
 *
 * ─── Provider Pattern ────────────────────────────────────────────────────────
 *
 * AuthProvider wraps your whole app (in main.jsx).
 * Any component inside it can call useAuth() to get user, login, logout.
 *
 *   <AuthProvider>        ← provides the context value
 *     <App />             ← any component here can use useAuth()
 *   </AuthProvider>
 */

import { createContext, useContext, useState, useEffect } from "react";
import { authAPI } from "../services/api";

// Step 1: Create the context object (just a container, no value yet)
const AuthContext = createContext(null);

// Step 2: Create the Provider — this is what wraps your app and holds state
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // true while checking stored token

  /**
   * On app load — check if there's a stored token and restore the session.
   *
   * WHY useEffect with []?
   * The empty array means "run once when the component mounts" — equivalent
   * to componentDidMount in class components. We check localStorage once
   * at startup to see if the user was previously logged in.
   */
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

// Step 3: Custom hook — cleaner than importing useContext everywhere
// Usage in any component: const { user, login, logout } = useAuth();
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside <AuthProvider>");
  }
  return context;
};
