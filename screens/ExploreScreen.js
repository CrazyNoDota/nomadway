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
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import attractionsData from '../data/attractions.json';
import routesData from '../data/routes.json';
import { useLocalization } from '../contexts/LocalizationContext';
import { useTheme } from '../contexts/ThemeContext';
import { getTranslatedAttractions } from '../utils/attractionTranslations';
import { useCart } from '../contexts/CartContext';
import { useFavorites } from '../contexts/FavoritesContext';
import { useAuth } from '../contexts/AuthContext';
import FilterSheet, { ActiveFiltersBar } from '../components/FilterSheet';
import HotToursSection from '../components/HotToursSection';

export default function ExploreScreen({ navigation, route }) {
  const [attractions, setAttractions] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilterSheet, setShowFilterSheet] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState({});
  const [activeTab, setActiveTab] = useState('hot');
  const { t, language } = useLocalization();
  const { colors, isDark } = useTheme();
  const { addToCart, getItemCount } = useCart();
  const { toggleFavorite, isFavorite } = useFavorites();
  const { requireAuth } = useAuth();

  // Handle tab switching from navigation params
  useEffect(() => {
    if (route?.params?.tab) {
      setActiveTab(route.params.tab);
    }
  }, [route?.params?.tab]);

  const handleToggleFavorite = (item, type = 'attraction') => {
    if (type === 'route') {
      toggleFavorite({
        id: item.id,
        type: 'route',
        name: item.name,
        description: item.description,
        duration: item.duration,
        difficulty: item.difficulty,
        image: item.image,
        color: item.color,
        stopsCount: item.stops?.length || 0,
      });
    } else {
      toggleFavorite({
        id: item.id,
        type: 'attraction',
        name: item.name,
        city: item.city,
        region: item.region,
        image: item.image,
        rating: item.rating,
        category: item.category,
        budget: item.budget,
      });
    }
  };

  // Category tabs - Hot first, then Places, Routes, AI Constructor
  const categoryTabs = [
    { key: 'hot', label: language === 'en' ? '🔥 Hot' : '🔥 Горящие', icon: 'flame', isHot: true },
    { key: 'tours', label: language === 'en' ? '🏔️ Places' : '🏔️ Места', icon: 'compass', isPremium: true },
    { key: 'routes', label: language === 'en' ? '🗺️ Routes' : '🗺️ Маршруты', icon: 'map' },
    { key: 'ai', label: language === 'en' ? '✨ AI Builder' : '✨ AI Создать', icon: 'sparkles', isAI: true },
  ];

  useEffect(() => {
    const translatedAttractions = getTranslatedAttractions(attractionsData.attractions, language);
    setAttractions(translatedAttractions);
    setRoutes(routesData.routes);
  }, [language]);

  const hasAdvancedFilters = () => {
    return Object.values(advancedFilters).some(val =>
      Array.isArray(val) ? val.length > 0 : val != null
    );
  };

  const getFilteredAttractions = () => {
    let filtered = attractions;

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter((attraction) =>
        attraction.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        attraction.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply advanced filters
    if (advancedFilters.regions?.length) {
      filtered = filtered.filter(a =>
        a.region && advancedFilters.regions.includes(a.region)
      );
    }

    if (advancedFilters.tourTypes?.length) {
      filtered = filtered.filter(a =>
        a.tourType && advancedFilters.tourTypes.includes(a.tourType)
      );
    }

    if (advancedFilters.seasons?.length) {
      filtered = filtered.filter(a =>
        a.bestSeason?.some(s => advancedFilters.seasons.includes(s))
      );
    }

    if (advancedFilters.cities?.length) {
      // Map city IDs to actual city names for matching
      const cityNameMap = {
        almaty: ['Алматы', 'Алматинская область'],
        astana: ['Астана'],
        aktau: ['Актау'],
        turkestan: ['Туркестан'],
        kostanay: ['Костанай'],
        petropavlovsk: ['Петропавловск'],
        kokshetau: ['Кокшетау'],
        pavlodar: ['Павлодар'],
        'ust-kamenogorsk': ['Усть-Каменогорск'],
      };
      filtered = filtered.filter(a =>
        a.city && advancedFilters.cities.some(cityId => {
          const names = cityNameMap[cityId] || [cityId];
          return names.some(name => a.city.includes(name));
        })
      );
    }

    if (advancedFilters.priceRange) {
      filtered = filtered.filter(a => {
        if (!a.budget) return true;
        const avgPrice = (a.budget.min + a.budget.max) / 2;
        switch (advancedFilters.priceRange) {
          case 'budget': return avgPrice <= 10000;
          case 'medium': return avgPrice > 10000 && avgPrice <= 50000;
          case 'premium': return avgPrice > 50000;
          default: return true;
        }
      });
    }

    return filtered;
  };

  const filteredAttractions = getFilteredAttractions();

  const handleAddToCart = (item) => {
    if (!requireAuth()) {
      // requireAuth handles navigation to Auth
      return;
    }
    addToCart({
      id: item.id,
      type: 'attraction',
      name: item.name,
      city: item.city,
      region: item.region,
      price: item.budget,
      durationDays: 1,
      bestSeason: item.bestSeason,
      image: item.image,
    });

    Alert.alert(
      '✅ Добавлено в корзину',
      `"${item.name}" добавлено в вашу корзину`,
      [
        { text: 'Продолжить', style: 'cancel' },
        { text: 'Открыть корзину', onPress: () => navigation.navigate('Cart') },
      ]
    );
  };

  const renderAttraction = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('AttractionDetails', { attraction: item })}
    >
      <Image source={{ uri: item.image }} style={styles.cardImage} />

      {/* Quick info badges */}
      <View style={styles.cardBadges}>
        {item.region && (
          <View style={styles.regionBadge}>
            <Text style={styles.regionBadgeText}>
              {item.region === 'south' ? '🏔️ Юг' :
                item.region === 'north' ? '🌲 Север' :
                  item.region === 'east' ? '⛰️ Восток' :
                    item.region === 'west' ? '🏜️ Запад' : '🏙️ Центр'}
            </Text>
          </View>
        )}
        {item.difficultyLevel && (
          <View style={[styles.difficultyBadge,
          item.difficultyLevel === 'easy' && styles.difficultyEasy,
          item.difficultyLevel === 'medium' && styles.difficultyMedium,
          item.difficultyLevel === 'hard' && styles.difficultyHard,
          ]}>
            <Text style={styles.difficultyText}>
              {item.difficultyLevel === 'easy' ? 'Легко' :
                item.difficultyLevel === 'medium' ? 'Средне' : 'Сложно'}
            </Text>
          </View>
        )}
      </View>

      {/* Favorite button */}
      <TouchableOpacity
        style={styles.favoriteButton}
        onPress={() => handleToggleFavorite(item)}
      >
        <Ionicons
          name={isFavorite(item.id, 'attraction') ? 'heart' : 'heart-outline'}
          size={22}
          color={isFavorite(item.id, 'attraction') ? '#e74c3c' : '#fff'}
        />
      </TouchableOpacity>

      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle} numberOfLines={1}>{item.name}</Text>
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={16} color="#d4af37" />
            <Text style={styles.rating}>{item.rating}</Text>
          </View>
        </View>
        <Text style={styles.cardDescription} numberOfLines={2}>
          {item.description}
        </Text>

        {/* Price and location row */}
        <View style={styles.infoRow}>
          {item.city && (
            <View style={styles.infoItem}>
              <Ionicons name="location-outline" size={14} color="#666" />
              <Text style={styles.infoText} numberOfLines={1}>{item.city}</Text>
            </View>
          )}
          {item.budget && (
            <View style={styles.infoItem}>
              <Ionicons name="cash-outline" size={14} color="#666" />
              <Text style={styles.infoText}>
                {new Intl.NumberFormat('ru-RU').format(item.budget.min)} - {new Intl.NumberFormat('ru-RU').format(item.budget.max)} ₸
              </Text>
            </View>
          )}
        </View>

        <View style={styles.cardFooter}>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{item.category}</Text>
          </View>
          <TouchableOpacity
            style={styles.addToCartButton}
            onPress={() => handleAddToCart(item)}
          >
            <Ionicons name="cart-outline" size={18} color="#fff" />
            <Text style={styles.addToCartText}>В корзину</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'Лёгкая':
        return '#27ae60';
      case 'Средняя':
        return '#f39c12';
      case 'Сложная':
        return '#e74c3c';
      default:
        return '#8e8e93';
    }
  };

  const renderRoute = ({ item }) => (
    <TouchableOpacity
      style={[styles.routeCard, { borderLeftColor: item.color, borderLeftWidth: 4 }]}
      onPress={() => navigation.navigate('RouteDetails', { route: item })}
    >
      <View style={styles.routeImageContainer}>
        <Image source={{ uri: item.image }} style={styles.routeCardImage} />
        <TouchableOpacity
          style={styles.favoriteButton}
          onPress={() => handleToggleFavorite(item, 'route')}
        >
          <Ionicons
            name={isFavorite(item.id, 'route') ? 'heart' : 'heart-outline'}
            size={22}
            color={isFavorite(item.id, 'route') ? '#e74c3c' : '#fff'}
          />
        </TouchableOpacity>
      </View>
      <View style={styles.routeCardContent}>
        <Text style={styles.routeCardTitle}>{item.name}</Text>
        <Text style={styles.routeCardDescription} numberOfLines={2}>
          {item.description}
        </Text>
        <View style={styles.routeCardFooter}>
          <View style={styles.routeInfoRow}>
            <Ionicons name="time-outline" size={16} color="#8e8e93" />
            <Text style={styles.routeInfoText}>{item.duration}</Text>
          </View>
          <View style={[styles.routeDifficultyBadge, { backgroundColor: getDifficultyColor(item.difficulty) + '20' }]}>
            <Text style={[styles.routeDifficultyText, { color: getDifficultyColor(item.difficulty) }]}>
              {item.difficulty}
            </Text>
          </View>
        </View>
        <View style={styles.routeStopsContainer}>
          <Ionicons name="location" size={16} color={item.color} />
          <Text style={styles.routeStopsText}>{item.stops?.length || 0} {language === 'en' ? 'stops' : 'остановок'}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  // AI Constructor Content
  const renderAIConstructor = () => (
    <View style={styles.aiConstructorContainer}>
      <View style={styles.aiHeader}>
        <View style={styles.aiIconContainer}>
          <Ionicons name="sparkles" size={48} color="#d4af37" />
        </View>
        <Text style={styles.aiTitle}>
          {language === 'en' ? 'AI Route Constructor' : 'AI Конструктор маршрутов'}
        </Text>
        <Text style={styles.aiDescription}>
          {language === 'en' 
            ? 'Create your perfect personalized route with AI assistance. Tell us your preferences and we\'ll build the ideal itinerary for you.'
            : 'Создайте идеальный персонализированный маршрут с помощью ИИ. Расскажите о своих предпочтениях, и мы составим для вас идеальный маршрут.'}
        </Text>
      </View>
      
      <TouchableOpacity 
        style={styles.aiButton}
        onPress={() => navigation.navigate('AIRouteBuilder')}
      >
        <Ionicons name="sparkles" size={20} color="#1a4d3a" />
        <Text style={styles.aiButtonText}>
          {language === 'en' ? 'Start Building' : 'Начать создание'}
        </Text>
      </TouchableOpacity>

      <View style={styles.aiFeatures}>
        <View style={styles.aiFeature}>
          <View style={styles.aiFeatureIcon}>
            <Ionicons name="person-outline" size={24} color="#1a4d3a" />
          </View>
          <Text style={styles.aiFeatureTitle}>
            {language === 'en' ? 'Personalized' : 'Персонализация'}
          </Text>
          <Text style={styles.aiFeatureText}>
            {language === 'en' ? 'Based on your interests' : 'На основе ваших интересов'}
          </Text>
        </View>
        <View style={styles.aiFeature}>
          <View style={styles.aiFeatureIcon}>
            <Ionicons name="wallet-outline" size={24} color="#1a4d3a" />
          </View>
          <Text style={styles.aiFeatureTitle}>
            {language === 'en' ? 'Budget' : 'Бюджет'}
          </Text>
          <Text style={styles.aiFeatureText}>
            {language === 'en' ? 'Within your budget' : 'В рамках вашего бюджета'}
          </Text>
        </View>
        <View style={styles.aiFeature}>
          <View style={styles.aiFeatureIcon}>
            <Ionicons name="time-outline" size={24} color="#1a4d3a" />
          </View>
          <Text style={styles.aiFeatureTitle}>
            {language === 'en' ? 'Duration' : 'Длительность'}
          </Text>
          <Text style={styles.aiFeatureText}>
            {language === 'en' ? 'Any time frame' : 'Любая продолжительность'}
          </Text>
        </View>
      </View>
    </View>
  );

  // Hot Tours Content
  const renderHotContent = () => (
    <ScrollView style={styles.hotContentContainer} showsVerticalScrollIndicator={false}>
      {/* AI Constructor Quick Card */}
      <TouchableOpacity 
        style={styles.aiQuickCard}
        onPress={() => navigation.navigate('AIRouteBuilder')}
      >
        <View style={styles.aiQuickCardContent}>
          <View style={styles.aiQuickIconContainer}>
            <Ionicons name="sparkles" size={28} color="#fff" />
          </View>
          <View style={styles.aiQuickTextContainer}>
            <Text style={styles.aiQuickTitle}>
              {language === 'en' ? '✨ AI Route Builder' : '✨ AI Конструктор'}
            </Text>
            <Text style={styles.aiQuickSubtitle}>
              {language === 'en' ? 'Create your perfect trip with AI' : 'Создайте идеальный маршрут с ИИ'}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#fff" />
        </View>
      </TouchableOpacity>

      <HotToursSection 
        onTourPress={(tour) => navigation.navigate('AttractionDetails', { attraction: tour })}
        onAddToCart={(tour) => {
          if (!requireAuth()) {
            return;
          }
          addToCart({
            id: tour.id,
            type: 'tour',
            name: language === 'en' ? tour.nameEn : tour.name,
            price: tour.price || { min: (tour.discountPrice || tour.price) * 0.9, max: tour.discountPrice || tour.price },
            durationDays: tour.durationDays,
            image: tour.image,
            region: tour.region,
          });
          Alert.alert(
            language === 'en' ? 'Success' : 'Успешно', 
            language === 'en' ? 'Added to cart' : 'Добавлено в корзину',
            [
              { text: 'OK' },
              { text: language === 'en' ? 'Go to Cart' : 'Перейти в корзину', onPress: () => navigation.navigate('Cart') }
            ]
          );
        }}
        onSeeAllPress={() => setActiveTab('tours')}
        language={language}
      />
    </ScrollView>
  );

  // Render content based on active tab
  const renderContent = () => {
    switch (activeTab) {
      case 'routes':
        return (
          <FlatList
            data={routes}
            renderItem={renderRoute}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="map-outline" size={64} color="#8e8e93" />
                <Text style={styles.emptyText}>{language === 'en' ? 'No routes found' : 'Маршруты не найдены'}</Text>
              </View>
            }
          />
        );
      case 'ai':
        return renderAIConstructor();
      case 'hot':
        return renderHotContent();
      case 'tours':
      default:
        return (
          <FlatList
            data={filteredAttractions}
            renderItem={renderAttraction}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={
              <>
                {/* Main Search Card */}
                <View style={styles.searchCard}>
                  {/* Search Input */}
                  <View style={styles.searchInputContainer}>
                    <Ionicons name="search" size={20} color="#8e8e93" />
                    <TextInput
                      style={styles.searchInput}
                      placeholder={t('searchPlaceholder')}
                      placeholderTextColor="#8e8e93"
                      value={searchQuery}
                      onChangeText={setSearchQuery}
                    />
                  </View>

                  {/* Filter Options Row */}
                  <View style={styles.filterOptionsRow}>
                    {/* Region Filter */}
                    <TouchableOpacity
                      style={styles.filterOption}
                      onPress={() => setShowFilterSheet(true)}
                    >
                      <Ionicons name="location-outline" size={18} color="#1a4d3a" />
                      <Text style={styles.filterOptionLabel}>
                        {language === 'en' ? 'Region' : 'Регион'}
                      </Text>
                      <Text style={styles.filterOptionValue} numberOfLines={1}>
                        {advancedFilters.regions?.length > 0
                          ? `${advancedFilters.regions.length} ${language === 'en' ? 'selected' : 'выбрано'}`
                          : language === 'en' ? 'All' : 'Все'}
                      </Text>
                    </TouchableOpacity>

                    {/* Season Filter */}
                    <TouchableOpacity
                      style={styles.filterOption}
                      onPress={() => setShowFilterSheet(true)}
                    >
                      <Ionicons name="calendar-outline" size={18} color="#1a4d3a" />
                      <Text style={styles.filterOptionLabel}>
                        {language === 'en' ? 'Season' : 'Сезон'}
                      </Text>
                      <Text style={styles.filterOptionValue} numberOfLines={1}>
                        {advancedFilters.seasons?.length > 0
                          ? `${advancedFilters.seasons.length} ${language === 'en' ? 'selected' : 'выбрано'}`
                          : language === 'en' ? 'Any' : 'Любой'}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* Price and Type Row */}
                  <View style={styles.filterOptionsRow}>
                    {/* Price Filter */}
                    <TouchableOpacity
                      style={styles.filterOption}
                      onPress={() => setShowFilterSheet(true)}
                    >
                      <Ionicons name="cash-outline" size={18} color="#1a4d3a" />
                      <Text style={styles.filterOptionLabel}>
                        {language === 'en' ? 'Budget' : 'Бюджет'}
                      </Text>
                      <Text style={styles.filterOptionValue} numberOfLines={1}>
                        {advancedFilters.priceRange
                          ? advancedFilters.priceRange === 'budget'
                            ? (language === 'en' ? 'Budget' : 'Бюджетный')
                            : advancedFilters.priceRange === 'medium'
                              ? (language === 'en' ? 'Medium' : 'Средний')
                              : (language === 'en' ? 'Premium' : 'Премиум')
                          : language === 'en' ? 'Any' : 'Любой'}
                      </Text>
                    </TouchableOpacity>

                    {/* Tour Type Filter */}
                    <TouchableOpacity
                      style={styles.filterOption}
                      onPress={() => setShowFilterSheet(true)}
                    >
                      <Ionicons name="options-outline" size={18} color="#1a4d3a" />
                      <Text style={styles.filterOptionLabel}>
                        {language === 'en' ? 'Type' : 'Тип'}
                      </Text>
                      <Text style={styles.filterOptionValue} numberOfLines={1}>
                        {advancedFilters.tourTypes?.length > 0
                          ? `${advancedFilters.tourTypes.length} ${language === 'en' ? 'selected' : 'выбрано'}`
                          : language === 'en' ? 'All' : 'Все'}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* Advanced Filters Link */}
                  <TouchableOpacity
                    style={styles.advancedFiltersLink}
                    onPress={() => setShowFilterSheet(true)}
                  >
                    <Text style={styles.advancedFiltersText}>
                      {language === 'en' ? 'More filters' : 'Ещё фильтры'}
                    </Text>
                    <Ionicons name="chevron-down" size={16} color="#1a4d3a" />
                  </TouchableOpacity>

                  {/* Search Button */}
                  <TouchableOpacity style={styles.searchButton}>
                    <Ionicons name="search" size={20} color="#fff" />
                    <Text style={styles.searchButtonText}>
                      {language === 'en' ? 'Find places' : 'Найти места'}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Active Filters Bar */}
                {hasAdvancedFilters() && (
                  <ActiveFiltersBar
                    filters={advancedFilters}
                    onClear={() => setAdvancedFilters({})}
                    onOpenFilter={() => setShowFilterSheet(true)}
                  />
                )}

                {/* Results count */}
                <View style={styles.resultsHeader}>
                  <Text style={styles.resultsCount}>
                    {language === 'en' ? 'Found:' : 'Найдено:'} {filteredAttractions.length} {filteredAttractions.length === 1 ? (language === 'en' ? 'place' : 'место') : (language === 'en' ? 'places' : 'мест')}
                  </Text>
                  <TouchableOpacity
                    style={styles.cartHeaderButton}
                    onPress={() => navigation.navigate('Cart')}
                  >
                    <Ionicons name="cart-outline" size={20} color="#1a4d3a" />
                    {getItemCount() > 0 && (
                      <View style={styles.cartBadge}>
                        <Text style={styles.cartBadgeText}>{getItemCount()}</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </View>
              </>
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="search-outline" size={64} color="#8e8e93" />
                <Text style={styles.emptyText}>{language === 'en' ? 'Nothing found' : 'Ничего не найдено'}</Text>
                <Text style={styles.emptySubtext}>
                  {language === 'en' ? 'Try changing the search parameters or filters' : 'Попробуйте изменить параметры поиска или фильтры'}
                </Text>
                {hasAdvancedFilters() && (
                  <TouchableOpacity
                    style={styles.clearFiltersButton}
                    onPress={() => setAdvancedFilters({})}
                  >
                    <Text style={styles.clearFiltersText}>{language === 'en' ? 'Reset filters' : 'Сбросить фильтры'}</Text>
                  </TouchableOpacity>
                )}
              </View>
            }
          />
        );
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header with Category Tabs */}
      <View style={[styles.headerSection, { backgroundColor: colors.headerBackground }]}>
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
                tab.isHot && styles.tabButtonHot,
                tab.isPremium && styles.tabButtonPremium,
                tab.isAI && styles.tabButtonAI,
                activeTab === tab.key && (
                  tab.isHot ? styles.tabButtonHotActive : 
                  tab.isAI ? styles.tabButtonAIActive : 
                  styles.tabButtonActive
                ),
              ]}
              onPress={() => setActiveTab(tab.key)}
            >
              <Text
                style={[
                  styles.tabText,
                  tab.isHot && styles.tabTextHot,
                  tab.isPremium && styles.tabTextPremium,
                  tab.isAI && styles.tabTextAI,
                  activeTab === tab.key && styles.tabTextActive,
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Render content based on active tab */}
      {renderContent()}

      {/* Filter Sheet Modal */}
      <FilterSheet
        visible={showFilterSheet}
        onClose={() => setShowFilterSheet(false)}
        filters={advancedFilters}
        onApply={setAdvancedFilters}
        language={language}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  // Header with tabs
  headerSection: {
    backgroundColor: '#1a4d3a',
    paddingTop: 8,
    paddingBottom: 12,
  },
  tabsContainer: {
    paddingHorizontal: 16,
    gap: 8,
    flexDirection: 'row',
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    marginRight: 8,
  },
  tabButtonActive: {
    backgroundColor: '#d4af37',
  },
  tabButtonHot: {
    backgroundColor: 'rgba(231, 76, 60, 0.3)',
    borderWidth: 1,
    borderColor: '#e74c3c',
  },
  tabButtonHotActive: {
    backgroundColor: '#e74c3c',
    borderColor: '#c0392b',
  },
  tabButtonPremium: {
    backgroundColor: 'rgba(212, 175, 55, 0.25)',
    borderWidth: 1,
    borderColor: '#d4af37',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
  },
  tabTextActive: {
    color: '#fff',
    fontWeight: '700',
  },
  tabTextHot: {
    color: '#fff',
    fontWeight: '700',
  },
  tabTextPremium: {
    color: '#ffd700',
    fontWeight: '700',
  },
  tabButtonAI: {
    backgroundColor: 'rgba(147, 112, 219, 0.3)',
    borderWidth: 1,
    borderColor: '#9370db',
  },
  tabButtonAIActive: {
    backgroundColor: '#9370db',
    borderColor: '#7b5fc7',
  },
  tabTextAI: {
    color: '#e6d9ff',
    fontWeight: '700',
  },
  hotBadge: {
    marginLeft: 4,
  },
  hotBadgeText: {
    fontSize: 12,
  },
  // Search Card
  searchCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: -8,
    marginBottom: 12,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    color: '#000',
  },
  filterOptionsRow: {
    flexDirection: 'row',
    marginBottom: 10,
    gap: 10,
  },
  filterOption: {
    flex: 1,
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#e8e8e8',
  },
  filterOptionLabel: {
    fontSize: 11,
    color: '#888',
    marginTop: 4,
  },
  filterOptionValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    marginTop: 2,
  },
  advancedFiltersLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    marginBottom: 8,
  },
  advancedFiltersText: {
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
    paddingVertical: 14,
    gap: 8,
  },
  searchButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  // Cart Header Button
  cartHeaderButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
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
  },
  cartBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  resultsCount: {
    fontSize: 13,
    color: '#666',
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
    height: 180,
    resizeMode: 'cover',
  },
  cardBadges: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
  },
  favoriteButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  regionBadge: {
    backgroundColor: 'rgba(26, 77, 58, 0.9)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
  },
  regionBadgeText: {
    fontSize: 11,
    color: '#fff',
    fontWeight: '500',
  },
  difficultyBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  difficultyEasy: {
    backgroundColor: 'rgba(46, 204, 113, 0.9)',
  },
  difficultyMedium: {
    backgroundColor: 'rgba(241, 196, 15, 0.9)',
  },
  difficultyHard: {
    backgroundColor: 'rgba(231, 76, 60, 0.9)',
  },
  difficultyText: {
    fontSize: 11,
    color: '#fff',
    fontWeight: '500',
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
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a4d3a',
    flex: 1,
    marginRight: 8,
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
    marginBottom: 10,
    lineHeight: 20,
  },
  infoRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginBottom: 4,
  },
  infoText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
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
  addToCartButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#d4af37',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addToCartText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 6,
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
  clearFiltersButton: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#1a4d3a',
    borderRadius: 20,
  },
  clearFiltersText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  // Route Card Styles
  routeCard: {
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
  routeImageContainer: {
    position: 'relative',
  },
  routeCardImage: {
    width: '100%',
    height: 180,
    resizeMode: 'cover',
  },
  routeCardContent: {
    padding: 16,
  },
  routeCardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a4d3a',
    marginBottom: 8,
  },
  routeCardDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  routeCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  routeInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  routeInfoText: {
    marginLeft: 6,
    fontSize: 14,
    color: '#8e8e93',
  },
  routeDifficultyBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  routeDifficultyText: {
    fontSize: 12,
    fontWeight: '600',
  },
  routeStopsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  routeStopsText: {
    marginLeft: 6,
    fontSize: 14,
    color: '#1a4d3a',
    fontWeight: '500',
  },
  // AI Constructor Styles
  aiConstructorContainer: {
    flex: 1,
    padding: 16,
  },
  aiHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  aiIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#fff9e6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  aiTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a4d3a',
    textAlign: 'center',
    marginBottom: 12,
  },
  aiDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 16,
  },
  aiButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#d4af37',
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 24,
    gap: 8,
  },
  aiButtonText: {
    color: '#1a4d3a',
    fontSize: 16,
    fontWeight: '700',
  },
  aiFeatures: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  aiFeature: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
  },
  aiFeatureIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#e8f5e9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  aiFeatureTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1a4d3a',
    textAlign: 'center',
    marginBottom: 4,
  },
  aiFeatureText: {
    fontSize: 11,
    color: '#8e8e93',
    textAlign: 'center',
  },
  // Hot Content Styles
  hotContentContainer: {
    flex: 1,
  },
  // AI Quick Card on Hot page
  aiQuickCard: {
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#9370db',
    shadowColor: '#9370db',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  aiQuickCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  aiQuickIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  aiQuickTextContainer: {
    flex: 1,
    marginLeft: 14,
  },
  aiQuickTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 3,
  },
  aiQuickSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.85)',
  },
});
