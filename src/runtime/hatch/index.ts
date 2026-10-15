// Crisp hatching for MapLibre. Fill patterns are scaled and cross-faded between
// zoom levels, which makes fine lines blur, double and show their tiles. This
// custom layer replaces the background and draws the paper plus hatch lines in
// device pixels instead, anchored to the map so they move with it.
// Settings live in style.metadata["mapstyler:hatch"]; without this script the
// style shows its own background (for example a pattern) as the fallback.

import type { CustomLayerInterface, Map as MapLibreMap } from 'maplibre-gl';

export const HATCH_KEY = 'mapstyler:hatch';
const LAYER_ID = 'msx-hatch';
const PARKED = 24;

export type HatchConfig = {
  /** The background layer to replace. */
  layer: string;
  paper: string;
  color: string;
  /** Distance between lines in CSS pixels. */
  spacing: number;
  /** Line width in CSS pixels. */
  width: number;
  /** Line angle in degrees, follows the map's rotation. */
  angle: number;
};

export const DEFAULT_HATCH: HatchConfig = { layer: 'background', paper: '#e4e2db', color: '#e0604f', spacing: 5, width: 0.9, angle: 45 };

export function normalizeHatch(input: unknown): HatchConfig | null {
  if (!input || typeof input !== 'object') return null;
  const raw = input as Record<string, unknown>;
  if (raw.enabled === false) return null;
  const out = { ...DEFAULT_HATCH } as Record<string, unknown>;
  for (const key of Object.keys(DEFAULT_HATCH)) {
    const value = raw[key];
    if (value != null && typeof value === typeof DEFAULT_HATCH[key as keyof HatchConfig]) out[key] = value;
  }
  return out as HatchConfig;
}

const VERTEX = `
attribute vec2 a_pos;
// Drawn at the far plane: opaque fills (water, parks) from MapLibre's opaque
// pass are already in the depth buffer and stay in front of the paper.
void main() { gl_Position = vec4(a_pos, 1.0, 1.0); }`;

const FRAGMENT = `
precision highp float;
uniform vec2 u_anchor;
uniform vec2 u_dir;
uniform float u_spacing;
uniform float u_width;
uniform vec3 u_paper;
uniform vec3 u_color;
void main() {
  float d = dot(gl_FragCoord.xy - u_anchor, u_dir);
  float m = mod(d, u_spacing);
  float dist = min(m, u_spacing - m);
  float ink = 1.0 - smoothstep(u_width * 0.5 - 0.5, u_width * 0.5 + 0.5, dist);
  gl_FragColor = vec4(mix(u_paper, u_color, ink), 1.0);
}`;

const hexToRgb = (hex: string): [number, number, number] => {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return [1, 1, 1];
  return [0, 2, 4].map((i) => parseInt(m[1].slice(i, i + 2), 16) / 255) as [number, number, number];
};

/** Unbind MapLibre's vertex array object so our attribute setup cannot change it. */
function unbindVertexArray(gl: WebGLRenderingContext) {
  if ('bindVertexArray' in gl) (gl as unknown as WebGL2RenderingContext).bindVertexArray(null);
  else gl.getExtension('OES_vertex_array_object')?.bindVertexArrayOES(null);
}

function createHatchLayer(map: MapLibreMap, getConfig: () => HatchConfig): CustomLayerInterface {
  let program: WebGLProgram | null = null;
  let buffer: WebGLBuffer | null = null;
  let uniforms: Record<string, WebGLUniformLocation | null> = {};
  let attrib = -1;
  // A fixed geographic point the lines are anchored to, so they pan with the map.
  let anchor = map.getCenter();

  return {
    id: LAYER_ID,
    type: 'custom',
    renderingMode: '2d',
    onAdd(_map, context) {
      const gl = context as WebGLRenderingContext;
      const shader = (type: number, source: string) => {
        const s = gl.createShader(type)!;
        gl.shaderSource(s, source);
        gl.compileShader(s);
        if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) ?? 'hatch shader');
        return s;
      };
      program = gl.createProgram()!;
      gl.attachShader(program, shader(gl.VERTEX_SHADER, VERTEX));
      gl.attachShader(program, shader(gl.FRAGMENT_SHADER, FRAGMENT));
      gl.linkProgram(program);
      attrib = gl.getAttribLocation(program, 'a_pos');
      for (const name of ['u_anchor', 'u_dir', 'u_spacing', 'u_width', 'u_paper', 'u_color']) uniforms[name] = gl.getUniformLocation(program, name);
      buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
    },
    onRemove(_map, context) {
      const gl = context as WebGLRenderingContext;
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
      program = null;
      buffer = null;
      uniforms = {};
    },
    render(context) {
      const gl = context as WebGLRenderingContext;
      if (!program || !buffer) return;
      const cfg = getConfig();
      const ratio = gl.drawingBufferWidth / map.getCanvas().clientWidth || 1;
      let point = map.project(anchor);
      // Re-anchor when far away so the numbers stay small.
      if (Math.abs(point.x) > 1e5 || Math.abs(point.y) > 1e5) {
        anchor = map.getCenter();
        point = map.project(anchor);
      }
      const angle = ((cfg.angle - map.getBearing()) * Math.PI) / 180;

      unbindVertexArray(gl);
      gl.useProgram(program);
      gl.uniform2f(uniforms.u_anchor, point.x * ratio, gl.drawingBufferHeight - point.y * ratio);
      gl.uniform2f(uniforms.u_dir, Math.cos(angle), Math.sin(angle));
      gl.uniform1f(uniforms.u_spacing, Math.max(cfg.spacing, 1) * ratio);
      gl.uniform1f(uniforms.u_width, cfg.width * ratio);
      gl.uniform3fv(uniforms.u_paper, hexToRgb(cfg.paper));
      gl.uniform3fv(uniforms.u_color, hexToRgb(cfg.color));
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.enableVertexAttribArray(attrib);
      gl.vertexAttribPointer(attrib, 2, gl.FLOAT, false, 0, 0);
      // Never touch MapLibre's stencil tile masks.
      gl.disable(gl.STENCIL_TEST);
      gl.stencilMask(0);
      gl.disable(gl.BLEND);
      gl.enable(gl.DEPTH_TEST);
      gl.depthFunc(gl.LEQUAL);
      gl.depthMask(false);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      gl.depthMask(true);
      gl.stencilMask(0xff);
      gl.disableVertexAttribArray(attrib);
    },
  };
}

export type HatchHandle = { destroy(): void };

/** Watch the style for metadata["mapstyler:hatch"] and keep the hatch layer in sync. */
export function attachHatch(map: MapLibreMap): HatchHandle {
  let config: HatchConfig | null = null;
  // Like the glass layer: park the replaced layer at an unreachable zoom instead
  // of hiding it, so styles that hide it on purpose are left alone.
  let parked: { id: string; minzoom: number; maxzoom: number } | null = null;
  let last = '';

  const unpark = () => {
    if (parked && map.getLayer(parked.id)?.minzoom === PARKED) map.setLayerZoomRange(parked.id, parked.minzoom, parked.maxzoom);
    parked = null;
  };

  const sync = () => {
    const style = map.getStyle();
    if (!style?.layers) return;
    const next = normalizeHatch((style.metadata as Record<string, unknown> | undefined)?.[HATCH_KEY]);
    const target = next && map.getLayer(next.layer) && map.getLayoutProperty(next.layer, 'visibility') !== 'none' ? next : null;
    const key = JSON.stringify(target);
    if (key !== last) {
      last = key;
      if (parked && parked.id !== target?.layer) unpark();
      config = target;
      if (!target && map.getLayer(LAYER_ID)) map.removeLayer(LAYER_ID);
    }
    if (!target) return;
    const layer = map.getLayer(target.layer);
    if (layer && layer.minzoom !== PARKED) {
      parked = { id: target.layer, minzoom: layer.minzoom ?? 0, maxzoom: layer.maxzoom ?? 24 };
      map.setLayerZoomRange(target.layer, PARKED, PARKED);
    }
    if (!map.getLayer(LAYER_ID)) {
      const ids = style.layers.map((l) => l.id);
      const before = ids[ids.indexOf(target.layer) + 1];
      map.addLayer(createHatchLayer(map, () => config ?? DEFAULT_HATCH), before && before !== LAYER_ID ? before : undefined);
    }
    map.triggerRepaint();
  };

  map.on('styledata', sync);
  if (map.isStyleLoaded()) sync();

  return {
    destroy() {
      map.off('styledata', sync);
      if (map.getLayer(LAYER_ID)) map.removeLayer(LAYER_ID);
      unpark();
    },
  };
}
