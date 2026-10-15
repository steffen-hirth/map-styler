// Loose structural types for editing arbitrary MapLibre styles. The official
// spec types are unions per layer type, which makes generic property editing
// awkward; the style is cast to StyleSpecification only when handed to MapLibre.

export type PropKind = 'paint' | 'layout';

export type Layer = {
  id: string;
  type: string;
  source?: string;
  'source-layer'?: string;
  paint?: Record<string, unknown>;
  layout?: Record<string, unknown>;
  filter?: unknown;
  minzoom?: number;
  maxzoom?: number;
  metadata?: unknown;
  [key: string]: unknown;
};

export type Style = {
  version: 8;
  name?: string;
  sources: Record<string, unknown>;
  layers: Layer[];
  metadata?: Record<string, unknown>;
  sprite?: unknown;
  glyphs?: string;
  [key: string]: unknown;
};

export function isStyle(value: unknown): value is Style {
  return (
    !!value &&
    typeof value === 'object' &&
    (value as Style).version === 8 &&
    Array.isArray((value as Style).layers) &&
    typeof (value as Style).sources === 'object'
  );
}
