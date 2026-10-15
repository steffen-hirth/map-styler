//#region src/runtime/tooltips/index.ts
var e = "mapstyler:tooltips", t = {
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
	tip: !0
}, n = {
	none: "none",
	soft: "0 4px 14px rgba(0, 0, 0, 0.12)",
	strong: "0 10px 30px rgba(0, 0, 0, 0.3)"
};
function r(e) {
	let n = e && typeof e == "object" ? e : {}, r = { ...t };
	if (n.style && typeof n.style == "object") for (let e of Object.keys(t)) {
		let i = n.style[e];
		i != null && typeof i == typeof t[e] && (r[e] = i);
	}
	let i = {};
	if (n.layers && typeof n.layers == "object") for (let [e, t] of Object.entries(n.layers)) {
		let n = t ?? {};
		i[e] = {
			enabled: n.enabled !== !1,
			template: typeof n.template == "string" ? n.template : ""
		};
	}
	return {
		trigger: n.trigger === "click" ? "click" : "hover",
		style: r,
		layers: i
	};
}
var i = {
	"&": "&amp;",
	"<": "&lt;",
	">": "&gt;",
	"\"": "&quot;",
	"'": "&#39;"
}, a = (e) => String(e).replace(/[&<>"']/g, (e) => i[e]);
function o(e, t) {
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
var s = /* @__PURE__ */ new Set([
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
]), c = /* @__PURE__ */ new Set([
	"SCRIPT",
	"STYLE",
	"IFRAME",
	"OBJECT",
	"EMBED",
	"TEMPLATE",
	"SVG",
	"MATH"
]);
function l(e) {
	for (let t of [...e.childNodes]) if (t.nodeType === 1) {
		let e = t;
		if (c.has(e.tagName)) {
			e.remove();
			continue;
		}
		if (l(e), !s.has(e.tagName)) {
			e.replaceWith(...e.childNodes);
			continue;
		}
		for (let t of [...e.attributes]) t.name === "class" || t.name === "style" && !/url\s*\(|expression|javascript:/i.test(t.value) || e.removeAttribute(t.name);
	} else t.nodeType !== 3 && t.remove();
}
function u(e) {
	if (typeof document > "u") return e;
	let t = document.createElement("template");
	return t.innerHTML = e, l(t.content), t.innerHTML;
}
function d(e, t = {}) {
	let n = [];
	for (let r of String(e || "").split(/\r?\n/)) {
		let e = !1, i = !0, s = r.replace(/\{([^{}]+)\}/g, (n, r) => {
			e = !0;
			let s = o(r, t);
			return s !== "" && (i = !1), a(s);
		});
		e && i || s.trim() && n.push(s);
	}
	return u(n.join("<br>"));
}
var f = (e) => String(e).replace(/[{}<>;]/g, "");
function p(e, t) {
	let r = `.${t}`, i = f(e.background), a = (e, t) => e.map((e) => `${r}.maplibregl-popup-anchor-${e} .maplibregl-popup-tip`).join(",") + `{border-${t}-color:${i};}`;
	return [
		`${r} .maplibregl-popup-content{background:${i};color:${f(e.color)};font-family:${f(e.fontFamily)};font-size:${Number(e.fontSize)}px;line-height:${Number(e.lineHeight)};padding:${Number(e.padding)}px;border-radius:${Number(e.radius)}px;border:${Number(e.borderWidth)}px solid ${f(e.borderColor)};box-shadow:${n[e.shadow] ?? n.soft};}`,
		`${r} .maplibregl-popup-close-button{top:6px;right:6px;width:20px;height:20px;padding:0;border-radius:6px;color:inherit;opacity:.55;font-size:16px;line-height:18px;background:transparent;}`,
		`${r} .maplibregl-popup-close-button:hover{opacity:1;background:rgba(127,127,127,.18);}`,
		`${r}.msx-click .maplibregl-popup-content{padding-right:${Number(e.padding) + 24}px;}`,
		a([
			"top",
			"top-left",
			"top-right"
		], "bottom"),
		a([
			"bottom",
			"bottom-left",
			"bottom-right"
		], "top"),
		a(["left"], "right"),
		a(["right"], "left"),
		e.tip ? "" : `${r} .maplibregl-popup-tip{display:none;}`
	].join("\n");
}
var m = 0;
function h(e, t = {}) {
	let n = t.maplibregl ?? globalThis.maplibregl;
	if (!n?.Popup) throw Error("MapStylerTooltips: maplibregl wurde nicht gefunden.");
	let i = `msx-tooltip-${++m}`, a = document.createElement("style");
	a.dataset.mapstyler = i, document.head.appendChild(a);
	let o = null, s = null, c = !0, l = "", u = () => o ? Object.keys(o.layers).filter((t) => o.layers[t].enabled && o.layers[t].template && e.getLayer(t)) : [], f = (t) => {
		let n = u();
		return n.length ? e.queryRenderedFeatures(t.point, { layers: n })[0] ?? null : null;
	}, h = () => {
		l = "", s?.isOpen() && s.remove();
	}, g = (t, n) => {
		if (!o || !s) return;
		let r = d(o.layers[t.layer.id].template, t.properties ?? {});
		if (!r) return h();
		let i = t.geometry.type === "Point" ? t.geometry.coordinates : null, a = i ?? [n.lngLat.lng, n.lngLat.lat], c = `${t.layer.id}|${t.id ?? ""}|${r}|${i ? i.join(",") : a.join(",")}`;
		c === l && s.isOpen() || (l = c, s.setLngLat(a).setHTML(r), s.isOpen() || s.addTo(e));
	}, _ = (t) => {
		if (!c || !o) return;
		let n = f(t);
		e.getCanvas().style.cursor = n ? "pointer" : "", o.trigger === "hover" && (n ? g(n, t) : h());
	}, v = (e) => {
		if (!c || !o || o.trigger !== "click") return;
		let t = f(e);
		t ? g(t, e) : h();
	}, y = () => {
		c && (e.getCanvas().style.cursor = "", o?.trigger === "hover" && h());
	}, b = (e) => {
		o = r(e), a.textContent = p(o.style, i), s?.remove(), s = new n.Popup({
			className: `msx-tooltip ${i}${o.trigger === "click" ? " msx-click" : ""}`,
			closeButton: o.trigger === "click",
			closeOnClick: !1,
			maxWidth: `${o.style.maxWidth}px`,
			offset: 10,
			focusAfterOpen: !1
		}), l = "";
	}, x = () => e.getStyle()?.metadata && e.getStyle().metadata["mapstyler:tooltips"], S = () => b(x());
	return e.on("mousemove", _), e.on("click", v), e.on("mouseout", y), t.config === void 0 ? (e.isStyleLoaded() && S(), e.on("style.load", S)) : b(t.config), {
		className: i,
		update: b,
		setEnabled(e) {
			c = e, c || h();
		},
		destroy() {
			e.off("mousemove", _), e.off("click", v), e.off("mouseout", y), e.off("style.load", S), s?.remove(), a.remove();
		}
	};
}
//#endregion
export { t as DEFAULT_STYLE, e as KEY, h as attach, r as normalize, d as renderTemplate, u as sanitize, p as tooltipCss };
