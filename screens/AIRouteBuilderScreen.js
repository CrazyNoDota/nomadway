import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Platform,
  Animated,
  Easing,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { notify } from '../utils/notify';
import { useAuth } from '../contexts/AuthContext';
import {
  USER_GROUPS,
  ACTIVITY_LEVELS,
  INTERESTS,
  DURATIONS,
} from '../constants/userSegments';
import { useLocalization } from '../contexts/LocalizationContext';
import { useCart } from '../contexts/CartContext';
import OSMMapView from '../components/OSMMapView';

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

const LOADING_PHRASES = [
  'Спорим с компасом о красивом повороте...',
  'Укладываем бюджет в чемодан без лишнего шума...',
  'Ищем точки, которые дружат по дороге...',
  'Просим карту не строить зигзаги...',
  'Собираем маршрут, где каждый следующий шаг имеет смысл...',
];

const LOADING_FACTS = {
  ru: [
    '\u041a\u0430\u0437\u0430\u0445\u0441\u0442\u0430\u043d \u0432\u0445\u043e\u0434\u0438\u0442 \u0432 \u0442\u043e\u043f-10 \u0441\u0442\u0440\u0430\u043d \u043c\u0438\u0440\u0430 \u043f\u043e \u043f\u043b\u043e\u0449\u0430\u0434\u0438.',
    '\u041e\u0437\u0435\u0440\u043e \u0411\u0430\u043b\u0445\u0430\u0448 \u0443\u043d\u0438\u043a\u0430\u043b\u044c\u043d\u043e: \u043e\u0434\u043d\u0430 \u0447\u0430\u0441\u0442\u044c \u043f\u0440\u0435\u0441\u043d\u0430\u044f, \u0434\u0440\u0443\u0433\u0430\u044f \u0441\u043e\u043b\u0435\u043d\u0430\u044f.',
    '\u0427\u0430\u0440\u044b\u043d\u0441\u043a\u0438\u0439 \u043a\u0430\u043d\u044c\u043e\u043d \u0447\u0430\u0441\u0442\u043e \u043d\u0430\u0437\u044b\u0432\u0430\u044e\u0442 \u043c\u043b\u0430\u0434\u0448\u0438\u043c \u0431\u0440\u0430\u0442\u043e\u043c \u0413\u0440\u0430\u043d\u0434-\u041a\u0430\u043d\u044c\u043e\u043d\u0430.',
    '\u0412 \u0410\u043b\u043c\u0430\u0442\u044b \u0437\u0430 \u043e\u0434\u0438\u043d \u0434\u0435\u043d\u044c \u043c\u043e\u0436\u043d\u043e \u0443\u0432\u0438\u0434\u0435\u0442\u044c \u0433\u043e\u0440\u044b, \u043a\u0430\u043d\u044c\u043e\u043d\u044b \u0438 \u0441\u0442\u0435\u043f\u044c.',
  ],
  en: [
    'Kazakhstan is one of the ten largest countries in the world by area.',
    'Lake Balkhash is unusual: one side is fresh water, the other is salty.',
    'Charyn Canyon is often called the younger sibling of the Grand Canyon.',
    'Around Almaty, one day can include mountains, canyons, and steppe views.',
  ],
};

const getApiBaseUrl = () => {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  if (!__DEV__) {
    return Constants.expoConfig?.extra?.apiUrl || 'https://nomadsway.kz';
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

async function fetchWithTimeout(url, options = {}, timeoutMs = 20000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

export default function AIRouteBuilderScreen({ navigation }) {
  const { t, language } = useLocalization();
  const { addToCart } = useCart();
  const { requireAuth } = useAuth();
  const isEnglish = language === 'en';
  const loadingFacts = isEnglish ? LOADING_FACTS.en : LOADING_FACTS.ru;
  const customDaysLabel = isEnglish ? 'Custom length:' : '\u0421\u0432\u043e\u0438 \u0434\u043d\u0438:';
  const daysSuffix = isEnglish ? 'days' : '\u0434\u043d.';

  // Form state
  const [ageGroup, setAgeGroup] = useState(USER_GROUPS.FAMILY);
  const [duration, setDuration] = useState(DURATIONS.ONE_DAY);
  // Empty string = use the selected preset above; non-empty = override with N days.
  const [customDays, setCustomDays] = useState('');
  const [budgetMin, setBudgetMin] = useState('5000');
  const [budgetMax, setBudgetMax] = useState('15000');
  const [activityLevel, setActivityLevel] = useState(ACTIVITY_LEVELS.MODERATE);
  const [selectedInterests, setSelectedInterests] = useState([]);
  const [routeDescription, setRouteDescription] = useState('');

  // Route state
  const [loading, setLoading] = useState(false);
  const [route, setRoute] = useState(null);
  const [summary, setSummary] = useState(null);
  const [viewMode, setViewMode] = useState('timeline'); // 'timeline' or 'daily'
  const [formError, setFormError] = useState('');
  const [loadingPhraseIndex, setLoadingPhraseIndex] = useState(0);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [cartAddedVisible, setCartAddedVisible] = useState(false);
  const planningSpin = useRef(new Animated.Value(0)).current;
  const addCartScale = useRef(new Animated.Value(1)).current;
  const addCartToastOpacity = useRef(new Animated.Value(0)).current;
  const addCartToastY = useRef(new Animated.Value(12)).current;

  useEffect(() => {
    if (!loading) {
      planningSpin.stopAnimation();
      planningSpin.setValue(0);
      setLoadingPhraseIndex(0);
      return undefined;
    }

    const animation = Animated.loop(
      Animated.timing(planningSpin, {
        toValue: 1,
        duration: 1600,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: true,
      })
    );
    animation.start();

    const phraseTimer = setInterval(() => {
      setLoadingPhraseIndex((index) => (index + 1) % LOADING_PHRASES.length);
    }, 1300);

    return () => {
      animation.stop();
      clearInterval(phraseTimer);
    };
  }, [loading, planningSpin]);

  const planningRotation = planningSpin.interpolate({
    inputRange: [0, 1],
    outputRange: ['-8deg', '352deg'],
  });

  const runAddToCartAnimation = () => {
    setCartAddedVisible(true);
    addCartToastOpacity.setValue(0);
    addCartToastY.setValue(12);
    Animated.parallel([
      Animated.sequence([
        Animated.spring(addCartScale, {
          toValue: 0.96,
          friction: 5,
          tension: 170,
          useNativeDriver: true,
        }),
        Animated.spring(addCartScale, {
          toValue: 1.04,
          friction: 4,
          tension: 150,
          useNativeDriver: true,
        }),
        Animated.spring(addCartScale, {
          toValue: 1,
          friction: 5,
          tension: 120,
          useNativeDriver: true,
        }),
      ]),
      Animated.sequence([
        Animated.parallel([
          Animated.timing(addCartToastOpacity, {
            toValue: 1,
            duration: 180,
            useNativeDriver: true,
          }),
          Animated.timing(addCartToastY, {
            toValue: 0,
            duration: 180,
            useNativeDriver: true,
          }),
        ]),
        Animated.delay(1400),
        Animated.parallel([
          Animated.timing(addCartToastOpacity, {
            toValue: 0,
            duration: 220,
            useNativeDriver: true,
          }),
          Animated.timing(addCartToastY, {
            toValue: -8,
            duration: 220,
            useNativeDriver: true,
          }),
        ]),
      ]),
    ]).start(() => {
      setCartAddedVisible(false);
    });
  };

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

  // Resolve the duration string to send to the backend. If the user typed a
  // custom day count it wins; otherwise we fall through to the selected preset.
  const customDaysInt = (() => {
    const n = parseInt(customDays, 10);
    return Number.isFinite(n) && n >= 1 ? Math.min(30, n) : null;
  })();
  const effectiveDuration =
    customDaysInt != null ? `${customDaysInt}_days` : duration;
  const effectiveDays =
    customDaysInt != null
      ? customDaysInt
      : duration === DURATIONS.THREE_DAYS
      ? 3
      : 1; // THREE_HOURS and ONE_DAY both fit a single day
  const isMultiDay = effectiveDays > 1;

  const buildRoute = async () => {
    setFormError('');
    if (selectedInterests.length === 0) {
      setFormError(t('errorSelectInterest'));
      return;
    }

    setLoading(true);

    try {
      const response = await fetchWithTimeout(`${getApiBaseUrl()}/api/routes/build`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          duration: effectiveDuration,
          budget: {
            min: Math.min(2147483647, Math.max(0, parseInt(budgetMin) || 0)),
            max: Math.min(2147483647, Math.max(0, parseInt(budgetMax) || 100000)),
          },
          interests: selectedInterests,
          activityLevel,
          ageGroup,
          description: routeDescription.trim() || undefined,
        }),
      }, 20000);

      const data = await response.json();

      if (response.ok) {
        setRoute(data.route);
        setSummary(data.summary);
        if (!data.route || data.route.length === 0) {
          setFormError('Не нашлось мест под эти параметры. Попробуйте расширить бюджет или добавить интересы.');
        }
      } else {
        const msg = data?.error?.message || data?.error || t('routeBuildFailed');
        setFormError(msg);
        notify(t('error'), msg);
      }
    } catch (error) {
      console.error('Error building route:', error);
      const timeoutMessage = error?.name === 'AbortError'
        ? 'Сервер слишком долго строил маршрут. Попробуйте сузить бюджет, интересы или повторить запрос.'
        : t('serverConnectionError');
      setFormError(timeoutMessage);
      notify(t('error'), timeoutMessage);
    } finally {
      setLoading(false);
    }
  };

  // Organize route into day-by-day schedule with time-of-day activities
  const organizeByDays = () => {
    if (!route || route.length === 0) return [];

    const durationDays = effectiveDays;

    const days = [];
    const stopsPerDay = Math.ceil(route.length / durationDays);

    for (let day = 0; day < durationDays; day++) {
      const dayStops = route.slice(day * stopsPerDay, (day + 1) * stopsPerDay);
      if (dayStops.length === 0) continue;

      const activities = [];
      const timeSlots = ['morning', 'afternoon', 'evening'];
      const timeLabels = {
        morning: 'Утро (9:00-12:00)',
        afternoon: 'День (12:00-18:00)',
        evening: 'Вечер (18:00-21:00)',
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
  const handleAddRouteToCart = async () => {
    if (!route || route.length === 0) return;

    if (!requireAuth()) {
      navigation.navigate('Auth');
      return;
    }


    const durationDays = effectiveDays;

    setIsAddingToCart(true);
    const result = await addToCart({
      id: `custom_route_${Date.now()}`,
      type: 'tour',
      name: `Индивидуальный тур (${route.length} мест)`,
      city: route[0]?.attraction?.city || 'Казахстан',
      region: route[0]?.attraction?.region || 'mixed',
      price: { min: summary?.totalCost * 0.8, max: summary?.totalCost * 1.2 },
      durationDays: durationDays,
      stops: route.map(s => s.attraction.name),
    });
    setIsAddingToCart(false);

    if (!result?.success) {
      notify('Ошибка', result?.error || 'Не удалось добавить маршрут в корзину');
      return;
    }

    runAddToCartAnimation();
  };

  const renderForm = () => (
    <View style={styles.formContainer}>
      <Text style={styles.sectionTitle}>{t('routeParams')}</Text>

      <View style={styles.fieldContainer}>
        <Text style={styles.label}>Опишите маршрут</Text>
        <TextInput
          style={styles.descriptionInput}
          placeholder="Например: хочу спокойный маршрут по природе без долгих переездов, с красивыми видами и кафе по пути"
          placeholderTextColor="#8e8e93"
          value={routeDescription}
          onChangeText={setRouteDescription}
          multiline
          maxLength={500}
          textAlignVertical="top"
        />
      </View>

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
          {DURATION_ORDER.map((key) => {
            const isActive = customDaysInt == null && duration === key;
            return (
              <TouchableOpacity
                key={key}
                style={[
                  styles.optionButton,
                  isActive && styles.optionButtonActive,
                ]}
                onPress={() => {
                  setDuration(key);
                  setCustomDays('');
                }}
              >
                <Text
                  style={[
                    styles.optionButtonText,
                    isActive && styles.optionButtonTextActive,
                  ]}
                >
                  {t(DURATION_LABEL_KEYS[key])}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
        <View style={styles.customDaysRow}>
          <Text style={styles.customDaysLabel}>
            {customDaysLabel}
          </Text>
          <TextInput
            style={[
              styles.customDaysInput,
              customDaysInt != null && styles.customDaysInputActive,
            ]}
            placeholder="—"
            placeholderTextColor="#9aa0a6"
            keyboardType="number-pad"
            maxLength={2}
            value={customDays}
            onChangeText={(text) => {
              const cleaned = text.replace(/[^0-9]/g, '').slice(0, 2);
              setCustomDays(cleaned);
            }}
          />
          <Text style={styles.customDaysSuffix}>
            {daysSuffix}
          </Text>
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
          <Text style={styles.budgetSeparator}>-</Text>
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

      {/* Inline error */}
      {formError ? (
        <View style={styles.errorBanner}>
          <Ionicons name="alert-circle-outline" size={18} color="#d32f2f" />
          <Text style={styles.errorBannerText}>{formError}</Text>
        </View>
      ) : null}

      {/* Build Button */}
      <TouchableOpacity
        style={styles.buildButton}
        onPress={buildRoute}
        disabled={loading}
      >
        {loading ? (
          <>
            <ActivityIndicator color="#fff" />
            <Text style={styles.buildButtonText}>Маршрут варится...</Text>
          </>
        ) : (
          <>
            <Ionicons name="construct-outline" size={20} color="#fff" />
            <Text style={styles.buildButtonText}>{t('buildRoute')}</Text>
          </>
        )}
      </TouchableOpacity>

      {loading ? (
        <View style={styles.planningCard}>
          <Animated.View style={[styles.planningIcon, { transform: [{ rotate: planningRotation }] }]}>
            <Ionicons name="compass-outline" size={26} color="#d4af37" />
          </Animated.View>
          <View style={styles.planningTextWrap}>
            <Text style={styles.planningTitle}>AI-куратор прокладывает путь</Text>
            <Text style={styles.planningPhrase}>{LOADING_PHRASES[loadingPhraseIndex]}</Text>
            <View style={styles.planningFact}>
              <Ionicons name="bulb-outline" size={14} color="#d4af37" />
              <Text style={styles.planningFactText}>
                {loadingFacts[loadingPhraseIndex % loadingFacts.length]}
              </Text>
            </View>
          </View>
          <View style={styles.planningDots}>
            {[0, 1, 2].map((dot) => (
              <View
                key={dot}
                style={[
                  styles.planningDot,
                  loadingPhraseIndex % 3 === dot && styles.planningDotActive,
                ]}
              />
            ))}
          </View>
        </View>
      ) : null}
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
            {summary.narrative ? (
              <Text style={styles.narrativeText}>{summary.narrative}</Text>
            ) : null}
            {summary.curationSource === 'llm' ? (
              <View style={styles.aiBadge}>
                <Ionicons name="sparkles-outline" size={12} color="#1a4d3a" />
                <Text style={styles.aiBadgeText}>Подобрано AI-куратором</Text>
              </View>
            ) : null}
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
        {isMultiDay && (
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
        <OSMMapView
          style={styles.map}
          markers={route.map((stop, index) => ({
            id: stop.attraction.id,
            latitude: stop.attraction.latitude,
            longitude: stop.attraction.longitude,
            title: stop.attraction.name,
            description: stop.attraction.description,
            color: '#d4af37',
            label: String(index + 1),
          }))}
          polyline={coordinates}
          center={region}
          zoom={8}
          interactive={false}
          errorLabel={isEnglish ? 'Map could not be loaded.' : 'Не удалось загрузить карту.'}
        />

        {/* Route Timeline */}
        <ScrollView style={styles.timeline}>
          {route.map((stop, index) => (
            <View key={stop.attraction.id} style={styles.timelineItem}>
              <View style={styles.timelineMarker}>
                <Text style={styles.timelineNumber}>{index + 1}</Text>
              </View>
              <View style={styles.timelineContent}>
                <Text style={styles.attractionName}>{stop.attraction.name}</Text>
                {stop.why ? (
                  <View style={styles.whyChip}>
                    <Ionicons name="sparkles-outline" size={12} color="#1a4d3a" />
                    <Text style={styles.whyText}>{stop.why}</Text>
                  </View>
                ) : null}
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
        {viewMode === 'daily' && isMultiDay && (
          <View style={styles.dailySchedule}>
            <Text style={styles.dailyScheduleTitle}>Расписание по дням</Text>
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
                        <Text style={styles.activityDuration}>{activity.visitDuration} мин</Text>
                        {activity.travelTime > 0 && (
                          <Text style={styles.activityTravel}>+{activity.travelTime} мин</Text>
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
        {cartAddedVisible ? (
          <Animated.View
            style={[
              styles.cartAddedToast,
              {
                opacity: addCartToastOpacity,
                transform: [{ translateY: addCartToastY }],
              },
            ]}
          >
            <Ionicons name="checkmark-circle" size={20} color="#1a4d3a" />
            <Text style={styles.cartAddedText}>Маршрут уже в корзине</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Cart')} style={styles.cartAddedLink}>
              <Text style={styles.cartAddedLinkText}>Открыть</Text>
            </TouchableOpacity>
          </Animated.View>
        ) : null}

        <Animated.View style={{ transform: [{ scale: addCartScale }] }}>
          <TouchableOpacity
            style={[styles.addToCartButton, isAddingToCart && styles.addToCartButtonBusy]}
            onPress={handleAddRouteToCart}
            disabled={isAddingToCart}
          >
            {isAddingToCart ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Ionicons name="cart-outline" size={20} color="#fff" />
            )}
            <Text style={styles.addToCartText}>
              {isAddingToCart ? 'Добавляем...' : 'Добавить маршрут в корзину'}
            </Text>
          </TouchableOpacity>
        </Animated.View>
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
  customDaysRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 8,
  },
  customDaysLabel: {
    color: '#666',
    fontSize: 14,
  },
  customDaysInput: {
    width: 64,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    color: '#1a4d3a',
    backgroundColor: '#fff',
    textAlign: 'center',
  },
  customDaysInputActive: {
    borderColor: '#1a4d3a',
    borderWidth: 2,
  },
  customDaysSuffix: {
    color: '#666',
    fontSize: 14,
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
  descriptionInput: {
    minHeight: 104,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontSize: 15,
    lineHeight: 21,
    color: '#222',
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
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#ffe5e5',
    borderColor: '#d32f2f',
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  errorBannerText: {
    color: '#a01717',
    fontSize: 13,
    flex: 1,
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
  planningCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0d231b',
    borderRadius: 12,
    padding: 14,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#1a4d3a',
  },
  planningIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#173f31',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  planningTextWrap: {
    flex: 1,
  },
  planningTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 3,
  },
  planningPhrase: {
    color: '#d7e6de',
    fontSize: 13,
    lineHeight: 18,
  },
  planningFact: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(212, 175, 55, 0.22)',
    gap: 6,
  },
  planningFactText: {
    flex: 1,
    color: '#f4e9bb',
    fontSize: 12,
    lineHeight: 17,
  },
  planningDots: {
    flexDirection: 'row',
    gap: 4,
    marginLeft: 8,
  },
  planningDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#315f4c',
  },
  planningDotActive: {
    backgroundColor: '#d4af37',
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
  narrativeText: {
    color: '#f5f5f5',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
    fontStyle: 'italic',
  },
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    backgroundColor: '#d4af37',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    marginBottom: 10,
  },
  aiBadgeText: {
    color: '#1a4d3a',
    fontSize: 11,
    fontWeight: '700',
  },
  whyChip: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    backgroundColor: '#fff8e1',
    borderLeftWidth: 3,
    borderLeftColor: '#d4af37',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    marginBottom: 8,
  },
  whyText: {
    color: '#5a4a1a',
    fontSize: 13,
    lineHeight: 18,
    flex: 1,
  },
  map: {
    height: 300,
    marginHorizontal: 15,
    borderRadius: 10,
    overflow: 'hidden',
  },
  mapFallback: {
    backgroundColor: '#0d231b',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  mapFallbackText: {
    color: '#d7e6de',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginTop: 10,
  },
  externalMapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: '#d4af37',
  },
  externalMapButtonText: {
    color: '#08110d',
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 6,
    textAlign: 'center',
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
  addToCartButtonBusy: {
    opacity: 0.82,
  },
  addToCartText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cartAddedToast: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f5e9',
    borderColor: '#1a4d3a',
    borderWidth: 1,
    borderRadius: 14,
    marginHorizontal: 15,
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 8,
  },
  cartAddedText: {
    flex: 1,
    color: '#1a4d3a',
    fontSize: 14,
    fontWeight: '700',
  },
  cartAddedLink: {
    backgroundColor: '#1a4d3a',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  cartAddedLinkText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
});
