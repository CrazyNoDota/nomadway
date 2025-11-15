import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import regionsData from '../data/regions.json';
import attractionsData from '../data/attractions.json';

export default function RegionalGuideScreen({ navigation, route }) {
  const [regions, setRegions] = useState([]);
  const [selectedRegion, setSelectedRegion] = useState(null);
  const regionId = route?.params?.regionId;

  useEffect(() => {
    setRegions(regionsData.regions);
    if (regionId) {
      const region = regionsData.regions.find(r => r.id === regionId);
      setSelectedRegion(region);
    }
  }, [regionId]);

  const getRegionAttractions = (region) => {
    if (!region.attractions || region.attractions.length === 0) return [];
    return attractionsData.attractions.filter(a => region.attractions.includes(a.id));
  };

  const renderRegion = ({ item }) => (
    <TouchableOpacity
      style={styles.regionCard}
      onPress={() => setSelectedRegion(item)}
    >
      <Image source={{ uri: item.image }} style={styles.regionImage} />
      <View style={styles.regionContent}>
        <Text style={styles.regionName}>{item.name}</Text>
        <Text style={styles.regionCountry}>{item.country}</Text>
        <Text style={styles.regionDescription} numberOfLines={2}>
          {item.description}
        </Text>
        <View style={styles.regionFooter}>
          <Ionicons name="calendar-outline" size={16} color="#8e8e93" />
          <Text style={styles.regionBestTime}>{item.bestTimeToVisit}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (selectedRegion) {
    const attractions = getRegionAttractions(selectedRegion);
    
    return (
      <ScrollView style={styles.container}>
        <View style={styles.headerImageContainer}>
          <Image source={{ uri: selectedRegion.image }} style={styles.headerImage} />
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setSelectedRegion(null)}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <Text style={styles.title}>{selectedRegion.name}</Text>
          <Text style={styles.country}>{selectedRegion.country}</Text>
          
          <Text style={styles.description}>{selectedRegion.longDescription}</Text>

          <View style={styles.infoSection}>
            <View style={styles.infoItem}>
              <Ionicons name="calendar" size={20} color="#d4af37" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Лучшее время для посещения</Text>
                <Text style={styles.infoValue}>{selectedRegion.bestTimeToVisit}</Text>
              </View>
            </View>

            <View style={styles.infoItem}>
              <Ionicons name="partly-sunny" size={20} color="#d4af37" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Климат</Text>
                <Text style={styles.infoValue}>{selectedRegion.climate}</Text>
              </View>
            </View>
          </View>

          {selectedRegion.localHolidays && selectedRegion.localHolidays.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Местные праздники</Text>
              {selectedRegion.localHolidays.map((holiday, index) => (
                <View key={index} style={styles.holidayItem}>
                  <Ionicons name="gift-outline" size={16} color="#d4af37" />
                  <Text style={styles.holidayText}>{holiday}</Text>
                </View>
              ))}
            </View>
          )}

          {selectedRegion.keyFeatures && selectedRegion.keyFeatures.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Основные особенности</Text>
              {selectedRegion.keyFeatures.map((feature, index) => (
                <View key={index} style={styles.featureItem}>
                  <Ionicons name="checkmark-circle" size={20} color="#27ae60" />
                  <Text style={styles.featureText}>{feature}</Text>
                </View>
              ))}
            </View>
          )}

          {selectedRegion.photos && selectedRegion.photos.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Фотогалерея</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {selectedRegion.photos.map((photo, index) => (
                  <Image
                    key={index}
                    source={{ uri: photo }}
                    style={styles.photo}
                  />
                ))}
              </ScrollView>
            </View>
          )}

          {attractions.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Достопримечательности</Text>
              {attractions.map((attraction) => (
                <TouchableOpacity
                  key={attraction.id}
                  style={styles.attractionItem}
                  onPress={() => {
                    navigation.navigate('AttractionDetails', { attraction });
                    setSelectedRegion(null);
                  }}
                >
                  <Image source={{ uri: attraction.image }} style={styles.attractionImage} />
                  <View style={styles.attractionContent}>
                    <Text style={styles.attractionName}>{attraction.name}</Text>
                    <Text style={styles.attractionDescription} numberOfLines={2}>
                      {attraction.description}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#8e8e93" />
                </TouchableOpacity>
              ))}
            </View>
          )}

          <TouchableOpacity
            style={styles.mapButton}
            onPress={() => {
              navigation.navigate('MapScreen', {
                attractions: attractions,
                title: selectedRegion.name,
              });
            }}
          >
            <Ionicons name="map" size={24} color="#1a4d3a" />
            <Text style={styles.mapButtonText}>Показать на карте</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Гид по регионам</Text>
        <Text style={styles.headerSubtitle}>
          Выберите регион для подробной информации
        </Text>
      </View>
      <FlatList
        data={regions}
        renderItem={renderRegion}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#1a4d3a',
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#d4af37',
  },
  list: {
    padding: 16,
  },
  regionCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  regionImage: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  regionContent: {
    padding: 16,
  },
  regionName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1a4d3a',
    marginBottom: 4,
  },
  regionCountry: {
    fontSize: 14,
    color: '#8e8e93',
    marginBottom: 8,
  },
  regionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  regionFooter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  regionBestTime: {
    marginLeft: 6,
    fontSize: 12,
    color: '#8e8e93',
  },
  headerImageContainer: {
    position: 'relative',
  },
  headerImage: {
    width: '100%',
    height: 300,
    resizeMode: 'cover',
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a4d3a',
    marginBottom: 4,
  },
  country: {
    fontSize: 16,
    color: '#8e8e93',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
    marginBottom: 24,
  },
  infoSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  infoItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  infoContent: {
    marginLeft: 12,
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#8e8e93',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a4d3a',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a4d3a',
    marginBottom: 16,
  },
  holidayItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  holidayText: {
    marginLeft: 12,
    fontSize: 14,
    color: '#1a4d3a',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  featureText: {
    marginLeft: 12,
    fontSize: 14,
    color: '#1a4d3a',
    flex: 1,
  },
  photo: {
    width: 200,
    height: 150,
    borderRadius: 12,
    marginRight: 12,
    resizeMode: 'cover',
  },
  attractionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  attractionImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    resizeMode: 'cover',
  },
  attractionContent: {
    flex: 1,
    marginLeft: 12,
  },
  attractionName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a4d3a',
    marginBottom: 4,
  },
  attractionDescription: {
    fontSize: 12,
    color: '#666',
  },
  mapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#d4af37',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  mapButtonText: {
    marginLeft: 12,
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});

