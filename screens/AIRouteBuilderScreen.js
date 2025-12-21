import React, { useState } from 'react';
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
import { useAuth } from '../contexts/AuthContext';
import {
  USER_GROUPS,
  ACTIVITY_LEVELS,
  INTERESTS,
  DURATIONS,
} from '../constants/userSegments';
import { useLocalization } from '../contexts/LocalizationContext';
import { useCart } from '../contexts/CartContext';

const DURATION_LABEL_KEYS = {
  [DURATIONS.THREE_HOURS]: 'duration_3_hours',
  [DURATIONS.ONE_DAY]: 'duration_1_day',
  [DURATIONS.THREE_DAYS]: 'duration_3_days',
};

const DURATION_ORDER = [
  DURATIONS.THREE_HOURS,
  DURATIONS.ONE_DAY,
  DURATIONS.THREE_DAYS,
];

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
  const { t } = useLocalization();
  const { addToCart } = useCart();
  const { requireAuth } = useAuth();

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
  const [viewMode, setViewMode] = useState('timeline'); // 'timeline' or 'daily'

  const formatSummaryDuration = (minutesValue) => {
    const hours = Math.floor(minutesValue / 60);
    const remainingMinutes = minutesValue % 60;
    return `${hours}${t('hoursShort')} ${remainingMinutes}${t('minutesShort')}`;
  };

  const toggleInterest = (interest) => {
    if (selectedInterests.includes(interest)) {
      setSelectedInterests(selectedInterests.filter(i => i !== interest));
    } else {
      setSelectedInterests([...selectedInterests, interest]);
    }
  };

  const buildRoute = async () => {
    if (selectedInterests.length === 0) {
      Alert.alert(t('error'), t('errorSelectInterest'));
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
        Alert.alert(t('error'), data.error || t('routeBuildFailed'));
      }
    } catch (error) {
      console.error('Error building route:', error);
      Alert.alert(t('error'), t('serverConnectionError'));
    } finally {
      setLoading(false);
    }
  };

  // Organize route into day-by-day schedule with time-of-day activities
  const organizeByDays = () => {
    if (!route || route.length === 0) return [];

    const durationDays = duration === DURATIONS.THREE_HOURS ? 1 :
      duration === DURATIONS.ONE_DAY ? 1 : 3;

    const days = [];
    const stopsPerDay = Math.ceil(route.length / durationDays);

    for (let day = 0; day < durationDays; day++) {
      const dayStops = route.slice(day * stopsPerDay, (day + 1) * stopsPerDay);
      if (dayStops.length === 0) continue;

      const activities = [];
      const timeSlots = ['morning', 'afternoon', 'evening'];
      const timeLabels = {
        morning: '🌅 Утро (9:00-12:00)',
        afternoon: '☀️ День (12:00-18:00)',
        evening: '🌙 Вечер (18:00-21:00)',
      };

      dayStops.forEach((stop, index) => {
        const timeSlot = timeSlots[Math.min(index, timeSlots.length - 1)];
        activities.push({
          ...stop,
          timeSlot,
          timeLabel: timeLabels[timeSlot],
        });
      });

      const dayCost = dayStops.reduce((sum, s) => sum + (s.estimatedCost || 0), 0);

      days.push({
        dayNumber: day + 1,
        activities,
        totalCost: dayCost,
        stopsCount: dayStops.length,
      });
    }

    return days;
  };

  // Add entire route to cart
  const handleAddRouteToCart = () => {
    if (!route || route.length === 0) return;

    if (!requireAuth()) {
      navigation.navigate('Auth');
      return;
    }

    const durationDays = duration === DURATIONS.THREE_HOURS ? 1 :
      duration === DURATIONS.ONE_DAY ? 1 : 3;

    addToCart({
      id: `custom_route_${Date.now()}`,
      type: 'tour',
      name: `Индивидуальный тур (${route.length} мест)`,
      city: route[0]?.attraction?.city || 'Казахстан',
      region: route[0]?.attraction?.region || 'mixed',
      price: { min: summary?.totalCost * 0.8, max: summary?.totalCost * 1.2 },
      durationDays: durationDays,
      stops: route.map(s => s.attraction.name),
    });

    Alert.alert(
      '✅ Маршрут добавлен',
      'Ваш персональный маршрут добавлен в корзину',
      [
        { text: 'Продолжить', style: 'cancel' },
        { text: 'Открыть корзину', onPress: () => navigation.navigate('Cart') },
      ]
    );
  };

  const renderForm = () => (
    <View style={styles.formContainer}>
      <Text style={styles.sectionTitle}>{t('routeParams')}</Text>

      {/* Age Group Selection */}
      <View style={styles.fieldContainer}>
        <Text style={styles.label}>{t('ageGroup')}</Text>
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
                {t(`userGroup_${group}`)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Duration Selection */}
      <View style={styles.fieldContainer}>
        <Text style={styles.label}>{t('duration')}</Text>
        <View style={styles.buttonGroup}>
          {DURATION_ORDER.map((key) => (
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
                {t(DURATION_LABEL_KEYS[key])}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Budget Input */}
      <View style={styles.fieldContainer}>
        <Text style={styles.label}>{t('budgetCurrency')}</Text>
        <View style={styles.budgetRow}>
          <TextInput
            style={styles.budgetInput}
            placeholder={t('budgetMin')}
            keyboardType="numeric"
            value={budgetMin}
            onChangeText={setBudgetMin}
          />
          <Text style={styles.budgetSeparator}>—</Text>
          <TextInput
            style={styles.budgetInput}
            placeholder={t('budgetMax')}
            keyboardType="numeric"
            value={budgetMax}
            onChangeText={setBudgetMax}
          />
        </View>
      </View>

      {/* Activity Level Selection */}
      <View style={styles.fieldContainer}>
        <Text style={styles.label}>{t('activityLevel')}</Text>
        <View style={styles.buttonGroup}>
          {Object.values(ACTIVITY_LEVELS).map((level) => (
            <TouchableOpacity
              key={level}
              style={[
                styles.optionButton,
                activityLevel === level && styles.optionButtonActive,
              ]}
              onPress={() => setActivityLevel(level)}
            >
              <Text
                style={[
                  styles.optionButtonText,
                  activityLevel === level && styles.optionButtonTextActive,
                ]}
              >
                {t(level)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Interests Selection */}
      <View style={styles.fieldContainer}>
        <Text style={styles.label}>{t('interests')}</Text>
        <View style={styles.interestsGrid}>
          {Object.values(INTERESTS).map((interest) => (
            <TouchableOpacity
              key={interest}
              style={[
                styles.interestChip,
                selectedInterests.includes(interest) && styles.interestChipActive,
              ]}
              onPress={() => toggleInterest(interest)}
            >
              <Text
                style={[
                  styles.interestChipText,
                  selectedInterests.includes(interest) && styles.interestChipTextActive,
                ]}
              >
                {t(interest)}
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
            <Text style={styles.buildButtonText}>{t('buildRoute')}</Text>
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
          <Text style={styles.emptyStateText}>{t('emptyRouteState')}</Text>
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
            <Text style={styles.summaryTitle}>{t('summaryTitle')}</Text>
            <View style={styles.summaryRow}>
              <Ionicons name="time-outline" size={20} color="#d4af37" />
              <Text style={styles.summaryText}>
                {`${t('summaryTime')}: ${formatSummaryDuration(summary.totalDuration)}`}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Ionicons name="cash-outline" size={20} color="#d4af37" />
              <Text style={styles.summaryText}>
                {t('summaryBudget')}: ~{summary.totalCost} ₸
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Ionicons name="location-outline" size={20} color="#d4af37" />
              <Text style={styles.summaryText}>
                {t('summaryStops')}: {summary.numberOfStops}
              </Text>
            </View>
          </View>
        )}

        {/* View Mode Toggle for multi-day trips */}
        {duration === DURATIONS.THREE_DAYS && (
          <View style={styles.viewModeToggle}>
            <TouchableOpacity
              style={[styles.viewModeButton, viewMode === 'timeline' && styles.viewModeButtonActive]}
              onPress={() => setViewMode('timeline')}
            >
              <Ionicons name="list-outline" size={16} color={viewMode === 'timeline' ? '#fff' : '#1a4d3a'} />
              <Text style={[styles.viewModeText, viewMode === 'timeline' && styles.viewModeTextActive]}>Таймлайн</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.viewModeButton, viewMode === 'daily' && styles.viewModeButtonActive]}
              onPress={() => setViewMode('daily')}
            >
              <Ionicons name="calendar-outline" size={16} color={viewMode === 'daily' ? '#fff' : '#1a4d3a'} />
              <Text style={[styles.viewModeText, viewMode === 'daily' && styles.viewModeTextActive]}>По дням</Text>
            </TouchableOpacity>
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
                    <Text style={styles.detailText}>
                      {`${stop.visitDuration} ${t('minutesShort')}`}
                    </Text>
                  </View>
                  {stop.travelTime > 0 && (
                    <View style={styles.detailItem}>
                      <Ionicons name="car-outline" size={16} color="#666" />
                      <Text style={styles.detailText}>
                        {`${stop.travelTime} ${t('minutesShort')}`}
                      </Text>
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
                    <Text style={styles.alternativesTitle}>{`${t('alternatives')}:`}</Text>
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

        {/* Day-by-Day View (for multi-day trips) */}
        {viewMode === 'daily' && duration === DURATIONS.THREE_DAYS && (
          <View style={styles.dailySchedule}>
            <Text style={styles.dailyScheduleTitle}>📅 Расписание по дням</Text>
            {organizeByDays().map((day) => (
              <View key={day.dayNumber} style={styles.dayCard}>
                <View style={styles.dayHeader}>
                  <Text style={styles.dayTitle}>День {day.dayNumber}</Text>
                  <Text style={styles.dayCost}>~{Math.round(day.totalCost).toLocaleString()} ₸</Text>
                </View>
                {day.activities.map((activity, idx) => (
                  <View key={idx} style={styles.activityItem}>
                    <Text style={styles.timeLabel}>{activity.timeLabel}</Text>
                    <View style={styles.activityContent}>
                      <Text style={styles.activityName}>{activity.attraction.name}</Text>
                      <View style={styles.activityDetails}>
                        <Text style={styles.activityDuration}>⏱ {activity.visitDuration} мин</Text>
                        {activity.travelTime > 0 && (
                          <Text style={styles.activityTravel}>🚗 +{activity.travelTime} мин</Text>
                        )}
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            ))}
          </View>
        )}

        {/* Add to Cart Button */}
        <TouchableOpacity style={styles.addToCartButton} onPress={handleAddRouteToCart}>
          <Ionicons name="cart-outline" size={20} color="#fff" />
          <Text style={styles.addToCartText}>Добавить маршрут в корзину</Text>
        </TouchableOpacity>
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
  viewModeToggle: {
    flexDirection: 'row',
    marginHorizontal: 15,
    marginTop: 15,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 4,
  },
  viewModeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 6,
    gap: 6,
  },
  viewModeButtonActive: {
    backgroundColor: '#1a4d3a',
  },
  viewModeText: {
    fontSize: 14,
    color: '#1a4d3a',
    fontWeight: '500',
  },
  viewModeTextActive: {
    color: '#fff',
  },
  dailySchedule: {
    padding: 15,
  },
  dailyScheduleTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a4d3a',
    marginBottom: 15,
  },
  dayCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  dayTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a4d3a',
  },
  dayCost: {
    fontSize: 14,
    fontWeight: '600',
    color: '#d4af37',
  },
  activityItem: {
    marginBottom: 12,
  },
  timeLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  activityContent: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#d4af37',
  },
  activityName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  activityDetails: {
    flexDirection: 'row',
    gap: 12,
  },
  activityDuration: {
    fontSize: 12,
    color: '#666',
  },
  activityTravel: {
    fontSize: 12,
    color: '#888',
  },
  addToCartButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#d4af37',
    marginHorizontal: 15,
    marginVertical: 20,
    paddingVertical: 14,
    borderRadius: 25,
    gap: 8,
  },
  addToCartText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
