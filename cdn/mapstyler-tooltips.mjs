//#region src/runtime/tooltips/pin-icons.ts
var e = [
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
], t = {
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
function n(t) {
	return typeof t == "string" && e.includes(t);
}
var r = 56;
function i(e) {
	if (!e.startsWith("msx-pin-") || typeof document > "u") return null;
	let i = /^(.+)-([0-9a-f]{6})$/i.exec(e.slice(8));
	if (!i) return null;
	let a = n(i[1]) ? i[1] : "pin", o = document.createElement("canvas");
	o.width = r, o.height = r;
	let s = o.getContext("2d");
	if (!s) return null;
	let c = r / 2, l = r / 2 - 1;
	s.shadowColor = "rgba(20, 22, 26, 0.28)", s.shadowBlur = 5, s.shadowOffsetY = 1.5, s.beginPath(), s.arc(c, l, 21, 0, Math.PI * 2), s.fillStyle = `#${i[2]}`, s.fill(), s.shadowColor = "transparent", s.lineWidth = 3, s.strokeStyle = "#ffffff", s.stroke();
	let u = .92;
	s.save(), s.translate(c - 12 * u, l - 12 * u), s.scale(u, u), s.strokeStyle = "#ffffff", s.lineWidth = 2.2, s.lineCap = "round", s.lineJoin = "round";
	for (let e of t[a]) s.stroke(new Path2D(e));
	return s.restore(), {
		width: r,
		height: r,
		data: s.getImageData(0, 0, r, r).data
	};
}
var a = {
	dot: "·",
	tilde: "~",
	hash: "#",
	plus: "+",
	slash: "/",
	colon: ":",
	dash: "-",
	star: "*"
}, o = 28;
function s(e) {
	if (!e.startsWith("msx-ascii-") || typeof document > "u") return null;
	let t = /^([a-z]+)-([0-9a-f]{6})-([0-9a-f]{6})$/i.exec(e.slice(10));
	if (!t || !(t[1] in a)) return null;
	let n = document.createElement("canvas");
	n.width = o, n.height = o;
	let r = n.getContext("2d");
	return r ? (r.fillStyle = `#${t[3]}`, r.fillRect(0, 0, o, o), r.fillStyle = `#${t[2]}`, r.font = "600 20px ui-monospace, \"SF Mono\", Menlo, Consolas, monospace", r.textAlign = "center", r.textBaseline = "middle", r.fillText(a[t[1]], o / 2, 15), {
		width: o,
		height: o,
		data: r.getImageData(0, 0, o, o).data
	}) : null;
}
//#endregion
//#region src/runtime/tooltips/index.ts
var c = "mapstyler:tooltips", l = {
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
}, u = {
	none: "none",
	soft: "0 4px 14px rgba(0, 0, 0, 0.12)",
	strong: "0 10px 30px rgba(0, 0, 0, 0.3)"
};
function d(e) {
	let t = e && typeof e == "object" ? e : {}, n = { ...l };
	if (t.style && typeof t.style == "object") for (let e of Object.keys(l)) {
		let r = t.style[e];
		r != null && typeof r == typeof l[e] && (n[e] = r);
	}
	let r = {};
	if (t.layers && typeof t.layers == "object") for (let [e, n] of Object.entries(t.layers)) {
		let t = n ?? {};
		r[e] = {
			enabled: t.enabled !== !1,
			template: typeof t.template == "string" ? t.template : ""
		};
	}
	return {
		trigger: t.trigger === "click" ? "click" : "hover",
		style: n,
		layers: r
	};
}
var f = {
	"&": "&amp;",
	"<": "&lt;",
	">": "&gt;",
	"\"": "&quot;",
	"'": "&#39;"
}, p = (e) => String(e).replace(/[&<>"']/g, (e) => f[e]);
function m(e, t) {
	for (let n of e.split("|")) {
		let e = n.trim();
		if (!e) continue;
		let r = e[0];
		if ((r === "'" || r === "\"") && e.length >= 2 && e.endsWith(r)) return e.slice(1, -1);
		let i = t[e];
		if (i != null && i !== "") return String(i);
	}
	return "";
}
var h = /* @__PURE__ */ new Set([
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
]), g = /* @__PURE__ */ new Set([
	"SCRIPT",
	"STYLE",
	"IFRAME",
	"OBJECT",
	"EMBED",
	"TEMPLATE",
	"SVG",
	"MATH"
]);
function _(e) {
	for (let t of [...e.childNodes]) if (t.nodeType === 1) {
		let e = t;
		if (g.has(e.tagName)) {
			e.remove();
			continue;
		}
		if (_(e), !h.has(e.tagName)) {
			e.replaceWith(...e.childNodes);
			continue;
		}
		for (let t of [...e.attributes]) t.name === "class" || t.name === "style" && !/url\s*\(|expression|javascript:/i.test(t.value) || e.removeAttribute(t.name);
	} else t.nodeType !== 3 && t.remove();
}
function v(e) {
	if (typeof document > "u") return e;
	let t = document.createElement("template");
	return t.innerHTML = e, _(t.content), t.innerHTML;
}
function y(e, t = {}) {
	let n = [];
	for (let r of String(e || "").split(/\r?\n/)) {
		let e = !1, i = !0, a = r.replace(/\{([^{}]+)\}/g, (n, r) => {
			e = !0;
			let a = m(r, t);
			return a !== "" && (i = !1), p(a);
		});
		e && i || a.trim() && n.push(a);
	}
	return v(n.join("<br>"));
}
var b = (e) => String(e).replace(/[{}<>;]/g, ""), x = {
	foot: "<path d=\"M4 16v-2.38C4 11.5 2.97 10.5 3 8c.03-2.72 1.49-6 4.5-6C9.37 2 10 3.8 10 5.5c0 3.11-2 5.66-2 8.68V16a2 2 0 1 1-4 0Z\"/><path d=\"M20 20v-2.38c0-2.12 1.03-3.12 1-5.62-.03-2.72-1.49-6-4.5-6C14.63 6 14 7.8 14 9.5c0 3.11 2 5.66 2 8.68V20a2 2 0 1 0 4 0Z\"/><path d=\"M16 17h4\"/><path d=\"M4 13h4\"/>",
	bike: "<circle cx=\"18.5\" cy=\"17.5\" r=\"3.5\"/><circle cx=\"5.5\" cy=\"17.5\" r=\"3.5\"/><circle cx=\"15\" cy=\"5\" r=\"1\"/><path d=\"M12 17.5V14l-3-3 4-3 2 3h2\"/>",
	car: "<path d=\"M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2\"/><circle cx=\"7\" cy=\"17\" r=\"2\"/><path d=\"M9 17h6\"/><circle cx=\"17\" cy=\"17\" r=\"2\"/>",
	train: "<path d=\"M8 3.1V7a4 4 0 0 0 8 0V3.1\"/><path d=\"m9 15-1-1\"/><path d=\"m15 15 1-1\"/><path d=\"M9 19c-2.8 0-5-2.2-5-5v-4a8 8 0 0 1 16 0v4c0 2.8-2.2 5-5 5Z\"/><path d=\"m8 19-2 3\"/><path d=\"m16 19 2 3\"/>",
	line: "<circle cx=\"19\" cy=\"5\" r=\"2\"/><circle cx=\"5\" cy=\"19\" r=\"2\"/><path d=\"M5 17A12 12 0 0 1 17 5\"/>"
};
function S(e) {
	return Object.entries(x).map(([t, n]) => {
		let r = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">${n}</svg>`, i = `url("data:image/svg+xml,${encodeURIComponent(r)}") center / contain no-repeat`;
		return `${e} .msx-icon-${t}{display:inline-block;width:1.1em;height:1.1em;margin-right:.35em;vertical-align:-.2em;background:currentColor;-webkit-mask:${i};mask:${i};}`;
	}).join("\n");
}
function C(e, t) {
	let n = `.${t}`, r = b(e.background), i = (e, t) => e.map((e) => `${n}.maplibregl-popup-anchor-${e} .maplibregl-popup-tip`).join(",") + `{border-${t}-color:${r};}`;
	return [
		`${n} .maplibregl-popup-content{background:${r};color:${b(e.color)};font-family:${b(e.fontFamily)};font-size:${Number(e.fontSize)}px;line-height:${Number(e.lineHeight)};padding:${Number(e.padding)}px;border-radius:${Number(e.radius)}px;border:${Number(e.borderWidth)}px solid ${b(e.borderColor)};box-shadow:${u[e.shadow] ?? u.soft};` + (Number(e.blur) > 0 ? `-webkit-backdrop-filter:blur(${Number(e.blur)}px) saturate(1.7);backdrop-filter:blur(${Number(e.blur)}px) saturate(1.7);` : "") + "}",
		`${n} .maplibregl-popup-close-button{top:6px;right:6px;width:20px;height:20px;padding:0;border-radius:6px;color:inherit;opacity:.55;font-size:16px;line-height:18px;background:transparent;}`,
		`${n} .maplibregl-popup-close-button:hover{opacity:1;background:rgba(127,127,127,.18);}`,
		`${n}.msx-click .maplibregl-popup-content{padding-right:${Number(e.padding) + 24}px;}`,
		i([
			"top",
			"top-left",
			"top-right"
		], "bottom"),
		i([
			"bottom",
			"bottom-left",
			"bottom-right"
		], "top"),
		i(["left"], "right"),
		i(["right"], "left"),
		e.tip ? "" : `${n} .maplibregl-popup-tip{display:none;}`,
		S(n)
	].join("\n");
}
var w = 0;
function T(e, t = {}) {
	let n = t.maplibregl ?? globalThis.maplibregl;
	if (!n?.Popup) throw Error("MapStylerTooltips: maplibregl wurde nicht gefunden.");
	let r = `msx-tooltip-${++w}`, a = document.createElement("style");
	a.dataset.mapstyler = r, document.head.appendChild(a);
	let o = null, c = null, l = !0, u = "", f = () => o ? Object.keys(o.layers).filter((t) => o.layers[t].enabled && o.layers[t].template && e.getLayer(t)) : [], p = (t) => {
		let n = f();
		return n.length ? e.queryRenderedFeatures(t.point, { layers: n })[0] ?? null : null;
	}, m = () => {
		u = "", c?.isOpen() && c.remove();
	}, h = (t, n) => {
		if (!o || !c) return;
		let r = y(o.layers[t.layer.id].template, t.properties ?? {});
		if (!r) return m();
		let i = t.geometry.type === "Point" ? t.geometry.coordinates : null, a = i ?? [n.lngLat.lng, n.lngLat.lat], s = `${t.layer.id}|${t.id ?? ""}|${r}|${i ? i.join(",") : a.join(",")}`;
		s === u && c.isOpen() || (u = s, c.setLngLat(a).setHTML(r), c.isOpen() || c.addTo(e));
	}, g = (t) => {
		if (!l || !o) return;
		let n = p(t);
		e.getCanvas().style.cursor = n ? "pointer" : "", o.trigger === "hover" && (n ? h(n, t) : m());
	}, _ = (e) => {
		if (!l || !o || o.trigger !== "click") return;
		let t = p(e);
		t ? h(t, e) : m();
	}, v = () => {
		l && (e.getCanvas().style.cursor = "", o?.trigger === "hover" && m());
	}, b = (e) => {
		o = d(e), a.textContent = C(o.style, r), c?.remove(), c = new n.Popup({
			className: `msx-tooltip ${r}${o.trigger === "click" ? " msx-click" : ""}`,
			closeButton: o.trigger === "click",
			closeOnClick: !1,
			maxWidth: `${o.style.maxWidth}px`,
			offset: 10,
			focusAfterOpen: !1
		}), u = "";
	}, x = () => e.getStyle()?.metadata && e.getStyle().metadata["mapstyler:tooltips"], S = () => b(x()), T = (t) => {
		if (e.hasImage(t.id)) return;
		let n = t.id.startsWith("msx-pin-") ? i(t.id) : t.id.startsWith("msx-ascii-") ? s(t.id) : null;
		n && e.addImage(t.id, n, { pixelRatio: 2 });
	};
	return e.on("styleimagemissing", T), e.on("mousemove", g), e.on("click", _), e.on("mouseout", v), t.config === void 0 ? (e.isStyleLoaded() && S(), e.on("style.load", S)) : b(t.config), {
		className: r,
		update: b,
		setEnabled(e) {
			l = e, l || m();
		},
		destroy() {
			e.off("mousemove", g), e.off("click", _), e.off("mouseout", v), e.off("style.load", S), e.off("styleimagemissing", T), c?.remove(), a.remove();
		}
	};
}
//#endregion
export { l as DEFAULT_STYLE, c as KEY, e as PIN_TYPES, T as attach, i as drawPinImage, d as normalize, y as renderTemplate, v as sanitize, C as tooltipCss };
