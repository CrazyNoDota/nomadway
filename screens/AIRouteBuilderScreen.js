import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, Polyline } from 'react-native-maps';
import Constants from 'expo-constants';
import {
  USER_GROUPS,
  USER_GROUP_LABELS,
  ACTIVITY_LEVELS,
  ACTIVITY_LEVEL_LABELS,
  INTERESTS,
  INTEREST_LABELS,
  DURATIONS,
  DURATION_LABELS,
} from '../constants/userSegments';

const getApiBaseUrl = () => {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  const hostUri =
    Constants.expoConfig?.hostUri ||
    Constants.expoGoConfig?.hostUri ||
    Constants.manifest?.debuggerHost;

  if (hostUri) {
    const hostname = hostUri.split(':')[0];
    return `http://${hostname}:3001`;
  }

  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:3001';
  }

  return 'http://localhost:3001';
};

export default function AIRouteBuilderScreen({ navigation }) {
  // Form state
  const [ageGroup, setAgeGroup] = useState(USER_GROUPS.FAMILY);
  const [duration, setDuration] = useState(DURATIONS.ONE_DAY);
  const [budgetMin, setBudgetMin] = useState('5000');
  const [budgetMax, setBudgetMax] = useState('15000');
  const [activityLevel, setActivityLevel] = useState(ACTIVITY_LEVELS.MODERATE);
  const [selectedInterests, setSelectedInterests] = useState([]);

  // Route state
  const [loading, setLoading] = useState(false);
  const [route, setRoute] = useState(null);
  const [summary, setSummary] = useState(null);

  const toggleInterest = (interest) => {
    if (selectedInterests.includes(interest)) {
      setSelectedInterests(selectedInterests.filter(i => i !== interest));
    } else {
      setSelectedInterests([...selectedInterests, interest]);
    }
  };

  const buildRoute = async () => {
    if (selectedInterests.length === 0) {
      Alert.alert('Ошибка', 'Выберите хотя бы один интерес');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${getApiBaseUrl()}/api/routes/build`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          duration,
          budget: {
            min: parseInt(budgetMin) || 0,
            max: parseInt(budgetMax) || 100000,
          },
          interests: selectedInterests,
          activityLevel,
          ageGroup,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setRoute(data.route);
        setSummary(data.summary);
      } else {
        Alert.alert('Ошибка', data.error || 'Не удалось построить маршрут');
      }
    } catch (error) {
      console.error('Error building route:', error);
      Alert.alert('Ошибка', 'Не удалось подключиться к серверу');
    } finally {
      setLoading(false);
    }
  };

  const renderForm = () => (
    <View style={styles.formContainer}>
      <Text style={styles.sectionTitle}>Параметры маршрута</Text>

      {/* Age Group Selection */}
      <View style={styles.fieldContainer}>
        <Text style={styles.label}>Возрастная группа</Text>
        <View style={styles.buttonGroup}>
          {Object.values(USER_GROUPS).map((group) => (
            <TouchableOpacity
              key={group}
              style={[
                styles.optionButton,
                ageGroup === group && styles.optionButtonActive,
              ]}
              onPress={() => setAgeGroup(group)}
            >
              <Text
                style={[
                  styles.optionButtonText,
                  ageGroup === group && styles.optionButtonTextActive,
                ]}
              >
                {USER_GROUP_LABELS[group]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Duration Selection */}
      <View style={styles.fieldContainer}>
        <Text style={styles.label}>Продолжительность</Text>
        <View style={styles.buttonGroup}>
          {Object.entries(DURATION_LABELS).map(([key, label]) => (
            <TouchableOpacity
              key={key}
              style={[
                styles.optionButton,
                duration === key && styles.optionButtonActive,
              ]}
              onPress={() => setDuration(key)}
            >
              <Text
                style={[
                  styles.optionButtonText,
                  duration === key && styles.optionButtonTextActive,
                ]}
              >
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Budget Input */}
      <View style={styles.fieldContainer}>
        <Text style={styles.label}>Бюджет (₸)</Text>
        <View style={styles.budgetRow}>
          <TextInput
            style={styles.budgetInput}
            placeholder="Мин."
            keyboardType="numeric"
            value={budgetMin}
            onChangeText={setBudgetMin}
          />
          <Text style={styles.budgetSeparator}>—</Text>
          <TextInput
            style={styles.budgetInput}
            placeholder="Макс."
            keyboardType="numeric"
            value={budgetMax}
            onChangeText={setBudgetMax}
          />
        </View>
      </View>

      {/* Activity Level Selection */}
      <View style={styles.fieldContainer}>
        <Text style={styles.label}>Уровень активности</Text>
        <View style={styles.buttonGroup}>
          {Object.entries(ACTIVITY_LEVEL_LABELS).map(([key, label]) => (
            <TouchableOpacity
              key={key}
              style={[
                styles.optionButton,
                activityLevel === key && styles.optionButtonActive,
              ]}
              onPress={() => setActivityLevel(key)}
            >
              <Text
                style={[
                  styles.optionButtonText,
                  activityLevel === key && styles.optionButtonTextActive,
                ]}
              >
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Interests Selection */}
      <View style={styles.fieldContainer}>
        <Text style={styles.label}>Интересы</Text>
        <View style={styles.interestsGrid}>
          {Object.entries(INTEREST_LABELS).map(([key, label]) => (
            <TouchableOpacity
              key={key}
              style={[
                styles.interestChip,
                selectedInterests.includes(key) && styles.interestChipActive,
              ]}
              onPress={() => toggleInterest(key)}
            >
              <Text
                style={[
                  styles.interestChipText,
                  selectedInterests.includes(key) && styles.interestChipTextActive,
                ]}
              >
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Build Button */}
      <TouchableOpacity
        style={styles.buildButton}
        onPress={buildRoute}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <Ionicons name="construct-outline" size={20} color="#fff" />
            <Text style={styles.buildButtonText}>Построить маршрут</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );

  const renderRoute = () => {
    if (!route || route.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Ionicons name="map-outline" size={64} color="#8e8e93" />
          <Text style={styles.emptyStateText}>
            Заполните параметры и нажмите "Построить маршрут"
          </Text>
        </View>
      );
    }

    // Extract coordinates for map
    const coordinates = route.map(stop => ({
      latitude: stop.attraction.latitude,
      longitude: stop.attraction.longitude,
    }));

    const region = {
      latitude: coordinates[0].latitude,
      longitude: coordinates[0].longitude,
      latitudeDelta: 2,
      longitudeDelta: 2,
    };

    return (
      <View style={styles.routeContainer}>
        {/* Summary */}
        {summary && (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Сводка маршрута</Text>
            <View style={styles.summaryRow}>
              <Ionicons name="time-outline" size={20} color="#d4af37" />
              <Text style={styles.summaryText}>
                Время: {Math.floor(summary.totalDuration / 60)}ч {summary.totalDuration % 60}м
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Ionicons name="cash-outline" size={20} color="#d4af37" />
              <Text style={styles.summaryText}>
                Бюджет: ~{summary.totalCost} ₸
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Ionicons name="location-outline" size={20} color="#d4af37" />
              <Text style={styles.summaryText}>
                Остановок: {summary.numberOfStops}
              </Text>
            </View>
          </View>
        )}

        {/* Map */}
        <MapView style={styles.map} initialRegion={region}>
          {route.map((stop, index) => (
            <Marker
              key={stop.attraction.id}
              coordinate={{
                latitude: stop.attraction.latitude,
                longitude: stop.attraction.longitude,
              }}
              title={stop.attraction.name}
              description={stop.attraction.description}
            >
              <View style={styles.markerContainer}>
                <Text style={styles.markerNumber}>{index + 1}</Text>
              </View>
            </Marker>
          ))}
          <Polyline
            coordinates={coordinates}
            strokeColor="#d4af37"
            strokeWidth={3}
          />
        </MapView>

        {/* Route Timeline */}
        <ScrollView style={styles.timeline}>
          {route.map((stop, index) => (
            <View key={stop.attraction.id} style={styles.timelineItem}>
              <View style={styles.timelineMarker}>
                <Text style={styles.timelineNumber}>{index + 1}</Text>
              </View>
              <View style={styles.timelineContent}>
                <Text style={styles.attractionName}>{stop.attraction.name}</Text>
                <Text style={styles.attractionDescription}>
                  {stop.attraction.description}
                </Text>
                <View style={styles.timelineDetails}>
                  <View style={styles.detailItem}>
                    <Ionicons name="time-outline" size={16} color="#666" />
                    <Text style={styles.detailText}>{stop.visitDuration} мин</Text>
                  </View>
                  {stop.travelTime > 0 && (
                    <View style={styles.detailItem}>
                      <Ionicons name="car-outline" size={16} color="#666" />
                      <Text style={styles.detailText}>{stop.travelTime} мин</Text>
                    </View>
                  )}
                  <View style={styles.detailItem}>
                    <Ionicons name="cash-outline" size={16} color="#666" />
                    <Text style={styles.detailText}>~{Math.round(stop.estimatedCost)} ₸</Text>
                  </View>
                </View>
                
                {/* Alternatives */}
                {stop.alternatives && stop.alternatives.length > 0 && (
                  <View style={styles.alternatives}>
                    <Text style={styles.alternativesTitle}>Альтернативы:</Text>
                    {stop.alternatives.map(alt => (
                      <Text key={alt.id} style={styles.alternativeItem}>
                        • {alt.name}
                      </Text>
                    ))}
                  </View>
                )}
              </View>
            </View>
          ))}
        </ScrollView>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView>
        {renderForm()}
        {renderRoute()}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  formContainer: {
    backgroundColor: '#fff',
    padding: 20,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a4d3a',
    marginBottom: 20,
  },
  fieldContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  buttonGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  optionButton: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  optionButtonActive: {
    backgroundColor: '#1a4d3a',
    borderColor: '#1a4d3a',
  },
  optionButtonText: {
    fontSize: 14,
    color: '#666',
  },
  optionButtonTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  budgetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  budgetInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 15,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  budgetSeparator: {
    fontSize: 16,
    color: '#666',
  },
  interestsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  interestChip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  interestChipActive: {
    backgroundColor: '#d4af37',
    borderColor: '#d4af37',
  },
  interestChipText: {
    fontSize: 13,
    color: '#666',
  },
  interestChipTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  buildButton: {
    backgroundColor: '#1a4d3a',
    paddingVertical: 15,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 10,
  },
  buildButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateText: {
    marginTop: 15,
    fontSize: 16,
    color: '#8e8e93',
    textAlign: 'center',
  },
  routeContainer: {
    backgroundColor: '#fff',
  },
  summaryCard: {
    backgroundColor: '#1a4d3a',
    padding: 15,
    margin: 15,
    borderRadius: 10,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginVertical: 5,
  },
  summaryText: {
    fontSize: 14,
    color: '#fff',
  },
  map: {
    height: 300,
    marginHorizontal: 15,
    borderRadius: 10,
    overflow: 'hidden',
  },
  markerContainer: {
    backgroundColor: '#d4af37',
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  markerNumber: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  timeline: {
    padding: 15,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  timelineMarker: {
    width: 40,
    alignItems: 'center',
  },
  timelineNumber: {
    backgroundColor: '#d4af37',
    width: 30,
    height: 30,
    borderRadius: 15,
    textAlign: 'center',
    lineHeight: 30,
    color: '#fff',
    fontWeight: 'bold',
  },
  timelineContent: {
    flex: 1,
    marginLeft: 10,
    paddingBottom: 20,
    borderLeftWidth: 2,
    borderLeftColor: '#e0e0e0',
    paddingLeft: 15,
  },
  attractionName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a4d3a',
    marginBottom: 5,
  },
  attractionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  timelineDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 15,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  detailText: {
    fontSize: 13,
    color: '#666',
  },
  alternatives: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
  },
  alternativesTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1a4d3a',
    marginBottom: 5,
  },
  alternativeItem: {
    fontSize: 12,
    color: '#666',
    marginVertical: 2,
  },
});
