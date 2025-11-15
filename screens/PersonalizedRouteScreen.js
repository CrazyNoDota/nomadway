import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  FlatList,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import SimplePicker from '../components/SimplePicker';
import attractionsData from '../data/attractions.json';
import { buildRoute, optimizeRoute } from '../utils/routeBuilder';
import { useLocalization } from '../contexts/LocalizationContext';
import { getTranslatedAttractions } from '../utils/attractionTranslations';

export default function PersonalizedRouteScreen({ navigation }) {
  const { language } = useLocalization();
  const [interests, setInterests] = useState({
    nature: false,
    history: false,
    modern: false,
  });
  const [budget, setBudget] = useState('medium');
  const [duration, setDuration] = useState('3');
  const [generatedRoute, setGeneratedRoute] = useState(null);
  const [selectedAttractions, setSelectedAttractions] = useState([]);

  const interestsList = [
    { key: 'nature', label: 'Природа', icon: '🌳' },
    { key: 'history', label: 'История', icon: '🏛️' },
    { key: 'modern', label: 'Современные развлечения', icon: '🎢' },
  ];

  const budgetOptions = [
    { label: 'Эконом', value: 'low' },
    { label: 'Средний', value: 'medium' },
    { label: 'Премиум', value: 'high' },
  ];

  const durationOptions = [
    { label: '1 день', value: '1' },
    { label: '2 дня', value: '2' },
    { label: '3 дня', value: '3' },
    { label: '5 дней', value: '5' },
    { label: '7 дней', value: '7' },
  ];

  const generateRoute = () => {
    // Get translated attractions
    const translatedAttractions = getTranslatedAttractions(attractionsData.attractions, language);
    let filtered = translatedAttractions;

    // Filter by interests - categories are now translated
    if (interests.nature || interests.history || interests.modern) {
      filtered = filtered.filter(attraction => {
        // Use original Russian categories for filtering since data structure uses them
        const originalAttraction = attractionsData.attractions.find(a => a.id === attraction.id);
        if (interests.nature && originalAttraction.category === 'Природа') return true;
        if (interests.history && originalAttraction.category === 'История') return true;
        if (interests.modern && (originalAttraction.category === 'Город' || originalAttraction.category === 'Спорт')) return true;
        return false;
      });
    }

    // Limit by duration
    const maxAttractions = parseInt(duration) * 2;
    filtered = filtered.slice(0, maxAttractions);

    // Optimize route order
    const optimized = optimizeRoute(filtered);
    
    // Build route
    const route = buildRoute(optimized);
    
    setSelectedAttractions(optimized);
    setGeneratedRoute(route);
  };

  const toggleInterest = (key) => {
    setInterests(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const removeAttraction = (id) => {
    const updated = selectedAttractions.filter(a => a.id !== id);
    setSelectedAttractions(updated);
    if (updated.length > 0) {
      const route = buildRoute(updated);
      setGeneratedRoute(route);
    } else {
      setGeneratedRoute(null);
    }
  };

  const renderAttraction = ({ item, index }) => (
    <View style={styles.attractionCard}>
      <View style={styles.attractionNumber}>
        <Text style={styles.attractionNumberText}>{index + 1}</Text>
      </View>
      <View style={styles.attractionContent}>
        <Text style={styles.attractionName}>{item.name}</Text>
        <Text style={styles.attractionCategory}>{item.category}</Text>
      </View>
      <TouchableOpacity
        onPress={() => removeAttraction(item.id)}
        style={styles.removeButton}
      >
        <Ionicons name="close-circle" size={24} color="#e74c3c" />
      </TouchableOpacity>
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Персонализированный маршрут</Text>
        <Text style={styles.headerSubtitle}>
          Укажите ваши предпочтения для создания идеального маршрута
        </Text>
      </View>

      <View style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ваши интересы</Text>
          {interestsList.map((interest) => (
            <TouchableOpacity
              key={interest.key}
              style={[
                styles.interestButton,
                interests[interest.key] && styles.interestButtonActive,
              ]}
              onPress={() => toggleInterest(interest.key)}
            >
              <Text style={styles.interestIcon}>{interest.icon}</Text>
              <Text
                style={[
                  styles.interestText,
                  interests[interest.key] && styles.interestTextActive,
                ]}
              >
                {interest.label}
              </Text>
              <Switch
                value={interests[interest.key]}
                onValueChange={() => toggleInterest(interest.key)}
                trackColor={{ false: '#e0e0e0', true: '#d4af37' }}
                thumbColor={interests[interest.key] ? '#fff' : '#f4f3f4'}
              />
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Бюджет</Text>
          <SimplePicker
            options={budgetOptions}
            selectedValue={budget}
            onValueChange={setBudget}
            placeholder="Выберите бюджет"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Длительность поездки</Text>
          <SimplePicker
            options={durationOptions}
            selectedValue={duration}
            onValueChange={setDuration}
            placeholder="Выберите длительность"
          />
        </View>

        <TouchableOpacity
          style={styles.generateButton}
          onPress={generateRoute}
        >
          <Ionicons name="sparkles" size={24} color="#fff" />
          <Text style={styles.generateButtonText}>Создать маршрут</Text>
        </TouchableOpacity>

        {generatedRoute && (
          <View style={styles.routeSection}>
            <View style={styles.routeHeader}>
              <Text style={styles.routeTitle}>Ваш маршрут</Text>
              <View style={styles.routeStats}>
                <View style={styles.statItem}>
                  <Ionicons name="location" size={16} color="#d4af37" />
                  <Text style={styles.statText}>
                    {generatedRoute.totalDistance} км
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <Ionicons name="time" size={16} color="#d4af37" />
                  <Text style={styles.statText}>
                    ~{generatedRoute.estimatedDuration} мин
                  </Text>
                </View>
              </View>
            </View>

            <FlatList
              data={selectedAttractions}
              renderItem={renderAttraction}
              keyExtractor={(item) => item.id.toString()}
              scrollEnabled={false}
            />

            <View style={styles.routeActions}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => {
                  navigation.navigate('MapScreen', {
                    attractions: selectedAttractions,
                    route: { color: '#d4af37' },
                    title: 'Персонализированный маршрут',
                  });
                }}
              >
                <Ionicons name="map" size={20} color="#1a4d3a" />
                <Text style={styles.actionButtonText}>Показать на карте</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.saveButton]}
                onPress={() => {
                  // Save route logic
                  alert('Маршрут сохранён!');
                }}
              >
                <Ionicons name="bookmark" size={20} color="#fff" />
                <Text style={[styles.actionButtonText, styles.saveButtonText]}>
                  Сохранить
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </ScrollView>
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
  content: {
    padding: 16,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a4d3a',
    marginBottom: 16,
  },
  interestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    marginBottom: 12,
  },
  interestButtonActive: {
    borderColor: '#d4af37',
    backgroundColor: '#fff9e6',
  },
  interestIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  interestText: {
    flex: 1,
    fontSize: 16,
    color: '#1a4d3a',
  },
  interestTextActive: {
    fontWeight: '600',
    color: '#d4af37',
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#d4af37',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  generateButtonText: {
    marginLeft: 12,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  routeSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  routeHeader: {
    marginBottom: 16,
  },
  routeTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a4d3a',
    marginBottom: 12,
  },
  routeStats: {
    flexDirection: 'row',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 24,
  },
  statText: {
    marginLeft: 6,
    fontSize: 14,
    color: '#666',
  },
  attractionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    marginBottom: 12,
  },
  attractionNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#d4af37',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  attractionNumberText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
  attractionContent: {
    flex: 1,
  },
  attractionName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a4d3a',
    marginBottom: 4,
  },
  attractionCategory: {
    fontSize: 12,
    color: '#8e8e93',
  },
  removeButton: {
    padding: 4,
  },
  routeActions: {
    flexDirection: 'row',
    marginTop: 16,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    marginRight: 8,
  },
  saveButton: {
    backgroundColor: '#1a4d3a',
    marginRight: 0,
  },
  actionButtonText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#1a4d3a',
  },
  saveButtonText: {
    color: '#fff',
  },
});

