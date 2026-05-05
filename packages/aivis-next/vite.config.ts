import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import { copyFile, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const isChromeWatchBuild = process.env.AIVIS_CHROME_WATCH === '1';

function chromeManifestPlugin() {
  return {
    name: 'chrome-manifest-plugin',
    buildStart() {
      this.addWatchFile(resolve(__dirname, 'src/extension/background.js'));
      this.addWatchFile(resolve(__dirname, 'src/extension/react-probe-main-world.js'));
      this.addWatchFile(resolve(__dirname, 'src/extension/manifest.json'));
    },
    async closeBundle() {
      const rootDir = resolve(__dirname, '.');
      const source = resolve(rootDir, 'src/extension/manifest.json');
      const targetDir = resolve(rootDir, 'dist/chrome-extension');
      const target = resolve(targetDir, 'manifest.json');
      const backgroundSource = resolve(rootDir, 'src/extension/background.js');
      const backgroundTarget = resolve(targetDir, 'background.js');
      const reactProbeSource = resolve(rootDir, 'src/extension/react-probe-main-world.js');
      const reactProbeTarget = resolve(targetDir, 'react-probe-main-world.js');
      const devReloadTarget = resolve(targetDir, 'dev-reload.json');

      await mkdir(targetDir, { recursive: true });

      const manifest = JSON.parse(await readFile(source, 'utf8'));
      const entries = await readdir(targetDir, { withFileTypes: true });
      const jsFile = entries.find(
        (entry) => entry.isFile() && entry.name.startsWith('content-script') && entry.name.endsWith('.js')
      );
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
      await copyFile(backgroundSource, backgroundTarget);
      await copyFile(reactProbeSource, reactProbeTarget);

      if (isChromeWatchBuild) {
        const devReloadConfig = {
          enabled: true,
          buildId: `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
        };
        await writeFile(devReloadTarget, `${JSON.stringify(devReloadConfig, null, 2)}\n`);
      } else {
        await rm(devReloadTarget, { force: true });
      }
    },
  };
}

export default defineConfig(({ command, mode }) => {
  const sharedConfig = {
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        '@': resolve(__dirname, './src'),
      },
    },
  };

  // In dev mode (serve), use the example page
  if (command === 'serve') {
    return {
      ...sharedConfig,
      root: './example',
      server: {
        port: 3002,
      },
    };
  }

  if (mode === 'chrome') {
    return {
      ...sharedConfig,
      plugins: [tailwindcss(), chromeManifestPlugin()],
      build: {
        outDir: 'dist/chrome-extension',
        lib: {
          entry: 'src/extension/content-script.tsx',
          name: 'AivisNextContentScript',
          formats: ['iife'],
          fileName: 'content-script',
        },
        rollupOptions: {
          output: {
            banner: 'globalThis.process = globalThis.process || { env: {} };',
          },
        },
        sourcemap: true,
        emptyOutDir: true,
      },
    };
  }

  // In build mode, build the library
  return {
    ...sharedConfig,
    build: {
      lib: {
        entry: 'src/index.ts',
        name: 'AivisNext',
        formats: ['es'],
        fileName: 'index',
      },
      rollupOptions: {
        external: ['react', 'react-dom'],
        output: {
          globals: {
            react: 'React',
            'react-dom': 'ReactDOM',
          },
          preserveModules: false,
        },
      },
      sourcemap: true,
      emptyOutDir: true,
    },
  };
});
