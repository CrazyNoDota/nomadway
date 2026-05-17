import React, { useMemo } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { WebView } from 'react-native-webview';

const TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

const sanitizeForScript = (value) =>
  JSON.stringify(value).replace(/</g, '\\u003c').replace(/>/g, '\\u003e');

const toFiniteNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};

const normalizePoint = (point, index) => {
  const latitude = toFiniteNumber(point?.latitude);
  const longitude = toFiniteNumber(point?.longitude);

  if (latitude == null || longitude == null) {
    return null;
  }

  return {
    id: point?.id ?? `${latitude},${longitude},${index}`,
    latitude,
    longitude,
    title: point?.title || point?.name || '',
    description: point?.description || '',
    color: point?.color || '#1a4d3a',
    label: point?.label || '',
  };
};

const normalizeCenter = (center, markers) => {
  const latitude = toFiniteNumber(center?.latitude);
  const longitude = toFiniteNumber(center?.longitude);

  if (latitude != null && longitude != null) {
    return { latitude, longitude };
  }

  if (markers.length > 0) {
    return {
      latitude: markers.reduce((sum, marker) => sum + marker.latitude, 0) / markers.length,
      longitude: markers.reduce((sum, marker) => sum + marker.longitude, 0) / markers.length,
    };
  }

  return { latitude: 48.0196, longitude: 66.9237 };
};

const buildHtml = ({ markers, polyline, center, zoom, interactive }) => {
  const payload = {
    markers,
    polyline,
    center,
    zoom,
    interactive,
    tileUrl: TILE_URL,
  };

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <style>
    html, body, #map { height: 100%; width: 100%; margin: 0; padding: 0; background: #0d231b; }
    .nomad-marker {
      width: 30px;
      height: 30px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      font: 700 13px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      border: 2px solid #fff;
      box-shadow: 0 2px 8px rgba(0,0,0,.28);
    }
    .leaflet-popup-content-wrapper { border-radius: 8px; }
    .leaflet-popup-content { font: 13px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; margin: 10px 12px; }
    .popup-title { font-weight: 700; color: #1a4d3a; margin-bottom: 4px; }
    .popup-description { color: #445; line-height: 1.35; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    const data = ${sanitizeForScript(payload)};

    function escapeHtml(value) {
      return String(value || '').replace(/[&<>"']/g, function (char) {
        return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char];
      });
    }

    const map = L.map('map', {
      zoomControl: data.interactive,
      dragging: data.interactive,
      touchZoom: data.interactive,
      doubleClickZoom: data.interactive,
      scrollWheelZoom: data.interactive,
      boxZoom: data.interactive,
      keyboard: data.interactive,
      tap: data.interactive,
      attributionControl: true
    }).setView([data.center.latitude, data.center.longitude], data.zoom);

    L.tileLayer(data.tileUrl, {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    const bounds = [];

    data.markers.forEach((marker, index) => {
      const color = marker.color || '#1a4d3a';
      const label = marker.label || '';
      const icon = L.divIcon({
        className: '',
        html: '<div class="nomad-marker" style="background:' + escapeHtml(color) + '">' + escapeHtml(label || '') + '</div>',
        iconSize: [30, 30],
        iconAnchor: [15, 15],
        popupAnchor: [0, -16]
      });
      const point = [marker.latitude, marker.longitude];
      bounds.push(point);
      const popup = '<div class="popup-title">' + escapeHtml(marker.title) + '</div>' +
        (marker.description ? '<div class="popup-description">' + escapeHtml(marker.description) + '</div>' : '');
      L.marker(point, { icon }).addTo(map).bindPopup(popup);
    });

    if (data.polyline.length > 1) {
      const line = data.polyline.map((point) => [point.latitude, point.longitude]);
      bounds.push(...line);
      L.polyline(line, { color: '#d4af37', weight: 4, opacity: 0.92 }).addTo(map);
    }

    if (bounds.length > 1) {
      map.fitBounds(bounds, { padding: [34, 34], maxZoom: 12 });
    } else if (bounds.length === 1) {
      map.setView(bounds[0], data.zoom);
    }
  </script>
</body>
</html>`;
};

export default function OSMMapView({
  style,
  markers = [],
  polyline = [],
  center,
  zoom = 6,
  interactive = true,
  errorLabel = 'Map could not be loaded.',
}) {
  const normalizedMarkers = useMemo(
    () => markers.map(normalizePoint).filter(Boolean),
    [markers]
  );

  const normalizedPolyline = useMemo(
    () => polyline.map(normalizePoint).filter(Boolean),
    [polyline]
  );

  const normalizedCenter = useMemo(
    () => normalizeCenter(center, normalizedMarkers),
    [center, normalizedMarkers]
  );

  const html = useMemo(
    () =>
      buildHtml({
        markers: normalizedMarkers,
        polyline: normalizedPolyline,
        center: normalizedCenter,
        zoom,
        interactive,
      }),
    [normalizedMarkers, normalizedPolyline, normalizedCenter, zoom, interactive]
  );

  return (
    <View style={[styles.container, style]}>
      <WebView
        originWhitelist={['*']}
        source={{ html, baseUrl: 'https://nomadway.local' }}
        javaScriptEnabled
        domStorageEnabled
        scrollEnabled={interactive}
        nestedScrollEnabled={interactive}
        setBuiltInZoomControls={false}
        setDisplayZoomControls={false}
        mixedContentMode="always"
        renderError={() => (
          <View style={styles.error}>
            <Text style={styles.errorText}>{errorLabel}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    backgroundColor: '#0d231b',
  },
  error: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0d231b',
    padding: 16,
  },
  errorText: {
    color: '#d4af37',
    fontSize: 13,
    textAlign: 'center',
  },
});
