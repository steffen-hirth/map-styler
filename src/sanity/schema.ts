// Schema types added by the plugin:
//   mapLocation – a geopoint with the map input (use it in your own documents)
//   mapPin      – a pin: name, location, category, icon, text, link
//   mapView     – camera (center, zoom, tilt, rotation)
//   styledMap   – the "Map" document: style, view, pins, tooltip template

import { defineArrayMember, defineField, defineType } from 'sanity';
import { PIN_TYPES } from '../runtime/tooltips/pin-icons';
import { createLocationInput, type LocationInputOptions } from './location-input';
import { createViewInput } from './view-input';

export type SchemaOptions = LocationInputOptions & {
  /** Styles editors can pick for a map (style.json URLs exported from the editor). */
  styles: Array<{ title: string; value: string }>;
  /** Add the "Map" document type (default true). */
  documentType: boolean;
};

const PIN_TYPE_TITLES: Record<string, string> = {
  pin: 'Place',
  star: 'Highlight',
  cafe: 'Café',
  food: 'Food',
  parking: 'Parking',
  view: 'Viewpoint',
  train: 'Station',
  info: 'Info',
  shop: 'Shop',
  home: 'Home',
  photo: 'Photo spot',
  hotel: 'Stay',
};

export function createSchemaTypes(options: SchemaOptions) {
  const mapLocation = defineType({
    name: 'mapLocation',
    title: 'Location',
    type: 'geopoint',
    components: { input: createLocationInput(options) },
  });

  const mapPin = defineType({
    name: 'mapPin',
    title: 'Pin',
    type: 'object',
    fields: [
      defineField({ name: 'name', title: 'Name', type: 'string', validation: (rule) => rule.required() }),
      defineField({ name: 'location', title: 'Location', type: 'mapLocation', validation: (rule) => rule.required() }),
      defineField({ name: 'category', title: 'Category', type: 'string', description: 'Pins of one category share a color and can be filtered together.' }),
      defineField({
        name: 'type',
        title: 'Icon',
        type: 'string',
        initialValue: 'pin',
        options: { list: PIN_TYPES.map((value) => ({ value, title: PIN_TYPE_TITLES[value] ?? value })) },
      }),
      defineField({ name: 'description', title: 'Description', type: 'text', rows: 2 }),
      defineField({ name: 'url', title: 'Link', type: 'url' }),
    ],
    preview: {
      select: { title: 'name', category: 'category', lat: 'location.lat', lng: 'location.lng' },
      prepare: ({ title, category, lat, lng }) => ({
        title: title || 'Unnamed pin',
        subtitle: [category, typeof lat === 'number' ? `${lat.toFixed(4)}, ${lng.toFixed(4)}` : 'no location'].filter(Boolean).join(' · '),
      }),
    },
  });

  const fallbackStyle = options.styles[0]?.value ?? options.mapStyle;

  const mapView = defineType({
    name: 'mapView',
    title: 'View',
    type: 'object',
    components: { input: createViewInput(fallbackStyle) },
    fields: ['lat', 'lng', 'zoom', 'pitch', 'bearing'].map((name) => defineField({ name, type: 'number' })),
  });

  const styledMap = defineType({
    name: 'styledMap',
    title: 'Map',
    type: 'document',
    fields: [
      defineField({ name: 'title', title: 'Title', type: 'string', validation: (rule) => rule.required() }),
      defineField({
        name: 'mapStyle',
        title: 'Style',
        type: 'string',
        description: options.styles.length ? undefined : 'URL of a style.json, e.g. exported from the map editor.',
        options: options.styles.length ? { list: options.styles } : undefined,
        initialValue: options.styles[0]?.value,
      }),
      defineField({ name: 'pins', title: 'Pins', type: 'array', of: [defineArrayMember({ type: 'mapPin' })] }),
      defineField({ name: 'view', title: 'View', type: 'mapView', description: 'Set up the map, then “Use current view”. Empty: zoom to the pins.' }),
      defineField({
        name: 'tooltipTemplate',
        title: 'Tooltip',
        type: 'text',
        rows: 3,
        description: 'Fields in curly braces, one line per row: <strong>{name}</strong> · {category} · {description}. Empty lines are dropped.',
      }),
    ],
    preview: {
      select: { title: 'title', pins: 'pins' },
      prepare: ({ title, pins }) => ({ title, subtitle: `${Array.isArray(pins) ? pins.length : 0} pins` }),
    },
  });

  return options.documentType ? [mapLocation, mapPin, mapView, styledMap] : [mapLocation, mapPin, mapView];
}
