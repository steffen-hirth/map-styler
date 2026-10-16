// Local test studio for the Sanity plugin. Project and dataset come from
// studio/.env (see .env.example); run it with `npm run studio`.

import { defineCliConfig } from 'sanity/cli';

export default defineCliConfig({
  api: {
    projectId: process.env.SANITY_STUDIO_PROJECT_ID,
    dataset: process.env.SANITY_STUDIO_DATASET || 'production',
  },
  server: { port: 3333 },
  // The plugin is loaded straight from ../src, so Vite may read the parent folder.
  vite: (config) => ({
    ...config,
    server: { ...config.server, fs: { ...config.server?.fs, allow: ['..'] } },
  }),
});
