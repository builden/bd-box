import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ command }) => {
  // In dev mode (serve), use the example page
  if (command === 'serve') {
    return {
      plugins: [tailwindcss()],
      root: './example',
      server: {
        port: 3002,
      },
      resolve: {
        tsconfigPaths: true,
      },
    };
  }

  // In build mode, build the library
  return {
    plugins: [tailwindcss()],
    resolve: {
      tsconfigPaths: true,
    },
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
