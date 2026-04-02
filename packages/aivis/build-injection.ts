import { build } from 'bun';

await build({
  entrypoints: ['src/injection/index.ts'],
  outdir: 'dist/injection',
  format: 'iife',
  minify: true,
  target: 'browser',
  splitting: false,
  sourcemap: 'none',
  banner: '/* AIVIS Injection Bundle */',
});
