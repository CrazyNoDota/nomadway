import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, Polyline } from 'react-native-maps';
import * as Location from 'expo-location';
import attractionsData from '../data/attractions.json';

const { width, height } = Dimensions.get('window');

// Default Kazakhstan coordinates
const KAZAKHSTAN_CENTER = {
  latitude: 48.0196,
  longitude: 66.9237,
  latitudeDelta: 15, // Zoom level ~5
  longitudeDelta: 15,
};

export default function MapScreen({ route, navigation }) {
  const { attractions: routeAttractions, route: routeData, title, zoomToPlace } = route.params || {};
  const [attractions, setAttractions] = useState([]);
  const [region, setRegion] = useState(KAZAKHSTAN_CENTER);
  const [userLocation, setUserLocation] = useState(null);
  const [showUserLocation, setShowUserLocation] = useState(false);
  const mapRef = useRef(null);

  // Load attractions
  useEffect(() => {
    if (routeAttractions && routeAttractions.length > 0) {
      setAttractions(routeAttractions);
    } else {
      // Load all attractions by default
      setAttractions(attractionsData.attractions);
    }
  }, [routeAttractions]);

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
      
      // Animate to the location
      if (mapRef.current) {
        setTimeout(() => {
          mapRef.current?.animateToRegion(zoomRegion, 1000);
        }, 100);
      }
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

  const coordinates = attractions.map((attraction) => ({
    latitude: attraction.latitude,
    longitude: attraction.longitude,
  }));

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={KAZAKHSTAN_CENTER}
        region={region}
        showsUserLocation={showUserLocation}
        showsMyLocationButton={false}
        onRegionChangeComplete={setRegion}
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
            onPress={() => {
              // Zoom to marker when pressed
              if (mapRef.current) {
                mapRef.current.animateToRegion({
                  latitude: attraction.latitude,
                  longitude: attraction.longitude,
                  latitudeDelta: 0.5,
                  longitudeDelta: 0.5,
                }, 1000);
              }
            }}
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
        <Text style={styles.infoTitle}>{title || 'Карта Казахстана'}</Text>
        <Text style={styles.infoSubtitle}>
          {attractions.length} {attractions.length === 1 ? 'место' : 'мест'}
        </Text>
      </View>

      <TouchableOpacity
        style={styles.resetButton}
        onPress={() => {
          setRegion(KAZAKHSTAN_CENTER);
          if (mapRef.current) {
            mapRef.current.animateToRegion(KAZAKHSTAN_CENTER, 1000);
          }
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

