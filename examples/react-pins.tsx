// Demo: <StyledMap> fed with Sanity-shaped documents, as a Next.js page would
// get them from a GROQ query like:
//   *[_type == "place"]{ _id, title, slug, location, category->{ title }, type, description }

import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { buildTemplate, TEMPLATES } from '../src/app/templates';
import { StyledMap, type Pin } from '../src/react';
import { removeRoute } from '../src/runtime/style/route';

const place = (id: string, title: string, lat: number, lng: number, category: string, type: string, description?: string) => ({
  _id: id,
  _type: 'place',
  title,
  slug: { _type: 'slug', current: id },
  location: { _type: 'geopoint', lat, lng },
  category: { _id: `cat-${category}`, title: category },
  type,
  description,
});

const PLACES = [
  place('roesterei', 'Rösterei Westend', 48.7745, 9.162, 'Café', 'cafe', 'Filterkaffee und Zimtschnecken'),
  place('feuersee', 'Café am Feuersee', 48.7686, 9.1676, 'Café', 'cafe', 'Terrasse direkt am Wasser'),
  place('platten', 'Plattenladen Süd', 48.7651, 9.1702, 'Shop', 'shop'),
  place('buecher', 'Buchhandlung am Markt', 48.7762, 9.1791, 'Shop', 'shop'),
  place('karlshoehe', 'Karlshöhe', 48.7661, 9.1627, 'Aussicht', 'view', 'Blick über den Talkessel'),
  place('birkenkopf', 'Birkenkopf', 48.7695, 9.1302, 'Aussicht', 'view'),
  place('kunstmuseum', 'Kunstmuseum', 48.7787, 9.1785, 'Museum', 'info'),
  place('staatsgalerie', 'Staatsgalerie', 48.7801, 9.1868, 'Museum', 'info'),
];

const CATEGORIES = ['Café', 'Shop', 'Aussicht', 'Museum'];

function App() {
  const [mapStyle, setMapStyle] = useState<object | null>(null);
  const [filter, setFilter] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);

  // In a real app this is the style.json exported from the editor.
  useEffect(() => {
    void buildTemplate(TEMPLATES.find((t) => t.id === 'liquid-glass')!).then((style) => setMapStyle(removeRoute(style)));
  }, []);

  const visible = PLACES.filter((p) => !filter || p.category.title === filter);

  return (
    <div className="page">
      <aside>
        <h1>React + Sanity</h1>
        <div className="filters">
          <button className={filter === null ? 'on' : ''} onClick={() => setFilter(null)}>
            Alle
          </button>
          {CATEGORIES.map((c) => (
            <button key={c} className={filter === c ? 'on' : ''} onClick={() => setFilter(c)}>
              {c}
            </button>
          ))}
        </div>
        <ul>
          {visible.map((p) => (
            <li key={p._id} className={selected === p._id ? 'on' : ''} onClick={() => setSelected(p._id)}>
              <strong>{p.title}</strong>
              <span>{p.category.title}</span>
            </li>
          ))}
        </ul>
      </aside>
      <main>
        {mapStyle ? (
          <StyledMap
            mapStyle={mapStyle}
            pins={PLACES}
            filter={filter}
            selectedId={selected}
            onSelect={(pin: Pin) => setSelected(pin.id)}
            colors={{ Café: '#a16207', Shop: '#4f46e5', Aussicht: '#0f9d76', Museum: '#e0604f' }}
            template={'<strong>{name}</strong>\n<span style="opacity:.7">{category}</span>\n{description}'}
            label="Lieblingsorte in Stuttgart"
            onLoad={(map) => map.addControl(new maplibregl.NavigationControl(), 'top-right')}
          />
        ) : null}
      </main>
    </div>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
