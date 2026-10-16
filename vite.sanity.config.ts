import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// Builds the Sanity Studio plugin into dist-sanity/. Everything the Studio
// already ships (sanity, @sanity/ui, React, styled-components) stays external,
// as does MapLibre, which the host project installs.
export default defineConfig({
  publicDir: false,
  plugins: [react()],
  build: {
    outDir: 'dist-sanity',
    emptyOutDir: true,
    sourcemap: true,
    lib: {
      entry: 'src/sanity/index.ts',
      formats: ['es'],
      fileName: () => 'index.mjs',
    },
    rollupOptions: {
      external: [/^sanity(\/|$)/, /^@sanity\//, /^react(\/|$)/, /^react-dom(\/|$)/, 'styled-components', /^maplibre-gl(\/|$)/],
    },
  },
});
