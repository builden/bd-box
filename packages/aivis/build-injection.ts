import { build } from 'bun';

await build({
  entryPoints: ['src/injection/index.ts'],
  outdir: 'dist/injection',
  format: 'iife',
  minify: true,
  target: 'browser',
  splitting: false,
  sourcemap: 'none',
  banner: '/* AIVIS Injection Bundle */',
});
