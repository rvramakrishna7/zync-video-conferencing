/**
 * main.jsx — The very first file React loads.
 *
 * Mounts the React app into the real DOM's <div id="root"> in index.html.
 *
 * Everything is wrapped in providers so their values are available
 * to every component in the tree. Order matters:
 *   ThemeProvider  → wraps everything (MUI needs the theme)
 *   AuthProvider   → wraps SocketProvider (socket may need auth state)
 *   SocketProvider → wraps App (all pages/components can access socket)
 */

import React from "react";
import ReactDOM from "react-dom/client";
import { useState, useMemo } from "react";
import { ThemeProvider, CssBaseline } from "@mui/material";
import { BrowserRouter } from "react-router-dom";

import App from "./App";
import { getTheme } from "./theme";
import { AuthProvider } from "./context/AuthContext";
import { SocketProvider } from "./context/SocketContext";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { ThemeToggleContext } from "./context/ThemeToggleContext";

// Inter font via @fontsource (self-hosted — no Google Fonts CDN dependency)
import "@fontsource/inter/400.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";
import "@fontsource/inter/800.css";

// ThemeWrapper lives outside render() so useState persists correctly
const ThemeWrapper = ({ children }) => {
  const [mode, setMode] = useState("light"); // light mode loads first

  // useMemo so theme object is only recreated when mode changes — not every render
  const theme = useMemo(() => getTheme(mode), [mode]);

  const toggleMode = () => setMode((prev) => (prev === "light" ? "dark" : "light"));

  return (
    <ThemeToggleContext.Provider value={{ mode, toggleMode }}>
      <ThemeProvider theme={theme}>
        {children}
      </ThemeProvider>
    </ThemeToggleContext.Provider>
  );
};

ReactDOM.createRoot(document.getElementById("root")).render(
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
    <ThemeWrapper>
      {/* CssBaseline = MUI's CSS reset. Normalizes browser defaults across Chrome/Firefox/Safari */}
      <CssBaseline />
      <BrowserRouter>
        <AuthProvider>
          <SocketProvider>
            <App />
          </SocketProvider>
        </AuthProvider>
      </BrowserRouter>
    </ThemeWrapper>
     </GoogleOAuthProvider>
  
);
