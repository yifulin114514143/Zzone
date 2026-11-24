import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: "127.0.0.1",
    proxy: {
      "/api/hoyoverse": {
        target: "https://sg-public-api-static.hoyoverse.com",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/hoyoverse/, ""),
      },
    },
  },
});
