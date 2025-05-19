import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";


// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    proxy: {
      // proxy /uploads/* to http://localhost:3000/uploads/*
      '/uploads': 'http://localhost:3000',
      // proxy any API calls
      '/api': 'http://localhost:3000'
    }
  },
  plugins: [
    react(),
    mode === 'development'
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
