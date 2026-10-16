//#region node_modules/earcut/src/earcut.js
var e = /* @__PURE__ */ new Set(), t = !1;
function n(t, n, i = 2) {
	let o = n && n.length, s = o ? n[0] * i : t.length;
	e.size && e.clear();
	let c = r(t, 0, s, i, !0), l = [];
	if (!c || c.next === c.prev) return l;
	let u = 0, f = 0, p = 0;
	if (o && (c = d(t, n, c, i)), t.length > 80 * i) {
		u = t[0], f = t[1];
		let e = u, n = f;
		for (let r = i; r < s; r += i) {
			let i = t[r], a = t[r + 1];
			i < u && (u = i), a < f && (f = a), i > e && (e = i), a > n && (n = a);
		}
		p = Math.max(e - u, n - f), p = p === 0 ? 0 : 32767 / p;
	}
	return a(c, l, u, f, p), l;
}
function r(e, t, n, r, i) {
	let a = null;
	if (i === ce(e, t, n, r) > 0) for (let i = t; i < n; i += r) a = oe(i / r | 0, e[i], e[i + 1], a);
	else for (let i = n - r; i >= t; i -= r) a = oe(i / r | 0, e[i], e[i + 1], a);
	return a && L(a, a.next) && (B(a), a = a.next), a;
}
function i(n, r = n) {
	let i = r === n, a = n, o;
	do
		o = !1, a !== a.next && (e.size === 0 || !e.has(a)) && (L(a, a.next) || I(a.prev, a, a.next) === 0) ? ((i || a === r) && (r = a.prev), t = !0, B(a), a = a.prev, o = !0) : (i || a !== r) && (a = a.next, o = !i);
	while (o || a !== r);
	return r;
}
function a(e, n, r, a, u) {
	u && ee(e, r, a, u);
	let d = e, f = !1;
	for (; e.prev !== e.next;) {
		let p = e.prev, m = e.next;
		if (I(p, e, m) < 0 && (u ? s(e, r, a, u) : o(e))) n.push(p.i, e.i, m.i), B(e), e = m, d = m;
		else if (e = m, e === d) {
			if (t = !1, e = i(e), t) {
				d = e;
				continue;
			}
			if (!f) {
				e = c(e, n), d = e, f = !0;
				continue;
			}
			l(e, n, r, a, u);
			break;
		}
	}
}
function o(e) {
	let t = e.prev, n = e, r = e.next, i = t.x, a = n.x, o = r.x, s = t.y, c = n.y, l = r.y, u = Math.min(i, a, o), d = Math.min(s, c, l), f = Math.max(i, a, o), p = Math.max(s, c, l), m = r.next;
	for (; m !== t;) {
		if (m.x >= u && m.x <= f && m.y >= d && m.y <= p && (i !== m.x || s !== m.y) && F(i, s, a, c, o, l, m.x, m.y) && I(m.prev, m, m.next) >= 0) return !1;
		m = m.next;
	}
	return !0;
}
function s(e, t, n, r) {
	let i = e.prev, a = e, o = e.next, s = i.x, c = a.x, l = o.x, u = i.y, d = a.y, f = o.y, p = Math.min(s, c, l), m = Math.min(u, d, f), h = Math.max(s, c, l), g = Math.max(u, d, f), _ = N(p, m, t, n, r), v = N(h, g, t, n, r), y = e.prevZ;
	for (; y && y.z >= _;) {
		if (y.x >= p && y.x <= h && y.y >= m && y.y <= g && y !== o && (s !== y.x || u !== y.y) && F(s, u, c, d, l, f, y.x, y.y) && I(y.prev, y, y.next) >= 0) return !1;
		y = y.prevZ;
	}
	let b = e.nextZ;
	for (; b && b.z <= v;) {
		if (b.x >= p && b.x <= h && b.y >= m && b.y <= g && b !== o && (s !== b.x || u !== b.y) && F(s, u, c, d, l, f, b.x, b.y) && I(b.prev, b, b.next) >= 0) return !1;
		b = b.nextZ;
	}
	return !0;
}
function c(e, t) {
	let n = e, r = !1;
	do {
		let i = n.prev, a = n.next.next;
		ne(i, n, n.next, a, !1) && z(i, a) && z(a, i) && (t.push(i.i, n.i, a.i), B(n), B(n.next), n = e = a, r = !0), n = n.next;
	} while (n !== e);
	return r ? i(n) : n;
}
function l(e, t, n, r, o) {
	let s = e;
	do {
		let e = s.next.next;
		for (; e !== s.prev;) {
			if (s.i !== e.i && te(s, e)) {
				let c = ae(s, e);
				s = i(s, s.next), c = i(c, c.next), a(s, t, n, r, o), a(c, t, n, r, o);
				return;
			}
			e = e.next;
		}
		s = s.next;
	} while (s !== e);
}
var u = !1;
function d(t, n, a, o) {
	let s = [];
	for (let i = 0, a = n.length; i < a; i++) {
		let c = r(t, n[i] * o, i < a - 1 ? n[i + 1] * o : t.length, o, !1);
		c === c.next && e.add(c), s.push(P(c));
	}
	s.sort(f), y(t.length / o, n.length), b(a, a), u = !0;
	for (let e = 0; e < s.length; e++) a = p(s[e], a);
	return u = !1, i(a);
}
function f(e, t) {
	return e.x - t.x || e.y - t.y || (e.next.y - e.y) / (e.next.x - e.x) - (t.next.y - t.y) / (t.next.x - t.x);
}
function p(e, t) {
	let n = w(e, t);
	if (!n) return t;
	let r = ae(n, e), a = r.next;
	return b(n, a.next), i(r, r.next), i(n, n.next);
}
var m = 16, h = /* @__PURE__ */ new Float64Array(), g = 0, _ = [], v = [];
function y(e, t) {
	let n = Math.ceil((e + 2 * t) / m) + t + 2;
	h.length < n * 4 && (h = new Float64Array(n * 4)), g = 0;
}
function b(e, t) {
	let n = e;
	do {
		let e = g++;
		_[e] = n;
		let r = n.x, i = n.y, a = n.x, o = n.y, s = 0;
		do {
			let t = n.next;
			n.z = e, t.x < r && (r = t.x), t.x > a && (a = t.x), t.y < i && (i = t.y), t.y > o && (o = t.y), n = t;
		} while (++s < m && n !== t);
		v[e] = n;
		let c = e * 4;
		h[c] = r, h[c + 1] = i, h[c + 2] = a, h[c + 3] = o;
	} while (n !== t);
}
function x(e, t) {
	let n = e.z * 4;
	t.x < h[n] && (h[n] = t.x), t.y < h[n + 1] && (h[n + 1] = t.y), t.x > h[n + 2] && (h[n + 2] = t.x), t.y > h[n + 3] && (h[n + 3] = t.y);
}
function S(e) {
	let t = v[e];
	for (; t.prev.next !== t;) t = t.next;
	return v[e] = t, t;
}
function C(e) {
	let t = _[e];
	for (; t.prev.next !== t;) t = t.next;
	return _[e] = t, t;
}
function w(e, t) {
	let n = t, r = e.x, i = e.y, a = -Infinity, o;
	if (L(e, n)) return n;
	for (let t = 0, s = 0; t < g; t++, s += 4) {
		if (i < h[s + 1] || i > h[s + 3] || h[s] > r || h[s + 2] <= a) continue;
		let c = S(t);
		n = C(t);
		do {
			if (n.prev.next === n) {
				if (L(e, n.next)) return n.next;
				if (i <= n.y && i >= n.next.y && n.next.y !== n.y) {
					let e = n.x + (i - n.y) * (n.next.x - n.x) / (n.next.y - n.y);
					if (e <= r && e > a && (a = e, o = n.x < n.next.x ? n : n.next, e === r)) return o;
				}
			}
			n = n.next;
		} while (n !== c);
	}
	if (!o) return null;
	let s = o.x, c = o.y, l = Math.min(i, c), u = Math.max(i, c), d = Infinity;
	for (let t = 0, f = 0; t < g; t++, f += 4) {
		if (h[f + 2] < s || h[f] > r || h[f + 3] < l || h[f + 1] > u) continue;
		let p = S(t);
		n = C(t);
		do {
			if (n.prev.next === n && r >= n.x && n.x >= s && r !== n.x && F(i < c ? r : a, i, s, c, i < c ? a : r, i, n.x, n.y)) {
				let t = Math.abs(i - n.y) / (r - n.x);
				(z(n, e) || n.y === i && n.next.y === i && n.next.x > r) && (t < d || t === d && (n.x > o.x || n.x === o.x && T(o, n))) && (o = n, d = t);
			}
			n = n.next;
		} while (n !== p);
	}
	return o;
}
function T(e, t) {
	return I(e.prev, e, t.prev) < 0 && I(t.next, e, e.next) < 0;
}
var E = [], D = [], O = /* @__PURE__ */ new Uint32Array(), k = /* @__PURE__ */ new Uint32Array(), A = /* @__PURE__ */ new Uint32Array(256);
function ee(e, t, n, r) {
	let i = e, a = 0;
	do
		i.z = N(i.x, i.y, t, n, r), E[a++] = i, i = i.next;
	while (i !== e);
	j(a);
	let o = null;
	for (let e = 0; e < a; e++) {
		let t = E[e];
		t.prevZ = o, o && (o.nextZ = t), o = t;
	}
	o.nextZ = null, E.fill(null, 0, a), D.fill(null, 0, a);
}
function j(e) {
	if (e <= 32) for (let t = 1; t < e; t++) {
		let e = E[t], n = e.z, r = t - 1;
		for (; r >= 0 && E[r].z > n;) E[r + 1] = E[r], r--;
		E[r + 1] = e;
	}
	else {
		O.length < e && (O = new Uint32Array(e), k = new Uint32Array(e), D = Array(e));
		for (let t = 0; t < e; t++) O[t] = E[t].z;
		M(e, E, O, D, k, 0), M(e, D, k, E, O, 8), M(e, E, O, D, k, 16), M(e, D, k, E, O, 24);
	}
}
function M(e, t, n, r, i, a) {
	A.fill(0);
	for (let t = 0; t < e; t++) A[n[t] >>> a & 255]++;
	let o = 0;
	for (let e = 0; e < 256; e++) {
		let t = A[e];
		A[e] = o, o += t;
	}
	for (let o = 0; o < e; o++) {
		let e = n[o], s = A[e >>> a & 255]++;
		r[s] = t[o], i[s] = e;
	}
}
function N(e, t, n, r, i) {
	return e = (e - n) * i | 0, t = (t - r) * i | 0, e = (e | e << 8) & 16711935, e = (e | e << 4) & 252645135, e = (e | e << 2) & 858993459, e = (e | e << 1) & 1431655765, t = (t | t << 8) & 16711935, t = (t | t << 4) & 252645135, t = (t | t << 2) & 858993459, t = (t | t << 1) & 1431655765, e | t << 1;
}
function P(e) {
	let t = e, n = e;
	do
		(t.x < n.x || t.x === n.x && t.y < n.y) && (n = t), t = t.next;
	while (t !== e);
	return n;
}
function F(e, t, n, r, i, a, o, s) {
	return (i - o) * (t - s) >= (e - o) * (a - s) && (e - o) * (r - s) >= (n - o) * (t - s) && (n - o) * (a - s) >= (i - o) * (r - s);
}
function te(e, t) {
	let n = L(e, t) && I(e.prev, e, e.next) > 0 && I(t.prev, t, t.next) > 0;
	return e.next.i !== t.i && (n || z(e, t) && z(t, e) && (I(e.prev, e, t.prev) !== 0 || I(e, t.prev, t) !== 0)) && !re(e, t) && (n || ie(e, t));
}
function I(e, t, n) {
	return (t.y - e.y) * (n.x - t.x) - (t.x - e.x) * (n.y - t.y);
}
function L(e, t) {
	return e.x === t.x && e.y === t.y;
}
function ne(e, t, n, r, i = !0) {
	let a = I(e, t, n), o = I(e, t, r), s = I(n, r, e), c = I(n, r, t);
	return (a > 0 && o < 0 || a < 0 && o > 0) && (s > 0 && c < 0 || s < 0 && c > 0) ? !0 : i ? !!(a === 0 && R(e, n, t) || o === 0 && R(e, r, t) || s === 0 && R(n, e, r) || c === 0 && R(n, t, r)) : !1;
}
function R(e, t, n) {
	return t.x <= Math.max(e.x, n.x) && t.x >= Math.min(e.x, n.x) && t.y <= Math.max(e.y, n.y) && t.y >= Math.min(e.y, n.y);
}
function re(e, t) {
	let n = Math.min(e.x, t.x), r = Math.max(e.x, t.x), i = Math.min(e.y, t.y), a = Math.max(e.y, t.y), o = e;
	do {
		let s = o.next;
		if (o.x > r && s.x > r || o.x < n && s.x < n || o.y > a && s.y > a || o.y < i && s.y < i) o = s;
		else {
			if (o.i !== e.i && s.i !== e.i && o.i !== t.i && s.i !== t.i && ne(o, s, e, t)) return !0;
			o = s;
		}
	} while (o !== e);
	return !1;
}
function z(e, t) {
	return I(e.prev, e, e.next) < 0 ? I(e, t, e.next) >= 0 && I(e, e.prev, t) >= 0 : I(e, t, e.prev) < 0 || I(e, e.next, t) < 0;
}
function ie(e, t) {
	let n = e, r = !1, i = (e.x + t.x) / 2, a = (e.y + t.y) / 2;
	do {
		let e = n.next;
		n.y > a != e.y > a && i < (e.x - n.x) * (a - n.y) / (e.y - n.y) + n.x && (r = !r), n = e;
	} while (n !== e);
	return r;
}
function ae(e, t) {
	let n = se(e.i, e.x, e.y), r = se(t.i, t.x, t.y), i = e.next, a = t.prev;
	return e.next = t, t.prev = e, n.next = i, i.prev = n, r.next = n, n.prev = r, a.next = r, r.prev = a, r;
}
function oe(e, t, n, r) {
	let i = se(e, t, n);
	return r ? (i.next = r.next, i.prev = r, r.next.prev = i, r.next = i) : (i.prev = i, i.next = i), i;
}
function B(e) {
	e.next.prev = e.prev, e.prev.next = e.next, e.prevZ && (e.prevZ.nextZ = e.nextZ), e.nextZ && (e.nextZ.prevZ = e.prevZ), u && x(e.prev, e.next);
}
function se(e, t, n) {
	return {
		i: e,
		x: t,
		y: n,
		prev: null,
		next: null,
		z: 0,
		prevZ: null,
		nextZ: null
	};
}
function ce(e, t, n, r) {
	let i = 0;
	for (let a = t, o = n - r; a < n; a += r) i += (e[o] - e[a]) * (e[a + 1] + e[o + 1]), o = a;
	return i;
}
//#endregion
//#region src/runtime/glass/index.ts
var le = "mapstyler:glass", V = "msx-glass", H = 24, U = {
	layer: "building-3d",
	tint: "#dff4ff",
	tintStrength: .18,
	refraction: 28,
	blur: 6,
	bevel: 4,
	rim: "#ffffff",
	rimStrength: .9,
	specular: .8
};
function ue(e) {
	if (!e || typeof e != "object") return null;
	let t = e;
	if (t.enabled === !1) return null;
	let n = { ...U };
	for (let e of Object.keys(U)) {
		let r = t[e];
		r != null && typeof r == typeof U[e] && (n[e] = r);
	}
	return n;
}
var de = 13, fe = 1e4, pe = (e) => (e + 180) / 360, me = (e) => (1 - Math.log(Math.tan(Math.PI / 4 + e * Math.PI / 360)) / Math.PI) / 2, he = (e) => 1 / (40075016.68557849 * Math.cos(e * Math.PI / 180));
function ge(e, t) {
	return {
		x: pe(e),
		y: me(t),
		unit: he(t)
	};
}
function _e(e, t, r, i, a) {
	if (r <= t || !e.length) return;
	let o = e.map((e) => e.map(([e, t]) => [(pe(e) - i.x) / i.unit, (me(t) - i.y) / i.unit])), s = r - t, c = [], l = [];
	for (let e of o) {
		c.length && l.push(c.length / 2);
		for (let [t, n] of e) c.push(t, n);
	}
	let u = n(c, l, 2);
	for (let e of u) a.push(c[e * 2], c[e * 2 + 1], r, 0, 0, 1, 0, 0, 0, fe, fe * 2, s, s);
	for (let e of o) {
		let n = 0;
		for (let t = 0; t < e.length - 1; t++) n += e[t][0] * e[t + 1][1] - e[t + 1][0] * e[t][1];
		let i = n > 0 ? 1 : -1;
		for (let n = 0; n < e.length - 1; n++) {
			let [o, c] = e[n], [l, u] = e[n + 1], d = Math.hypot(l - o, u - c);
			if (d < .05) continue;
			let f = (l - o) / d, p = (u - c) / d, m = p * i, h = -f * i, g = (e, n, r, i) => a.push(e, n, r, m, h, 0, f, p, 0, i, d, r - t, s);
			g(o, c, t, 0), g(l, u, t, d), g(l, u, r, d), g(o, c, t, 0), g(l, u, r, d), g(o, c, r, 0);
		}
	}
}
function ve(e, t) {
	let n = /* @__PURE__ */ new Float64Array(16);
	for (let r = 0; r < 4; r++) for (let i = 0; i < 4; i++) {
		let a = 0;
		for (let n = 0; n < 4; n++) a += e[n * 4 + i] * t[r * 4 + n];
		n[r * 4 + i] = a;
	}
	return n;
}
function ye(e) {
	let [t, n, r, i, a, o, s, c, l, u, d, f, p, m, h, g] = Array.from(e), _ = t * o - n * a, v = t * s - r * a, y = t * c - i * a, b = n * s - r * o, x = n * c - i * o, S = r * c - i * s, C = l * m - u * p, w = l * h - d * p, T = l * g - f * p, E = u * h - d * m, D = u * g - f * m, O = d * g - f * h, k = _ * O - v * D + y * E + b * T - x * w + S * C;
	if (!k) return null;
	let A = 1 / k;
	return Float64Array.from([
		(o * O - s * D + c * E) * A,
		(r * D - n * O - i * E) * A,
		(m * S - h * x + g * b) * A,
		(d * x - u * S - f * b) * A,
		(s * T - a * O - c * w) * A,
		(t * O - r * T + i * w) * A,
		(h * y - p * S - g * v) * A,
		(l * S - d * y + f * v) * A,
		(a * D - o * T + c * C) * A,
		(n * T - t * D - i * C) * A,
		(p * x - m * y + g * _) * A,
		(u * y - l * x - f * _) * A,
		(o * w - a * E - s * C) * A,
		(t * E - n * w + r * C) * A,
		(m * v - p * b - h * _) * A,
		(l * b - u * v + d * _) * A
	]);
}
var be = "\nprecision highp float;\nuniform mat4 u_matrix;\nattribute vec3 a_pos;\nattribute vec3 a_normal;\nattribute vec3 a_tangent;\nattribute vec4 a_side;\nvarying vec3 v_pos;\nvarying vec3 v_normal;\nvarying vec3 v_tangent;\nvarying vec4 v_side;\nvoid main() {\n  v_pos = a_pos;\n  v_normal = a_normal;\n  v_tangent = a_tangent;\n  v_side = a_side;\n  gl_Position = u_matrix * vec4(a_pos, 1.0);\n}", xe = "\nprecision highp float;\nuniform mat4 u_matrix;\nuniform sampler2D u_backdrop;\nuniform vec2 u_viewport;\nuniform vec3 u_eye;\nuniform vec3 u_tint;\nuniform float u_tintStrength;\nuniform float u_refraction;\nuniform float u_blur;\nuniform float u_bevel;\nuniform vec3 u_rim;\nuniform float u_rimStrength;\nuniform float u_specular;\nvarying vec3 v_pos;\nvarying vec3 v_normal;\nvarying vec3 v_tangent;\nvarying vec4 v_side;\n\nvec2 screen(vec3 p) {\n  vec4 c = u_matrix * vec4(p, 1.0);\n  return c.xy / c.w;\n}\n\nvoid main() {\n  vec3 n = normalize(v_normal);\n  // Rounded bevel: bend the normal towards the nearest wall edge and the roof.\n  float toStart = v_side.x;\n  float toEnd = v_side.y - v_side.x;\n  float toTop = v_side.w - v_side.z;\n  float side = 1.0 - smoothstep(0.0, u_bevel, min(toStart, toEnd));\n  float top = 1.0 - smoothstep(0.0, u_bevel, toTop);\n  vec3 along = toStart < toEnd ? -v_tangent : v_tangent;\n  n = normalize(n + along * side * 1.6 + vec3(0.0, 0.0, 1.0) * top * 1.6);\n\n  vec3 view = normalize(u_eye - v_pos);\n  float facing = abs(dot(n, view));\n  float fresnel = pow(1.0 - facing, 5.0) * (0.35 + 0.65 * max(side, top));\n\n  // Refraction: push the backdrop lookup along the normal's screen direction.\n  vec2 here = screen(v_pos);\n  vec2 dir = screen(v_pos + n * 0.5) - here;\n  float len = length(dir);\n  dir = len > 0.0 ? dir / len : vec2(0.0);\n  // Strongest at the rounded edges, like the thick rim of a glass slab.\n  float edge = max(side, top);\n  float strength = 0.2 + 1.3 * edge + 0.5 * (1.0 - facing);\n  vec2 uv = gl_FragCoord.xy / u_viewport - dir * strength * u_refraction / u_viewport;\n\n  // Frosting: centre tap plus two rings of eight taps.\n  vec2 px = u_blur / u_viewport;\n  vec3 color = texture2D(u_backdrop, uv).rgb * 0.12;\n  for (int i = 0; i < 8; i++) {\n    float a = float(i) * 0.785398;\n    vec2 o = vec2(cos(a), sin(a));\n    color += texture2D(u_backdrop, uv + o * px * 0.5).rgb * 0.055;\n    color += texture2D(u_backdrop, uv + vec2(cos(a + 0.392699), sin(a + 0.392699)) * px).rgb * 0.055;\n  }\n\n  color = mix(color, u_tint, u_tintStrength);\n  // Walls slightly darker at the base, lighter towards the top.\n  float lift = v_normal.z > 0.5 ? 1.0 : 0.94 + 0.06 * clamp(v_side.z / max(v_side.w, 1.0), 0.0, 1.0);\n  color *= lift;\n\n  vec3 light = normalize(vec3(-0.45, -0.55, 0.7));\n  float spec = pow(max(dot(n, normalize(light + view)), 0.0), 48.0) * u_specular;\n  color += u_rim * fresnel * u_rimStrength + vec3(spec);\n  gl_FragColor = vec4(min(color, vec3(1.0)), 1.0);\n}";
function Se(e, t, n) {
	let r = e.createShader(t);
	if (e.shaderSource(r, n), e.compileShader(r), !e.getShaderParameter(r, e.COMPILE_STATUS)) throw Error(e.getShaderInfoLog(r) ?? "glass shader");
	return r;
}
var Ce = (e) => {
	let t = /^#?([0-9a-f]{6})$/i.exec(e.trim());
	return t ? [
		0,
		2,
		4
	].map((e) => parseInt(t[1].slice(e, e + 2), 16) / 255) : [
		1,
		1,
		1
	];
};
function we(e) {
	"bindVertexArray" in e ? e.bindVertexArray(null) : e.getExtension("OES_vertex_array_object")?.bindVertexArrayOES(null);
}
function Te(e, t, n) {
	let r = null, i = null, a = {}, o = {}, s = null, c = null, l = 0, u = ge(0, 0), d = null, f, p = () => {
		let r = t(), i = e.getLayer(r.layer);
		if (!i?.source) return;
		let a = e.getCenter(), o = ge(a.lng, a.lat), s = [];
		if (e.getZoom() >= n() - .5) {
			let t = e.querySourceFeatures(i.source, {
				sourceLayer: i.sourceLayer,
				filter: i.filter
			});
			for (let e of t) {
				let t = e.properties ?? {}, n = Number(t.render_height ?? t.height ?? 0), r = Number(t.render_min_height ?? t.min_height ?? 0), i = e.geometry;
				if (i.type === "Polygon") _e(i.coordinates, r, n, o, s);
				else if (i.type === "MultiPolygon") for (let e of i.coordinates) _e(e, r, n, o, s);
			}
		}
		u = o, d = new Float32Array(s), e.triggerRepaint();
	}, m = () => {
		clearTimeout(f), f = setTimeout(p, 120);
	}, h = (n) => {
		let r = e.getLayer(t().layer);
		n.sourceId && n.sourceId === r?.source && n.isSourceLoaded && m();
	};
	return {
		id: V,
		type: "custom",
		renderingMode: "3d",
		onAdd(t, n) {
			r = n, i = r.createProgram(), r.attachShader(i, Se(r, r.VERTEX_SHADER, be)), r.attachShader(i, Se(r, r.FRAGMENT_SHADER, xe)), r.linkProgram(i);
			for (let e of [
				"a_pos",
				"a_normal",
				"a_tangent",
				"a_side"
			]) o[e] = r.getAttribLocation(i, e);
			for (let e of [
				"u_matrix",
				"u_backdrop",
				"u_viewport",
				"u_eye",
				"u_tint",
				"u_tintStrength",
				"u_refraction",
				"u_blur",
				"u_bevel",
				"u_rim",
				"u_rimStrength",
				"u_specular"
			]) a[e] = r.getUniformLocation(i, e);
			s = r.createBuffer(), c = r.createTexture(), e.on("sourcedata", h), e.on("moveend", m), m();
		},
		onRemove() {
			clearTimeout(f), e.off("sourcedata", h), e.off("moveend", m), r && (r.deleteBuffer(s), r.deleteTexture(c), r.deleteProgram(i)), r = null, i = null, a = {}, o = {};
		},
		render(n, r) {
			let f = n;
			if (!i || !s || !c || (we(f), d &&= (f.bindBuffer(f.ARRAY_BUFFER, s), f.bufferData(f.ARRAY_BUFFER, d, f.STATIC_DRAW), l = d.length / de, null), !l)) return;
			let p = t(), m = f.drawingBufferWidth, h = f.drawingBufferHeight, g = m / e.getCanvas().clientWidth || 1;
			f.activeTexture(f.TEXTURE0), f.bindTexture(f.TEXTURE_2D, c), f.copyTexImage2D(f.TEXTURE_2D, 0, f.RGBA, 0, 0, m, h, 0), f.texParameteri(f.TEXTURE_2D, f.TEXTURE_MIN_FILTER, f.LINEAR), f.texParameteri(f.TEXTURE_2D, f.TEXTURE_MAG_FILTER, f.LINEAR), f.texParameteri(f.TEXTURE_2D, f.TEXTURE_WRAP_S, f.CLAMP_TO_EDGE), f.texParameteri(f.TEXTURE_2D, f.TEXTURE_WRAP_T, f.CLAMP_TO_EDGE);
			let _ = u.unit, v = [
				_,
				0,
				0,
				0,
				0,
				_,
				0,
				0,
				0,
				0,
				_,
				0,
				u.x,
				u.y,
				0,
				1
			], y = ve(r.defaultProjectionData?.mainMatrix ?? r.modelViewProjectionMatrix, v), b = ye(y), x = [
				0,
				0,
				1e5
			];
			if (b) {
				let e = [
					0,
					1,
					2,
					3
				].map((e) => b[8 + e]);
				e[3] && (x = [
					e[0] / e[3],
					e[1] / e[3],
					e[2] / e[3]
				]);
			}
			f.useProgram(i), f.uniformMatrix4fv(a.u_matrix, !1, Float32Array.from(y)), f.uniform1i(a.u_backdrop, 0), f.uniform2f(a.u_viewport, m, h), f.uniform3f(a.u_eye, x[0], x[1], x[2]), f.uniform3fv(a.u_tint, Ce(p.tint)), f.uniform1f(a.u_tintStrength, p.tintStrength), f.uniform1f(a.u_refraction, p.refraction * g), f.uniform1f(a.u_blur, p.blur * g), f.uniform1f(a.u_bevel, p.bevel), f.uniform3fv(a.u_rim, Ce(p.rim)), f.uniform1f(a.u_rimStrength, p.rimStrength), f.uniform1f(a.u_specular, p.specular), f.bindBuffer(f.ARRAY_BUFFER, s);
			let S = (e, t, n) => {
				let r = o[e];
				r < 0 || (f.enableVertexAttribArray(r), f.vertexAttribPointer(r, t, f.FLOAT, !1, 52, n * 4));
			};
			S("a_pos", 3, 0), S("a_normal", 3, 3), S("a_tangent", 3, 6), S("a_side", 4, 9), f.disable(f.STENCIL_TEST), f.stencilMask(0), f.disable(f.BLEND), f.disable(f.CULL_FACE), f.enable(f.DEPTH_TEST), f.depthFunc(f.LEQUAL), f.depthMask(!0), f.colorMask(!1, !1, !1, !1), f.drawArrays(f.TRIANGLES, 0, l), f.colorMask(!0, !0, !0, !0), f.depthMask(!1), f.drawArrays(f.TRIANGLES, 0, l), f.depthMask(!0), f.stencilMask(255);
			for (let e of Object.keys(o)) o[e] >= 0 && f.disableVertexAttribArray(o[e]);
		}
	};
}
function Ee(e) {
	let t = null, n = null, r = "", i = (t) => {
		let r = e.getLayer(t);
		r && r.minzoom !== H && (n = {
			id: t,
			minzoom: r.minzoom ?? 0,
			maxzoom: r.maxzoom ?? 24
		}, e.setLayerZoomRange(t, H, H));
	}, a = () => {
		n && e.getLayer(n.id)?.minzoom === H && e.setLayerZoomRange(n.id, n.minzoom, n.maxzoom), n = null;
	}, o = () => {
		let o = e.getStyle();
		if (!o?.layers) return;
		let s = ue(o.metadata?.[le]), c = s && e.getLayer(s.layer) && e.getLayoutProperty(s.layer, "visibility") !== "none" ? s : null, l = JSON.stringify(c);
		if (l !== r && (r = l, n && n.id !== c?.layer && a(), t = c, !c && e.getLayer(V) && e.removeLayer(V)), c) {
			if (i(c.layer), !e.getLayer(V)) {
				let r = o.layers.map((e) => e.id), i = r[r.indexOf(c.layer) + 1];
				e.addLayer(Te(e, () => t ?? U, () => n?.minzoom ?? 0), i && i !== V ? i : void 0);
			}
			e.triggerRepaint();
		}
	};
	return e.on("styledata", o), e.isStyleLoaded() && o(), {
		refresh: o,
		destroy() {
			e.off("styledata", o), e.getLayer(V) && e.removeLayer(V), a();
		}
	};
}
//#endregion
//#region src/runtime/hatch/index.ts
var De = "mapstyler:hatch", W = "msx-hatch", G = 24, K = {
	layer: "background",
	paper: "#e4e2db",
	color: "#e0604f",
	spacing: 5,
	width: .9,
	angle: 45
};
function Oe(e) {
	if (!e || typeof e != "object") return null;
	let t = e;
	if (t.enabled === !1) return null;
	let n = { ...K };
	for (let e of Object.keys(K)) {
		let r = t[e];
		r != null && typeof r == typeof K[e] && (n[e] = r);
	}
	return n;
}
var ke = "\nattribute vec2 a_pos;\n// Drawn at the far plane: opaque fills (water, parks) from MapLibre's opaque\n// pass are already in the depth buffer and stay in front of the paper.\nvoid main() { gl_Position = vec4(a_pos, 1.0, 1.0); }", Ae = "\nprecision highp float;\nuniform vec2 u_anchor;\nuniform vec2 u_dir;\nuniform float u_spacing;\nuniform float u_width;\nuniform vec3 u_paper;\nuniform vec3 u_color;\nvoid main() {\n  float d = dot(gl_FragCoord.xy - u_anchor, u_dir);\n  float m = mod(d, u_spacing);\n  float dist = min(m, u_spacing - m);\n  float ink = 1.0 - smoothstep(u_width * 0.5 - 0.5, u_width * 0.5 + 0.5, dist);\n  gl_FragColor = vec4(mix(u_paper, u_color, ink), 1.0);\n}", je = (e) => {
	let t = /^#?([0-9a-f]{6})$/i.exec(e.trim());
	return t ? [
		0,
		2,
		4
	].map((e) => parseInt(t[1].slice(e, e + 2), 16) / 255) : [
		1,
		1,
		1
	];
};
function Me(e) {
	"bindVertexArray" in e ? e.bindVertexArray(null) : e.getExtension("OES_vertex_array_object")?.bindVertexArrayOES(null);
}
function Ne(e, t) {
	let n = null, r = null, i = {}, a = -1, o = e.getCenter();
	return {
		id: W,
		type: "custom",
		renderingMode: "2d",
		onAdd(e, t) {
			let o = t, s = (e, t) => {
				let n = o.createShader(e);
				if (o.shaderSource(n, t), o.compileShader(n), !o.getShaderParameter(n, o.COMPILE_STATUS)) throw Error(o.getShaderInfoLog(n) ?? "hatch shader");
				return n;
			};
			n = o.createProgram(), o.attachShader(n, s(o.VERTEX_SHADER, ke)), o.attachShader(n, s(o.FRAGMENT_SHADER, Ae)), o.linkProgram(n), a = o.getAttribLocation(n, "a_pos");
			for (let e of [
				"u_anchor",
				"u_dir",
				"u_spacing",
				"u_width",
				"u_paper",
				"u_color"
			]) i[e] = o.getUniformLocation(n, e);
			r = o.createBuffer(), o.bindBuffer(o.ARRAY_BUFFER, r), o.bufferData(o.ARRAY_BUFFER, new Float32Array([
				-1,
				-1,
				1,
				-1,
				-1,
				1,
				-1,
				1,
				1,
				-1,
				1,
				1
			]), o.STATIC_DRAW);
		},
		onRemove(e, t) {
			let a = t;
			a.deleteBuffer(r), a.deleteProgram(n), n = null, r = null, i = {};
		},
		render(s) {
			let c = s;
			if (!n || !r) return;
			let l = t(), u = c.drawingBufferWidth / e.getCanvas().clientWidth || 1, d = e.project(o);
			(Math.abs(d.x) > 1e5 || Math.abs(d.y) > 1e5) && (o = e.getCenter(), d = e.project(o));
			let f = (l.angle - e.getBearing()) * Math.PI / 180;
			Me(c), c.useProgram(n), c.uniform2f(i.u_anchor, d.x * u, c.drawingBufferHeight - d.y * u), c.uniform2f(i.u_dir, Math.cos(f), Math.sin(f)), c.uniform1f(i.u_spacing, Math.max(l.spacing, 1) * u), c.uniform1f(i.u_width, l.width * u), c.uniform3fv(i.u_paper, je(l.paper)), c.uniform3fv(i.u_color, je(l.color)), c.bindBuffer(c.ARRAY_BUFFER, r), c.enableVertexAttribArray(a), c.vertexAttribPointer(a, 2, c.FLOAT, !1, 0, 0), c.disable(c.STENCIL_TEST), c.stencilMask(0), c.disable(c.BLEND), c.enable(c.DEPTH_TEST), c.depthFunc(c.LEQUAL), c.depthMask(!1), c.drawArrays(c.TRIANGLES, 0, 6), c.depthMask(!0), c.stencilMask(255), c.disableVertexAttribArray(a);
		}
	};
}
function Pe(e) {
	let t = null, n = null, r = "", i = () => {
		n && e.getLayer(n.id)?.minzoom === G && e.setLayerZoomRange(n.id, n.minzoom, n.maxzoom), n = null;
	}, a = () => {
		let a = e.getStyle();
		if (!a?.layers) return;
		let o = Oe(a.metadata?.[De]), s = o && e.getLayer(o.layer) && e.getLayoutProperty(o.layer, "visibility") !== "none" ? o : null, c = JSON.stringify(s);
		if (c !== r && (r = c, n && n.id !== s?.layer && i(), t = s, !s && e.getLayer(W) && e.removeLayer(W)), !s) return;
		let l = e.getLayer(s.layer);
		if (l && l.minzoom !== G && (n = {
			id: s.layer,
			minzoom: l.minzoom ?? 0,
			maxzoom: l.maxzoom ?? 24
		}, e.setLayerZoomRange(s.layer, G, G)), !e.getLayer(W)) {
			let n = a.layers.map((e) => e.id), r = n[n.indexOf(s.layer) + 1];
			e.addLayer(Ne(e, () => t ?? K), r && r !== W ? r : void 0);
		}
		e.triggerRepaint();
	};
	return e.on("styledata", a), e.isStyleLoaded() && a(), { destroy() {
		e.off("styledata", a), e.getLayer(W) && e.removeLayer(W), i();
	} };
}
//#endregion
//#region src/runtime/tooltips/pin-icons.ts
var Fe = [
	"pin",
	"star",
	"cafe",
	"food",
	"parking",
	"view",
	"train",
	"info",
	"shop",
	"home",
	"photo",
	"hotel"
], Ie = "msx-pin-", Le = {
	pin: ["M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0", "M9 10a3 3 0 1 0 6 0a3 3 0 1 0-6 0"],
	star: ["M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"],
	cafe: [
		"M10 2v2",
		"M14 2v2",
		"M16 8a1 1 0 0 1 1 1v8a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V9a1 1 0 0 1 1-1h14a4 4 0 1 1 0 8h-1",
		"M6 2v2"
	],
	food: [
		"M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2",
		"M7 2v20",
		"M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"
	],
	parking: ["M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z", "M9 17V7h4a3 3 0 0 1 0 6H9"],
	view: ["m8 3 4 8 5-5 5 15H2L8 3z"],
	train: [
		"M8 3.1V7a4 4 0 0 0 8 0V3.1",
		"m9 15-1-1",
		"m15 15 1-1",
		"M9 19c-2.8 0-5-2.2-5-5v-4a8 8 0 0 1 16 0v4c0 2.8-2.2 5-5 5Z",
		"m8 19-2 3",
		"m16 19 2 3"
	],
	info: [
		"M2 12a10 10 0 1 0 20 0a10 10 0 1 0-20 0",
		"M12 16v-4",
		"M12 8h.01"
	],
	shop: [
		"M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z",
		"M3 6h18",
		"M16 10a4 4 0 0 1-8 0"
	],
	home: ["M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8", "M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"],
	photo: ["M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z", "M9 13a3 3 0 1 0 6 0a3 3 0 1 0-6 0"],
	hotel: [
		"M2 20v-8a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v8",
		"M4 10V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v4",
		"M12 4v6",
		"M2 18h20"
	]
};
function Re(e) {
	return typeof e == "string" && Fe.includes(e);
}
var q = 56;
function ze(e) {
	if (!e.startsWith("msx-pin-") || typeof document > "u") return null;
	let t = /^(.+)-([0-9a-f]{6})$/i.exec(e.slice(8));
	if (!t) return null;
	let n = Re(t[1]) ? t[1] : "pin", r = document.createElement("canvas");
	r.width = q, r.height = q;
	let i = r.getContext("2d");
	if (!i) return null;
	let a = q / 2, o = q / 2 - 1;
	i.shadowColor = "rgba(20, 22, 26, 0.28)", i.shadowBlur = 5, i.shadowOffsetY = 1.5, i.beginPath(), i.arc(a, o, 21, 0, Math.PI * 2), i.fillStyle = `#${t[2]}`, i.fill(), i.shadowColor = "transparent", i.lineWidth = 3, i.strokeStyle = "#ffffff", i.stroke();
	let s = .92;
	i.save(), i.translate(a - 12 * s, o - 12 * s), i.scale(s, s), i.strokeStyle = "#ffffff", i.lineWidth = 2.2, i.lineCap = "round", i.lineJoin = "round";
	for (let e of Le[n]) i.stroke(new Path2D(e));
	return i.restore(), {
		width: q,
		height: q,
		data: i.getImageData(0, 0, q, q).data
	};
}
var Be = {
	dot: "·",
	tilde: "~",
	hash: "#",
	plus: "+",
	slash: "/",
	colon: ":",
	dash: "-",
	star: "*",
	stripe: "",
	hatch: ""
}, J = 28;
function Ve(e) {
	if (!e.startsWith("msx-ascii-") || typeof document > "u") return null;
	let t = /^([a-z]+)-([0-9a-f]{6})-([0-9a-f]{6})$/i.exec(e.slice(10));
	if (!t || !(t[1] in Be)) return null;
	let n = document.createElement("canvas");
	n.width = J, n.height = J;
	let r = n.getContext("2d");
	if (!r) return null;
	if (r.fillStyle = `#${t[3]}`, r.fillRect(0, 0, J, J), t[1] === "stripe" || t[1] === "hatch") {
		let e = t[1] === "hatch";
		r.strokeStyle = `#${t[2]}`, r.lineWidth = e ? 2.4 : 5;
		let n = e ? [
			-28,
			-14,
			0,
			J / 2,
			J
		] : [
			-28,
			0,
			J
		];
		for (let e of n) r.beginPath(), r.moveTo(e, J), r.lineTo(e + J, 0), r.stroke();
		return {
			width: J,
			height: J,
			data: r.getImageData(0, 0, J, J).data
		};
	}
	return r.fillStyle = `#${t[2]}`, r.font = "600 20px ui-monospace, \"SF Mono\", Menlo, Consolas, monospace", r.textAlign = "center", r.textBaseline = "middle", r.fillText(Be[t[1]], J / 2, 15), {
		width: J,
		height: J,
		data: r.getImageData(0, 0, J, J).data
	};
}
function He(e) {
	let t = /^([0-9a-f]{6})$/i.exec(e.slice(8));
	if (!e.startsWith("msx-box-") || !t) return null;
	let n = /* @__PURE__ */ new Uint8ClampedArray(1024), [r, i, a] = [
		0,
		2,
		4
	].map((e) => parseInt(t[1].slice(e, e + 2), 16));
	for (let e = 0; e < n.length; e += 4) n[e] = r, n[e + 1] = i, n[e + 2] = a, n[e + 3] = 255;
	return {
		width: 16,
		height: 16,
		data: n
	};
}
//#endregion
//#region src/runtime/pins/index.ts
var Y = "msx-pins", X = "msx-pins", Z = "msx-pins-clusters", Ue = "msx-pins-count", We = [
	"#4f46e5",
	"#e0604f",
	"#0f9d76",
	"#d97706",
	"#0284c7",
	"#c026d3",
	"#65a30d",
	"#475569"
];
function Ge(e) {
	if (e == null) return null;
	let t = String(e).trim();
	if (!t) return null;
	let n = /^-?\d+,\d+$/.test(t) ? t.replace(",", ".") : t, r = Number(n);
	return Number.isFinite(r) ? r : null;
}
function Ke(e) {
	if (!e) return null;
	let t = String(e).trim(), n;
	n = t.includes(";") ? t.split(";") : /\d\.\d/.test(t) || !/\d,\d/.test(t) ? t.split(/[\s,]+/) : t.split(/\s+/);
	let r = n.map(Ge).filter((e) => e !== null);
	return r.length === 2 ? [r[0], r[1]] : null;
}
var qe = (e, t) => Math.abs(e) <= 90 && Math.abs(t) <= 180, Je = (e) => {
	let t = /^#?([0-9a-f]{6}|[0-9a-f]{3})$/i.exec((e ?? "").trim());
	return t ? `#${(t[1].length === 3 ? [...t[1]].map((e) => e + e).join("") : t[1]).toLowerCase()}` : null;
}, Ye = /* @__PURE__ */ new Set([
	"map-pin",
	"lat",
	"lng",
	"lon",
	"latitude",
	"longitude",
	"coordinates",
	"latlng",
	"type",
	"color",
	"category",
	"name",
	"id"
]);
function Xe(e, t) {
	let n = Ke(e.coordinates ?? e.latlng), r = n?.[0] ?? Ge(e.lat ?? e.latitude), i = n?.[1] ?? Ge(e.lng ?? e.lon ?? e.longitude);
	if (r == null || i == null || !qe(r, i)) return null;
	let a = {};
	for (let [t, n] of Object.entries(e)) n == null || Ye.has(t) || t.startsWith("map-") || (a[t.replace(/-/g, "_")] = n);
	let o = (e.type ?? "").trim().toLowerCase();
	return {
		id: (e.id ?? "").trim() || `pin-${t}`,
		lat: r,
		lng: i,
		name: (e.name ?? "").trim(),
		category: (e.category ?? "").trim(),
		type: Re(o) ? o : "pin",
		color: Je(e.color),
		props: a
	};
}
function Ze(e) {
	let t = [];
	return e.features.forEach((e, n) => {
		if (e.geometry?.type !== "Point" || !Array.isArray(e.geometry.coordinates)) return;
		let [r, i] = e.geometry.coordinates, a = {};
		for (let [t, n] of Object.entries(e.properties ?? {})) n != null && (a[t] = String(n));
		a.lat = String(i), a.lng = String(r), e.id != null && a.id == null && (a.id = String(e.id));
		let o = Xe(a, n);
		o && t.push(o);
	}), t;
}
function Qe(e, t = We, n = {}) {
	let r = {};
	for (let [e, t] of Object.entries(n)) {
		let n = Je(t);
		n && (r[e] = n);
	}
	let i = 0;
	for (let n of e) r[n.category] ?? (r[n.category] = n.color ?? t[i++ % t.length]);
	return r;
}
var $e = (e, t) => !t || e.category.toLowerCase() === t.toLowerCase();
function et(e, t) {
	return {
		type: "FeatureCollection",
		features: e.map((e) => ({
			type: "Feature",
			geometry: {
				type: "Point",
				coordinates: [e.lng, e.lat]
			},
			properties: {
				...e.props,
				id: e.id,
				name: e.name,
				category: e.category,
				type: e.type,
				icon: `${Ie}${e.type}-${(e.color ?? t[e.category] ?? We[0]).slice(1)}`
			}
		}))
	};
}
function tt(e) {
	let t = {};
	for (let n of Array.from(e.attributes)) n.name.startsWith("data-") && (t[n.name.slice(5)] = n.value);
	return e.querySelectorAll("[data-map-field]").forEach((e) => {
		let n = e.getAttribute("data-map-field");
		n && t[n] == null && (t[n] = (e.textContent ?? "").trim());
	}), t;
}
function nt(e) {
	let t = [], n = /* @__PURE__ */ new Map();
	return e.forEach((e, r) => {
		let i = Xe(tt(e), r);
		i && (t.push(i), n.set(i.id, e));
	}), {
		pins: t,
		byId: n
	};
}
function rt(e, t, n) {
	let r = t.activeClass ?? "is-active", i = t.filters === !1 ? null : t.filters ?? "[data-map-filter]", a = t.from !== !1 && typeof document < "u", o = [], s = /* @__PURE__ */ new Map(), c = {}, l = null, u = t.fit === !1, d = !1, f = t.data, p = !1, m = null, h = () => o.filter((e) => $e(e, l)), g = () => et(h(), c), _ = () => {
		if (d || !e.isStyleLoaded()) return;
		e.getSource("msx-pins") || e.addSource(Y, {
			type: "geojson",
			data: g(),
			cluster: t.cluster !== !1,
			clusterRadius: 44,
			clusterMaxZoom: 15
		});
		let n = t.clusterColor ?? "#1f2328";
		e.getLayer(Z) || e.addLayer({
			id: Z,
			type: "circle",
			source: Y,
			filter: ["has", "point_count"],
			paint: {
				"circle-color": n,
				"circle-radius": [
					"step",
					["get", "point_count"],
					15,
					10,
					19,
					50,
					24
				],
				"circle-stroke-color": "#ffffff",
				"circle-stroke-width": 2.5
			}
		}), e.getLayer(Ue) || e.addLayer({
			id: Ue,
			type: "symbol",
			source: Y,
			filter: ["has", "point_count"],
			layout: {
				"text-field": ["get", "point_count_abbreviated"],
				"text-font": ["Noto Sans Bold"],
				"text-size": 12,
				"text-allow-overlap": !0
			},
			paint: { "text-color": "#ffffff" }
		}), e.getLayer("msx-pins") || e.addLayer({
			id: X,
			type: "symbol",
			source: Y,
			filter: ["!", ["has", "point_count"]],
			layout: {
				"icon-image": ["get", "icon"],
				"icon-allow-overlap": !0,
				"icon-ignore-placement": !0
			}
		});
	}, v = () => {
		if (u) return;
		let t = h();
		if (!t.length) return;
		if (u = !0, t.length === 1) {
			e.jumpTo({
				center: [t[0].lng, t[0].lat],
				zoom: Math.max(e.getZoom(), 14)
			});
			return;
		}
		let n = t.map((e) => e.lng), r = t.map((e) => e.lat);
		e.fitBounds([[Math.min(...n), Math.min(...r)], [Math.max(...n), Math.max(...r)]], {
			padding: 56,
			maxZoom: 15,
			animate: !1
		});
	}, y = () => {
		if (_(), e.getSource(Y)?.setData(g()), t.filterList !== !1) for (let e of o) {
			let t = s.get(e.id);
			t && (t.style.display = $e(e, l) ? "" : "none");
		}
		i && typeof document < "u" && document.querySelectorAll(i).forEach((e) => {
			let t = (e.getAttribute("data-map-filter") ?? "").trim(), n = !t || t.toLowerCase() === "all" ? l === null : t.toLowerCase() === l?.toLowerCase();
			e.classList.toggle(r, n), e.setAttribute("aria-pressed", String(n));
		});
	}, b = async () => {
		let e = [];
		if (s = /* @__PURE__ */ new Map(), a) {
			let n = t.from, r = nt(Array.isArray(n) ? n : Array.from(document.querySelectorAll(n ?? "[data-map-pin]")));
			e = r.pins, s = r.byId;
		}
		let n = [];
		f && (n = Ze(typeof f == "string" ? await (await fetch(f)).json() : f)), o = [...e, ...n], c = Qe(o, t.palette, t.colors);
	}, x = null, S = (e) => {
		e !== x && (x && s.get(x)?.classList.remove(r), x = e, e && s.get(e)?.classList.add(r));
	}, C = (t) => {
		if (!p) {
			m = t;
			return;
		}
		let r = o.find((e) => e.id === t);
		if (!r) return;
		$e(r, l) || (l = null, y());
		let i = et([r], c).features[0].properties;
		e.once("moveend", () => n.show(i, [r.lng, r.lat])), e.easeTo({
			center: [r.lng, r.lat],
			zoom: Math.max(e.getZoom(), 16),
			duration: 600
		}), S(t);
	}, w = (e) => S(String(e.features?.[0]?.properties?.id ?? "") || null), T = () => S(null), E = async (t) => {
		let n = t.features?.[0], r = n?.properties?.cluster_id, i = e.getSource(Y);
		if (r == null || !i || n?.geometry.type !== "Point") return;
		let a = await i.getClusterExpansionZoom(r);
		e.easeTo({
			center: n.geometry.coordinates,
			zoom: a + .3,
			duration: 500
		});
	}, D = (e) => {
		let n = String(e.features?.[0]?.properties?.id ?? ""), r = o.find((e) => e.id === n);
		r && (S(n), t.onSelect?.(r));
	}, O = () => e.getCanvas().style.cursor = "pointer", k = () => e.getCanvas().style.cursor = "", A = (e) => {
		let t = e.target;
		if (t?.closest) {
			if (i) {
				let e = t.closest(i);
				if (e) {
					let t = (e.getAttribute("data-map-filter") ?? "").trim();
					l = t && t.toLowerCase() !== "all" ? t : null, y();
					return;
				}
			}
			for (let [e, n] of s) if (n.contains(t) && !t.closest("a[href]")) {
				C(e);
				return;
			}
		}
	}, ee = () => {
		!d && !e.getSource("msx-pins") && y();
	}, j = null, M, N = async () => {
		if (await b(), !d && (y(), v(), p = !0, m)) {
			let e = m;
			m = null, C(e);
		}
	}, P = () => {
		N(), e.on("styledata", ee), e.on("mousemove", X, w), e.on("mouseleave", X, T), e.on("click", Z, E), e.on("click", X, D), e.on("mouseenter", Z, O), e.on("mouseleave", Z, k), typeof document < "u" && (document.addEventListener("click", A), a && !Array.isArray(t.from) && (j = new MutationObserver((t) => {
			t.some((t) => t.type === "childList" && !e.getContainer().contains(t.target)) && (clearTimeout(M), M = setTimeout(() => void N(), 150));
		}), j.observe(document.body, {
			childList: !0,
			subtree: !0
		})));
	};
	return e.isStyleLoaded() ? P() : e.once("load", P), {
		pins: () => o.slice(),
		setFilter(e) {
			l = e || null, y();
		},
		focus: C,
		async setData(e) {
			f = e, await N();
		},
		refresh: N,
		destroy() {
			d = !0, clearTimeout(M), j?.disconnect(), e.off("styledata", ee), e.off("mousemove", X, w), e.off("mouseleave", X, T), e.off("click", Z, E), e.off("click", X, D), e.off("mouseenter", Z, O), e.off("mouseleave", Z, k), typeof document < "u" && document.removeEventListener("click", A);
			for (let t of [
				Ue,
				Z,
				X
			]) e.getLayer(t) && e.removeLayer(t);
			e.getSource("msx-pins") && e.removeSource(Y);
		}
	};
}
//#endregion
//#region src/runtime/tooltips/kind-labels.ts
var it = {
	park: ["Park", "Park"],
	garden: ["Garten", "Garden"],
	playground: ["Spielplatz", "Playground"],
	pitch: ["Sportplatz", "Sports pitch"],
	sports_centre: ["Sportzentrum", "Sports centre"],
	stadium: ["Stadion", "Stadium"],
	swimming_pool: ["Schwimmbad", "Swimming pool"],
	golf_course: ["Golfplatz", "Golf course"],
	nature_reserve: ["Naturschutzgebiet", "Nature reserve"],
	national_park: ["Nationalpark", "National park"],
	protected_area: ["Schutzgebiet", "Protected area"],
	wood: ["Wald", "Woods"],
	forest: ["Wald", "Forest"],
	grass: ["Wiese", "Grass"],
	meadow: ["Wiese", "Meadow"],
	farmland: ["Ackerland", "Farmland"],
	vineyard: ["Weinberg", "Vineyard"],
	orchard: ["Obstwiese", "Orchard"],
	allotments: ["Kleingärten", "Allotments"],
	cemetery: ["Friedhof", "Cemetery"],
	grave_yard: ["Friedhof", "Graveyard"],
	scrub: ["Gebüsch", "Scrub"],
	rock: ["Fels", "Rock"],
	sand: ["Sand", "Sand"],
	beach: ["Strand", "Beach"],
	wetland: ["Feuchtgebiet", "Wetland"],
	residential: ["Wohngebiet", "Residential area"],
	commercial: ["Gewerbegebiet", "Commercial area"],
	industrial: ["Industriegebiet", "Industrial area"],
	retail: ["Einkaufsgebiet", "Retail area"],
	water: ["Gewässer", "Water"],
	lake: ["See", "Lake"],
	pond: ["Teich", "Pond"],
	river: ["Fluss", "River"],
	stream: ["Bach", "Stream"],
	canal: ["Kanal", "Canal"],
	reservoir: ["Stausee", "Reservoir"],
	fountain: ["Brunnen", "Fountain"],
	peak: ["Gipfel", "Peak"],
	volcano: ["Vulkan", "Volcano"],
	saddle: ["Sattel", "Saddle"],
	viewpoint: ["Aussichtspunkt", "Viewpoint"],
	city: ["Stadt", "City"],
	town: ["Stadt", "Town"],
	village: ["Dorf", "Village"],
	hamlet: ["Weiler", "Hamlet"],
	suburb: ["Stadtteil", "Suburb"],
	quarter: ["Viertel", "Quarter"],
	neighbourhood: ["Wohnviertel", "Neighbourhood"],
	country: ["Land", "Country"],
	state: ["Bundesland", "State"],
	motorway: ["Autobahn", "Motorway"],
	trunk: ["Schnellstraße", "Trunk road"],
	primary: ["Hauptstraße", "Main road"],
	secondary: ["Landstraße", "Secondary road"],
	tertiary: ["Kreisstraße", "Tertiary road"],
	minor: ["Straße", "Street"],
	service: ["Zufahrt", "Service road"],
	track: ["Feldweg", "Track"],
	path: ["Weg", "Path"],
	footway: ["Fußweg", "Footpath"],
	cycleway: ["Radweg", "Cycleway"],
	pedestrian: ["Fußgängerzone", "Pedestrian zone"],
	steps: ["Treppe", "Steps"],
	bridleway: ["Reitweg", "Bridleway"],
	railway: ["Bahn", "Railway"],
	rail: ["Bahnstrecke", "Railway"],
	transit: ["Nahverkehr", "Transit"],
	station: ["Bahnhof", "Station"],
	halt: ["Haltepunkt", "Halt"],
	subway: ["U-Bahn", "Subway"],
	tram_stop: ["Straßenbahnhaltestelle", "Tram stop"],
	bus: ["Bus", "Bus"],
	bus_stop: ["Bushaltestelle", "Bus stop"],
	bus_station: ["Busbahnhof", "Bus station"],
	aerialway: ["Seilbahn", "Aerial lift"],
	ferry_terminal: ["Fähranleger", "Ferry terminal"],
	airport: ["Flughafen", "Airport"],
	aerodrome: ["Flugplatz", "Airfield"],
	parking: ["Parkplatz", "Parking"],
	bicycle_parking: ["Fahrradparkplatz", "Bicycle parking"],
	bicycle_rental: ["Fahrradverleih", "Bicycle rental"],
	car_rental: ["Autovermietung", "Car rental"],
	fuel: ["Tankstelle", "Fuel station"],
	charging_station: ["Ladestation", "Charging station"],
	restaurant: ["Restaurant", "Restaurant"],
	cafe: ["Café", "Café"],
	fast_food: ["Imbiss", "Fast food"],
	bar: ["Bar", "Bar"],
	pub: ["Kneipe", "Pub"],
	biergarten: ["Biergarten", "Beer garden"],
	beer: ["Biergarten", "Beer garden"],
	ice_cream: ["Eisdiele", "Ice cream"],
	bakery: ["Bäckerei", "Bakery"],
	shop: ["Geschäft", "Shop"],
	supermarket: ["Supermarkt", "Supermarket"],
	grocery: ["Lebensmittel", "Grocery"],
	convenience: ["Kiosk", "Convenience store"],
	clothes: ["Bekleidung", "Clothes"],
	books: ["Buchhandlung", "Bookshop"],
	butcher: ["Metzgerei", "Butcher"],
	florist: ["Blumenladen", "Florist"],
	hairdresser: ["Friseur", "Hairdresser"],
	pharmacy: ["Apotheke", "Pharmacy"],
	chemist: ["Drogerie", "Chemist"],
	mall: ["Einkaufszentrum", "Shopping mall"],
	department_store: ["Kaufhaus", "Department store"],
	marketplace: ["Markt", "Marketplace"],
	museum: ["Museum", "Museum"],
	theatre: ["Theater", "Theatre"],
	cinema: ["Kino", "Cinema"],
	library: ["Bibliothek", "Library"],
	arts_centre: ["Kulturzentrum", "Arts centre"],
	gallery: ["Galerie", "Gallery"],
	attraction: ["Sehenswürdigkeit", "Attraction"],
	artwork: ["Kunstwerk", "Artwork"],
	monument: ["Denkmal", "Monument"],
	memorial: ["Gedenkstätte", "Memorial"],
	castle: ["Burg", "Castle"],
	ruins: ["Ruine", "Ruins"],
	zoo: ["Zoo", "Zoo"],
	theme_park: ["Freizeitpark", "Theme park"],
	picnic_site: ["Picknickplatz", "Picnic site"],
	lodging: ["Unterkunft", "Lodging"],
	hotel: ["Hotel", "Hotel"],
	hostel: ["Hostel", "Hostel"],
	guest_house: ["Pension", "Guest house"],
	camp_site: ["Campingplatz", "Campsite"],
	caravan_site: ["Wohnmobilstellplatz", "Caravan site"],
	alpine_hut: ["Berghütte", "Mountain hut"],
	wilderness_hut: ["Schutzhütte", "Shelter"],
	shelter: ["Unterstand", "Shelter"],
	school: ["Schule", "School"],
	college: ["Hochschule", "College"],
	university: ["Universität", "University"],
	kindergarten: ["Kindergarten", "Kindergarten"],
	hospital: ["Krankenhaus", "Hospital"],
	clinic: ["Klinik", "Clinic"],
	doctors: ["Arztpraxis", "Doctor"],
	dentist: ["Zahnarzt", "Dentist"],
	police: ["Polizei", "Police"],
	fire_station: ["Feuerwehr", "Fire station"],
	post: ["Post", "Post office"],
	post_office: ["Post", "Post office"],
	town_hall: ["Rathaus", "Town hall"],
	townhall: ["Rathaus", "Town hall"],
	bank: ["Bank", "Bank"],
	atm: ["Geldautomat", "ATM"],
	toilets: ["Toiletten", "Toilets"],
	drinking_water: ["Trinkwasser", "Drinking water"],
	information: ["Information", "Information"],
	place_of_worship: ["Gotteshaus", "Place of worship"],
	church: ["Kirche", "Church"],
	mosque: ["Moschee", "Mosque"],
	synagogue: ["Synagoge", "Synagogue"],
	building: ["Gebäude", "Building"]
};
function at(e, t) {
	if (typeof e != "string" || !e) return "";
	let n = it[e.toLowerCase()];
	if (n) return t === "de" ? n[0] : n[1];
	let r = e.replace(/_/g, " ");
	return r.charAt(0).toUpperCase() + r.slice(1);
}
//#endregion
//#region src/runtime/tooltips/index.ts
var ot = "<strong>{name}</strong>\n<span style=\"opacity:.7\">{category}</span>\n{description}\n<a href=\"{url}\">{url}</a>", st = "mapstyler:tooltips", Q = {
	background: "#ffffff",
	color: "#1f2328",
	fontFamily: "system-ui, -apple-system, \"Segoe UI\", sans-serif",
	fontSize: 13,
	lineHeight: 1.4,
	padding: 10,
	radius: 8,
	borderColor: "rgba(0, 0, 0, 0.08)",
	borderWidth: 1,
	shadow: "soft",
	maxWidth: 260,
	tip: !0,
	blur: 0
}, ct = {
	none: "none",
	soft: "0 4px 14px rgba(0, 0, 0, 0.12)",
	strong: "0 10px 30px rgba(0, 0, 0, 0.3)"
};
function lt(e) {
	let t = e && typeof e == "object" ? e : {}, n = { ...Q };
	if (t.style && typeof t.style == "object") for (let e of Object.keys(Q)) {
		let r = t.style[e];
		r != null && typeof r == typeof Q[e] && (n[e] = r);
	}
	let r = {};
	if (t.layers && typeof t.layers == "object") for (let [e, n] of Object.entries(t.layers)) {
		let t = n ?? {};
		r[e] = {
			enabled: t.enabled !== !1,
			template: typeof t.template == "string" ? ft(t.template) : ""
		};
	}
	return {
		trigger: t.trigger === "click" ? "click" : "hover",
		style: n,
		layers: r
	};
}
var ut = {
	"&": "&amp;",
	"<": "&lt;",
	">": "&gt;",
	"\"": "&quot;",
	"'": "&#39;"
}, dt = (e) => String(e).replace(/[&<>"']/g, (e) => ut[e]);
function ft(e) {
	let t = /\{name:(de|en)\|/.exec(e)?.[1] ?? "en";
	return e.replace("{subclass|class}", `{kind_${t}}`);
}
function pt(e, t) {
	for (let n of e.split("|")) {
		let e = n.trim();
		if (!e) continue;
		let r = e[0];
		if ((r === "'" || r === "\"") && e.length >= 2 && e.endsWith(r)) return e.slice(1, -1);
		let i = /^kind(?:_(de|en))?$/.exec(e);
		if (i) {
			let e = at(t.subclass || t.class, i[1] ?? "en");
			if (e) return e;
			continue;
		}
		let a = t[e];
		if (a != null && a !== "") return String(a);
	}
	return "";
}
var mt = /* @__PURE__ */ new Set([
	"A",
	"B",
	"STRONG",
	"I",
	"EM",
	"U",
	"SMALL",
	"SPAN",
	"DIV",
	"P",
	"BR",
	"UL",
	"OL",
	"LI",
	"HR",
	"SUB",
	"SUP"
]);
function ht(e) {
	let t = e.trim();
	return /^https?:\/\/[^\s"'<>]+$/i.test(t) ? t : /^www\.[^\s"'<>]+$/i.test(t) ? `https://${t}` : null;
}
var gt = /* @__PURE__ */ new Set([
	"SCRIPT",
	"STYLE",
	"IFRAME",
	"OBJECT",
	"EMBED",
	"TEMPLATE",
	"SVG",
	"MATH"
]);
function _t(e) {
	for (let t of [...e.childNodes]) if (t.nodeType === 1) {
		let e = t;
		if (gt.has(e.tagName)) {
			e.remove();
			continue;
		}
		if (_t(e), !mt.has(e.tagName)) {
			e.replaceWith(...e.childNodes);
			continue;
		}
		let n = e.tagName === "A" ? ht(e.getAttribute("href") ?? "") : null;
		for (let t of [...e.attributes]) t.name === "class" || t.name === "style" && !/url\s*\(|expression|javascript:/i.test(t.value) || e.removeAttribute(t.name);
		if (e.tagName === "A") {
			if (!n) {
				e.replaceWith(...e.childNodes);
				continue;
			}
			e.setAttribute("href", n), e.setAttribute("target", "_blank"), e.setAttribute("rel", "noopener noreferrer");
		}
	} else t.nodeType !== 3 && t.remove();
}
function vt(e) {
	if (typeof document > "u") return e;
	let t = document.createElement("template");
	return t.innerHTML = e, _t(t.content), t.innerHTML;
}
function yt(e, t = {}) {
	let n = [];
	for (let r of String(e || "").split(/\r?\n/)) {
		let e = !1, i = !0, a = r.replace(/\{([^{}]+)\}/g, (n, r) => {
			e = !0;
			let a = pt(r, t);
			return a !== "" && (i = !1), dt(a);
		});
		e && i || a.trim() && n.push(a);
	}
	return vt(n.join("<br>"));
}
var $ = (e) => String(e).replace(/[{}<>;]/g, ""), bt = {
	foot: "<path d=\"M4 16v-2.38C4 11.5 2.97 10.5 3 8c.03-2.72 1.49-6 4.5-6C9.37 2 10 3.8 10 5.5c0 3.11-2 5.66-2 8.68V16a2 2 0 1 1-4 0Z\"/><path d=\"M20 20v-2.38c0-2.12 1.03-3.12 1-5.62-.03-2.72-1.49-6-4.5-6C14.63 6 14 7.8 14 9.5c0 3.11 2 5.66 2 8.68V20a2 2 0 1 0 4 0Z\"/><path d=\"M16 17h4\"/><path d=\"M4 13h4\"/>",
	bike: "<circle cx=\"18.5\" cy=\"17.5\" r=\"3.5\"/><circle cx=\"5.5\" cy=\"17.5\" r=\"3.5\"/><circle cx=\"15\" cy=\"5\" r=\"1\"/><path d=\"M12 17.5V14l-3-3 4-3 2 3h2\"/>",
	car: "<path d=\"M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2\"/><circle cx=\"7\" cy=\"17\" r=\"2\"/><path d=\"M9 17h6\"/><circle cx=\"17\" cy=\"17\" r=\"2\"/>",
	train: "<path d=\"M8 3.1V7a4 4 0 0 0 8 0V3.1\"/><path d=\"m9 15-1-1\"/><path d=\"m15 15 1-1\"/><path d=\"M9 19c-2.8 0-5-2.2-5-5v-4a8 8 0 0 1 16 0v4c0 2.8-2.2 5-5 5Z\"/><path d=\"m8 19-2 3\"/><path d=\"m16 19 2 3\"/>",
	line: "<circle cx=\"19\" cy=\"5\" r=\"2\"/><circle cx=\"5\" cy=\"19\" r=\"2\"/><path d=\"M5 17A12 12 0 0 1 17 5\"/>"
};
function xt(e) {
	return Object.entries(bt).map(([t, n]) => {
		let r = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">${n}</svg>`, i = `url("data:image/svg+xml,${encodeURIComponent(r)}") center / contain no-repeat`;
		return `${e} .msx-icon-${t}{display:inline-block;width:1.1em;height:1.1em;margin-right:.35em;vertical-align:-.2em;background:currentColor;-webkit-mask:${i};mask:${i};}`;
	}).join("\n");
}
function St(e, t) {
	let n = `.${t}`, r = $(e.background), i = Math.max(Number(e.borderWidth) || 0, 0), a = (e, t, a) => e.map((e) => `${n}.maplibregl-popup-anchor-${e} .maplibregl-popup-tip`).join(",") + `{border-${t}-color:${r};position:relative;z-index:1;margin-${a}:-${i}px;}`;
	return [
		`${n} .maplibregl-popup-content{background:${r};color:${$(e.color)};font-family:${$(e.fontFamily)};font-size:${Number(e.fontSize)}px;line-height:${Number(e.lineHeight)};padding:${Number(e.padding)}px;border-radius:${Number(e.radius)}px;border:${Number(e.borderWidth)}px solid ${$(e.borderColor)};box-shadow:${ct[e.shadow] ?? ct.soft};` + (Number(e.blur) > 0 ? `-webkit-backdrop-filter:blur(${Number(e.blur)}px) saturate(1.7);backdrop-filter:blur(${Number(e.blur)}px) saturate(1.7);` : "") + "}",
		`${n} .maplibregl-popup-close-button{top:6px;right:6px;width:20px;height:20px;padding:0;border-radius:6px;color:inherit;opacity:.55;font-size:16px;line-height:18px;background:transparent;}`,
		`${n} .maplibregl-popup-close-button:hover{opacity:1;background:rgba(127,127,127,.18);}`,
		`${n} a{color:inherit;text-decoration:none;}`,
		`${n} a:hover{text-decoration:underline;}`,
		`${n}.msx-click .maplibregl-popup-content{padding-right:${Number(e.padding) + 24}px;}`,
		a([
			"top",
			"top-left",
			"top-right"
		], "bottom", "bottom"),
		a([
			"bottom",
			"bottom-left",
			"bottom-right"
		], "top", "top"),
		a(["left"], "right", "right"),
		a(["right"], "left", "left"),
		e.tip ? "" : `${n} .maplibregl-popup-tip{display:none;}`,
		xt(n)
	].join("\n");
}
var Ct = 0;
function wt(e, t = {}) {
	let n = t.maplibregl ?? globalThis.maplibregl;
	if (!n?.Popup) throw Error("MapStylerTooltips: maplibregl wurde nicht gefunden.");
	let r = `msx-tooltip-${++Ct}`, i = document.createElement("style");
	i.dataset.mapstyler = r, document.head.appendChild(i);
	let a = null, o = null, s = !0, c = "", l = () => a ? Object.keys(a.layers).filter((t) => a.layers[t].enabled && a.layers[t].template && e.getLayer(t)) : [], u = (t) => {
		let n = l();
		return n.length ? e.queryRenderedFeatures(t.point, { layers: n })[0] ?? null : null;
	}, d = () => {
		c = "", o?.isOpen() && o.remove();
	}, f = (t, n) => {
		if (!a || !o) return;
		let r = yt(a.layers[t.layer.id].template, t.properties ?? {});
		if (!r) return d();
		let i = t.geometry.type === "Point" ? t.geometry.coordinates : null, s = i ?? [n.lngLat.lng, n.lngLat.lat], l = `${t.layer.id}|${t.id ?? ""}|${r}|${i ? i.join(",") : s.join(",")}`;
		l === c && o.isOpen() || (c = l, o.setLngLat(s).setHTML(r), o.isOpen() || o.addTo(e));
	}, p = (t) => {
		if (!s || !a) return;
		let n = u(t);
		e.getCanvas().style.cursor = n ? "pointer" : "", a.trigger === "hover" && (n ? f(n, t) : d());
	}, m = (e) => {
		if (!s || !a || a.trigger !== "click") return;
		let t = u(e);
		t ? f(t, e) : d();
	}, h = () => {
		s && (e.getCanvas().style.cursor = "", a?.trigger === "hover" && d());
	}, g = {}, _ = (e) => {
		a = lt(e), Object.assign(a.layers, g), i.textContent = St(a.style, r), o?.remove(), o = new n.Popup({
			className: `msx-tooltip ${r}${a.trigger === "click" ? " msx-click" : ""}`,
			closeButton: a.trigger === "click",
			closeOnClick: !1,
			maxWidth: `${a.style.maxWidth}px`,
			offset: 10,
			focusAfterOpen: !1
		}), c = "";
	}, v = () => e.getStyle()?.metadata && e.getStyle().metadata["mapstyler:tooltips"], y = () => _(v()), b = (t) => {
		if (!e.hasImage(t)) {
			if (t.startsWith("msx-pin-")) {
				let n = ze(t);
				n && e.addImage(t, n, { pixelRatio: 2 });
			} else if (t.startsWith("msx-ascii-")) {
				let n = Ve(t);
				n && e.addImage(t, n, { pixelRatio: 2 });
			} else if (t.startsWith("msx-box-")) {
				let n = He(t);
				n && e.addImage(t, n, {
					pixelRatio: 2,
					stretchX: [[4, 12]],
					stretchY: [[4, 12]],
					content: [
						4,
						4,
						12,
						12
					]
				});
			}
		}
	}, x = (e) => b(e.id);
	e.on("styleimagemissing", x);
	let S = (e, t) => {
		typeof e == "string" ? (e.startsWith("msx-ascii-") || e.startsWith("msx-box-")) && t.add(e) : Array.isArray(e) ? e.forEach((e) => S(e, t)) : e && typeof e == "object" && Object.values(e).forEach((e) => S(e, t));
	}, C = () => {
		let t = e.getStyle();
		if (!t?.layers) return;
		let n = /* @__PURE__ */ new Set();
		for (let e of t.layers) S(e.paint, n), S(e.layout, n);
		n.forEach(b);
	};
	e.on("styledata", C);
	let w = t.glass === !1 ? null : Ee(e), T = t.hatch === !1 ? null : Pe(e);
	e.on("mousemove", p), e.on("click", m), e.on("mouseout", h), t.config === void 0 ? (e.isStyleLoaded() && y(), e.on("style.load", y)) : _(t.config);
	let E = [];
	return {
		className: r,
		update: _,
		pins(t = {}) {
			let { template: n, ...r } = t;
			g[X] = {
				enabled: !0,
				template: n ?? "<strong>{name}</strong>\n<span style=\"opacity:.7\">{category}</span>\n{description}\n<a href=\"{url}\">{url}</a>"
			}, a && (a.layers[X] = g[X]);
			let i = rt(e, r, { show(t, n) {
				if (!a || !o || !s) return;
				let r = yt(g[X].template, t);
				r && (c = `${X}|${String(t.id ?? "")}`, o.setLngLat(n).setHTML(r), o.isOpen() || o.addTo(e));
			} });
			return E.push(i), i;
		},
		setEnabled(e) {
			s = e, s || d();
		},
		destroy() {
			E.forEach((e) => e.destroy()), e.off("mousemove", p), e.off("click", m), e.off("mouseout", h), e.off("style.load", y), e.off("styleimagemissing", x), e.off("styledata", C), w?.destroy(), T?.destroy(), o?.remove(), i.remove();
		}
	};
}
//#endregion
export { U as DEFAULT_GLASS, K as DEFAULT_HATCH, Q as DEFAULT_STYLE, le as GLASS_KEY, De as HATCH_KEY, st as KEY, ot as PIN_TEMPLATE, Fe as PIN_TYPES, wt as attach, Ee as attachGlass, Pe as attachHatch, ze as drawPinImage, lt as normalize, Ke as parseCoordinates, Xe as parsePin, Ze as pinsFromGeoJSON, yt as renderTemplate, vt as sanitize, St as tooltipCss };
