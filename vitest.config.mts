import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const src = fileURLToPath(new URL("./src", import.meta.url));
const shared = {
  resolve: {
    alias: {
      "@": src,
      // `server-only` throws outside a React Server environment; tests import server modules directly.
      "server-only": fileURLToPath(new URL("./tests/support/empty.ts", import.meta.url)),
    },
  },
};

export default defineConfig({
  plugins: [react()],
  ...shared,
  test: {
    coverage: {
      provider: "v8",
      include: ["src/lib/**", "src/components/**"],
      reporter: ["text-summary", "html"],
    },
    projects: [
      {
        ...shared,
        extends: true,
        test: { name: "unit", environment: "node", include: ["tests/unit/**/*.test.ts"] },
      },
      {
        ...shared,
        extends: true,
        test: {
          name: "integration",
          environment: "node",
          include: ["tests/integration/**/*.test.ts"],
          testTimeout: 60_000,
          hookTimeout: 60_000,
        },
      },
      {
        ...shared,
        extends: true,
        test: {
          name: "components",
          environment: "jsdom",
          include: ["tests/components/**/*.test.tsx"],
          setupFiles: ["tests/support/setup-dom.ts"],
        },
      },
    ],
  },
});
