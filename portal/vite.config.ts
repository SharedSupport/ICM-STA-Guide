import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Local dev: `npm run dev` serves the frontend on 5173 and proxies /api to the
// Azure Functions host (run separately via `func start` in /portal/api, default port 7071).
// When running through the SWA CLI instead (`swa start`), the CLI does this proxying itself
// and this config is not needed for /api — see README.md.
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": "http://localhost:7071",
    },
  },
});
