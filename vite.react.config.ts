import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// Builds the React component (<StyledMap>) as an ES module into dist-react/.
// React and MapLibre stay external: the host app brings its own copies.
export default defineConfig({
  publicDir: false,
  plugins: [react()],
  build: {
    outDir: 'dist-react',
    emptyOutDir: true,
    sourcemap: true,
    lib: {
      entry: 'src/react/index.ts',
      formats: ['es'],
      fileName: () => 'index.mjs',
    },
    rollupOptions: {
      external: ['react', 'react-dom', 'react/jsx-runtime', 'maplibre-gl'],
      output: {
        // Keep the "use client" directive for Next.js server components.
        banner: "'use client';",
      },
    },
  },
});
