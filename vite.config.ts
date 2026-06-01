import { defineConfig } from "vite";
import { fileURLToPath, URL } from "node:url";

export default defineConfig(({ command }) => ({
  // Use relative asset paths for the production build so the app works when
  // served from a sub-path (GitHub Pages: /semlaengine/). Dev stays at root.
  base: command === "build" ? "./" : "/",
  resolve: {
    alias: {
      "@engine": fileURLToPath(new URL("./src/engine", import.meta.url)),
      "@game": fileURLToPath(new URL("./src/game", import.meta.url)),
      "@editor": fileURLToPath(new URL("./src/editor", import.meta.url)),
    },
  },
  server: {
    open: true,
  },
}));
