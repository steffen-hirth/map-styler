import { describe, expect, it } from 'vitest';
import { normalize, renderTemplate } from './index';

describe('kind fields', () => {
  it('turns OpenMapTiles keys into readable labels', () => {
    expect(renderTemplate('{kind_de}', { class: 'park' })).toBe('Park');
    expect(renderTemplate('{kind_de}', { class: 'bus', subclass: 'bus_stop' })).toBe('Bushaltestelle');
    expect(renderTemplate('{kind_en}', { subclass: 'bus_stop' })).toBe('Bus stop');
    expect(renderTemplate('{kind_de}', { class: 'some_thing' })).toBe('Some thing');
    expect(renderTemplate('a\n{kind_de}', {})).toBe('a');
  });

  it('upgrades the old default template', () => {
    const cfg = normalize({ layers: { poi: { template: '<strong>{name:de|name}</strong>\n<span>{subclass|class}</span>' } } });
    expect(cfg.layers.poi.template).toContain('{kind_de}');
  });
});
