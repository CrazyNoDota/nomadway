import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import attractionsData from '../data/attractions.json';
import { useLocalization } from '../contexts/LocalizationContext';
import { getTranslatedAttractions } from '../utils/attractionTranslations';
import OSMMapView from '../components/OSMMapView';

// Default Kazakhstan coordinates
const KAZAKHSTAN_CENTER = {
  latitude: 48.0196,
  longitude: 66.9237,
  latitudeDelta: 15, // Zoom level ~5
  longitudeDelta: 15,
};

export default function MapScreen({ route, navigation }) {
  const { attractions: routeAttractions, route: routeData, title, zoomToPlace } = route.params || {};
  const { language } = useLocalization();
  const [attractions, setAttractions] = useState([]);
  const [region, setRegion] = useState(KAZAKHSTAN_CENTER);
  const [userLocation, setUserLocation] = useState(null);
  const [showUserLocation, setShowUserLocation] = useState(false);

  // Load attractions with translations
  useEffect(() => {
    if (routeAttractions && routeAttractions.length > 0) {
      const translated = getTranslatedAttractions(routeAttractions, language);
      setAttractions(translated);
    } else {
      // Load all attractions by default
      const translated = getTranslatedAttractions(attractionsData.attractions, language);
      setAttractions(translated);
    }
  }, [routeAttractions, language]);

  // Set region based on attractions or zoom to specific place
  useEffect(() => {
    if (zoomToPlace && zoomToPlace.latitude && zoomToPlace.longitude) {
      // Zoom to specific place
      const zoomRegion = {
        latitude: zoomToPlace.latitude,
        longitude: zoomToPlace.longitude,
        latitudeDelta: 0.5,
        longitudeDelta: 0.5,
      };
      setRegion(zoomRegion);
    } else if (attractions && attractions.length > 0) {
      if (attractions.length === 1) {
        // Single attraction - zoom in closer
        setRegion({
          latitude: attractions[0].latitude,
          longitude: attractions[0].longitude,
          latitudeDelta: 0.5,
          longitudeDelta: 0.5,
        });
      } else {
        // Multiple attractions - fit bounds
        const latitudes = attractions.map((a) => a.latitude);
        const longitudes = attractions.map((a) => a.longitude);
        const minLat = Math.min(...latitudes);
        const maxLat = Math.max(...latitudes);
        const minLng = Math.min(...longitudes);
        const maxLng = Math.max(...longitudes);

        const latDelta = Math.max((maxLat - minLat) * 1.5 + 0.2, 2);
        const lngDelta = Math.max((maxLng - minLng) * 1.5 + 0.2, 2);

        setRegion({
          latitude: (minLat + maxLat) / 2,
          longitude: (minLng + maxLng) / 2,
          latitudeDelta: latDelta,
          longitudeDelta: lngDelta,
        });
      }
    } else {
      // Default to Kazakhstan view
      setRegion(KAZAKHSTAN_CENTER);
    }
  }, [attractions, zoomToPlace]);

  const requestLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        alert('Разрешение на местоположение необходимо для отображения вашего местоположения');
        return;
      }
      const location = await Location.getCurrentPositionAsync({});
      setUserLocation(location.coords);
      setShowUserLocation(true);
    } catch (error) {
      console.error('Error getting location:', error);
    }
  };

  const coordinates = attractions
    .filter((attraction) => Number.isFinite(Number(attraction.latitude)) && Number.isFinite(Number(attraction.longitude)))
    .map((attraction) => ({
    latitude: attraction.latitude,
    longitude: attraction.longitude,
  }));

  const mapMarkers = attractions
    .filter((attraction) => Number.isFinite(Number(attraction.latitude)) && Number.isFinite(Number(attraction.longitude)))
    .map((attraction, index) => ({
      id: attraction.id,
      latitude: attraction.latitude,
      longitude: attraction.longitude,
      title: attraction.name,
      description: attraction.description,
      color: routeData?.color || '#1a4d3a',
      label: routeData ? String(index + 1) : '',
    }));

  if (showUserLocation && userLocation) {
    mapMarkers.push({
      id: 'user-location',
      latitude: userLocation.latitude,
      longitude: userLocation.longitude,
      title: language === 'en' ? 'Your location' : 'Ваше местоположение',
      color: '#2563eb',
      label: 'U',
    });
  }

  return (
    <View style={styles.container}>
      <OSMMapView
        style={styles.map}
        markers={mapMarkers}
        polyline={routeData ? coordinates : []}
        center={region}
        zoom={zoomToPlace || attractions.length === 1 ? 10 : 5}
        interactive
        errorLabel={language === 'en' ? 'Map could not be loaded.' : 'Не удалось загрузить карту.'}
      />

      <View style={styles.infoPanel}>
        <Text style={styles.infoTitle}>{title || 'Карта Казахстана'}</Text>
        <Text style={styles.infoSubtitle}>
          {attractions.length} {attractions.length === 1 ? 'место' : 'мест'}
        </Text>
      </View>

      <TouchableOpacity
        style={styles.resetButton}
        onPress={() => {
          setRegion(KAZAKHSTAN_CENTER);
        }}
      >
        <Ionicons name="globe-outline" size={20} color="#1a4d3a" />
        <Text style={styles.resetButtonText}>Вся страна</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.locationButton}
        onPress={requestLocation}
      >
        <Ionicons name="locate" size={24} color="#1a4d3a" />
      </TouchableOpacity>
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
  locationButton: {
    position: 'absolute',
    bottom: 100,
    right: 16,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  resetButton: {
    position: 'absolute',
    bottom: 160,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  resetButtonText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#1a4d3a',
  },
});

