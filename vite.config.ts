import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    // Forward /api calls to the Flask backend so the browser never needs the API key.
    proxy: { "/api": "http://127.0.0.1:5000" },
  },
});
