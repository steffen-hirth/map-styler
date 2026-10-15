import { defineConfig } from 'vite';

// Builds the framework-free tooltip runtime into cdn/ so it can be served
// straight from the repository via jsDelivr.
export default defineConfig({
  publicDir: false,
  build: {
    outDir: 'cdn',
    emptyOutDir: true,
    minify: true,
    sourcemap: false,
    lib: {
      entry: 'src/runtime/tooltips/index.ts',
      name: 'MapStylerTooltips',
      formats: ['umd', 'es'],
      fileName: (format) => (format === 'es' ? 'mapstyler-tooltips.mjs' : 'mapstyler-tooltips.js'),
    },
  },
});
