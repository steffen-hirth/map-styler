// Test studio: the plugin's "Map" document plus a "Place" type that uses the
// mapLocation field the way a real project would.

import { defineConfig, defineField, defineType } from 'sanity';
import { structureTool } from 'sanity/structure';
import { mapStyler } from '../src/sanity';

const place = defineType({
  name: 'place',
  title: 'Place',
  type: 'document',
  fields: [
    defineField({ name: 'title', title: 'Title', type: 'string', validation: (rule) => rule.required() }),
    defineField({ name: 'location', title: 'Location', type: 'mapLocation' }),
    defineField({ name: 'category', title: 'Category', type: 'string', options: { list: ['Café', 'Shop', 'Aussicht', 'Museum'] } }),
    defineField({ name: 'type', title: 'Icon', type: 'string', options: { list: ['pin', 'cafe', 'shop', 'view', 'info'] } }),
    defineField({ name: 'description', title: 'Description', type: 'text', rows: 2 }),
  ],
  preview: { select: { title: 'title', subtitle: 'category' } },
});

export default defineConfig({
  name: 'map-styler-test',
  title: 'Map Styler · Test Studio',
  projectId: process.env.SANITY_STUDIO_PROJECT_ID ?? '',
  dataset: process.env.SANITY_STUDIO_DATASET || 'production',
  plugins: [
    structureTool(),
    mapStyler({
      // Replace with style.json files exported from the editor once they are hosted.
      styles: [
        { title: 'OpenFreeMap Positron', value: 'https://tiles.openfreemap.org/styles/positron' },
        { title: 'OpenFreeMap Liberty', value: 'https://tiles.openfreemap.org/styles/liberty' },
        { title: 'OpenFreeMap Bright', value: 'https://tiles.openfreemap.org/styles/bright' },
      ],
      defaultCenter: [9.18, 48.775],
      defaultZoom: 11,
    }),
  ],
  schema: { types: [place] },
});
