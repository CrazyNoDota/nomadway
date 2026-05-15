// Stub for react-native-maps on web — the real library is native-only.
// Web bundler resolves to this file via metro.config.js.
import React from 'react';
import { View, Text } from 'react-native';

const MapView = React.forwardRef(({ style, children }, ref) => (
  <View
    ref={ref}
    style={[
      { backgroundColor: '#0F1B16', alignItems: 'center', justifyContent: 'center' },
      style,
    ]}
  >
    <Text style={{ color: '#7A847F', fontSize: 11 }}>Map preview unavailable on web</Text>
    {children}
  </View>
));

export const Marker = () => null;
export const Callout = () => null;
export const Polyline = () => null;
export const Polygon = () => null;
export const Circle = () => null;
export const PROVIDER_GOOGLE = 'google';
export const PROVIDER_DEFAULT = 'default';

export default MapView;
