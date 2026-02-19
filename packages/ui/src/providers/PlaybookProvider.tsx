import CssBaseline from "@mui/material/CssBaseline";
import { ThemeProvider } from "@mui/material/styles";
import type { ReactNode } from "react";
import { theme } from "../tokens";

export interface PlaybookProviderProps {
  children: ReactNode;
}

export function PlaybookProvider({ children }: PlaybookProviderProps) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}
