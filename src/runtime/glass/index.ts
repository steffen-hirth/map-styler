// Liquid glass buildings for MapLibre. A custom WebGL layer takes the place of
// a fill-extrusion layer: it copies the map drawn so far into a texture and
// renders the buildings as glass that refracts, blurs and tints that texture,
// with bent normals near the edges (a rounded bevel) for rim and highlight.
// The settings live in style.metadata["mapstyler:glass"]; without this script
// the style simply shows its regular extrusion layer.

import earcut from 'earcut';
import type { CustomLayerInterface, CustomRenderMethodInput, Map as MapLibreMap } from 'maplibre-gl';

export const GLASS_KEY = 'mapstyler:glass';
const LAYER_ID = 'msx-glass';
const PARKED = 24;

export type GlassConfig = {
  /** The fill-extrusion layer to replace. */
  layer: string;
  tint: string;
  /** 0..1, how much the tint covers the refracted map. */
  tintStrength: number;
  /** Maximum refraction offset in CSS pixels. */
  refraction: number;
  /** Frosting radius in CSS pixels. */
  blur: number;
  /** Width of the rounded edge in meters. */
  bevel: number;
  rim: string;
  rimStrength: number;
  specular: number;
};

export const DEFAULT_GLASS: GlassConfig = {
  layer: 'building-3d',
  tint: '#dff4ff',
  tintStrength: 0.18,
  refraction: 28,
  blur: 6,
  bevel: 4,
  rim: '#ffffff',
  rimStrength: 0.9,
  specular: 0.8,
};

export function normalizeGlass(input: unknown): GlassConfig | null {
  if (!input || typeof input !== 'object') return null;
  const raw = input as Record<string, unknown>;
  if (raw.enabled === false) return null;
  const out = { ...DEFAULT_GLASS } as Record<string, unknown>;
  for (const key of Object.keys(DEFAULT_GLASS)) {
    const value = raw[key];
    if (value != null && typeof value === typeof DEFAULT_GLASS[key as keyof GlassConfig]) out[key] = value;
  }
  return out as GlassConfig;
}

// Geometry ----------------------------------------------------------------------

// Per vertex: position (3), normal (3), edge tangent (3), side (4: distance
// along the wall, wall length, height above base, wall height).
const STRIDE = 13;
const FAR = 1e4;

type Ring = number[][];

const mercX = (lng: number) => (lng + 180) / 360;
const mercY = (lat: number) => (1 - Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360)) / Math.PI) / 2;
/** Mercator units per meter at a latitude (same as MercatorCoordinate). */
const unitsPerMeter = (lat: number) => 1 / (40075016.68557849 * Math.cos((lat * Math.PI) / 180));

export type Origin = { x: number; y: number; unit: number };

export function originAt(lng: number, lat: number): Origin {
  return { x: mercX(lng), y: mercY(lat), unit: unitsPerMeter(lat) };
}

/** Triangles for one polygon (outer ring + holes) as glass: roof and walls. */
export function buildPolygon(rings: Ring[], base: number, height: number, origin: Origin, out: number[]): void {
  if (height <= base || !rings.length) return;
  const local = rings.map((ring) =>
    ring.map(([lng, lat]) => [(mercX(lng) - origin.x) / origin.unit, (mercY(lat) - origin.y) / origin.unit]),
  );
  const wallHeight = height - base;

  // Roof
  const flat: number[] = [];
  const holes: number[] = [];
  for (const ring of local) {
    if (flat.length) holes.push(flat.length / 2);
    for (const [x, y] of ring) flat.push(x, y);
  }
  const tris = earcut(flat, holes, 2);
  for (const i of tris) {
    out.push(flat[i * 2], flat[i * 2 + 1], height, 0, 0, 1, 0, 0, 0, FAR, FAR * 2, wallHeight, wallHeight);
  }

  // Walls, with outward normals regardless of ring winding.
  for (const ring of local) {
    let area = 0;
    for (let i = 0; i < ring.length - 1; i++) area += ring[i][0] * ring[i + 1][1] - ring[i + 1][0] * ring[i][1];
    const sign = area > 0 ? 1 : -1;
    for (let i = 0; i < ring.length - 1; i++) {
      const [ax, ay] = ring[i];
      const [bx, by] = ring[i + 1];
      const len = Math.hypot(bx - ax, by - ay);
      if (len < 0.05) continue;
      const tx = (bx - ax) / len;
      const ty = (by - ay) / len;
      // y grows southwards, so the outward normal of a positive ring is (ty, -tx).
      const nx = ty * sign;
      const ny = -tx * sign;
      const v = (x: number, y: number, z: number, s: number) =>
        out.push(x, y, z, nx, ny, 0, tx, ty, 0, s, len, z - base, wallHeight);
      v(ax, ay, base, 0);
      v(bx, by, base, len);
      v(bx, by, height, len);
      v(ax, ay, base, 0);
      v(bx, by, height, len);
      v(ax, ay, height, 0);
    }
  }
}

// Matrices (column-major, like gl-matrix) ----------------------------------------

type Mat4 = ArrayLike<number>;

function multiply(a: Mat4, b: Mat4): Float64Array {
  const out = new Float64Array(16);
  for (let c = 0; c < 4; c++) {
    for (let r = 0; r < 4; r++) {
      let sum = 0;
      for (let k = 0; k < 4; k++) sum += a[k * 4 + r] * b[c * 4 + k];
      out[c * 4 + r] = sum;
    }
  }
  return out;
}

function invert(m: Mat4): Float64Array | null {
  const [a00, a01, a02, a03, a10, a11, a12, a13, a20, a21, a22, a23, a30, a31, a32, a33] = Array.from(m);
  const b00 = a00 * a11 - a01 * a10;
  const b01 = a00 * a12 - a02 * a10;
  const b02 = a00 * a13 - a03 * a10;
  const b03 = a01 * a12 - a02 * a11;
  const b04 = a01 * a13 - a03 * a11;
  const b05 = a02 * a13 - a03 * a12;
  const b06 = a20 * a31 - a21 * a30;
  const b07 = a20 * a32 - a22 * a30;
  const b08 = a20 * a33 - a23 * a30;
  const b09 = a21 * a32 - a22 * a31;
  const b10 = a21 * a33 - a23 * a31;
  const b11 = a22 * a33 - a23 * a32;
  const det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;
  if (!det) return null;
  const d = 1 / det;
  return Float64Array.from([
    (a11 * b11 - a12 * b10 + a13 * b09) * d,
    (a02 * b10 - a01 * b11 - a03 * b09) * d,
    (a31 * b05 - a32 * b04 + a33 * b03) * d,
    (a22 * b04 - a21 * b05 - a23 * b03) * d,
    (a12 * b08 - a10 * b11 - a13 * b07) * d,
    (a00 * b11 - a02 * b08 + a03 * b07) * d,
    (a32 * b02 - a30 * b05 - a33 * b01) * d,
    (a20 * b05 - a22 * b02 + a23 * b01) * d,
    (a10 * b10 - a11 * b08 + a13 * b06) * d,
    (a01 * b08 - a00 * b10 - a03 * b06) * d,
    (a30 * b04 - a31 * b02 + a33 * b00) * d,
    (a21 * b02 - a20 * b04 - a23 * b00) * d,
    (a11 * b07 - a10 * b09 - a12 * b06) * d,
    (a00 * b09 - a01 * b07 + a02 * b06) * d,
    (a31 * b01 - a30 * b03 - a32 * b00) * d,
    (a20 * b03 - a21 * b01 + a22 * b00) * d,
  ]);
}

// Shaders -------------------------------------------------------------------------

const VERTEX = `
precision highp float;
uniform mat4 u_matrix;
attribute vec3 a_pos;
attribute vec3 a_normal;
attribute vec3 a_tangent;
attribute vec4 a_side;
varying vec3 v_pos;
varying vec3 v_normal;
varying vec3 v_tangent;
varying vec4 v_side;
void main() {
  v_pos = a_pos;
  v_normal = a_normal;
  v_tangent = a_tangent;
  v_side = a_side;
  gl_Position = u_matrix * vec4(a_pos, 1.0);
}`;

const FRAGMENT = `
precision highp float;
uniform mat4 u_matrix;
uniform sampler2D u_backdrop;
uniform vec2 u_viewport;
uniform vec3 u_eye;
uniform vec3 u_tint;
uniform float u_tintStrength;
uniform float u_refraction;
uniform float u_blur;
uniform float u_bevel;
uniform vec3 u_rim;
uniform float u_rimStrength;
uniform float u_specular;
varying vec3 v_pos;
varying vec3 v_normal;
varying vec3 v_tangent;
varying vec4 v_side;

vec2 screen(vec3 p) {
  vec4 c = u_matrix * vec4(p, 1.0);
  return c.xy / c.w;
}

void main() {
  vec3 n = normalize(v_normal);
  // Rounded bevel: bend the normal towards the nearest wall edge and the roof.
  float toStart = v_side.x;
  float toEnd = v_side.y - v_side.x;
  float toTop = v_side.w - v_side.z;
  float side = 1.0 - smoothstep(0.0, u_bevel, min(toStart, toEnd));
  float top = 1.0 - smoothstep(0.0, u_bevel, toTop);
  vec3 along = toStart < toEnd ? -v_tangent : v_tangent;
  n = normalize(n + along * side * 1.6 + vec3(0.0, 0.0, 1.0) * top * 1.6);

  vec3 view = normalize(u_eye - v_pos);
  float facing = abs(dot(n, view));
  float fresnel = pow(1.0 - facing, 5.0) * (0.35 + 0.65 * max(side, top));

  // Refraction: push the backdrop lookup along the normal's screen direction.
  vec2 here = screen(v_pos);
  vec2 dir = screen(v_pos + n * 0.5) - here;
  float len = length(dir);
  dir = len > 0.0 ? dir / len : vec2(0.0);
  // Strongest at the rounded edges, like the thick rim of a glass slab.
  float edge = max(side, top);
  float strength = 0.2 + 1.3 * edge + 0.5 * (1.0 - facing);
  vec2 uv = gl_FragCoord.xy / u_viewport - dir * strength * u_refraction / u_viewport;

  // Frosting: centre tap plus two rings of eight taps.
  vec2 px = u_blur / u_viewport;
  vec3 color = texture2D(u_backdrop, uv).rgb * 0.12;
  for (int i = 0; i < 8; i++) {
    float a = float(i) * 0.785398;
    vec2 o = vec2(cos(a), sin(a));
    color += texture2D(u_backdrop, uv + o * px * 0.5).rgb * 0.055;
    color += texture2D(u_backdrop, uv + vec2(cos(a + 0.392699), sin(a + 0.392699)) * px).rgb * 0.055;
  }

  color = mix(color, u_tint, u_tintStrength);
  // Walls slightly darker at the base, lighter towards the top.
  float lift = v_normal.z > 0.5 ? 1.0 : 0.94 + 0.06 * clamp(v_side.z / max(v_side.w, 1.0), 0.0, 1.0);
  color *= lift;

  vec3 light = normalize(vec3(-0.45, -0.55, 0.7));
  float spec = pow(max(dot(n, normalize(light + view)), 0.0), 48.0) * u_specular;
  color += u_rim * fresnel * u_rimStrength + vec3(spec);
  gl_FragColor = vec4(min(color, vec3(1.0)), 1.0);
}`;

function compile(gl: WebGLRenderingContext, type: number, source: string): WebGLShader {
  const shader = gl.createShader(type)!;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader) ?? 'glass shader');
  return shader;
}

const hexToRgb = (hex: string): [number, number, number] => {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return [1, 1, 1];
  return [0, 2, 4].map((i) => parseInt(m[1].slice(i, i + 2), 16) / 255) as [number, number, number];
};

// Layer ---------------------------------------------------------------------------

/** Unbind MapLibre's vertex array object so our attribute setup cannot change it. */
function unbindVertexArray(gl: WebGLRenderingContext) {
  if ('bindVertexArray' in gl) (gl as unknown as WebGL2RenderingContext).bindVertexArray(null);
  else gl.getExtension('OES_vertex_array_object')?.bindVertexArrayOES(null);
}

type Uniforms = Record<string, WebGLUniformLocation | null>;

function createGlassLayer(map: MapLibreMap, getConfig: () => GlassConfig, getMinzoom: () => number) {
  let gl: WebGLRenderingContext | null = null;
  let program: WebGLProgram | null = null;
  let uniforms: Uniforms = {};
  let attribs: Record<string, number> = {};
  let buffer: WebGLBuffer | null = null;
  let texture: WebGLTexture | null = null;
  let count = 0;
  let origin: Origin = originAt(0, 0);
  let pending: Float32Array | null = null;
  let timer: ReturnType<typeof setTimeout> | undefined;

  const rebuild = () => {
    const cfg = getConfig();
    const layer = map.getLayer(cfg.layer) as { source?: string; sourceLayer?: string; filter?: unknown } | undefined;
    if (!layer?.source) return;
    const center = map.getCenter();
    const nextOrigin = originAt(center.lng, center.lat);
    const data: number[] = [];
    if (map.getZoom() >= getMinzoom() - 0.5) {
      const features = map.querySourceFeatures(layer.source, {
        sourceLayer: layer.sourceLayer,
        filter: layer.filter as never,
      });
      for (const f of features) {
        const p = f.properties ?? {};
        const height = Number(p.render_height ?? p.height ?? 0);
        const base = Number(p.render_min_height ?? p.min_height ?? 0);
        const g = f.geometry;
        if (g.type === 'Polygon') buildPolygon(g.coordinates as Ring[], base, height, nextOrigin, data);
        else if (g.type === 'MultiPolygon') for (const poly of g.coordinates) buildPolygon(poly as Ring[], base, height, nextOrigin, data);
      }
    }
    origin = nextOrigin;
    pending = new Float32Array(data);
    map.triggerRepaint();
  };

  const schedule = () => {
    clearTimeout(timer);
    timer = setTimeout(rebuild, 120);
  };
  const onSourceData = (e: { sourceId?: string; isSourceLoaded?: boolean }) => {
    const layer = map.getLayer(getConfig().layer) as { source?: string } | undefined;
    if (e.sourceId && e.sourceId === layer?.source && e.isSourceLoaded) schedule();
  };

  const custom: CustomLayerInterface = {
    id: LAYER_ID,
    type: 'custom',
    renderingMode: '3d',
    onAdd(_map, context) {
      gl = context as WebGLRenderingContext;
      program = gl.createProgram()!;
      gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, VERTEX));
      gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, FRAGMENT));
      gl.linkProgram(program);
      for (const name of ['a_pos', 'a_normal', 'a_tangent', 'a_side']) attribs[name] = gl.getAttribLocation(program, name);
      for (const name of ['u_matrix', 'u_backdrop', 'u_viewport', 'u_eye', 'u_tint', 'u_tintStrength', 'u_refraction', 'u_blur', 'u_bevel', 'u_rim', 'u_rimStrength', 'u_specular']) {
        uniforms[name] = gl.getUniformLocation(program, name);
      }
      buffer = gl.createBuffer();
      texture = gl.createTexture();
      map.on('sourcedata', onSourceData);
      map.on('moveend', schedule);
      schedule();
    },
    onRemove() {
      clearTimeout(timer);
      map.off('sourcedata', onSourceData);
      map.off('moveend', schedule);
      if (gl) {
        gl.deleteBuffer(buffer);
        gl.deleteTexture(texture);
        gl.deleteProgram(program);
      }
      gl = null;
      program = null;
      uniforms = {};
      attribs = {};
    },
    render(context, options: CustomRenderMethodInput) {
      const g = context as WebGLRenderingContext;
      if (!program || !buffer || !texture) return;
      unbindVertexArray(g);
      if (pending) {
        g.bindBuffer(g.ARRAY_BUFFER, buffer);
        g.bufferData(g.ARRAY_BUFFER, pending, g.STATIC_DRAW);
        count = pending.length / STRIDE;
        pending = null;
      }
      if (!count) return;
      const cfg = getConfig();
      const width = g.drawingBufferWidth;
      const height = g.drawingBufferHeight;
      const ratio = width / map.getCanvas().clientWidth || 1;

      // Everything drawn so far becomes the backdrop seen through the glass.
      g.activeTexture(g.TEXTURE0);
      g.bindTexture(g.TEXTURE_2D, texture);
      g.copyTexImage2D(g.TEXTURE_2D, 0, g.RGBA, 0, 0, width, height, 0);
      g.texParameteri(g.TEXTURE_2D, g.TEXTURE_MIN_FILTER, g.LINEAR);
      g.texParameteri(g.TEXTURE_2D, g.TEXTURE_MAG_FILTER, g.LINEAR);
      g.texParameteri(g.TEXTURE_2D, g.TEXTURE_WRAP_S, g.CLAMP_TO_EDGE);
      g.texParameteri(g.TEXTURE_2D, g.TEXTURE_WRAP_T, g.CLAMP_TO_EDGE);

      // Local meters -> mercator -> clip space, composed in double precision.
      const u = origin.unit;
      const model = [u, 0, 0, 0, 0, u, 0, 0, 0, 0, u, 0, origin.x, origin.y, 0, 1];
      const main = options.defaultProjectionData?.mainMatrix ?? options.modelViewProjectionMatrix;
      const matrix = multiply(main as Mat4, model);
      const inverse = invert(matrix);
      let eye: [number, number, number] = [0, 0, 1e5];
      if (inverse) {
        const e = [0, 1, 2, 3].map((r) => inverse[8 + r]);
        if (e[3]) eye = [e[0] / e[3], e[1] / e[3], e[2] / e[3]];
      }

      g.useProgram(program);
      g.uniformMatrix4fv(uniforms.u_matrix, false, Float32Array.from(matrix));
      g.uniform1i(uniforms.u_backdrop, 0);
      g.uniform2f(uniforms.u_viewport, width, height);
      g.uniform3f(uniforms.u_eye, eye[0], eye[1], eye[2]);
      g.uniform3fv(uniforms.u_tint, hexToRgb(cfg.tint));
      g.uniform1f(uniforms.u_tintStrength, cfg.tintStrength);
      g.uniform1f(uniforms.u_refraction, cfg.refraction * ratio);
      g.uniform1f(uniforms.u_blur, cfg.blur * ratio);
      g.uniform1f(uniforms.u_bevel, cfg.bevel);
      g.uniform3fv(uniforms.u_rim, hexToRgb(cfg.rim));
      g.uniform1f(uniforms.u_rimStrength, cfg.rimStrength);
      g.uniform1f(uniforms.u_specular, cfg.specular);

      g.bindBuffer(g.ARRAY_BUFFER, buffer);
      const bytes = STRIDE * 4;
      const bind = (name: string, size: number, offset: number) => {
        const loc = attribs[name];
        if (loc < 0) return;
        g.enableVertexAttribArray(loc);
        g.vertexAttribPointer(loc, size, g.FLOAT, false, bytes, offset * 4);
      };
      bind('a_pos', 3, 0);
      bind('a_normal', 3, 3);
      bind('a_tangent', 3, 6);
      bind('a_side', 4, 9);

      // Depth pre-pass so only the nearest glass surface is shaded.
      // Never touch MapLibre's stencil tile masks.
      g.disable(g.STENCIL_TEST);
      g.stencilMask(0);
      g.disable(g.BLEND);
      g.disable(g.CULL_FACE);
      g.enable(g.DEPTH_TEST);
      g.depthFunc(g.LEQUAL);
      g.depthMask(true);
      g.colorMask(false, false, false, false);
      g.drawArrays(g.TRIANGLES, 0, count);
      g.colorMask(true, true, true, true);
      g.depthMask(false);
      g.drawArrays(g.TRIANGLES, 0, count);
      g.depthMask(true);
      g.stencilMask(0xff);
      for (const name of Object.keys(attribs)) if (attribs[name] >= 0) g.disableVertexAttribArray(attribs[name]);
    },
  };
  return custom;
}

// Wiring --------------------------------------------------------------------------

export type GlassHandle = { refresh(): void; destroy(): void };

/** Watch the style for metadata["mapstyler:glass"] and keep the glass layer in sync. */
export function attachGlass(map: MapLibreMap): GlassHandle {
  let config: GlassConfig | null = null;
  // The replaced extrusion is "parked" at a zoom range no map reaches instead of
  // being hidden, so a later style that hides it on purpose is left alone.
  let parked: { id: string; minzoom: number; maxzoom: number } | null = null;
  let last = '';

  const park = (id: string) => {
    const layer = map.getLayer(id);
    if (!layer || layer.minzoom === PARKED) return;
    parked = { id, minzoom: layer.minzoom ?? 0, maxzoom: layer.maxzoom ?? 24 };
    map.setLayerZoomRange(id, PARKED, PARKED);
  };

  const unpark = () => {
    if (parked && map.getLayer(parked.id)?.minzoom === PARKED) map.setLayerZoomRange(parked.id, parked.minzoom, parked.maxzoom);
    parked = null;
  };

  const sync = () => {
    const style = map.getStyle();
    if (!style?.layers) return;
    const next = normalizeGlass((style.metadata as Record<string, unknown> | undefined)?.[GLASS_KEY]);
    const visible = next && map.getLayer(next.layer) && map.getLayoutProperty(next.layer, 'visibility') !== 'none';
    const target = visible ? next : null;
    const key = JSON.stringify(target);
    if (key !== last) {
      last = key;
      if (parked && parked.id !== target?.layer) unpark();
      config = target;
      if (!target && map.getLayer(LAYER_ID)) map.removeLayer(LAYER_ID);
    }
    if (!target) return;
    // The regular extrusion stays in the style as the fallback; park it here.
    park(target.layer);
    if (!map.getLayer(LAYER_ID)) {
      const ids = style.layers.map((l) => l.id);
      const before = ids[ids.indexOf(target.layer) + 1];
      map.addLayer(
        createGlassLayer(map, () => config ?? DEFAULT_GLASS, () => parked?.minzoom ?? 0),
        before && before !== LAYER_ID ? before : undefined,
      );
    }
    map.triggerRepaint();
  };

  map.on('styledata', sync);
  if (map.isStyleLoaded()) sync();

  return {
    refresh: sync,
    destroy() {
      map.off('styledata', sync);
      if (map.getLayer(LAYER_ID)) map.removeLayer(LAYER_ID);
      unpark();
    },
  };
}
