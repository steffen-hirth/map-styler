// Pin markers drawn on demand. Icon outlines come from Lucide (ISC License,
// https://lucide.dev), reduced to plain SVG path data so the runtime needs no
// icon library. Images are registered through MapLibre's "styleimagemissing"
// event, so a style only references ids like "msx-pin-cafe-a68b5b".

export const PIN_TYPES = ['pin', 'star', 'cafe', 'food', 'parking', 'view', 'train', 'info', 'shop', 'home', 'photo', 'hotel'] as const;
export type PinType = (typeof PIN_TYPES)[number];

export const PIN_IMAGE_PREFIX = 'msx-pin-';

const PATHS: Record<PinType, string[]> = {
  pin: ['M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0', 'M9 10a3 3 0 1 0 6 0a3 3 0 1 0-6 0'],
  star: ['M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z'],
  cafe: ['M10 2v2', 'M14 2v2', 'M16 8a1 1 0 0 1 1 1v8a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V9a1 1 0 0 1 1-1h14a4 4 0 1 1 0 8h-1', 'M6 2v2'],
  food: ['M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2', 'M7 2v20', 'M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7'],
  parking: ['M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z', 'M9 17V7h4a3 3 0 0 1 0 6H9'],
  view: ['m8 3 4 8 5-5 5 15H2L8 3z'],
  train: ['M8 3.1V7a4 4 0 0 0 8 0V3.1', 'm9 15-1-1', 'm15 15 1-1', 'M9 19c-2.8 0-5-2.2-5-5v-4a8 8 0 0 1 16 0v4c0 2.8-2.2 5-5 5Z', 'm8 19-2 3', 'm16 19 2 3'],
  info: ['M2 12a10 10 0 1 0 20 0a10 10 0 1 0-20 0', 'M12 16v-4', 'M12 8h.01'],
  shop: ['M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z', 'M3 6h18', 'M16 10a4 4 0 0 1-8 0'],
  home: ['M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8', 'M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z'],
  photo: ['M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z', 'M9 13a3 3 0 1 0 6 0a3 3 0 1 0-6 0'],
  hotel: ['M2 20v-8a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v8', 'M4 10V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v4', 'M12 4v6', 'M2 18h20'],
};

export function isPinType(value: unknown): value is PinType {
  return typeof value === 'string' && (PIN_TYPES as readonly string[]).includes(value);
}

/** Expression for a symbol layer's icon-image; the color is baked into the id. */
export function pinImageExpression(colorHex: string): unknown {
  return ['concat', PIN_IMAGE_PREFIX, ['coalesce', ['get', 'type'], 'pin'], '-', colorHex.replace('#', '').toLowerCase()];
}

const SIZE = 56;

/** Draw "msx-pin-<type>-<rrggbb>" as a 28px (@2x) round marker with a white icon. */
export function drawPinImage(id: string): { width: number; height: number; data: Uint8ClampedArray } | null {
  if (!id.startsWith(PIN_IMAGE_PREFIX) || typeof document === 'undefined') return null;
  const match = /^(.+)-([0-9a-f]{6})$/i.exec(id.slice(PIN_IMAGE_PREFIX.length));
  if (!match) return null;
  const type: PinType = isPinType(match[1]) ? match[1] : 'pin';
  const canvas = document.createElement('canvas');
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const cx = SIZE / 2;
  const cy = SIZE / 2 - 1;
  ctx.shadowColor = 'rgba(20, 22, 26, 0.28)';
  ctx.shadowBlur = 5;
  ctx.shadowOffsetY = 1.5;
  ctx.beginPath();
  ctx.arc(cx, cy, 21, 0, Math.PI * 2);
  ctx.fillStyle = `#${match[2]}`;
  ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#ffffff';
  ctx.stroke();

  const scale = 0.92;
  ctx.save();
  ctx.translate(cx - 12 * scale, cy - 12 * scale);
  ctx.scale(scale, scale);
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2.2;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  for (const d of PATHS[type]) ctx.stroke(new Path2D(d));
  ctx.restore();

  const image = ctx.getImageData(0, 0, SIZE, SIZE);
  return { width: SIZE, height: SIZE, data: image.data };
}
