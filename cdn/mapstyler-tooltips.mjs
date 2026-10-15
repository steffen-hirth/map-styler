//#region src/runtime/tooltips/kind-labels.ts
var e = {
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
function t(t, n) {
	if (typeof t != "string" || !t) return "";
	let r = e[t.toLowerCase()];
	if (r) return n === "de" ? r[0] : r[1];
	let i = t.replace(/_/g, " ");
	return i.charAt(0).toUpperCase() + i.slice(1);
}
//#endregion
//#region src/runtime/tooltips/pin-icons.ts
var n = [
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
], r = {
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
function i(e) {
	return typeof e == "string" && n.includes(e);
}
var a = 56;
function o(e) {
	if (!e.startsWith("msx-pin-") || typeof document > "u") return null;
	let t = /^(.+)-([0-9a-f]{6})$/i.exec(e.slice(8));
	if (!t) return null;
	let n = i(t[1]) ? t[1] : "pin", o = document.createElement("canvas");
	o.width = a, o.height = a;
	let s = o.getContext("2d");
	if (!s) return null;
	let c = a / 2, l = a / 2 - 1;
	s.shadowColor = "rgba(20, 22, 26, 0.28)", s.shadowBlur = 5, s.shadowOffsetY = 1.5, s.beginPath(), s.arc(c, l, 21, 0, Math.PI * 2), s.fillStyle = `#${t[2]}`, s.fill(), s.shadowColor = "transparent", s.lineWidth = 3, s.strokeStyle = "#ffffff", s.stroke();
	let u = .92;
	s.save(), s.translate(c - 12 * u, l - 12 * u), s.scale(u, u), s.strokeStyle = "#ffffff", s.lineWidth = 2.2, s.lineCap = "round", s.lineJoin = "round";
	for (let e of r[n]) s.stroke(new Path2D(e));
	return s.restore(), {
		width: a,
		height: a,
		data: s.getImageData(0, 0, a, a).data
	};
}
var s = {
	dot: "·",
	tilde: "~",
	hash: "#",
	plus: "+",
	slash: "/",
	colon: ":",
	dash: "-",
	star: "*",
	stripe: ""
}, c = 28;
function l(e) {
	if (!e.startsWith("msx-ascii-") || typeof document > "u") return null;
	let t = /^([a-z]+)-([0-9a-f]{6})-([0-9a-f]{6})$/i.exec(e.slice(10));
	if (!t || !(t[1] in s)) return null;
	let n = document.createElement("canvas");
	n.width = c, n.height = c;
	let r = n.getContext("2d");
	if (!r) return null;
	if (r.fillStyle = `#${t[3]}`, r.fillRect(0, 0, c, c), t[1] === "stripe") {
		r.strokeStyle = `#${t[2]}`, r.lineWidth = 5;
		for (let e of [
			-28,
			0,
			c
		]) r.beginPath(), r.moveTo(e, c), r.lineTo(e + c, 0), r.stroke();
		return {
			width: c,
			height: c,
			data: r.getImageData(0, 0, c, c).data
		};
	}
	return r.fillStyle = `#${t[2]}`, r.font = "600 20px ui-monospace, \"SF Mono\", Menlo, Consolas, monospace", r.textAlign = "center", r.textBaseline = "middle", r.fillText(s[t[1]], c / 2, 15), {
		width: c,
		height: c,
		data: r.getImageData(0, 0, c, c).data
	};
}
function u(e) {
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
//#region src/runtime/tooltips/index.ts
var d = "mapstyler:tooltips", f = {
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
}, p = {
	none: "none",
	soft: "0 4px 14px rgba(0, 0, 0, 0.12)",
	strong: "0 10px 30px rgba(0, 0, 0, 0.3)"
};
function m(e) {
	let t = e && typeof e == "object" ? e : {}, n = { ...f };
	if (t.style && typeof t.style == "object") for (let e of Object.keys(f)) {
		let r = t.style[e];
		r != null && typeof r == typeof f[e] && (n[e] = r);
	}
	let r = {};
	if (t.layers && typeof t.layers == "object") for (let [e, n] of Object.entries(t.layers)) {
		let t = n ?? {};
		r[e] = {
			enabled: t.enabled !== !1,
			template: typeof t.template == "string" ? _(t.template) : ""
		};
	}
	return {
		trigger: t.trigger === "click" ? "click" : "hover",
		style: n,
		layers: r
	};
}
var h = {
	"&": "&amp;",
	"<": "&lt;",
	">": "&gt;",
	"\"": "&quot;",
	"'": "&#39;"
}, g = (e) => String(e).replace(/[&<>"']/g, (e) => h[e]);
function _(e) {
	let t = /\{name:(de|en)\|/.exec(e)?.[1] ?? "en";
	return e.replace("{subclass|class}", `{kind_${t}}`);
}
function v(e, n) {
	for (let r of e.split("|")) {
		let e = r.trim();
		if (!e) continue;
		let i = e[0];
		if ((i === "'" || i === "\"") && e.length >= 2 && e.endsWith(i)) return e.slice(1, -1);
		let a = /^kind(?:_(de|en))?$/.exec(e);
		if (a) {
			let e = t(n.subclass || n.class, a[1] ?? "en");
			if (e) return e;
			continue;
		}
		let o = n[e];
		if (o != null && o !== "") return String(o);
	}
	return "";
}
var y = /* @__PURE__ */ new Set([
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
function b(e) {
	let t = e.trim();
	return /^https?:\/\/[^\s"'<>]+$/i.test(t) ? t : /^www\.[^\s"'<>]+$/i.test(t) ? `https://${t}` : null;
}
var x = /* @__PURE__ */ new Set([
	"SCRIPT",
	"STYLE",
	"IFRAME",
	"OBJECT",
	"EMBED",
	"TEMPLATE",
	"SVG",
	"MATH"
]);
function S(e) {
	for (let t of [...e.childNodes]) if (t.nodeType === 1) {
		let e = t;
		if (x.has(e.tagName)) {
			e.remove();
			continue;
		}
		if (S(e), !y.has(e.tagName)) {
			e.replaceWith(...e.childNodes);
			continue;
		}
		let n = e.tagName === "A" ? b(e.getAttribute("href") ?? "") : null;
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
function C(e) {
	if (typeof document > "u") return e;
	let t = document.createElement("template");
	return t.innerHTML = e, S(t.content), t.innerHTML;
}
function w(e, t = {}) {
	let n = [];
	for (let r of String(e || "").split(/\r?\n/)) {
		let e = !1, i = !0, a = r.replace(/\{([^{}]+)\}/g, (n, r) => {
			e = !0;
			let a = v(r, t);
			return a !== "" && (i = !1), g(a);
		});
		e && i || a.trim() && n.push(a);
	}
	return C(n.join("<br>"));
}
var T = (e) => String(e).replace(/[{}<>;]/g, ""), E = {
	foot: "<path d=\"M4 16v-2.38C4 11.5 2.97 10.5 3 8c.03-2.72 1.49-6 4.5-6C9.37 2 10 3.8 10 5.5c0 3.11-2 5.66-2 8.68V16a2 2 0 1 1-4 0Z\"/><path d=\"M20 20v-2.38c0-2.12 1.03-3.12 1-5.62-.03-2.72-1.49-6-4.5-6C14.63 6 14 7.8 14 9.5c0 3.11 2 5.66 2 8.68V20a2 2 0 1 0 4 0Z\"/><path d=\"M16 17h4\"/><path d=\"M4 13h4\"/>",
	bike: "<circle cx=\"18.5\" cy=\"17.5\" r=\"3.5\"/><circle cx=\"5.5\" cy=\"17.5\" r=\"3.5\"/><circle cx=\"15\" cy=\"5\" r=\"1\"/><path d=\"M12 17.5V14l-3-3 4-3 2 3h2\"/>",
	car: "<path d=\"M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2\"/><circle cx=\"7\" cy=\"17\" r=\"2\"/><path d=\"M9 17h6\"/><circle cx=\"17\" cy=\"17\" r=\"2\"/>",
	train: "<path d=\"M8 3.1V7a4 4 0 0 0 8 0V3.1\"/><path d=\"m9 15-1-1\"/><path d=\"m15 15 1-1\"/><path d=\"M9 19c-2.8 0-5-2.2-5-5v-4a8 8 0 0 1 16 0v4c0 2.8-2.2 5-5 5Z\"/><path d=\"m8 19-2 3\"/><path d=\"m16 19 2 3\"/>",
	line: "<circle cx=\"19\" cy=\"5\" r=\"2\"/><circle cx=\"5\" cy=\"19\" r=\"2\"/><path d=\"M5 17A12 12 0 0 1 17 5\"/>"
};
function D(e) {
	return Object.entries(E).map(([t, n]) => {
		let r = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">${n}</svg>`, i = `url("data:image/svg+xml,${encodeURIComponent(r)}") center / contain no-repeat`;
		return `${e} .msx-icon-${t}{display:inline-block;width:1.1em;height:1.1em;margin-right:.35em;vertical-align:-.2em;background:currentColor;-webkit-mask:${i};mask:${i};}`;
	}).join("\n");
}
function O(e, t) {
	let n = `.${t}`, r = T(e.background), i = (e, t) => e.map((e) => `${n}.maplibregl-popup-anchor-${e} .maplibregl-popup-tip`).join(",") + `{border-${t}-color:${r};}`;
	return [
		`${n} .maplibregl-popup-content{background:${r};color:${T(e.color)};font-family:${T(e.fontFamily)};font-size:${Number(e.fontSize)}px;line-height:${Number(e.lineHeight)};padding:${Number(e.padding)}px;border-radius:${Number(e.radius)}px;border:${Number(e.borderWidth)}px solid ${T(e.borderColor)};box-shadow:${p[e.shadow] ?? p.soft};` + (Number(e.blur) > 0 ? `-webkit-backdrop-filter:blur(${Number(e.blur)}px) saturate(1.7);backdrop-filter:blur(${Number(e.blur)}px) saturate(1.7);` : "") + "}",
		`${n} .maplibregl-popup-close-button{top:6px;right:6px;width:20px;height:20px;padding:0;border-radius:6px;color:inherit;opacity:.55;font-size:16px;line-height:18px;background:transparent;}`,
		`${n} .maplibregl-popup-close-button:hover{opacity:1;background:rgba(127,127,127,.18);}`,
		`${n} a{color:inherit;text-decoration:none;}`,
		`${n} a:hover{text-decoration:underline;}`,
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
		D(n)
	].join("\n");
}
var k = 0;
function A(e, t = {}) {
	let n = t.maplibregl ?? globalThis.maplibregl;
	if (!n?.Popup) throw Error("MapStylerTooltips: maplibregl wurde nicht gefunden.");
	let r = `msx-tooltip-${++k}`, i = document.createElement("style");
	i.dataset.mapstyler = r, document.head.appendChild(i);
	let a = null, s = null, c = !0, d = "", f = () => a ? Object.keys(a.layers).filter((t) => a.layers[t].enabled && a.layers[t].template && e.getLayer(t)) : [], p = (t) => {
		let n = f();
		return n.length ? e.queryRenderedFeatures(t.point, { layers: n })[0] ?? null : null;
	}, h = () => {
		d = "", s?.isOpen() && s.remove();
	}, g = (t, n) => {
		if (!a || !s) return;
		let r = w(a.layers[t.layer.id].template, t.properties ?? {});
		if (!r) return h();
		let i = t.geometry.type === "Point" ? t.geometry.coordinates : null, o = i ?? [n.lngLat.lng, n.lngLat.lat], c = `${t.layer.id}|${t.id ?? ""}|${r}|${i ? i.join(",") : o.join(",")}`;
		c === d && s.isOpen() || (d = c, s.setLngLat(o).setHTML(r), s.isOpen() || s.addTo(e));
	}, _ = (t) => {
		if (!c || !a) return;
		let n = p(t);
		e.getCanvas().style.cursor = n ? "pointer" : "", a.trigger === "hover" && (n ? g(n, t) : h());
	}, v = (e) => {
		if (!c || !a || a.trigger !== "click") return;
		let t = p(e);
		t ? g(t, e) : h();
	}, y = () => {
		c && (e.getCanvas().style.cursor = "", a?.trigger === "hover" && h());
	}, b = (e) => {
		a = m(e), i.textContent = O(a.style, r), s?.remove(), s = new n.Popup({
			className: `msx-tooltip ${r}${a.trigger === "click" ? " msx-click" : ""}`,
			closeButton: a.trigger === "click",
			closeOnClick: !1,
			maxWidth: `${a.style.maxWidth}px`,
			offset: 10,
			focusAfterOpen: !1
		}), d = "";
	}, x = () => e.getStyle()?.metadata && e.getStyle().metadata["mapstyler:tooltips"], S = () => b(x()), C = (t) => {
		if (!e.hasImage(t)) {
			if (t.startsWith("msx-pin-")) {
				let n = o(t);
				n && e.addImage(t, n, { pixelRatio: 2 });
			} else if (t.startsWith("msx-ascii-")) {
				let n = l(t);
				n && e.addImage(t, n, { pixelRatio: 2 });
			} else if (t.startsWith("msx-box-")) {
				let n = u(t);
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
	}, T = (e) => C(e.id);
	e.on("styleimagemissing", T);
	let E = (e, t) => {
		typeof e == "string" ? (e.startsWith("msx-ascii-") || e.startsWith("msx-box-")) && t.add(e) : Array.isArray(e) ? e.forEach((e) => E(e, t)) : e && typeof e == "object" && Object.values(e).forEach((e) => E(e, t));
	}, D = () => {
		let t = e.getStyle();
		if (!t?.layers) return;
		let n = /* @__PURE__ */ new Set();
		for (let e of t.layers) E(e.paint, n), E(e.layout, n);
		n.forEach(C);
	};
	return e.on("styledata", D), e.on("mousemove", _), e.on("click", v), e.on("mouseout", y), t.config === void 0 ? (e.isStyleLoaded() && S(), e.on("style.load", S)) : b(t.config), {
		className: r,
		update: b,
		setEnabled(e) {
			c = e, c || h();
		},
		destroy() {
			e.off("mousemove", _), e.off("click", v), e.off("mouseout", y), e.off("style.load", S), e.off("styleimagemissing", T), e.off("styledata", D), s?.remove(), i.remove();
		}
	};
}
//#endregion
export { f as DEFAULT_STYLE, d as KEY, n as PIN_TYPES, A as attach, o as drawPinImage, m as normalize, w as renderTemplate, C as sanitize, O as tooltipCss };
