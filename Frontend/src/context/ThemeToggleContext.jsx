/**
 * ThemeToggleContext.jsx 
 */

import { createContext, useContext } from "react";

export const ThemeToggleContext = createContext({
  mode: "light",
  toggleMode: () => {},
});

export const useThemeToggle = () => useContext(ThemeToggleContext);