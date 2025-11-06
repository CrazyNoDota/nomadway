import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, Polyline } from 'react-native-maps';

const { width, height } = Dimensions.get('window');

export default function MapScreen({ route, navigation }) {
  const { attractions, route: routeData, title } = route.params || {};
  const [region, setRegion] = useState(null);

  useEffect(() => {
    if (attractions && attractions.length > 0) {
      const latitudes = attractions.map((a) => a.latitude);
      const longitudes = attractions.map((a) => a.longitude);
      const minLat = Math.min(...latitudes);
      const maxLat = Math.max(...latitudes);
      const minLng = Math.min(...longitudes);
      const maxLng = Math.max(...longitudes);

      setRegion({
        latitude: (minLat + maxLat) / 2,
        longitude: (minLng + maxLng) / 2,
        latitudeDelta: (maxLat - minLat) * 1.5 + 0.2,
        longitudeDelta: (maxLng - minLng) * 1.5 + 0.2,
      });
    }
  }, [attractions]);

  if (!attractions || attractions.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Нет данных для отображения</Text>
      </View>
    );
  }

  const coordinates = attractions.map((attraction) => ({
    latitude: attraction.latitude,
    longitude: attraction.longitude,
  }));

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={region}
        region={region}
        showsUserLocation={false}
        showsMyLocationButton={false}
      >
        {attractions.map((attraction, index) => (
          <Marker
            key={attraction.id}
            coordinate={{
              latitude: attraction.latitude,
              longitude: attraction.longitude,
            }}
            title={attraction.name}
            description={attraction.description}
            pinColor={routeData?.color || '#1a4d3a'}
          >
            {routeData && (
              <View style={[styles.markerContainer, { backgroundColor: routeData.color }]}>
                <Text style={styles.markerNumber}>{index + 1}</Text>
              </View>
            )}
          </Marker>
        ))}
        {routeData && coordinates.length > 1 && (
          <Polyline
            coordinates={coordinates}
            strokeColor={routeData.color}
            strokeWidth={4}
          />
        )}
      </MapView>

      <View style={styles.infoPanel}>
        <Text style={styles.infoTitle}>{title || 'Карта'}</Text>
        <Text style={styles.infoSubtitle}>
          {attractions.length} {attractions.length === 1 ? 'место' : 'мест'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  markerContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  markerNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  infoPanel: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a4d3a',
    marginBottom: 4,
  },
  infoSubtitle: {
    fontSize: 14,
    color: '#8e8e93',
  },
  errorText: {
    fontSize: 16,
    color: '#8e8e93',
    textAlign: 'center',
    marginTop: 40,
  },
});

