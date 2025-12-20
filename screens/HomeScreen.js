import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalization } from '../contexts/LocalizationContext';
import { useTheme } from '../contexts/ThemeContext';
import HotToursSection from '../components/HotToursSection';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';

export default function HomeScreen({ navigation }) {
  const { t, language } = useLocalization();
  const { colors, isDark } = useTheme();
  const { addToCart, getItemCount } = useCart();
  const { requireAuth } = useAuth();
  const [activeTab, setActiveTab] = useState('tours');

  // Category tabs similar to the design
  const categoryTabs = [
    { key: 'tours', label: language === 'en' ? 'Tours' : 'Туры', icon: 'airplane' },
    { key: 'attractions', label: language === 'en' ? 'Places' : 'Места', icon: 'compass' },
    { key: 'routes', label: language === 'en' ? 'Routes' : 'Маршруты', icon: 'map' },
    { key: 'hot', label: language === 'en' ? 'Hot' : 'Горящие', icon: 'flame', isHot: true },
  ];

  const quickActions = [
    {
      id: 0,
      titleKey: 'cartTitle',
      subtitleKey: 'cartSubtitle',
      icon: 'cart',
      color: '#e74c3c',
      screen: 'Cart',
    },
    {
      id: 1,
      titleKey: 'aiGuideTitle',
      subtitleKey: 'aiGuideSubtitle',
      icon: 'sparkles',
      color: '#d4af37',
      screen: 'AIGuide',
    },
    {
      id: 2,
      titleKey: 'toolsTitle',
      subtitleKey: 'toolsSubtitle',
      icon: 'briefcase',
      color: '#3498db',
      screen: 'TravelerTools',
    },
    {
      id: 3,
      titleKey: 'personalizedRouteTitle',
      subtitleKey: 'personalizedRouteSubtitle',
      icon: 'map',
      color: '#27ae60',
      screen: 'PersonalizedRoute',
    },
    {
      id: 4,
      titleKey: 'regionalGuideTitle',
      subtitleKey: 'regionalGuideSubtitle',
      icon: 'location',
      color: '#e74c3c',
      screen: 'RegionalGuide',
    },
  ];

  const handleTabPress = (tabKey) => {
    setActiveTab(tabKey);
    if (tabKey === 'attractions') {
      navigation.navigate('Home', { screen: 'Tours' });
    } else if (tabKey === 'routes') {
      navigation.navigate('Home', { screen: 'Tours' });
    }
  };

  const handleTourPress = (tour) => {
    // Navigate to details
    navigation.navigate('AttractionDetails', { attraction: tour });
  };

  const handleAddToCart = (tour) => {
    if (!requireAuth()) {
      // requireAuth handles navigation to Auth
      return;
    }
    
    // Add to cart
    addToCart({
      id: tour.id,
      type: 'tour',
      name: language === 'en' ? tour.nameEn : tour.name,
      price: tour.price || { min: tour.discountPrice * 0.9, max: tour.discountPrice },
      durationDays: tour.durationDays,
      image: tour.image,
      region: tour.region,
    });
    
    Alert.alert(
      t('success'), 
      t('addedToCart'),
      [
        { text: 'OK' },
        { text: t('goToCart') || 'Перейти в корзину', onPress: () => navigation.navigate('Cart') }
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.headerBackground }]}>
      <ScrollView 
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={true}
      >
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.headerBackground }]}>
          <View style={styles.headerTop}>
            <Image 
              source={{ uri: 'https://raw.githubusercontent.com/CrazyNoDota/danik/21bad4af7ac400b27c470851e9968c5860b06407/photo_2025-11-15_23-14-57-removebg-preview.png' }}
              style={styles.headerLogo}
              resizeMode="contain"
            />
            <View style={styles.headerActions}>
              {/* Cart Button */}
              <TouchableOpacity 
                style={[styles.headerButton, { backgroundColor: colors.surface }]}
                onPress={() => navigation.navigate('Cart')}
              >
                <Ionicons name="cart-outline" size={20} color={colors.primary} />
                {getItemCount() > 0 && (
                  <View style={styles.cartBadge}>
                    <Text style={styles.cartBadgeText}>{getItemCount()}</Text>
                  </View>
                )}
              </TouchableOpacity>
              {/* Chat Button */}
              <TouchableOpacity style={[styles.chatButton, { backgroundColor: colors.surface }]}>
                <Ionicons name="chatbubble-ellipses-outline" size={18} color={colors.primary} />
                <Text style={[styles.chatButtonText, { color: colors.primary }]}>
                  {language === 'en' ? 'Chat' : 'Чат'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          <Text style={styles.greeting}>{t('homeGreeting')}</Text>
          <Text style={[styles.subtitle, { color: colors.secondary }]}>{t('homeSubtitle')}</Text>

          {/* Category Tabs */}
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabsContainer}
          >
            {categoryTabs.map((tab) => (
              <TouchableOpacity
                key={tab.key}
                style={[
                  styles.tabButton,
                  activeTab === tab.key && styles.tabButtonActive,
                ]}
                onPress={() => handleTabPress(tab.key)}
              >
                <Ionicons
                  name={tab.icon}
                  size={16}
                  color={activeTab === tab.key ? '#1a4d3a' : '#fff'}
                />
                <Text
                  style={[
                    styles.tabText,
                    activeTab === tab.key && styles.tabTextActive,
                  ]}
                >
                  {tab.label}
                </Text>
                {tab.isHot && (
                  <Text style={styles.hotEmoji}>🔥</Text>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Main Search Card */}
        <View style={styles.searchCardWrapper}>
          <View style={[styles.searchCard, { backgroundColor: colors.card }]}>
            {/* Departure City */}
            <TouchableOpacity style={styles.searchField}>
              <Text style={[styles.searchFieldLabel, { color: colors.textMuted }]}>
                {language === 'en' ? 'Departure city' : 'Город вылета'}
              </Text>
              <Text style={[styles.searchFieldValue, { color: colors.text }]}>
                {language === 'en' ? 'Almaty' : 'Алматы'}
              </Text>
            </TouchableOpacity>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            {/* Destination */}
            <TouchableOpacity style={styles.searchField}>
              <Text style={[styles.searchFieldLabel, { color: colors.textMuted }]}>
                {language === 'en' ? 'Country, resort, hotel' : 'Страна, курорт, отель'}
              </Text>
              <Text style={[styles.searchFieldValue, { color: colors.text }]}>
                {language === 'en' ? 'Kazakhstan' : 'Казахстан'}
              </Text>
            </TouchableOpacity>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            {/* Dates and Duration Row */}
            <View style={styles.searchRow}>
              <TouchableOpacity style={[styles.searchField, styles.searchFieldHalf]}>
                <Text style={[styles.searchFieldLabel, { color: colors.textMuted }]}>
                  {language === 'en' ? 'Departure date' : 'Дата вылета'}
                </Text>
                <Text style={[styles.searchFieldValue, { color: colors.text }]}>16.12 — 20.12</Text>
              </TouchableOpacity>
              <View style={[styles.verticalDivider, { backgroundColor: colors.border }]} />
              <TouchableOpacity style={[styles.searchField, styles.searchFieldHalf]}>
                <Text style={[styles.searchFieldLabel, { color: colors.textMuted }]}>
                  {language === 'en' ? 'Duration' : 'На сколько'}
                </Text>
                <Text style={[styles.searchFieldValue, { color: colors.text }]}>
                  {language === 'en' ? '3 — 7 days' : '3 — 7 дней'}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            {/* Travelers */}
            <TouchableOpacity style={styles.searchField}>
              <Text style={[styles.searchFieldLabel, { color: colors.textMuted }]}>
                {language === 'en' ? 'Travelers' : 'Кто едет'}
              </Text>
              <Text style={[styles.searchFieldValue, { color: colors.text }]}>
                {language === 'en' ? '2 adults' : '2 взрослых'}
              </Text>
            </TouchableOpacity>

            {/* More options link */}
            <TouchableOpacity style={styles.moreOptionsLink}>
              <Text style={[styles.moreOptionsText, { color: colors.primary }]}>
                {language === 'en' ? 'Tour type and budget' : 'Тип тура и бюджет'}
              </Text>
              <Ionicons name="chevron-down" size={16} color={colors.primary} />
            </TouchableOpacity>

            {/* Search Button */}
            <TouchableOpacity 
              style={styles.searchButton}
              onPress={() => navigation.navigate('Home', { screen: 'Tours' })}
            >
              <Ionicons name="search" size={20} color="#1a4d3a" />
              <Text style={styles.searchButtonText}>
                {language === 'en' ? 'Find tours' : 'Найти туры'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Hot Tours Section */}
        <HotToursSection 
          onTourPress={handleTourPress}
          onAddToCart={handleAddToCart}
          onSeeAllPress={() => navigation.navigate('Home', { screen: 'Tours', params: { tab: 'tours' } })}
          language={language}
        />

        {/* Quick Access Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.primary }]}>{t('quickAccess')}</Text>
          <View style={styles.quickActionsGrid}>
            {quickActions.map((action) => (
              <TouchableOpacity
                key={action.id}
                style={[styles.quickActionCard, { backgroundColor: colors.card }]}
                onPress={() => navigation.navigate(action.screen)}
              >
                <View style={[styles.iconContainer, { backgroundColor: action.color + '20' }]}>
                  <Ionicons name={action.icon} size={32} color={action.color} />
                </View>
                <Text style={[styles.quickActionTitle, { color: colors.text }]}>{t(action.titleKey)}</Text>
                <Text style={[styles.quickActionSubtitle, { color: colors.textMuted }]}>{t(action.subtitleKey)}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Popular Places Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.primary }]}>{t('popularPlaces')}</Text>
          
          {/* Cart Feature Card - Highlighted when has items */}
          <TouchableOpacity
            style={[
              styles.featureCard, 
              { backgroundColor: getItemCount() > 0 ? '#e74c3c' : colors.card }
            ]}
            onPress={() => navigation.navigate('Cart')}
          >
            <Ionicons name="cart" size={24} color={getItemCount() > 0 ? '#fff' : '#e74c3c'} />
            <View style={styles.featureContent}>
              <Text style={[styles.featureTitle, { color: getItemCount() > 0 ? '#fff' : colors.text }]}>
                {language === 'en' ? 'Shopping Cart' : 'Корзина покупок'}
              </Text>
              <Text style={[styles.featureSubtitle, { color: getItemCount() > 0 ? 'rgba(255,255,255,0.8)' : colors.textMuted }]}>
                {getItemCount() > 0 
                  ? `${getItemCount()} ${language === 'en' ? 'items ready' : 'позиций готово'}`
                  : (language === 'en' ? 'Add tours to your cart' : 'Добавьте туры в корзину')}
              </Text>
            </View>
            <View style={getItemCount() > 0 ? styles.cartArrowBadge : null}>
              <Ionicons name="chevron-forward" size={20} color={getItemCount() > 0 ? '#fff' : colors.textMuted} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.featureCard, { backgroundColor: colors.card }]}
            onPress={() => navigation.navigate('Tours')}
          >
            <Ionicons name="compass" size={24} color={colors.secondary} />
            <View style={styles.featureContent}>
              <Text style={[styles.featureTitle, { color: colors.text }]}>{t('exploreAttractions')}</Text>
              <Text style={[styles.featureSubtitle, { color: colors.textMuted }]}>{t('exploreAttractionsSubtitle')}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.featureCard, { backgroundColor: colors.card }]}
            onPress={() => navigation.navigate('Tours')}
          >
            <Ionicons name="map" size={24} color={colors.secondary} />
            <View style={styles.featureContent}>
              <Text style={[styles.featureTitle, { color: colors.text }]}>{t('readyRoutes')}</Text>
              <Text style={[styles.featureSubtitle, { color: colors.textMuted }]}>{t('readyRoutesSubtitle')}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.featureCard, { backgroundColor: colors.card }]}
            onPress={() => navigation.navigate('MapScreen', { title: t('mapOfKazakhstan') })}
          >
            <Ionicons name="map-outline" size={24} color="#3498db" />
            <View style={styles.featureContent}>
              <Text style={[styles.featureTitle, { color: colors.text }]}>{t('interactiveMap')}</Text>
              <Text style={[styles.featureSubtitle, { color: colors.textMuted }]}>{t('interactiveMapSubtitle')}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Cart Summary Section */}
        {getItemCount() > 0 && (
          <TouchableOpacity 
            style={[styles.cartSummaryCard, { backgroundColor: colors.primary }]}
            onPress={() => navigation.navigate('Cart')}
          >
            <View style={styles.cartSummaryLeft}>
              <View style={styles.cartSummaryIcon}>
                <Ionicons name="cart" size={24} color="#fff" />
                <View style={styles.cartSummaryBadge}>
                  <Text style={styles.cartSummaryBadgeText}>{getItemCount()}</Text>
                </View>
              </View>
              <View>
                <Text style={styles.cartSummaryTitle}>
                  {language === 'en' ? 'Your Cart' : 'Ваша корзина'}
                </Text>
                <Text style={styles.cartSummarySubtitle}>
                  {getItemCount()} {language === 'en' ? 'items ready for checkout' : 'позиций к оформлению'}
                </Text>
              </View>
            </View>
            <View style={styles.cartSummaryRight}>
              <Text style={styles.cartSummaryAction}>
                {language === 'en' ? 'View' : 'Открыть'}
              </Text>
              <Ionicons name="chevron-forward" size={20} color="#fff" />
            </View>
          </TouchableOpacity>
        )}

        {/* Bottom spacing */}
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#1a4d3a',
  },
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    backgroundColor: '#1a4d3a',
    paddingTop: 16,
    paddingBottom: 24,
    paddingHorizontal: 16,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerLogo: {
    width: 60,
    height: 60,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  cartBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#e74c3c',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  cartBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  chatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  chatButtonText: {
    color: '#1a4d3a',
    fontSize: 14,
    fontWeight: '600',
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#d4af37',
    marginBottom: 16,
  },
  tabsContainer: {
    paddingTop: 8,
    gap: 8,
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginRight: 8,
    gap: 6,
  },
  tabButtonActive: {
    backgroundColor: '#fff',
  },
  tabText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#1a4d3a',
    fontWeight: '600',
  },
  hotEmoji: {
    fontSize: 14,
  },
  searchCardWrapper: {
    paddingHorizontal: 16,
    marginTop: -8,
  },
  searchCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  searchField: {
    paddingVertical: 12,
  },
  searchFieldHalf: {
    flex: 1,
  },
  searchFieldLabel: {
    fontSize: 12,
    color: '#8e8e93',
    marginBottom: 4,
  },
  searchFieldValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
  },
  verticalDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#e0e0e0',
    marginHorizontal: 12,
  },
  moreOptionsLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginTop: 8,
  },
  moreOptionsText: {
    fontSize: 14,
    color: '#1a4d3a',
    fontWeight: '500',
    marginRight: 4,
  },
  searchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#d4af37',
    borderRadius: 12,
    paddingVertical: 16,
    marginTop: 8,
    gap: 8,
  },
  searchButtonText: {
    color: '#1a4d3a',
    fontSize: 16,
    fontWeight: '700',
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a4d3a',
    marginBottom: 16,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickActionCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  quickActionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a4d3a',
    textAlign: 'center',
    marginBottom: 4,
  },
  quickActionSubtitle: {
    fontSize: 12,
    color: '#8e8e93',
    textAlign: 'center',
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  featureContent: {
    flex: 1,
    marginLeft: 12,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a4d3a',
    marginBottom: 4,
  },
  featureSubtitle: {
    fontSize: 14,
    color: '#8e8e93',
  },
  // Cart Summary Card
  cartSummaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    padding: 16,
    borderRadius: 16,
    shadowColor: '#1a4d3a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  cartSummaryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cartSummaryIcon: {
    position: 'relative',
  },
  cartSummaryBadge: {
    position: 'absolute',
    top: -6,
    right: -8,
    backgroundColor: '#e74c3c',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  cartSummaryBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  cartSummaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  cartSummarySubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  cartSummaryRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cartSummaryAction: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  cartArrowBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    padding: 4,
  },
  bottomSpacer: {
    height: 20,
  },
});

