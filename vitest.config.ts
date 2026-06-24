import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Only run TypeScript sources; ignore compiled output in dist/.
    include: ['src/**/*.test.ts'],
  },
});
