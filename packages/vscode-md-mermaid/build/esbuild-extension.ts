import esbuild, { type BuildOptions } from 'esbuild';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const srcDir = path.join(__dirname, '..', 'src');
const distDir = path.join(__dirname, '..', 'dist');

const sharedOptions: BuildOptions = {
  bundle: true,
  external: ['vscode'],
  sourcemap: true,
};

async function main() {
  const isWatch = process.argv.includes('--watch');
  const isProduction = process.argv.includes('--production');

  const nodeOptions: BuildOptions = {
    ...sharedOptions,
    entryPoints: [path.join(srcDir, 'vscode-extension', 'index.ts')],
    outfile: path.join(distDir, 'index.js'),
    format: 'cjs',
    platform: 'node',
    minify: isProduction,
    sourcemap: isProduction ? false : true,
  };

  const webOptions: BuildOptions = {
    ...sharedOptions,
    entryPoints: [path.join(srcDir, 'vscode-extension', 'index.ts')],
    outfile: path.join(distDir, 'web', 'index.js'),
    format: 'cjs',
    platform: 'browser',
    minify: isProduction,
    sourcemap: isProduction ? 'external' : true,
  };

  if (isWatch) {
    const [nodeCtx, webCtx] = await Promise.all([
      esbuild.context(nodeOptions),
      esbuild.context(webOptions),
    ]);
    await Promise.all([nodeCtx.watch(), webCtx.watch()]);
    console.log('Watching for changes...');
  } else {
    await Promise.all([esbuild.build(nodeOptions), esbuild.build(webOptions)]);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
