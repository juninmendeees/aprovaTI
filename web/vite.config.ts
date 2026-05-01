import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/questoes": { target: "http://localhost:8080", changeOrigin: true },
      "/respostas": { target: "http://localhost:8080", changeOrigin: true },
      "/dashboard": { target: "http://localhost:8080", changeOrigin: true },
      "/apostilas": { target: "http://localhost:8080", changeOrigin: true },
      "/flashcards": { target: "http://localhost:8080", changeOrigin: true },
      "/mapas-mentais": { target: "http://localhost:8080", changeOrigin: true },
      "/billing": { target: "http://localhost:8080", changeOrigin: true },
      "/auth": { target: "http://localhost:8080", changeOrigin: true },
      "/admin": { target: "http://localhost:8080", changeOrigin: true },
      "/politicas": { target: "http://localhost:8080", changeOrigin: true },
    },
  },
  preview: {
    // Railway forwards requests with the public app host; allow it in preview mode.
    allowedHosts: [".up.railway.app"],
  },
});
