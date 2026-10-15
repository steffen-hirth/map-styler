import { describe, expect, it } from 'vitest';
import { adjustColor, colorKey, parseColor } from './color';
import { PROPS } from './spec';
import {
  applyLabelLanguage,
  collectColorPaths,
  collectPalette,
  readStops,
  replaceColor,
  scaleTextSize,
  setAt,
  shapeOf,
  writeStops,
} from './style-utils';
import type { Style } from './types';

const lineWidth = PROPS.line.paint['line-width'];
const fillColor = PROPS.fill.paint['fill-color'];

const style = (): Style => ({
  version: 8,
  sources: {},
  layers: [
    { id: 'water', type: 'fill', 'source-layer': 'water', paint: { 'fill-color': '#a0c8f0' } },
    { id: 'river', type: 'line', 'source-layer': 'waterway', paint: { 'line-color': 'rgb(160, 200, 240)', 'line-width': 2 } },
    {
      id: 'place',
      type: 'symbol',
      'source-layer': 'place',
      layout: { 'text-field': ['get', 'name'], 'text-size': { stops: [[8, 10], [14, 16]] } },
    },
    { id: 'road-ref', type: 'symbol', layout: { 'text-field': '{ref}' } },
  ],
});

describe('color', () => {
  it('parses hex, rgb and hsl into the same key', () => {
    expect(colorKey('#a0c8f0')).toBe('#a0c8f0');
    expect(colorKey('rgb(160, 200, 240)')).toBe('#a0c8f0');
    expect(colorKey('hsla(0, 0%, 100%, 0.5)')).toBe('rgba(255, 255, 255, 0.5)');
    expect(parseColor('not-a-color')).toBeNull();
  });

  it('inverts lightness', () => {
    expect(adjustColor({ r: 255, g: 255, b: 255, a: 1 }, { invert: true })).toMatchObject({ r: 0, g: 0, b: 0 });
  });
});

describe('value shapes', () => {
  it('classifies literals, stops and expressions', () => {
    expect(shapeOf(undefined, lineWidth)).toBe('unset');
    expect(shapeOf(2, lineWidth)).toBe('literal');
    expect(shapeOf({ base: 1.2, stops: [[10, 1], [16, 4]] }, lineWidth)).toBe('stops');
    expect(shapeOf(['interpolate', ['linear'], ['zoom'], 10, 1, 16, 4], lineWidth)).toBe('stops');
    expect(shapeOf(['match', ['get', 'class'], 'park', '#0f0', '#fff'], fillColor)).toBe('expr');
  });

  it('round-trips stops in their original format', () => {
    const legacy = { base: 1.4, stops: [[16, 4], [10, 1]] };
    expect(writeStops(readStops(legacy, lineWidth)!)).toEqual({ base: 1.4, stops: [[10, 1], [16, 4]] });
    const expr = ['interpolate', ['exponential', 1.5], ['zoom'], 10, 1, 16, 4];
    expect(writeStops(readStops(expr, lineWidth)!)).toEqual(expr);
  });
});

describe('expressions', () => {
  it('finds colors inside match expressions with labels', () => {
    const value = ['match', ['get', 'class'], 'park', '#00ff00', ['wood', 'forest'], '#008800', '#ffffff'];
    const paths = collectColorPaths(value);
    expect(paths.map((p) => p.label)).toEqual(['park', 'wood, forest', 'sonst']);
    expect(setAt(value, paths[0].path, '#123456')).toEqual(['match', ['get', 'class'], 'park', '#123456', ['wood', 'forest'], '#008800', '#ffffff']);
  });
});

describe('style transforms', () => {
  it('groups equal colors across syntaxes and replaces them', () => {
    const s = style();
    const [entry] = collectPalette(s);
    expect(entry.key).toBe('#a0c8f0');
    expect(entry.layerIds).toEqual(['water', 'river']);
    const next = replaceColor(s, entry.refs, entry.key, '#ff0000');
    expect(next.layers[0].paint?.['fill-color']).toBe('#ff0000');
    expect(next.layers[1].paint?.['line-color']).toBe('#ff0000');
  });

  it('scales text sizes including stops', () => {
    const next = scaleTextSize(style(), 1.5);
    expect(next.layers[2].layout?.['text-size']).toEqual({ stops: [[8, 15], [14, 24]] });
  });

  it('switches label language but keeps road refs', () => {
    const { style: next, count } = applyLabelLanguage(style(), 'de');
    expect(count).toBe(1);
    expect(next.layers[2].layout?.['text-field']).toEqual(['coalesce', ['get', 'name:de'], ['get', 'name_de'], ['get', 'name']]);
    expect(next.layers[3].layout?.['text-field']).toBe('{ref}');
  });
});
