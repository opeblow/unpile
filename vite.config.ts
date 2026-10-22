import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// Relative base so the build works on GitHub Pages, Netlify, Vercel or opened from any sub-path.
export default defineConfig({
  base: './',
  plugins: [react()],
  test: {
    // Unit tests only. Playwright runs the e2e/ folder separately (npm run test:e2e).
    include: ['src/**/*.test.ts'],
  },
});
