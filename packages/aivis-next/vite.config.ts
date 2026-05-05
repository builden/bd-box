import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

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
