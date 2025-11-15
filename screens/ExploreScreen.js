import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import attractionsData from '../data/attractions.json';
import { useLocalization } from '../contexts/LocalizationContext';

export default function ExploreScreen({ navigation }) {
  const [attractions, setAttractions] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState(null);
  const { t } = useLocalization();

  useEffect(() => {
    setAttractions(attractionsData.attractions);
  }, []);

  const filters = [
    { key: 'all', labelKey: 'allCategories', icon: '🌍' },
    { key: 'nature', labelKey: 'nature_category', icon: '🌳' },
    { key: 'history', labelKey: 'history_category', icon: '🏛️' },
    { key: 'city', labelKey: 'city_category', icon: '🏙️' },
    { key: 'mountains', labelKey: 'mountains_category', icon: '⛰️' },
    { key: 'sport', labelKey: 'sport_category', icon: '⚽' },
  ];

  const getFilteredAttractions = () => {
    let filtered = attractions;

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter((attraction) =>
        attraction.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        attraction.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply category filter
    if (activeFilter && activeFilter !== 'all') {
      if (activeFilter === 'nature') {
        filtered = filtered.filter(a => a.category === 'Природа');
      } else if (activeFilter === 'history') {
        filtered = filtered.filter(a => a.category === 'История');
      } else if (activeFilter === 'city') {
        filtered = filtered.filter(a => a.category === 'Город');
      } else if (activeFilter === 'mountains') {
        filtered = filtered.filter(a => a.category === 'Горы');
      } else if (activeFilter === 'sport') {
        filtered = filtered.filter(a => a.category === 'Спорт');
      }
    }

    return filtered;
  };

  const filteredAttractions = getFilteredAttractions();

  const renderAttraction = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('AttractionDetails', { attraction: item })}
    >
      <Image source={{ uri: item.image }} style={styles.cardImage} />
      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>{item.name}</Text>
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={16} color="#d4af37" />
            <Text style={styles.rating}>{item.rating}</Text>
          </View>
        </View>
        <Text style={styles.cardDescription} numberOfLines={2}>
          {item.description}
        </Text>
        <View style={styles.cardFooter}>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{item.category}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#8e8e93" />
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#8e8e93" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder={t('searchPlaceholder')}
          placeholderTextColor="#8e8e93"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>
      
      <View style={styles.filtersContainer}>
        <Text style={styles.filtersTitle}>{t('categories')}</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersContent}
        >
          {filters.map((filter) => (
            <TouchableOpacity
              key={filter.key}
              style={[
                styles.filterButton,
                activeFilter === filter.key && styles.filterButtonActive,
              ]}
              onPress={() => setActiveFilter(filter.key)}
            >
              <Text style={styles.filterEmoji}>{filter.icon}</Text>
              <Text
                style={[
                  styles.filterText,
                  activeFilter === filter.key && styles.filterTextActive,
                ]}
              >
                {t(filter.labelKey)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={filteredAttractions}
        renderItem={renderAttraction}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="search-outline" size={64} color="#8e8e93" />
            <Text style={styles.emptyText}>Ничего не найдено</Text>
            <Text style={styles.emptySubtext}>
              Попробуйте изменить параметры поиска
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    margin: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 48,
    fontSize: 16,
    color: '#000',
  },
  list: {
    padding: 16,
    paddingTop: 0,
  },
  card: {
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
  cardImage: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  cardContent: {
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a4d3a',
    flex: 1,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff9e6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  rating: {
    marginLeft: 4,
    fontSize: 14,
    fontWeight: '600',
    color: '#d4af37',
  },
  cardDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryBadge: {
    backgroundColor: '#e8f5e9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  categoryText: {
    fontSize: 12,
    color: '#27ae60',
    fontWeight: '600',
  },
  filtersContainer: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  filtersTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  filtersContent: {
    paddingHorizontal: 16,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  filterButtonActive: {
    backgroundColor: '#fff9e6',
    borderColor: '#d4af37',
  },
  filterEmoji: {
    fontSize: 16,
    marginRight: 6,
  },
  filterText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  filterTextActive: {
    color: '#d4af37',
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#8e8e93',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#8e8e93',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});

