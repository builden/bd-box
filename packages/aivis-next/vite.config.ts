import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import { resolve } from 'path';

export default defineConfig(({ command }) => {
  // In dev mode (serve), use the example page
  if (command === 'serve') {
    return {
      plugins: [tailwindcss()],
      root: './example',
      resolve: {
        alias: {
          '@': resolve(__dirname, './src'),
        },
      },
    };
  }

  // In build mode, build the library
  return {
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        '@': resolve(__dirname, './src'),
      },
    },
    build: {
      lib: {
        entry: resolve(__dirname, 'src/index.ts'),
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
