import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, '..');
const source = resolve(rootDir, 'src/extension/manifest.json');
const targetDir = resolve(rootDir, 'dist/chrome-extension');
const target = resolve(targetDir, 'manifest.json');

await mkdir(targetDir, { recursive: true });

const manifest = JSON.parse(await readFile(source, 'utf8'));
const entries = await readdir(targetDir, { withFileTypes: true });
const jsFile = entries.find((entry) => entry.isFile() && entry.name.startsWith('content-script') && entry.name.endsWith('.js'));
const cssFile = entries.find((entry) => entry.isFile() && entry.name.endsWith('.css'));

if (!jsFile) {
  throw new Error(`Could not find chrome extension JS bundle in ${targetDir}`);
}

manifest.content_scripts[0].js = [jsFile.name];

if (cssFile) {
  manifest.content_scripts[0].css = [cssFile.name];
} else {
  delete manifest.content_scripts[0].css;
}

await writeFile(target, `${JSON.stringify(manifest, null, 2)}\n`);
