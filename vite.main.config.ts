import { defineConfig } from 'vite';

export default defineConfig({
  resolve: {
    browserField: false,
    conditions: ['node'],
    mainFields: ['module', 'jsnext:main', 'jsnext'],
  },
  build: {
    lib: {
      entry: 'electron/main.ts',
      formats: ['cjs'],
    },
    rollupOptions: {
      external: ['electron'],
      output: {
        entryFileNames: '[name].js',
      },
    },
  },
});
