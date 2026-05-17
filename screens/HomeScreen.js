import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeIn, FadeInRight } from 'react-native-reanimated';

import { useLocalization } from '../contexts/LocalizationContext';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import HotToursSection from '../components/HotToursSection';
import Card from '../components/ui/Card';
import Pill from '../components/ui/Pill';
import AttractionCard from '../components/ui/AttractionCard';
import FallbackImage from '../components/ui/FallbackImage';
import attractionsData from '../data/attractions.json';
import { getImageUri } from '../utils/imageSources';
import { tokens } from '../theme/tokens';

const QUICK_ACTIONS = [
  { id: 'ai', icon: 'sparkles', screen: 'AIGuide', accent: tokens.palette.gold, isAI: true },
  { id: 'route', icon: 'map', screen: 'PersonalizedRoute', accent: tokens.palette.emerald },
  { id: 'cart', icon: 'cart', screen: 'Cart', accent: '#EF4444' },
  { id: 'tools', icon: 'compass', screen: 'TravelerTools', accent: tokens.palette.info },
  { id: 'region', icon: 'globe', screen: 'RegionalGuide', accent: '#A855F7' },
];

const QUICK_LABELS = {
  ru: {
    ai: 'AI-Агент',
    route: 'Маршрут',
    cart: 'Корзина',
    tools: 'Инструменты',
    region: 'Регионы',
  },
  en: {
    ai: 'AI Agent',
    route: 'Route',
    cart: 'Cart',
    tools: 'Tools',
    region: 'Regions',
  },
};

export default function HomeScreen({ navigation }) {
  const { t, language } = useLocalization();
  const { getItemCount } = useCart();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = React.useState(false);

  const featured = useMemo(
    () =>
      [...(attractionsData.attractions || [])]
        .filter((a) => getImageUri(a) && (a.rating || 0) >= 4.5)
        .sort((a, b) => (b.rating || 0) - (a.rating || 0))
        .slice(0, 8),
    []
  );

  const recentlyAdded = useMemo(
    () => (attractionsData.attractions || []).slice(-5).reverse(),
    []
  );

  const handleQuickAction = (action) => {
    if (action.screen === 'Cart' || action.screen === 'PersonalizedRoute') {
      navigation.navigate(action.screen);
    } else {
      navigation.navigate(action.screen);
    }
  };

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  }, []);

  const quickLabels = QUICK_LABELS[language === 'en' ? 'en' : 'ru'];
  const isRu = language !== 'en';
  const greeting = user?.displayName || user?.fullName?.split(' ')[0];

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 12 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={tokens.palette.gold}
          />
        }
      >
        {/* ===== Top bar ===== */}
        <Animated.View entering={FadeIn.duration(500)} style={styles.topBar}>
          <View style={styles.brandRow}>
            <View style={styles.logoMark}>
              <Ionicons name="compass" size={20} color={tokens.palette.ink0} />
            </View>
            <View>
              <Text style={styles.brand}>NomadWay</Text>
              <Text style={styles.tagline}>{isRu ? 'Открой Казахстан' : 'Discover Kazakhstan'}</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.cartIcon}
            onPress={() => navigation.navigate('Cart')}
            hitSlop={8}
          >
            <Ionicons name="cart-outline" size={22} color={tokens.palette.textHi} />
            {getItemCount() > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{getItemCount()}</Text>
              </View>
            )}
          </TouchableOpacity>
        </Animated.View>

        {/* ===== Hero greeting ===== */}
        <Animated.View entering={FadeInDown.delay(80).duration(550)} style={styles.heroBlock}>
          <Text style={styles.heroLabel}>
            {greeting
              ? `${isRu ? 'Привет' : 'Hi'}, ${greeting} 👋`
              : (isRu ? 'Добро пожаловать' : 'Welcome')}
          </Text>
          <Text style={styles.heroTitle}>
            {isRu ? 'Куда отправимся\nсегодня?' : 'Where to\nnext?'}
          </Text>
        </Animated.View>

        {/* ===== AI Agent CTA ===== */}
        <Animated.View entering={FadeInDown.delay(150).duration(550)} style={styles.aiCardWrap}>
          <TouchableOpacity activeOpacity={0.92} onPress={() => navigation.navigate('AIGuide')}>
            <LinearGradient
              colors={['rgba(212, 175, 55, 0.18)', 'rgba(82, 183, 136, 0.12)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.aiCard}
            >
              <View style={styles.aiIconWrap}>
                <LinearGradient
                  colors={tokens.gradients.gold}
                  style={styles.aiIcon}
                >
                  <Ionicons name="sparkles" size={22} color={tokens.palette.ink0} />
                </LinearGradient>
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.aiTitleRow}>
                  <Text style={styles.aiTitle}>
                    {isRu ? 'AI-Агент NomadWay' : 'NomadWay AI Agent'}
                  </Text>
                  <View style={styles.liveBadge}>
                    <View style={styles.liveDot} />
                    <Text style={styles.liveText}>LIVE</Text>
                  </View>
                </View>
                <Text style={styles.aiSubtitle}>
                  {isRu
                    ? 'Умный помощник · проверенная база знаний'
                    : 'Smart concierge · curated knowledge base'}
                </Text>
                <View style={styles.aiPillRow}>
                  <Pill label={isRu ? 'Маршруты' : 'Routes'} icon="map-outline" />
                  <Pill label={isRu ? 'Сезоны' : 'Seasons'} icon="snow-outline" />
                  <Pill label={isRu ? 'Бюджет' : 'Budget'} icon="cash-outline" />
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color={tokens.palette.gold} />
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        {/* ===== Quick actions ===== */}
        <View style={styles.section}>
          <Animated.View entering={FadeInDown.delay(220)} style={styles.quickRow}>
            {QUICK_ACTIONS.map((action, idx) => (
              <Animated.View
                key={action.id}
                entering={FadeInRight.delay(240 + idx * 60).duration(450)}
                style={{ flex: 1 }}
              >
                <TouchableOpacity
                  onPress={() => handleQuickAction(action)}
                  activeOpacity={0.85}
                  style={styles.quickAction}
                >
                  <View
                    style={[
                      styles.quickIcon,
                      action.isAI && styles.quickIconAI,
                      { borderColor: action.accent + '55' },
                    ]}
                  >
                    <Ionicons
                      name={action.icon}
                      size={20}
                      color={action.accent}
                    />
                    {action.id === 'cart' && getItemCount() > 0 && (
                      <View style={styles.quickBadge}>
                        <Text style={styles.quickBadgeText}>{getItemCount()}</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.quickLabel} numberOfLines={1}>
                    {quickLabels[action.id]}
                  </Text>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </Animated.View>
        </View>

        {/* ===== Featured destinations carousel ===== */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>
                {isRu ? 'Топ направления' : 'Top destinations'}
              </Text>
              <Text style={styles.sectionSubtitle}>
                {isRu ? 'Лучшие места Казахстана' : 'The best of Kazakhstan'}
              </Text>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate('Tours')}>
              <Text style={styles.seeAll}>{isRu ? 'Все' : 'See all'}</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            decelerationRate="fast"
            snapToInterval={236}
            snapToAlignment="start"
            contentContainerStyle={styles.carousel}
          >
            {featured.map((attraction, idx) => (
              <View key={attraction.id} style={{ marginRight: 12 }}>
                <AttractionCard
                  attraction={attraction}
                  index={idx}
                  onPress={() =>
                    navigation.navigate('AttractionDetails', { attraction })
                  }
                />
              </View>
            ))}
          </ScrollView>
        </View>

        {/* ===== Hot tours (legacy section preserved) ===== */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{isRu ? 'Горячие туры' : 'Hot tours'}</Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('Home', { screen: 'Tours' })}
            >
              <Text style={styles.seeAll}>{isRu ? 'Все' : 'See all'}</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.hotWrap}>
            <HotToursSection
              onTourPress={(tour) =>
                navigation.navigate('AttractionDetails', { attraction: tour })
              }
              onAddToCart={() => {}}
              onSeeAllPress={() => navigation.navigate('Home', { screen: 'Tours' })}
              language={language}
            />
          </View>
        </View>

        {/* ===== Recently added ===== */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{isRu ? 'Новое' : 'Just added'}</Text>
          </View>
          {recentlyAdded.slice(0, 3).map((attraction, idx) => (
            <Animated.View
              key={attraction.id}
              entering={FadeInDown.delay(idx * 80).duration(500)}
              style={{ marginBottom: 12 }}
            >
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() =>
                  navigation.navigate('AttractionDetails', { attraction })
                }
              >
                <Card padding={0} style={styles.recentCard}>
                  <FallbackImage
                    item={attraction}
                    style={styles.recentImage}
                  />
                  <View style={styles.recentBody}>
                    <Text style={styles.recentTitle} numberOfLines={1}>
                      {attraction.name}
                    </Text>
                    <Text style={styles.recentMeta} numberOfLines={2}>
                      {attraction.description}
                    </Text>
                    <View style={styles.recentFooter}>
                      <View style={styles.recentRating}>
                        <Ionicons name="star" size={11} color={tokens.palette.gold} />
                        <Text style={styles.recentRatingText}>
                          {attraction.rating?.toFixed(1) || '—'}
                        </Text>
                      </View>
                      <Text style={styles.recentCity} numberOfLines={1}>
                        {attraction.city || ''}
                      </Text>
                    </View>
                  </View>
                </Card>
              </TouchableOpacity>
            </Animated.View>
          ))}
        </View>

        <View style={{ height: 80 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: tokens.palette.ink0 },
  scroll: { paddingHorizontal: tokens.spacing.lg, paddingBottom: tokens.spacing.xxl },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: tokens.spacing.xl,
  },
  brandRow: { flexDirection: 'row', alignItems: 'center' },
  logoMark: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: tokens.palette.gold,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  brand: {
    color: tokens.palette.textHi,
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  tagline: {
    color: tokens.palette.textMid,
    fontSize: 11,
    marginTop: 1,
  },
  cartIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: tokens.palette.glass,
    borderWidth: 1,
    borderColor: tokens.palette.hairline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartBadgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },

  heroBlock: { marginBottom: tokens.spacing.xl },
  heroLabel: {
    color: tokens.palette.gold,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  },
  heroTitle: {
    color: tokens.palette.textHi,
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.5,
    lineHeight: 38,
  },

  // AI card
  aiCardWrap: { marginBottom: tokens.spacing.xl },
  aiCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: tokens.spacing.lg,
    borderRadius: tokens.radii.lg,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
  },
  aiIconWrap: { marginRight: tokens.spacing.md },
  aiIcon: {
    width: 48,
    height: 48,
    borderRadius: tokens.radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiTitleRow: { flexDirection: 'row', alignItems: 'center' },
  aiTitle: {
    color: tokens.palette.textHi,
    fontSize: 15,
    fontWeight: '700',
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(34, 197, 94, 0.18)',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 8,
  },
  liveDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: '#22C55E', marginRight: 4 },
  liveText: {
    color: '#22C55E',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  aiSubtitle: {
    color: tokens.palette.textMid,
    fontSize: 12,
    marginTop: 3,
    marginBottom: 8,
  },
  aiPillRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },

  // Quick actions
  quickRow: { flexDirection: 'row', gap: tokens.spacing.sm },
  quickAction: { alignItems: 'center' },
  quickIcon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: tokens.palette.ink1,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  quickIconAI: {
    backgroundColor: 'rgba(212, 175, 55, 0.12)',
  },
  quickLabel: {
    color: tokens.palette.textMid,
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  quickBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#EF4444',
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickBadgeText: { color: '#fff', fontSize: 9, fontWeight: '700' },

  // Sections
  section: { marginBottom: tokens.spacing.xl },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: tokens.spacing.md,
  },
  sectionTitle: {
    color: tokens.palette.textHi,
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  sectionSubtitle: {
    color: tokens.palette.textMid,
    fontSize: 12,
    marginTop: 2,
  },
  seeAll: {
    color: tokens.palette.gold,
    fontSize: 13,
    fontWeight: '600',
  },
  carousel: { paddingRight: tokens.spacing.lg },

  // HotTours wrapper (legacy white card collides with dark BG)
  hotWrap: {
    marginHorizontal: -tokens.spacing.lg,
  },

  // Recent
  recentCard: {
    flexDirection: 'row',
    padding: 0,
    overflow: 'hidden',
  },
  recentImage: {
    width: 110,
    height: 110,
  },
  recentBody: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  recentTitle: {
    color: tokens.palette.textHi,
    fontSize: 14,
    fontWeight: '700',
  },
  recentMeta: {
    color: tokens.palette.textMid,
    fontSize: 11,
    lineHeight: 15,
    marginTop: 4,
  },
  recentFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  recentRating: { flexDirection: 'row', alignItems: 'center' },
  recentRatingText: {
    color: tokens.palette.gold,
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 3,
  },
  recentCity: {
    color: tokens.palette.textLo,
    fontSize: 10,
    maxWidth: 100,
  },
});
