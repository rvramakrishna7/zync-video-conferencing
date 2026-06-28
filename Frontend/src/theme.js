/**
 * theme.js — Zync's global Material UI theme.
 */

import { createTheme } from "@mui/material/styles";

export const getTheme = (mode) =>
  createTheme({
    palette: {
      mode, // "light" or "dark" — MUI uses this to auto-adjust many defaults

      primary: {
        // Teal-600 in light (darker = more readable on white)
        // Teal-400 in dark (lighter = more readable on black)
        main: mode === "light" ? "#0D9488" : "#2DD4BF",
        light: mode === "light" ? "#2DD4BF" : "#5EEAD4",
        dark: mode === "light" ? "#0F766E" : "#0D9488",
        contrastText: "#FFFFFF",
      },

      secondary: {
        main: mode === "light" ? "#71717A" : "#A1A1AA", // zinc-500 / zinc-400
      },

      background: {
        // Light: near-white zinc. Dark: near-black zinc.
        default: mode === "light" ? "#FAFAFA" : "#09090B",
        paper: mode === "light" ? "#FFFFFF" : "#18181B",
      },

      text: {
        primary: mode === "light" ? "#09090B" : "#FAFAFA",
        secondary: mode === "light" ? "#71717A" : "#A1A1AA",
      },

      // divider is used for borders, separators — theme-aware
      divider: mode === "light" ? "#E4E4E7" : "#27272A",

      error: { main: "#EF4444" },
      success: { main: "#10B981" },
      warning: { main: "#F59E0B" },
    },

    typography: {
      fontFamily: "'Inter', 'Roboto', sans-serif",
      h1: { fontWeight: 800, letterSpacing: "-0.02em" },
      h2: { fontWeight: 700, letterSpacing: "-0.01em" },
      h3: { fontWeight: 700 },
      h4: { fontWeight: 600 },
      h5: { fontWeight: 600 },
      h6: { fontWeight: 600 },
      button: {
        fontWeight: 600,
        textTransform: "none",
        letterSpacing: "0.01em",
      },
    },

    shape: { borderRadius: 10 },

    components: {
      MuiButton: {
        styleOverrides: {
          root: ({ ownerState }) => ({
            borderRadius: 8,
            fontSize: "0.9rem",
            boxShadow: "none",
            "&:hover": { boxShadow: "none" },
            // Apply teal color to all contained buttons directly on root
            // ownerState gives us the variant and color props at runtime
            ...(ownerState.variant === "contained" &&
              ownerState.color === "primary" && {
                backgroundColor: mode === "light" ? "#0D9488" : "#2DD4BF",
                color: "#FFFFFF",
                "&:hover": {
                  backgroundColor: mode === "light" ? "#0F766E" : "#14B8A6",
                },
              }),
          }),
        },
      },

      MuiTextField: {
        styleOverrides: {
          root: {
            "& .MuiOutlinedInput-root": {
              borderRadius: 8,
              backgroundColor: mode === "light" ? "#F4F4F5" : "rgba(255,255,255,0.04)",
              "&:hover .MuiOutlinedInput-notchedOutline": {
                borderColor: mode === "light" ? "#0D9488" : "#2DD4BF",
              },
              "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                borderColor: mode === "light" ? "#0D9488" : "#2DD4BF",
                borderWidth: 1.5,
              },
            },
          },
        },
      },

      MuiCard: {
        styleOverrides: {
          root: {
            backgroundImage: "none",
            border: `1px solid ${mode === "light" ? "#E4E4E7" : "#27272A"}`,
            borderRadius: 12,
            boxShadow: mode === "light" ? "0 1px 3px rgba(0,0,0,0.06)" : "none",
          },
        },
      },

      MuiChip: {
        styleOverrides: {
          root: { borderRadius: 6 },
        },
      },

      MuiDivider: {
        styleOverrides: {
          root: { borderColor: mode === "light" ? "#E4E4E7" : "#27272A" },
        },
      },
    },
  });