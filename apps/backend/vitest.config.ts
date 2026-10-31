import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["tests/**/*.test.ts"],
    // Placeholder values so env validation passes; tests never connect to a real database
    env: {
      NODE_ENV: "test",
      DATABASE_URL: "postgresql://test:test@localhost-pooler.invalid/test?sslmode=require",
      DIRECT_URL: "postgresql://test:test@localhost.invalid/test?sslmode=require",
      JWT_SECRET: "test_jwt_secret_at_least_32_characters",
    },
    coverage: {
      reporter: ["text", "json", "html"],
    },
  },
});
