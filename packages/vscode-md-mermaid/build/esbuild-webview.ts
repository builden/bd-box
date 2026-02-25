import esbuild, { type BuildOptions, type Plugin } from 'esbuild';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const srcDir = path.join(__dirname, '..', 'src');
const distPreviewDir = path.join(__dirname, '..', 'dist', 'preview');

// Plugin to bundle CSS files and export as text
const cssTextPlugin: Plugin = {
  name: 'css-text',
  setup(build) {
    build.onLoad({ filter: /diagramStyles\.css$/ }, async (args) => {
      const result = await esbuild.build({
        entryPoints: [args.path],
        bundle: true,
        minify: true,
        write: false,
        loader: { '.ttf': 'dataurl', '.woff': 'dataurl', '.woff2': 'dataurl' },
      });
      return {
        contents: `export default ${JSON.stringify(result.outputFiles[0].text)};`,
        loader: 'js',
      };
    });
  },
};

async function main() {
  const isWatch = process.argv.includes('--watch');

  const options: BuildOptions = {
    bundle: true,
    minify: true,
    sourcemap: false,
    platform: 'browser',
    target: ['es2022'],
    external: ['fs'],
    loader: { '.ttf': 'dataurl' },
    plugins: [cssTextPlugin],
    entryPoints: { 'index.bundle': path.join(srcDir, 'markdownPreview', 'index.ts') },
    outdir: distPreviewDir,
    format: 'iife',
  };

  if (isWatch) {
    const ctx = await esbuild.context(options);
    await ctx.watch();
    console.log('Watching for changes...');
  } else {
    await esbuild.build(options);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
