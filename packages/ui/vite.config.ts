import { resolve } from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

export default defineConfig({
  plugins: [
    react(),
    dts({
      tsconfigPath: "./tsconfig.json",
      exclude: ["**/*.stories.tsx", "**/*.test.tsx", "vitest.setup.ts"],
    }),
  ],
  build: {
    lib: {
      entry: {
        index: resolve(__dirname, "src/index.ts"),
        theme: resolve(__dirname, "src/tokens/index.ts"),
      },
      formats: ["es"],
    },
    rollupOptions: {
      external: [
        "react",
        "react-dom",
        "react/jsx-runtime",
        "@mui/material",
        /^@mui\/material\//,
        "@emotion/react",
        "@emotion/styled",
      ],
    },
  },
});
