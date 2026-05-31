import { defineConfig } from "vite";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
  resolve: {
    alias: {
      "@engine": fileURLToPath(new URL("./src/engine", import.meta.url)),
      "@game": fileURLToPath(new URL("./src/game", import.meta.url)),
    },
  },
  server: {
    open: true,
  },
});
