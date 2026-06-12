import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// MyHolidayBro admin runs as a standalone SPA, separate from the Next.js site.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    // Fail instead of hopping to 5175+ — those ports aren't in the backend CORS allowlist.
    strictPort: true,
    open: true,
  },
});
