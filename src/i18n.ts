// Minimal i18n: German strings are the keys, English comes from the table
// below. English is the default; the choice is remembered per browser.

import { useSyncExternalStore } from 'react';

export type Lang = 'en' | 'de';

const STORAGE_KEY = 'mapstyler:lang';
const listeners = new Set<() => void>();

function readLang(): Lang {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'de' || stored === 'en') return stored;
  } catch {
    // Storage unavailable: fall back to English.
  }
  return 'en';
}

let lang: Lang = typeof window === 'undefined' ? 'en' : readLang();
if (typeof document !== 'undefined') document.documentElement.lang = lang;

export const getLang = () => lang;

export function setLang(next: Lang) {
  if (next === lang) return;
  lang = next;
  try {
    localStorage.setItem(STORAGE_KEY, next);
  } catch {
    // Preference is a convenience only.
  }
  document.documentElement.lang = next;
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useLang(): Lang {
  return useSyncExternalStore(subscribe, getLang, () => 'en');
}

/** Translate a German UI string. `{name}` placeholders are filled from `vars`. */
export function t(de: string, vars?: Record<string, string | number>): string {
  let text = lang === 'en' ? (EN[de] ?? de) : de;
  if (vars) text = text.replace(/\{(\w+)\}/g, (match, key: string) => (key in vars ? String(vars[key]) : match));
  return text;
}

/** Pick between two inline variants, for data such as template names. */
export const tr = (de: string, en: string) => (lang === 'en' ? en : de);

export const EN: Record<string, string> = {
  // App shell
  'Lade Karte …': 'Loading map …',
  'Der Basis-Style ließ sich nicht laden.': 'The base style could not be loaded.',
  'Nochmal versuchen': 'Try again',
  Vorlagen: 'Templates',
  Ebenen: 'Layers',
  Farben: 'Colors',
  Routen: 'Routes',
  Tooltips: 'Tooltips',
  Global: 'Global',
  Kartenvorschau: 'Map preview',
  'Unbekannter Kartenfehler': 'Unknown map error',

  // Dialogs
  Abbrechen: 'Cancel',
  OK: 'OK',
  'Eigene Style-URL': 'Custom style URL',
  'URL einer MapLibre-Style-JSON, z. B. von OpenFreeMap oder einem eigenen Server.': 'URL of a MapLibre style JSON, e.g. from OpenFreeMap or your own server.',
  Laden: 'Load',
  'Aktuellen Style ersetzen?': 'Replace current style?',
  'Mit Rückgängig kommst du jederzeit zurück.': 'You can always go back with undo.',
  Ersetzen: 'Replace',
  'Vorlage „{name}“ laden?': 'Load template “{name}”?',
  'Deine Änderungen bleiben über Rückgängig erreichbar.': 'Your changes stay available via undo.',
  'Vorlage laden': 'Load template',
  'Anderer Startpunkt': 'Other starting points',
  'Original-Styles von OpenFreeMap, eine eigene Style-URL oder eine gespeicherte style.json.': 'Original OpenFreeMap styles, a custom style URL or a saved style.json.',
  'Eigene URL': 'Custom URL',
  'JSON importieren': 'Import JSON',

  // Toolbar
  'Lade Style …': 'Loading style …',
  '„{name}“ geladen': '“{name}” loaded',
  'Style konnte nicht geladen werden: {message}': 'Could not load style: {message}',
  'Keine MapLibre-Style-Datei (version 8, sources, layers).': 'Not a MapLibre style file (version 8, sources, layers).',
  '„{name}“ importiert': '“{name}” imported',
  'Import fehlgeschlagen: {message}': 'Import failed: {message}',
  'Rückgängig (⌘Z)': 'Undo (⌘Z)',
  'Wiederholen (⇧⌘Z)': 'Redo (⇧⌘Z)',
  Inspektor: 'Inspector',
  Exportieren: 'Export',

  // Export
  'Kopieren nicht möglich – bitte manuell markieren.': 'Copy failed – please select the text manually.',
  Kopiert: 'Copied',
  Kopieren: 'Copy',
  Schließen: 'Close',
  '1 · Style-Datei': '1 · Style file',
  'Eine Datei mit allen Ebenen und der Tooltip-Konfiguration (unter metadata). Lässt sich jederzeit wieder importieren.':
    'One file with all layers and the tooltip setup (under metadata). You can import it again at any time.',
  Dateiname: 'File name',
  '{n} Ebenen': '{n} layers',
  '1 Ebene': '1 layer',
  'JSON kopieren': 'Copy JSON',
  Herunterladen: 'Download',
  '2 · Über GitHub & jsDelivr ausliefern': '2 · Serve via GitHub & jsDelivr',
  'Leg die Style-Datei in dein Repo (z. B. unter styles/), committe sie und setz am besten einen Tag. jsDelivr liefert sie dann kostenlos über ein CDN aus.':
    'Put the style file in your repo (e.g. under styles/), commit it and ideally add a tag. jsDelivr then serves it for free from a CDN.',
  'GitHub-Nutzer': 'GitHub user',
  'dein-name': 'your-name',
  'Pfad Style': 'Style path',
  'Pfad Tooltips': 'Tooltips path',
  'Ohne Nutzer und Repo zeigt der Code relative Pfade, z. B. für GitHub Pages.':
    'Without user and repo the code uses relative paths, e.g. for GitHub Pages.',
  Einbettungscode: 'Embed code',
  'Tipp: jsDelivr cacht Branches bis zu 12 Stunden. Mit Tags (@v1.0.0) sind Änderungen sofort eindeutig.':
    'Tip: jsDelivr caches branches for up to 12 hours. With tags (@v1.0.0) every change gets its own URL.',
  '3 · Testseite': '3 · Test page',
  'Eine einzelne HTML-Datei mit Style und Tooltips, zum lokalen Testen oder Weitergeben.':
    'A single HTML file with style and tooltips, for local testing or sharing.',
  'HTML-Datei herunterladen': 'Download HTML file',

  // Property controls
  '{label} wählen': 'Pick {label}',
  'Farbe wählen': 'Pick color',
  'Nach Zoomstufe variieren': 'Vary by zoom level',
  'Fester Wert statt Zoomstufen': 'Fixed value instead of zoom stops',
  'Auf Standard zurücksetzen': 'Reset to default',
  Zoom: 'Zoom',
  Ausdruck: 'Expression',
  'z. B. 2, 1': 'e.g. 2, 1',
  Wert: 'Value',
  Zoomstufe: 'Zoom level',
  'Stufe entfernen': 'Remove stop',
  'Stufe bei aktuellem Zoom': 'Stop at current zoom',
  'Kurve: individuell': 'Curve: custom',
  Verlauf: 'Curve',
  Linear: 'Linear',
  Farbe: 'Color',
  'JSON-Ausdruck': 'JSON expression',
  'Ungültiges JSON: {message}': 'Invalid JSON: {message}',
  sonst: 'otherwise',
  Fall: 'case',
  Start: 'Start',
  Fallback: 'Fallback',

  // Templates
  'Vorlage „{name}“ geladen': 'Template “{name}” loaded',
  'Vorlage konnte nicht geladen werden: {message}': 'Could not load template: {message}',
  'Fertige Kartendesigns mit passenden Tooltips und Beispielroute. Danach lässt sich alles unter Ebenen, Farben, Routen und Tooltips anpassen.':
    'Ready-made map designs with matching tooltips and a sample route. Afterwards you can tweak everything under Layers, Colors, Routes and Tooltips.',
  Minimal: 'Minimal',
  'Helles Grau, weiße Straßen – nichts lenkt von deiner Route ab.': 'Light grey, white roads – nothing distracts from your route.',
  Dämmerung: 'Dusk',
  'Dunkel und ruhig, mit warmem Pfirsich-Akzent.': 'Dark and calm, with a warm peach accent.',
  Papier: 'Paper',
  'Warmes Papier, gedämpfte Töne, ruhige Tooltips.': 'Warm paper, muted tones, calm tooltips.',
  Outdoor: 'Outdoor',
  'Kräftiges Grün, klares Wasser, gestrichelte Tour.': 'Rich greens, clear water, dashed trail.',
  Standard: 'Standard',
  'OpenFreeMap Liberty, unverändert. Guter Ausgangspunkt.': 'OpenFreeMap Liberty, unchanged. A good starting point.',
  Klar: 'Bright',
  'OpenFreeMap Bright: hell, kontrastreich, viele Details.': 'OpenFreeMap Bright: light, high contrast, lots of detail.',
  'Dataviz Hell': 'Dataviz Light',
  'Neutrales Grau ohne POIs – Bühne für eigene Daten.': 'Neutral grey without POIs – a stage for your own data.',
  'Dataviz Dunkel': 'Dataviz Dark',
  'Tiefes Anthrazit, leise Beschriftung, leuchtende Daten.': 'Deep charcoal, quiet labels, glowing data.',
  Blaupause: 'Blueprint',
  'Technischer Plan in Blau mit gepunkteter Route.': 'Technical blue plan with a dotted route.',
  '{distance_km} km · {ascent_m} Hm': '{distance_km} km · {ascent_m} m up',

  // Palette
  Gruppe: 'Group',
  'Alle Ebenen': 'All layers',
  '{n} Farben. Eine Änderung ersetzt die Farbe überall in „{group}“.': '{n} colors. A change replaces the color everywhere in “{group}”.',
  '{n} Farben. Eine Änderung ersetzt die Farbe überall, wo sie vorkommt.': '{n} colors. A change replaces the color everywhere it is used.',
  Palettenfarbe: 'Palette color',

  // Tooltips panel
  Vorschau: 'Preview',
  Verhalten: 'Behavior',
  'Anzeigen bei': 'Show on',
  Klick: 'Click',
  Aussehen: 'Appearance',
  Hintergrund: 'Background',
  Text: 'Text',
  Textfarbe: 'Text color',
  Schrift: 'Font',
  Schriftgröße: 'Font size',
  Zeilenhöhe: 'Line height',
  Innenabstand: 'Padding',
  Eckenradius: 'Corner radius',
  Rahmen: 'Border',
  Rahmenfarbe: 'Border color',
  Rahmenbreite: 'Border width',
  Schatten: 'Shadow',
  'Max. Breite': 'Max. width',
  'Pfeil anzeigen': 'Show arrow',
  'Ebenen mit Tooltip ({n})': 'Layers with tooltip ({n})',
  'Die Vorlage bearbeitest du rechts in den Eigenschaften der Ebene.': 'Edit the template on the right, in the layer properties.',
  '{id} (Ebene fehlt im Style)': '{id} (layer missing in style)',
  'Tooltip für {id}': 'Tooltip for {id}',
  'Noch keine Ebene hat einen Tooltip.': 'No layer has a tooltip yet.',
  'Ebene für Tooltip': 'Layer for tooltip',
  'Ebene wählen …': 'Choose layer …',
  Hinzufügen: 'Add',
  System: 'System',
  Inter: 'Inter',
  Serif: 'Serif',
  Mono: 'Mono',
  Keiner: 'None',
  Weich: 'Soft',
  Stark: 'Strong',

  // Inspector
  'Inspektor schließen': 'Close inspector',
  'Klick auf die Karte, um zu sehen, welche Ebenen dort zeichnen.': 'Click the map to see which layers draw there.',
  'An dieser Stelle zeichnet keine Ebene.': 'No layer draws at this spot.',
  'Tooltip für diese Ebene anlegen': 'Add tooltip for this layer',

  // Properties panel
  Eigenschaften: 'Properties',
  'Keine Ebene ausgewählt': 'No layer selected',
  'Wähle links eine Ebene oder klick mit dem Inspektor direkt auf die Karte.': 'Pick a layer on the left or click the map with the inspector.',
  Darstellung: 'Paint',
  Layout: 'Layout',
  Zoombereich: 'Zoom range',
  Filter: 'Filter',
  'MapLibre-Filterausdruck, z. B. ["==", ["get", "class"], "park"].': 'MapLibre filter expression, e.g. ["==", ["get", "class"], "park"].',
  'JSON der Ebene': 'Layer JSON',
  'Ebenen-ID': 'Layer ID',
  'Die ID „{id}“ gibt es schon.': 'The ID “{id}” already exists.',
  'Die ID darf nicht leer sein.': 'The ID must not be empty.',
  'Auswahl aufheben': 'Clear selection',
  Ausblenden: 'Hide',
  Einblenden: 'Show',
  'Eine Ebene höher': 'Move up',
  'Eine Ebene tiefer': 'Move down',
  Duplizieren: 'Duplicate',
  Löschen: 'Delete',
  '„{id}“ gelöscht': '“{id}” deleted',
  Rückgängig: 'Undo',
  'Alles auf Standardwerten.': 'Everything on default values.',
  'Weniger anzeigen': 'Show less',
  'Weitere Eigenschaften ({n})': 'More properties ({n})',
  Tooltip: 'Tooltip',
  'Tooltip für diese Ebene': 'Tooltip for this layer',
  Vorlage: 'Template',
  'Tooltip-Vorlage': 'Tooltip template',
  '{feld} fügt einen Wert ein, {name:de|name} nimmt den ersten vorhandenen. Leere Zeilen fallen weg.':
    '{field} inserts a value, {name:en|name} takes the first one present. Empty lines are dropped.',
  'Felder in dieser Ansicht': 'Fields in this view',
  'Beispiel: {value}': 'Example: {value}',
  'Zoom näher heran, damit Daten dieser Ebene geladen werden.': 'Zoom in closer so data for this layer loads.',
  'Tooltip entfernen': 'Remove tooltip',
  'Sichtbar ab Zoom': 'Visible from zoom',
  'Sichtbar bis Zoom': 'Visible up to zoom',
  Zurücksetzen: 'Reset',
  'Kein Filter': 'No filter',
  'Eine Ebene braucht mindestens "id" und "type".': 'A layer needs at least "id" and "type".',

  // Global panel
  'Anpassung übernommen': 'Adjustment applied',
  'Farben & Schrift anpassen': 'Adjust colors & type',
  'Wirkt auf alle Ebenen. Die Karte zeigt die Vorschau live, fest wird es erst mit „Übernehmen“.':
    'Affects all layers. The map previews live; it only sticks once you hit “Apply”.',
  Farbton: 'Hue',
  Sättigung: 'Saturation',
  Helligkeit: 'Lightness',
  'Helligkeit umkehren (schneller Dark Mode)': 'Invert lightness (quick dark mode)',
  Verwerfen: 'Discard',
  Übernehmen: 'Apply',
  Beschriftungen: 'Labels',
  'Sprache der Ortsnamen': 'Place name language',
  Sprache: 'Language',
  Deutsch: 'German',
  Englisch: 'English',
  Lokal: 'Local',
  'Keine passenden Beschriftungen gefunden.': 'No matching labels found.',
  '{n} Beschriftungsebenen umgestellt': '{n} label layers switched',
  Anwenden: 'Apply',
  'Textumrandung (Halo) für alle Beschriftungen': 'Text halo for all labels',
  'Halo-Farbe': 'Halo color',
  'Halo-Breite': 'Halo width',
  'Halo anwenden': 'Apply halo',
  Schriftschnitt: 'Font style',
  'Kursive Schrift entfernen': 'Remove italic type',
  'Keine kursiven Beschriftungen gefunden.': 'No italic labels found.',
  '{n} Ebenen auf normale Schrift umgestellt': '{n} layers switched to regular type',
  Style: 'Style',
  Name: 'Name',
  'Style-Name': 'Style name',
  Quellen: 'Sources',
  'Schriften (Glyphs)': 'Fonts (glyphs)',

  // Routes
  'Route konnte nicht gelesen werden: {message}': 'Could not read route: {message}',
  'Noch keine Route': 'No route yet',
  'Füg eine Beispielroute hinzu oder lade eine eigene GPX- oder GeoJSON-Datei.': 'Add the sample route or load your own GPX or GeoJSON file.',
  Beispielroute: 'Sample route',
  Importieren: 'Import',
  Daten: 'Data',
  'Die Route steckt mit in der style.json. Ihre Ebenen findest du auch unter Ebenen → Routen & Overlays.':
    'The route is stored in the style.json. Its layers are also under Layers → Routes & overlays.',
  Route: 'Route',
  '{n} Punkte': '{n} points',
  'Zur Route': 'Zoom to route',
  Entfernen: 'Remove',
  Linie: 'Line',
  Linienfarbe: 'Line color',
  Breite: 'Width',
  Linienbreite: 'Line width',
  Deckkraft: 'Opacity',
  Stil: 'Style',
  Strich: 'Dashed',
  Gepunktet: 'Dotted',
  Richtungspfeile: 'Direction arrows',
  Umrandung: 'Casing',
  Umrandungsfarbe: 'Casing color',
  Umrandungsbreite: 'Casing width',
  'Punkte & Beschriftung': 'Points & labels',
  Füllung: 'Fill',
  Punktfarbe: 'Point color',
  Rand: 'Stroke',
  Punktrand: 'Point stroke',
  Größe: 'Size',
  Punktgröße: 'Point size',
  'Namen anzeigen': 'Show names',
  Textumrandung: 'Text halo',
  'Keine GeoJSON-Daten gefunden.': 'No GeoJSON data found.',
  'Die GPX-Datei ist nicht lesbar.': 'The GPX file could not be read.',
  'Die GPX-Datei enthält keinen Track.': 'The GPX file contains no track.',
  Wegpunkt: 'Waypoint',
  Ziel: 'Finish',

  // Layers panel
  'Ebene suchen': 'Search layers',
  'Als Liste zeigen': 'Show as list',
  'Nach Gruppen ordnen': 'Group layers',
  'Keine Ebene gefunden.': 'No layer found.',
  'Gruppe einblenden': 'Show group',
  'Gruppe ausblenden': 'Hide group',
  '{n} Ebenen · oben in der Liste = oben auf der Karte': '{n} layers · top of the list = top of the map',
  'Tooltip aktiv': 'Tooltip active',

  // Layer groups
  'Routen & Overlays': 'Routes & overlays',
  Wasser: 'Water',
  'Landnutzung & Natur': 'Land use & nature',
  'Straßen & Wege': 'Roads & paths',
  'Bahn, Flug & Fähre': 'Rail, air & ferry',
  Gebäude: 'Buildings',
  Grenzen: 'Boundaries',
  POIs: 'POIs',
  Sonstiges: 'Other',

  // Property names
  Lückenbreite: 'Gap width',
  Versatz: 'Offset',
  Unschärfe: 'Blur',
  Strichmuster: 'Dash pattern',
  Muster: 'Pattern',
  Konturfarbe: 'Outline color',
  Kantenglättung: 'Antialiasing',
  Verschiebung: 'Translate',
  Linienende: 'Line cap',
  Linienecken: 'Line join',
  Gehrungsgrenze: 'Miter limit',
  Rundungsgrenze: 'Round limit',
  Radius: 'Radius',
  Randfarbe: 'Stroke color',
  Randbreite: 'Stroke width',
  'Rand-Deckkraft': 'Stroke opacity',
  Neigungsausrichtung: 'Pitch alignment',
  Höhe: 'Height',
  Sockel: 'Base',
  'Vertikaler Verlauf': 'Vertical gradient',
  'Halo-Unschärfe': 'Halo blur',
  Inhalt: 'Field',
  Schreibweise: 'Transform',
  Laufweite: 'Letter spacing',
  Anker: 'Anchor',
  Ausrichtung: 'Justify',
  Abstand: 'Spacing',
  Drehausrichtung: 'Rotation alignment',
  'Überlappen erlauben': 'Allow overlap',
  'Platzierung ignorieren': 'Ignore placement',
  Optional: 'Optional',
  Bild: 'Image',
  Platzierung: 'Placement',
  'Kachelränder meiden': 'Avoid tile edges',
  Sortierschlüssel: 'Sort key',
  'Farbton drehen': 'Hue rotate',
  Kontrast: 'Contrast',
  'Helligkeit min.': 'Brightness min.',
  'Helligkeit max.': 'Brightness max.',
  Schattenfarbe: 'Shadow color',
  Lichtfarbe: 'Highlight color',
  Akzentfarbe: 'Accent color',
  Überhöhung: 'Exaggeration',
  Lichtrichtung: 'Light direction',
  Gewichtung: 'Weight',
  Intensität: 'Intensity',
};
