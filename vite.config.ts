// Vercel deployment config — uses TanStack Start + Vercel preset directly.
// The @lovable.dev/vite-tanstack-config is NOT used here because it forces
// Cloudflare Workers output which is incompatible with Vercel.
import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import tailwind from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";
import react from "@vitejs/plugin-react";
import { loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const serverKeys = [
    "MY_SUPABASE_URL",
    "MY_SUPABASE_SERVICE_ROLE_KEY",
    "SUPABASE_URL",
    "SUPABASE_SERVICE_ROLE_KEY",
    "MY_ADMIN_SESSION_SECRET",
    "ADMIN_SESSION_SECRET",
    "CRON_SECRET",
  ];
  const define: Record<string, string> = {};
  for (const key of serverKeys) {
    // env = from .env files (local); process.env[key] = set by Vercel during build
    const val = env[key] || process.env[key];
    if (val) define[`process.env.${key}`] = JSON.stringify(val);
  }

  return {
    plugins: [
      tanstackStart({
        server: { preset: "vercel" },
      }),
      react(),
      tailwind(),
      tsconfigPaths(),
    ],
    resolve: {
      dedupe: [
        "react",
        "react-dom",
        "react/jsx-runtime",
        "react/jsx-dev-runtime",
        "@tanstack/react-query",
        "@tanstack/query-core",
      ],
    },
    define,
  };
});
