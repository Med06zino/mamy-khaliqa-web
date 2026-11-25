/// <reference types="vitest" />
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:8000",
        changeOrigin: false,
        secure: false,
        configure: (proxy) => {
          proxy.on("proxyRes", (proxyRes) => {
            // Réécrire le domaine du cookie pour qu'il soit accepté par localhost:5173
            const setCookie = proxyRes.headers["set-cookie"];
            if (setCookie) {
              proxyRes.headers["set-cookie"] = setCookie.map((c: string) =>
                c
                  .replace(/;\s*SameSite=None/gi, "; SameSite=Lax")
                  .replace(/;\s*Secure/gi, "")
                  .replace(/;\s*Domain=[^;]+/gi, "")
              );
            }
          });
        },
      },
      "/media": {
        target: "http://localhost:8000",
        changeOrigin: false,
        secure: false,
      },
    },
  },
  test: { environment: "jsdom", globals: true, setupFiles: "./src/test/setup.ts", css: false },
});
