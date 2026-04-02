import { defineConfig } from 'tsup';
import sassPlugin from 'esbuild-plugin-sass';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  splitting: false,
  sourcemap: false,
  clean: true,
  external: ['react', 'react-dom'],
  esbuildOptions(options) {
    options.plugins = [sassPlugin()];
  },
});
