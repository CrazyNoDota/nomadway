import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, Polyline } from 'react-native-maps';
import routesData from '../data/routes.json';
import attractionsData from '../data/attractions.json';

export default function RouteDetailsScreen({ route, navigation }) {
  const { route: routeData } = route.params;
  const [stops, setStops] = useState([]);
  const [region, setRegion] = useState(null);

  useEffect(() => {
    const routeStops = routeData.stops.map((id) =>
      attractionsData.attractions.find((attr) => attr.id === id)
    ).filter(Boolean);
    setStops(routeStops);

    if (routeStops.length > 0) {
      const latitudes = routeStops.map((s) => s.latitude);
      const longitudes = routeStops.map((s) => s.longitude);
      const minLat = Math.min(...latitudes);
      const maxLat = Math.max(...latitudes);
      const minLng = Math.min(...longitudes);
      const maxLng = Math.max(...longitudes);

      setRegion({
        latitude: (minLat + maxLat) / 2,
        longitude: (minLng + maxLng) / 2,
        latitudeDelta: (maxLat - minLat) * 1.5 + 0.1,
        longitudeDelta: (maxLng - minLng) * 1.5 + 0.1,
      });
    }
  }, [routeData]);

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'Лёгкая':
        return '#27ae60';
      case 'Средняя':
        return '#f39c12';
      case 'Сложная':
        return '#e74c3c';
      default:
        return '#8e8e93';
    }
  };

  const openMap = () => {
    navigation.navigate('MapScreen', {
      attractions: stops,
      route: routeData,
      title: routeData.name,
    });
  };

  const coordinates = stops.map((stop) => ({
    latitude: stop.latitude,
    longitude: stop.longitude,
  }));

  return (
    <ScrollView style={styles.container}>
      <Image source={{ uri: routeData.image }} style={styles.headerImage} />
      
      <View style={styles.content}>
        <Text style={styles.title}>{routeData.name}</Text>
        
        <View style={styles.metaContainer}>
          <View style={styles.metaItem}>
            <Ionicons name="time-outline" size={20} color="#1a4d3a" />
            <Text style={styles.metaText}>{routeData.duration}</Text>
          </View>
          <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(routeData.difficulty) + '20' }]}>
            <Text style={[styles.difficultyText, { color: getDifficultyColor(routeData.difficulty) }]}>
              {routeData.difficulty}
            </Text>
          </View>
        </View>

        <Text style={styles.description}>{routeData.longDescription || routeData.description}</Text>

        <TouchableOpacity style={styles.mapButton} onPress={openMap}>
          <Ionicons name="map" size={24} color="#1a4d3a" />
          <Text style={styles.mapButtonText}>Открыть полную карту</Text>
        </TouchableOpacity>

        {region && (
          <View style={styles.mapContainer}>
            <MapView style={styles.map} initialRegion={region} scrollEnabled={false}>
              {stops.map((stop, index) => (
                <Marker
                  key={stop.id}
                  coordinate={{ latitude: stop.latitude, longitude: stop.longitude }}
                  title={stop.name}
                  pinColor={routeData.color}
                >
                  <View style={styles.markerContainer}>
                    <Text style={styles.markerNumber}>{index + 1}</Text>
                  </View>
                </Marker>
              ))}
              {coordinates.length > 1 && (
                <Polyline
                  coordinates={coordinates}
                  strokeColor={routeData.color}
                  strokeWidth={3}
                />
              )}
            </MapView>
          </View>
        )}

        <View style={styles.stopsSection}>
          <Text style={styles.sectionTitle}>Остановки маршрута</Text>
          {stops.map((stop, index) => (
            <TouchableOpacity
              key={stop.id}
              style={styles.stopItem}
              onPress={() => navigation.navigate('AttractionDetails', { attraction: stop })}
            >
              <View style={[styles.stopNumber, { backgroundColor: routeData.color }]}>
                <Text style={styles.stopNumberText}>{index + 1}</Text>
              </View>
              <View style={styles.stopContent}>
                <Text style={styles.stopName}>{stop.name}</Text>
                <Text style={styles.stopDescription} numberOfLines={2}>
                  {stop.description}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#8e8e93" />
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  headerImage: {
    width: '100%',
    height: 250,
    resizeMode: 'cover',
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a4d3a',
    marginBottom: 12,
  },
  metaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  metaText: {
    marginLeft: 6,
    fontSize: 16,
    color: '#1a4d3a',
    fontWeight: '500',
  },
  difficultyBadge: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
  },
  difficultyText: {
    fontSize: 14,
    fontWeight: '600',
  },
  description: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
    marginBottom: 20,
  },
  mapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  mapButtonText: {
    marginLeft: 12,
    fontSize: 16,
    fontWeight: '600',
    color: '#1a4d3a',
  },
  mapContainer: {
    height: 300,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 24,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  markerContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#1a4d3a',
  },
  markerNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1a4d3a',
  },
  stopsSection: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1a4d3a',
    marginBottom: 16,
  },
  stopItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  stopNumber: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stopNumberText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  stopContent: {
    flex: 1,
  },
  stopName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a4d3a',
    marginBottom: 4,
  },
  stopDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 18,
  },
});

