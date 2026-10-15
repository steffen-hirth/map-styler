// Dev tool: renders every template as a small map image for the template cards.
// Not part of the app bundle. Run it in the dev server's browser console:
//   const { renderPreviews } = await import('/src/dev/render-previews.ts');
//   await renderPreviews(async (id, blob) => { /* save blob as public/previews/<id>.webp */ });

import maplibregl from 'maplibre-gl';
import { buildTemplate, TEMPLATES } from '../app/templates';
import { attach } from '../runtime/tooltips';

/** Around Marienplatz and Karlshöhe: route, stops, a café pin and city blocks. */
const VIEW = { center: [9.1652, 48.7656] as [number, number], zoom: 14.8 };
const SIZE = { width: 264, height: 144 };

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function renderPreviews(save: (id: string, blob: Blob) => Promise<void>, only?: string[]) {
  const el = document.createElement('div');
  el.style.cssText = `position:fixed;left:0;top:0;width:${SIZE.width}px;height:${SIZE.height}px;z-index:99999`;
  document.body.append(el);
  const map = new maplibregl.Map({
    container: el,
    style: { version: 8, sources: {}, layers: [] },
    pixelRatio: 2,
    canvasContextAttributes: { preserveDrawingBuffer: true },
    attributionControl: false,
    interactive: false,
    fadeDuration: 0,
  });
  const runtime = attach(map, { maplibregl });
  try {
    for (const template of TEMPLATES) {
      if (only && !only.includes(template.id)) continue;
      const style = await buildTemplate(template);
      map.setStyle(style as never, { diff: false });
      await new Promise((resolve) => map.once('style.load', resolve));
      // The template's own zoom (so e.g. street-name boxes show up), within reason;
      // limited tilt keeps tall glass from hiding the route.
      const zoom = Math.min(Math.max(template.view?.zoom ?? VIEW.zoom, 14.5), 15.6);
      map.jumpTo({ center: VIEW.center, zoom, pitch: Math.min(template.view?.pitch ?? 0, 50), bearing: template.view?.bearing ?? 0 });
      await new Promise((resolve) => map.once('idle', resolve));
      // Give the glass/hatch layers time to build their geometry, then settle.
      await wait(700);
      map.triggerRepaint();
      await new Promise((resolve) => map.once('idle', resolve));
      const blob = await new Promise<Blob | null>((resolve) => map.getCanvas().toBlob(resolve, 'image/webp', 0.86));
      if (blob) await save(template.id, blob);
    }
  } finally {
    runtime.destroy();
    map.remove();
    el.remove();
  }
}
