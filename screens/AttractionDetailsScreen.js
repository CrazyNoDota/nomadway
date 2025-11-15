import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
  TextInput,
  Modal,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker } from 'react-native-maps';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Sharing from 'expo-sharing';

const { width } = Dimensions.get('window');

export default function AttractionDetailsScreen({ route, navigation }) {
  const { attraction } = route.params;
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    checkIfSaved();
  }, []);

  const checkIfSaved = async () => {
    try {
      const saved = await AsyncStorage.getItem(`saved_${attraction.id}`);
      setIsSaved(saved !== null);
    } catch (error) {
      console.error('Error checking saved status:', error);
    }
  };

  const toggleSave = async () => {
    try {
      if (isSaved) {
        await AsyncStorage.removeItem(`saved_${attraction.id}`);
        setIsSaved(false);
      } else {
        await AsyncStorage.setItem(`saved_${attraction.id}`, JSON.stringify(attraction));
        setIsSaved(true);
      }
    } catch (error) {
      console.error('Error saving attraction:', error);
    }
  };

  const openMap = () => {
    navigation.navigate('MapScreen', {
      attractions: [attraction],
      title: attraction.name,
      zoomToPlace: {
        latitude: attraction.latitude,
        longitude: attraction.longitude,
      },
    });
  };

  const shareAttraction = async () => {
    try {
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync({
          message: `Посмотрите на это место: ${attraction.name}\n${attraction.description}\n\nНайдено в NomadWay`,
        });
      } else {
        alert('Функция "Поделиться" недоступна на этом устройстве');
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Image source={{ uri: attraction.image }} style={styles.headerImage} />
      
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>{attraction.name}</Text>
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={20} color="#d4af37" />
              <Text style={styles.rating}>{attraction.rating}</Text>
            </View>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity onPress={shareAttraction} style={styles.shareButton}>
              <Ionicons name="share-outline" size={24} color="#1a4d3a" />
            </TouchableOpacity>
            <TouchableOpacity onPress={toggleSave} style={styles.saveButton}>
              <Ionicons
                name={isSaved ? 'bookmark' : 'bookmark-outline'}
                size={24}
                color={isSaved ? '#d4af37' : '#8e8e93'}
              />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.categoryBadge}>
          <Text style={styles.categoryText}>{attraction.category}</Text>
        </View>

        <Text style={styles.description}>{attraction.longDescription || attraction.description}</Text>

        <TouchableOpacity style={styles.mapButton} onPress={openMap}>
          <Ionicons name="map" size={24} color="#1a4d3a" />
          <Text style={styles.mapButtonText}>Показать на карте</Text>
        </TouchableOpacity>

        <View style={styles.mapContainer}>
          <MapView
            style={styles.map}
            initialRegion={{
              latitude: attraction.latitude,
              longitude: attraction.longitude,
              latitudeDelta: 0.1,
              longitudeDelta: 0.1,
            }}
            scrollEnabled={false}
            zoomEnabled={false}
          >
            <Marker
              coordinate={{
                latitude: attraction.latitude,
                longitude: attraction.longitude,
              }}
              title={attraction.name}
            />
          </MapView>
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
    height: 300,
    resizeMode: 'cover',
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a4d3a',
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff9e6',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  rating: {
    marginLeft: 6,
    fontSize: 16,
    fontWeight: '600',
    color: '#d4af37',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  shareButton: {
    padding: 8,
    marginRight: 8,
  },
  saveButton: {
    padding: 8,
  },
  categoryBadge: {
    backgroundColor: '#e8f5e9',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  categoryText: {
    fontSize: 14,
    color: '#27ae60',
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
    height: 250,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 20,
  },
  map: {
    width: '100%',
    height: '100%',
  },
});

