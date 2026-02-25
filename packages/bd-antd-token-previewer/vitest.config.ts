import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      'bd-antd-token-previewer': path.resolve(__dirname, './src'),
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/utils/setup.ts', './tests/utils/setupAfterEnv.ts'],
    globals: true,
    transformIgnorePatterns: [
      'node_modules/(?!vanilla-jsoneditor|.*@(babel|antd))(?!array-move)[^/]+?/(?!(es|node_modules)/)',
    ],
  },
});
