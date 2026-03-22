import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "happy-dom",
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      thresholds: { lines: 80, branches: 80, functions: 80 },
    },
    include: ["src/**/*.test.{ts,tsx}"],
    setupFiles: ["src/__tests__/setup.ts"],
  },
});
