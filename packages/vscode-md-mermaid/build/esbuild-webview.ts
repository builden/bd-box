import esbuild, { type BuildOptions, type Plugin } from 'esbuild';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const srcDir = path.join(__dirname, '..', 'src');
const distPreviewDir = path.join(__dirname, '..', 'dist', 'preview');

// Plugin to bundle CSS files (with @import resolution) and export as text
const cssTextPlugin: Plugin = {
  name: 'css-text',
  setup(build) {
    build.onLoad({ filter: /diagramStyles\.css$/ }, async (args) => {
      // Use esbuild to bundle the CSS with imports resolved and fonts as dataurl
      const result = await esbuild.build({
        entryPoints: [args.path],
        bundle: true,
        minify: true,
        write: false,
        loader: {
          '.ttf': 'dataurl',
          '.woff': 'dataurl',
          '.woff2': 'dataurl',
        },
      });
      const css = result.outputFiles[0].text;
      return {
        contents: `export default ${JSON.stringify(css)};`,
        loader: 'js',
      };
    });
  },
};

const sharedOptions: BuildOptions = {
  bundle: true,
  minify: true,
  sourcemap: false,
  platform: 'browser',
  target: ['es2022'],
  external: ['fs'], // mermaid requires this,
  loader: {
    '.ttf': 'dataurl',
  },
  plugins: [cssTextPlugin],
};

async function build(options: BuildOptions) {
  await esbuild.build(options);
}

async function main() {
  const isWatch = process.argv.includes('--watch');

  const previewOptions: BuildOptions = {
    ...sharedOptions,
    entryPoints: {
      'index.bundle': path.join(srcDir, 'markdownPreview', 'index.ts'),
    },
    outdir: distPreviewDir,
    format: 'iife',
  };

  if (isWatch) {
    const previewCtx = await esbuild.context(previewOptions);
    await previewCtx.watch();
    console.log('Watching for changes...');
  } else {
    await build(previewOptions);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
