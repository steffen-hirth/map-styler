// Camera input for the "Map" document: shows the real map (style + pins of
// the document, exactly as the website will render it) and stores the view
// the editor sets up with "Use current view".

import { Icon } from '@sanity/icons';
import { Box, Button, Card, Flex, Stack, Text } from '@sanity/ui';
import type { Map as MapLibreMap } from 'maplibre-gl';
import { useRef, type ComponentType } from 'react';
import { set, unset, useFormValue, type ObjectInputProps } from 'sanity';
import { StyledMap } from '../react/styled-map';
import type { PinInput } from '../react/normalize';

export type MapView = { lat?: number; lng?: number; zoom?: number; pitch?: number; bearing?: number };

const r = (n: number, digits: number) => Math.round(n * 10 ** digits) / 10 ** digits;

/** Current camera of a map, rounded so the document stays readable. */
export function viewOf(map: Pick<MapLibreMap, 'getCenter' | 'getZoom' | 'getPitch' | 'getBearing'>): Required<MapView> {
  const c = map.getCenter();
  return { lat: r(c.lat, 6), lng: r(c.lng, 6), zoom: r(map.getZoom(), 2), pitch: r(map.getPitch(), 1), bearing: r(map.getBearing(), 1) };
}

export function createViewInput(fallbackStyle: string): ComponentType<ObjectInputProps> {
  function ViewInput(props: ObjectInputProps) {
    const { onChange, readOnly } = props;
    const value = props.value as MapView | undefined;
    const mapStyle = (useFormValue(['mapStyle']) as string | undefined) || fallbackStyle;
    const pins = (useFormValue(['pins']) as PinInput[] | undefined) ?? [];
    const template = useFormValue(['tooltipTemplate']) as string | undefined;
    const mapRef = useRef<MapLibreMap | null>(null);
    const hasView = typeof value?.lat === 'number' && typeof value?.lng === 'number';

    return (
      <Stack gap={2}>
        <Card radius={2} border overflow="hidden">
          <div style={{ height: 380 }}>
            <StyledMap
              mapStyle={mapStyle}
              pins={pins}
              template={template || undefined}
              center={hasView ? [value!.lng!, value!.lat!] : undefined}
              zoom={value?.zoom}
              pitch={value?.pitch}
              bearing={value?.bearing}
              fit={!hasView}
              label="Map preview"
              onLoad={(map) => (mapRef.current = map)}
            />
          </div>
        </Card>
        <Flex align="center" gap={2}>
          <Box flex={1}>
            <Text size={1} muted>
              {hasView
                ? `Center ${value!.lat}, ${value!.lng} · zoom ${value!.zoom ?? '–'} · tilt ${value!.pitch ?? 0}° · rotation ${value!.bearing ?? 0}°`
                : 'No fixed view: the map zooms to its pins.'}
            </Text>
          </Box>
          {!readOnly ? (
            <>
              {hasView ? <Button mode="bleed" icon={<Icon symbol="reset" />} text="Fit to pins" onClick={() => onChange(unset())} /> : null}
              <Button
                mode="ghost"
                icon={<Icon symbol="target" />}
                text="Use current view"
                onClick={() => {
                  if (mapRef.current) onChange(set(viewOf(mapRef.current)));
                }}
              />
            </>
          ) : null}
        </Flex>
      </Stack>
    );
  }
  return ViewInput;
}
