// Harness: the Sanity location input outside a Studio, in the Studio theme,
// with a tiny stand-in for the form's patch handling.

import { ThemeProvider, Card, Container, Stack, Heading, Text } from '@sanity/ui';
import { buildTheme } from '@sanity/ui/theme';
import { StrictMode, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { createLocationInput, nominatim, DEFAULT_INPUT_STYLE } from '../src/sanity';

type Patch = { type: 'set' | 'unset'; path: unknown[]; value?: unknown };

const LocationInput = createLocationInput({
  mapStyle: DEFAULT_INPUT_STYLE,
  geocoder: nominatim({ language: 'de' }),
  defaultCenter: [10.45, 51.16],
  defaultZoom: 4.5,
  markerColor: '#4f46e5',
});

function App() {
  const [value, setValue] = useState<unknown>({ _type: 'geopoint', lat: 48.7661, lng: 9.1627 });
  const onChange = useMemo(
    () => (patch: Patch | Patch[] | { patches: Patch[] }) => {
      const patches = Array.isArray(patch) ? patch : 'patches' in patch ? patch.patches : [patch];
      for (const p of patches) setValue(p.type === 'unset' ? undefined : p.value);
    },
    [],
  );
  const props = { value, onChange, readOnly: false } as never;
  return (
    <Card padding={4} style={{ minHeight: '100vh' }}>
      <Container width={1}>
        <Stack gap={4}>
          <Heading size={2}>Location</Heading>
          <LocationInput {...props} />
          <Text size={1} muted style={{ fontFamily: 'ui-monospace, monospace' }}>
            {JSON.stringify(value)}
          </Text>
        </Stack>
      </Container>
    </Card>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider theme={buildTheme()}>
      <App />
    </ThemeProvider>
  </StrictMode>,
);
