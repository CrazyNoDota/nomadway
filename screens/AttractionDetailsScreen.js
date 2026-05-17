import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
  Linking,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Sharing from 'expo-sharing';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedScrollHandler,
  useSharedValue,
  useAnimatedStyle,
  interpolate,
  Extrapolate,
  FadeInDown,
} from 'react-native-reanimated';

import { useLocalization } from '../contexts/LocalizationContext';
import { getTranslatedAttraction } from '../utils/attractionTranslations';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import Card from '../components/ui/Card';
import Pill from '../components/ui/Pill';
import Button from '../components/ui/Button';
import OSMMapView from '../components/OSMMapView';
import { getImageCandidates, getImageUri } from '../utils/imageSources';
import { tokens } from '../theme/tokens';

const { width } = Dimensions.get('window');
const HERO_HEIGHT = 360;

export default function AttractionDetailsScreen({ route, navigation }) {
  const { attraction: originalAttraction } = route.params;
  const { language, t } = useLocalization();
  const attraction = getTranslatedAttraction(originalAttraction, language);
  const insets = useSafeAreaInsets();
  const { addToCart } = useCart();
  const { requireAuth } = useAuth();

  const isRu = language !== 'en';
  const [isSaved, setIsSaved] = useState(false);

  const hasLocation =
    typeof attraction?.latitude === 'number' && typeof attraction?.longitude === 'number';
  const isTour =
    attraction?.id?.toString().startsWith('tour_') || attraction?.id?.toString().startsWith('hot_');
  const price =
    attraction?.budget ||
    attraction?.price ||
    (attraction?.discountPrice
      ? { min: attraction.discountPrice, max: attraction.originalPrice || attraction.discountPrice }
      : null);
  const imageCandidates = getImageCandidates(attraction);
  const [imageIndex, setImageIndex] = useState(0);
  const imageUri = imageCandidates[imageIndex] || getImageUri(attraction);

  useEffect(() => {
    AsyncStorage.getItem(`saved_${attraction.id}`)
      .then((saved) => setIsSaved(saved !== null))
      .catch(() => {});
  }, [attraction.id]);

  useEffect(() => {
    setImageIndex(0);
  }, [attraction.id]);

  const toggleSave = async () => {
    try {
      if (isSaved) {
        await AsyncStorage.removeItem(`saved_${attraction.id}`);
        setIsSaved(false);
      } else {
        await AsyncStorage.setItem(`saved_${attraction.id}`, JSON.stringify(attraction));
        setIsSaved(true);
      }
    } catch (e) {
      console.error('save error', e);
    }
  };

  const shareAttraction = async () => {
    try {
      const ok = await Sharing.isAvailableAsync();
      if (ok) {
        await Sharing.shareAsync({
          message: `${attraction.name}\n${attraction.description}\n\nNomadWay`,
        });
      }
    } catch (e) {
      console.error('share error', e);
    }
  };

  const handleAddToCart = () => {
    if (!requireAuth()) return;
    addToCart({
      id: attraction.id,
      type: isTour ? 'tour' : 'attraction',
      name: attraction.name,
      city: attraction.city,
      region: attraction.region,
      price,
      durationDays: attraction.durationDays || 1,
      bestSeason: attraction.bestSeason,
      image: imageUri,
    });
    Alert.alert(
      isRu ? 'Добавлено в корзину' : 'Added to cart',
      `${attraction.name}`,
      [
        { text: isRu ? 'Продолжить' : 'Continue', style: 'cancel' },
        { text: isRu ? 'Открыть корзину' : 'View cart', onPress: () => navigation.navigate('Cart') },
      ]
    );
  };

  const askAIAboutThisPlace = () => {
    navigation.navigate('AIGuide', {
      seedQuestion: isRu
        ? `Расскажи подробнее про "${attraction.name}". Что посмотреть, когда лучше ехать и сколько стоит?`
        : `Tell me more about "${attraction.nameEn || attraction.name}". What to see, when to go, and costs?`,
    });
  };

  const openAttribution = () => {
    if (attraction.imageAttribution?.sourceUrl) {
      Linking.openURL(attraction.imageAttribution.sourceUrl).catch(() => {});
    }
  };

  // Parallax scroll
  const scrollY = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler({
    onScroll: (e) => {
      scrollY.value = e.contentOffset.y;
    },
  });
  const heroStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: interpolate(
          scrollY.value,
          [-HERO_HEIGHT, 0, HERO_HEIGHT],
          [-HERO_HEIGHT / 2, 0, HERO_HEIGHT * 0.4],
          Extrapolate.CLAMP
        ),
      },
      {
        scale: interpolate(
          scrollY.value,
          [-HERO_HEIGHT, 0],
          [1.4, 1],
          Extrapolate.CLAMP
        ),
      },
    ],
  }));
  const headerBgStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [120, 220], [0, 1], Extrapolate.CLAMP),
  }));

  return (
    <View style={styles.root}>
      {/* Sticky top bar */}
      <Animated.View
        style={[styles.topBarBg, { paddingTop: insets.top }, headerBgStyle]}
        pointerEvents="none"
      />
      <View style={[styles.topBar, { paddingTop: insets.top + 6 }]}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.goBack()} hitSlop={8}>
          <Ionicons name="chevron-back" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={{ flexDirection: 'row' }}>
          <TouchableOpacity style={styles.iconBtn} onPress={shareAttraction} hitSlop={8}>
            <Ionicons name="share-outline" size={20} color="#fff" />
          </TouchableOpacity>
          <View style={{ width: 8 }} />
          <TouchableOpacity style={styles.iconBtn} onPress={toggleSave} hitSlop={8}>
            <Ionicons
              name={isSaved ? 'bookmark' : 'bookmark-outline'}
              size={20}
              color={isSaved ? tokens.palette.gold : '#fff'}
            />
          </TouchableOpacity>
        </View>
      </View>

      <Animated.ScrollView
        onScroll={onScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 160 }}
      >
        {/* Parallax hero */}
        <View style={styles.heroWrap}>
          <Animated.Image
            source={{ uri: imageUri }}
            style={[styles.heroImage, heroStyle]}
            resizeMode="cover"
            onError={() => {
              if (imageIndex < imageCandidates.length - 1) {
                setImageIndex(imageIndex + 1);
              }
            }}
          />
          <LinearGradient
            colors={['transparent', 'rgba(8, 17, 13, 0.6)', tokens.palette.ink0]}
            style={styles.heroOverlay}
          />
          {attraction.imageAttribution?.source && (
            <TouchableOpacity style={styles.attribution} onPress={openAttribution}>
              <Ionicons name="information-circle-outline" size={11} color={tokens.palette.textMid} />
              <Text style={styles.attributionText} numberOfLines={1}>
                {attraction.imageAttribution.source}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Body */}
        <View style={styles.body}>
          <Animated.View entering={FadeInDown.duration(500)}>
            <View style={styles.titleRow}>
              <Text style={styles.title}>{attraction.name}</Text>
              {attraction.rating != null && (
                <View style={styles.ratingBig}>
                  <Ionicons name="star" size={14} color={tokens.palette.gold} />
                  <Text style={styles.ratingBigText}>{attraction.rating.toFixed(1)}</Text>
                </View>
              )}
            </View>

            <View style={styles.metaRow}>
              {attraction.city && (
                <View style={styles.metaItem}>
                  <Ionicons name="location-outline" size={13} color={tokens.palette.gold} />
                  <Text style={styles.metaText}>{attraction.city}</Text>
                </View>
              )}
              {attraction.averageVisitDuration && (
                <View style={styles.metaItem}>
                  <Ionicons name="time-outline" size={13} color={tokens.palette.gold} />
                  <Text style={styles.metaText}>
                    ~{Math.round(attraction.averageVisitDuration / 60)} {isRu ? 'ч' : 'h'}
                  </Text>
                </View>
              )}
              {attraction.difficultyLevel && (
                <View style={styles.metaItem}>
                  <Ionicons name="trending-up-outline" size={13} color={tokens.palette.gold} />
                  <Text style={styles.metaText}>{attraction.difficultyLevel}</Text>
                </View>
              )}
            </View>

            {/* Tags */}
            <View style={styles.tagRow}>
              {attraction.category && <Pill label={attraction.category} icon="pricetag-outline" />}
              {(attraction.interests || []).slice(0, 3).map((tag) => (
                <Pill key={tag} label={tag} />
              ))}
            </View>
          </Animated.View>

          {/* AI ask card */}
          <Animated.View entering={FadeInDown.delay(80).duration(500)}>
            <TouchableOpacity activeOpacity={0.92} onPress={askAIAboutThisPlace}>
              <LinearGradient
                colors={['rgba(212, 175, 55, 0.16)', 'rgba(82, 183, 136, 0.08)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.askAI}
              >
                <View style={styles.askAIIcon}>
                  <Ionicons name="sparkles" size={18} color={tokens.palette.ink0} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.askAITitle}>
                    {isRu ? 'Спросить AI-агента' : 'Ask the AI agent'}
                  </Text>
                  <Text style={styles.askAISubtitle}>
                    {isRu
                      ? `Что посмотреть, маршруты, советы по ${attraction.name}`
                      : `Routes, tips, what to see at ${attraction.nameEn || attraction.name}`}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={tokens.palette.gold} />
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>

          {/* Description */}
          <Animated.View entering={FadeInDown.delay(160).duration(500)}>
            <Text style={styles.sectionLabel}>{isRu ? 'О месте' : 'About'}</Text>
            <Text style={styles.description}>
              {attraction.longDescription ||
                attraction.description ||
                (isRu ? 'Описание скоро появится.' : 'Description coming soon.')}
            </Text>
          </Animated.View>

          {/* Price card */}
          {price && (
            <Animated.View entering={FadeInDown.delay(220).duration(500)}>
              <Card style={styles.priceCard}>
                <View style={styles.priceHead}>
                  <Ionicons name="cash-outline" size={18} color={tokens.palette.gold} />
                  <Text style={styles.priceHeadText}>{isRu ? 'Бюджет' : 'Budget'}</Text>
                </View>
                {attraction.discountPrice ? (
                  <View style={styles.priceRow}>
                    <Text style={styles.priceOld}>
                      {new Intl.NumberFormat('ru-RU').format(attraction.originalPrice)} ₸
                    </Text>
                    <Text style={styles.priceNew}>
                      {new Intl.NumberFormat('ru-RU').format(attraction.discountPrice)} ₸
                    </Text>
                  </View>
                ) : (
                  <Text style={styles.priceNew}>
                    {price.min != null && price.max != null
                      ? `${new Intl.NumberFormat('ru-RU').format(price.min)} – ${new Intl.NumberFormat('ru-RU').format(price.max)} ₸`
                      : `${new Intl.NumberFormat('ru-RU').format(price.min || price.max)} ₸`}
                  </Text>
                )}
              </Card>
            </Animated.View>
          )}

          {/* Map */}
          {hasLocation && (
            <Animated.View entering={FadeInDown.delay(280).duration(500)}>
              <Text style={styles.sectionLabel}>{isRu ? 'На карте' : 'On the map'}</Text>
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() =>
                  navigation.navigate('MapScreen', {
                    attractions: [attraction],
                    title: attraction.name,
                    zoomToPlace: {
                      latitude: attraction.latitude,
                      longitude: attraction.longitude,
                    },
                  })
                }
                style={styles.mapWrap}
              >
                <View pointerEvents="none" style={StyleSheet.absoluteFillObject}>
                  <OSMMapView
                    style={StyleSheet.absoluteFillObject}
                    markers={[{
                      id: attraction.id,
                      latitude: attraction.latitude,
                      longitude: attraction.longitude,
                      title: attraction.name,
                      description: attraction.description,
                      color: tokens.palette.gold,
                    }]}
                    center={{
                      latitude: attraction.latitude,
                      longitude: attraction.longitude,
                    }}
                    zoom={11}
                    interactive={false}
                    errorLabel={isRu ? 'Не удалось загрузить карту.' : 'Map could not be loaded.'}
                  />
                </View>
                <View style={styles.mapHint}>
                  <Ionicons name="expand-outline" size={14} color="#fff" />
                  <Text style={styles.mapHintText}>{isRu ? 'Открыть карту' : 'Open map'}</Text>
                </View>
              </TouchableOpacity>
            </Animated.View>
          )}

          {/* AI summary (existing data) */}
          {attraction.aiSummary && (
            <Animated.View entering={FadeInDown.delay(340).duration(500)}>
              <Text style={styles.sectionLabel}>
                {isRu ? 'AI разбор отзывов' : 'AI review analysis'}
              </Text>
              <Card tint="gold">
                <Text style={styles.aiSummaryText}>{attraction.aiSummary.summary}</Text>
                <View style={styles.prosCons}>
                  <View style={styles.prosCol}>
                    <Text style={styles.prosTitle}>+ {isRu ? 'Плюсы' : 'Pros'}</Text>
                    {attraction.aiSummary.pros.map((p, i) => (
                      <Text key={i} style={styles.proConItem}>
                        · {p}
                      </Text>
                    ))}
                  </View>
                  <View style={styles.consCol}>
                    <Text style={styles.consTitle}>− {isRu ? 'Минусы' : 'Cons'}</Text>
                    {attraction.aiSummary.cons.map((c, i) => (
                      <Text key={i} style={styles.proConItem}>
                        · {c}
                      </Text>
                    ))}
                  </View>
                </View>
              </Card>
            </Animated.View>
          )}

          {/* Reviews */}
          {attraction.reviews?.length > 0 && (
            <Animated.View entering={FadeInDown.delay(400).duration(500)}>
              <Text style={styles.sectionLabel}>
                {isRu ? 'Отзывы' : 'Reviews'} · {attraction.reviews.length}
              </Text>
              {attraction.reviews.map((r) => (
                <Card key={r.id} style={{ marginBottom: 10 }}>
                  <View style={styles.reviewHead}>
                    <Text style={styles.reviewAuthor}>{r.author}</Text>
                    <View style={{ flexDirection: 'row' }}>
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Ionicons
                          key={s}
                          name={s <= r.rating ? 'star' : 'star-outline'}
                          size={11}
                          color={tokens.palette.gold}
                        />
                      ))}
                    </View>
                  </View>
                  <Text style={styles.reviewDate}>{r.date}</Text>
                  <Text style={styles.reviewText}>{r.text}</Text>
                </Card>
              ))}
            </Animated.View>
          )}
        </View>
      </Animated.ScrollView>

      {/* Sticky CTA */}
      <View style={[styles.cta, { paddingBottom: insets.bottom + 12 }]}>
        <LinearGradient
          colors={['transparent', tokens.palette.ink0]}
          style={styles.ctaFade}
          pointerEvents="none"
        />
        <Button
          label={isRu ? 'Добавить в корзину' : 'Add to cart'}
          icon="cart"
          onPress={handleAddToCart}
          fullWidth
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: tokens.palette.ink0 },

  // Top bar
  topBarBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 0,
    paddingBottom: 12,
    backgroundColor: tokens.palette.ink0,
    borderBottomWidth: 1,
    borderBottomColor: tokens.palette.hairline,
    zIndex: 9,
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: tokens.spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(8, 17, 13, 0.55)',
    borderWidth: 1,
    borderColor: tokens.palette.hairline,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Hero
  heroWrap: { height: HERO_HEIGHT, overflow: 'hidden' },
  heroImage: { width, height: HERO_HEIGHT + 100, position: 'absolute', top: -50 },
  heroOverlay: { ...StyleSheet.absoluteFillObject },
  attribution: {
    position: 'absolute',
    bottom: 82,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(8, 17, 13, 0.7)',
    borderWidth: 1,
    borderColor: tokens.palette.hairline,
    maxWidth: 160,
  },
  attributionText: {
    color: tokens.palette.textMid,
    fontSize: 10,
    marginLeft: 4,
  },

  // Body
  body: { paddingHorizontal: tokens.spacing.lg, marginTop: -40 },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  title: {
    flex: 1,
    color: tokens.palette.textHi,
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.4,
    marginRight: 12,
  },
  ratingBig: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(212, 175, 55, 0.16)',
    borderColor: 'rgba(212, 175, 55, 0.4)',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  ratingBigText: {
    color: tokens.palette.gold,
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 4,
  },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 8, marginBottom: 14 },
  metaItem: { flexDirection: 'row', alignItems: 'center', marginRight: 14 },
  metaText: { color: tokens.palette.textMid, fontSize: 12, marginLeft: 4 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: tokens.spacing.lg },

  // AI ask
  askAI: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: tokens.spacing.md,
    borderRadius: tokens.radii.lg,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
    marginBottom: tokens.spacing.lg,
  },
  askAIIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: tokens.palette.gold,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  askAITitle: {
    color: tokens.palette.textHi,
    fontSize: 14,
    fontWeight: '700',
  },
  askAISubtitle: {
    color: tokens.palette.textMid,
    fontSize: 11,
    marginTop: 2,
  },

  sectionLabel: {
    color: tokens.palette.textHi,
    fontSize: 16,
    fontWeight: '700',
    marginTop: tokens.spacing.lg,
    marginBottom: tokens.spacing.sm,
  },
  description: {
    color: tokens.palette.textMid,
    fontSize: 14,
    lineHeight: 22,
  },

  // Price
  priceCard: { marginTop: tokens.spacing.lg },
  priceHead: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  priceHeadText: {
    color: tokens.palette.textMid,
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  priceOld: {
    color: tokens.palette.textLo,
    fontSize: 14,
    textDecorationLine: 'line-through',
  },
  priceNew: {
    color: tokens.palette.textHi,
    fontSize: 18,
    fontWeight: '800',
  },

  // Map
  mapWrap: {
    height: 180,
    borderRadius: tokens.radii.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: tokens.palette.hairline,
  },
  mapFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#0f2e22',
  },
  mapFallbackText: {
    color: '#d4af37',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 8,
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
  },
  mapHint: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(8, 17, 13, 0.7)',
    borderWidth: 1,
    borderColor: tokens.palette.hairline,
  },
  mapHintText: { color: '#fff', fontSize: 11, fontWeight: '600', marginLeft: 4 },

  // AI summary
  aiSummaryText: {
    color: tokens.palette.textHi,
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 12,
  },
  prosCons: { flexDirection: 'row', gap: tokens.spacing.lg },
  prosCol: { flex: 1 },
  consCol: { flex: 1 },
  prosTitle: { color: tokens.palette.success, fontSize: 12, fontWeight: '700', marginBottom: 6 },
  consTitle: { color: '#F59E0B', fontSize: 12, fontWeight: '700', marginBottom: 6 },
  proConItem: {
    color: tokens.palette.textMid,
    fontSize: 12,
    lineHeight: 18,
  },

  // Reviews
  reviewHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reviewAuthor: { color: tokens.palette.textHi, fontSize: 13, fontWeight: '700' },
  reviewDate: { color: tokens.palette.textLo, fontSize: 10, marginTop: 2 },
  reviewText: { color: tokens.palette.textMid, fontSize: 13, lineHeight: 19, marginTop: 6 },

  // CTA
  cta: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: tokens.spacing.lg,
    paddingTop: 20,
  },
  ctaFade: {
    position: 'absolute',
    top: -40,
    left: 0,
    right: 0,
    height: 60,
  },
});
