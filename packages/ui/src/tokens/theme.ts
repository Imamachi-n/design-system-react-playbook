import { createTheme } from "@mui/material/styles";

const primaryScale = {
  50: "#eff6ff",
  100: "#dbeafe",
  200: "#bfdbfe",
  300: "#93c5fd",
  400: "#60a5fa",
  500: "#3b82f6",
  600: "#2563eb",
  700: "#1d4ed8",
  800: "#1e40af",
  900: "#1e3a8a",
};

const neutralScale = {
  50: "#fafafa",
  100: "#f5f5f5",
  200: "#e5e5e5",
  300: "#d4d4d4",
  400: "#a3a3a3",
  500: "#737373",
  600: "#525252",
  700: "#404040",
  800: "#262626",
  900: "#171717",
};

export const theme = createTheme({
  palette: {
    primary: {
      main: primaryScale[600],
      light: primaryScale[400],
      dark: primaryScale[800],
      contrastText: "#ffffff",
      ...primaryScale,
    },
    grey: neutralScale,
    success: { main: "#16a34a" },
    warning: { main: "#d97706" },
    error: { main: "#dc2626" },
    common: {
      white: "#ffffff",
      black: "#000000",
    },
  },
  typography: {
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    fontWeightRegular: 400,
    fontWeightMedium: 500,
    fontWeightBold: 700,
  },
  spacing: 4,
  shape: {
    borderRadius: 6,
  },
  components: {
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          textTransform: "none",
          fontWeight: 500,
          lineHeight: 1.25,
          transition: "background-color 0.15s ease, box-shadow 0.15s ease",
        },
        sizeSmall: {
          fontSize: "0.875rem",
          padding: "4px 12px",
          height: "32px",
        },
        sizeMedium: {
          fontSize: "1rem",
          padding: "8px 16px",
          height: "40px",
        },
        sizeLarge: {
          fontSize: "1.125rem",
          padding: "12px 24px",
          height: "48px",
        },
      },
    },
  },
});
