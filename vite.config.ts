import { defineConfig } from "vite";
import { fresh } from "@fresh/plugin-vite";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [fresh(), tailwindcss()],
  // Vite's dev server would answer CORS preflights itself, before Fresh sees
  // them. Leave CORS to the app so `/api/mock` behaves as in production.
  server: { cors: false },
});
