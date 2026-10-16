// Sanity Studio plugin:
//
//   import { mapStyler } from 'map-styler/sanity'
//   export default defineConfig({
//     plugins: [mapStyler({ styles: [{ title: 'Liquid Glass', value: 'https://…/liquid-glass.json' }] })],
//   })

import { definePlugin } from 'sanity';
import { nominatim, type Geocoder } from './geocode';
import { createSchemaTypes } from './schema';

export type MapStylerPluginOptions = {
  /** Styles editors can pick for a map: style.json URLs exported from the editor. */
  styles?: Array<{ title: string; value: string }>;
  /** Style for the location input (default: OpenFreeMap Positron, calm and light). */
  inputStyle?: string;
  /** Address search. Default: OpenStreetMap Nominatim; false hides the search. */
  geocoder?: Geocoder | false;
  /** Start of the location input without a value: [lng, lat]. Default: Central Europe. */
  defaultCenter?: [number, number];
  defaultZoom?: number;
  markerColor?: string;
  /** Add the "Map" document type (default true). Set false to only use mapLocation in your own types. */
  documentType?: boolean;
};

export const DEFAULT_INPUT_STYLE = 'https://tiles.openfreemap.org/styles/positron';

export const mapStyler = definePlugin<MapStylerPluginOptions | void>((options) => {
  const o = options ?? {};
  return {
    name: 'map-styler',
    schema: {
      types: createSchemaTypes({
        mapStyle: o.inputStyle ?? DEFAULT_INPUT_STYLE,
        geocoder: o.geocoder === false ? null : (o.geocoder ?? nominatim()),
        defaultCenter: o.defaultCenter ?? [10.45, 51.16],
        defaultZoom: o.defaultZoom ?? 4.5,
        markerColor: o.markerColor ?? '#4f46e5',
        styles: o.styles ?? [],
        documentType: o.documentType !== false,
      }),
    },
  };
});
