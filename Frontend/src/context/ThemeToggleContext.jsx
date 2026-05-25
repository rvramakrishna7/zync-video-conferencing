/**
 * ThemeToggleContext.jsx — Shares the theme toggle function globally.
 *
 * Any component can call useThemeToggle() to get:
 *   { mode, toggleMode }
 *
 * mode        → "light" or "dark" (current mode)
 * toggleMode  → function to flip between them
 *
 * This follows the exact same pattern as AuthContext and SocketContext.
 */

import { createContext, useContext } from "react";

export const ThemeToggleContext = createContext({
  mode: "light",
  toggleMode: () => {},
});

export const useThemeToggle = () => useContext(ThemeToggleContext);