/**
 * ThemeToggleContext.jsx — Shares the theme toggle function globally.
 */

import { createContext, useContext } from "react";

export const ThemeToggleContext = createContext({
  mode: "light",
  toggleMode: () => {},
});

export const useThemeToggle = () => useContext(ThemeToggleContext);