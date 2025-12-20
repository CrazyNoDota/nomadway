import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
  TextInput,
  Modal,
  FlatList,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker } from 'react-native-maps';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Sharing from 'expo-sharing';
import { useLocalization } from '../contexts/LocalizationContext';
import { getTranslatedAttraction } from '../utils/attractionTranslations';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';

const { width } = Dimensions.get('window');

export default function AttractionDetailsScreen({ route, navigation }) {
  const { attraction: originalAttraction } = route.params;
  const { language, t } = useLocalization();
  const attraction = getTranslatedAttraction(originalAttraction, language);
  const [isSaved, setIsSaved] = useState(false);
  const { addToCart } = useCart();
  const { requireAuth } = useAuth();
  const hasLocation =
    typeof attraction?.latitude === 'number' && typeof attraction?.longitude === 'number';

  // Determine item type and price
  const isTour = attraction?.id?.toString().startsWith('tour_') || attraction?.id?.toString().startsWith('hot_');
  const price = attraction?.budget || attraction?.price || (attraction?.discountPrice ? { min: attraction.discountPrice, max: attraction.originalPrice || attraction.discountPrice } : null);

  const handleAddToCart = () => {
    if (!requireAuth()) {
      return;
    }
    addToCart({
      id: attraction.id,
      type: isTour ? 'tour' : 'attraction',
      name: attraction.name,
      city: attraction.city,
      region: attraction.region,
      price: price,
      durationDays: attraction.durationDays || 1,
      bestSeason: attraction.bestSeason,
      image: attraction.image,
    });

    Alert.alert(
      '✅ ' + (t('addedToCart') || 'Добавлено в корзину'),
      `"${attraction.name}" добавлено в вашу корзину`,
      [
        { text: t('continue') || 'Продолжить', style: 'cancel' },
        { text: t('goToCart') || 'Открыть корзину', onPress: () => navigation.navigate('Cart') },
      ]
    );
  };

  useEffect(() => {
    checkIfSaved();
  }, []);

  const checkIfSaved = async () => {
    try {
      const saved = await AsyncStorage.getItem(`saved_${attraction.id}`);
      setIsSaved(saved !== null);
    } catch (error) {
      console.error('Error checking saved status:', error);
    }
  };

  const toggleSave = async () => {
    try {
      if (isSaved) {
        await AsyncStorage.removeItem(`saved_${attraction.id}`);
        setIsSaved(false);
      } else {
        await AsyncStorage.setItem(`saved_${attraction.id}`, JSON.stringify(attraction));
        setIsSaved(true);
      }
    } catch (error) {
      console.error('Error saving attraction:', error);
    }
  };

  const openMap = () => {
    if (!hasLocation) {
      alert('Для этого тура координаты не указаны');
      return;
    }
    navigation.navigate('MapScreen', {
      attractions: [attraction],
      title: attraction.name,
      zoomToPlace: {
        latitude: attraction.latitude,
        longitude: attraction.longitude,
      },
    });
  };

  const shareAttraction = async () => {
    try {
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync({
          message: `Посмотрите на это место: ${attraction.name}\n${attraction.description}\n\nНайдено в NomadWay`,
        });
      } else {
        alert('Функция "Поделиться" недоступна на этом устройстве');
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Image source={{ uri: attraction.image }} style={styles.headerImage} />

      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>{attraction.name}</Text>
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={20} color="#d4af37" />
              <Text style={styles.rating}>{attraction.rating}</Text>
            </View>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity onPress={shareAttraction} style={styles.shareButton}>
              <Ionicons name="share-outline" size={24} color="#1a4d3a" />
            </TouchableOpacity>
            <TouchableOpacity onPress={toggleSave} style={styles.saveButton}>
              <Ionicons
                name={isSaved ? 'bookmark' : 'bookmark-outline'}
                size={24}
                color={isSaved ? '#d4af37' : '#8e8e93'}
              />
            </TouchableOpacity>
          </View>
        </View>

        {attraction.category && (
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{attraction.category}</Text>
          </View>
        )}

        {/* Tour-specific info: duration, discount */}
        {isTour && (
          <View style={styles.tourInfoSection}>
            {attraction.duration && (
              <View style={styles.tourInfoItem}>
                <Ionicons name="time-outline" size={18} color="#1a4d3a" />
                <Text style={styles.tourInfoText}>{attraction.duration}</Text>
              </View>
            )}
            {attraction.discount && (
              <View style={styles.discountBadge}>
                <Text style={styles.discountText}>🔥 -{attraction.discount}%</Text>
              </View>
            )}
            {attraction.reason && (
              <Text style={styles.tourReason}>{attraction.reason}</Text>
            )}
          </View>
        )}

        {/* Price Section */}
        {price && (
          <View style={styles.priceSection}>
            <Ionicons name="cash-outline" size={20} color="#1a4d3a" />
            {attraction.discountPrice ? (
              <View style={styles.priceContainer}>
                <Text style={styles.originalPrice}>
                  {new Intl.NumberFormat('ru-RU').format(attraction.originalPrice)} ₸
                </Text>
                <Text style={styles.discountPrice}>
                  {new Intl.NumberFormat('ru-RU').format(attraction.discountPrice)} ₸
                </Text>
              </View>
            ) : (
              <Text style={styles.priceText}>
                {price.min && price.max
                  ? `${new Intl.NumberFormat('ru-RU').format(price.min)} - ${new Intl.NumberFormat('ru-RU').format(price.max)} ₸`
                  : `${new Intl.NumberFormat('ru-RU').format(price.min || price.max || price)} ₸`}
              </Text>
            )}
          </View>
        )}

        <Text style={styles.description}>{attraction.longDescription || attraction.description || (language === 'en' ? 'No description available' : 'Описание недоступно')}</Text>

        <TouchableOpacity style={styles.mapButton} onPress={openMap}>
          <Ionicons name="map" size={24} color="#1a4d3a" />
          <Text style={styles.mapButtonText}>Показать на карте</Text>
        </TouchableOpacity>

        {hasLocation && (
          <View style={styles.mapContainer}>
            <MapView
              style={styles.map}
              initialRegion={{
                latitude: attraction.latitude,
                longitude: attraction.longitude,
                latitudeDelta: 0.1,
                longitudeDelta: 0.1,
              }}
              scrollEnabled={false}
              zoomEnabled={false}
            >
              <Marker
                coordinate={{
                  latitude: attraction.latitude,
                  longitude: attraction.longitude,
                }}
                title={attraction.name}
              />
            </MapView>
          </View>
        )}

        {/* AI Summary Section */}
        {attraction.aiSummary && (
          <View style={styles.aiSummarySection}>
            <View style={styles.aiSummaryHeader}>
              <Ionicons name="sparkles" size={20} color="#d4af37" />
              <Text style={styles.aiSummaryTitle}>AI Анализ отзывов</Text>
            </View>
            <Text style={styles.aiSummarySummary}>{attraction.aiSummary.summary}</Text>
            <View style={styles.prosConsContainer}>
              <View style={styles.prosColumn}>
                <Text style={styles.prosTitle}>✅ Плюсы</Text>
                {attraction.aiSummary.pros.map((pro, index) => (
                  <Text key={index} style={styles.proConItem}>• {pro}</Text>
                ))}
              </View>
              <View style={styles.consColumn}>
                <Text style={styles.consTitle}>⚠️ Минусы</Text>
                {attraction.aiSummary.cons.map((con, index) => (
                  <Text key={index} style={styles.proConItem}>• {con}</Text>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* Reviews Section */}
        {attraction.reviews && attraction.reviews.length > 0 && (
          <View style={styles.reviewsSection}>
            <Text style={styles.reviewsTitle}>📝 Отзывы ({attraction.reviews.length})</Text>
            {attraction.reviews.map((review) => (
              <View key={review.id} style={styles.reviewCard}>
                <View style={styles.reviewHeader}>
                  <Text style={styles.reviewAuthor}>{review.author}</Text>
                  <View style={styles.reviewRating}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Ionicons
                        key={star}
                        name={star <= review.rating ? "star" : "star-outline"}
                        size={14}
                        color="#d4af37"
                      />
                    ))}
                  </View>
                </View>
                <Text style={styles.reviewDate}>{review.date}</Text>
                <Text style={styles.reviewText}>{review.text}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Add to Cart Button */}
        <TouchableOpacity style={styles.addToCartButton} onPress={handleAddToCart}>
          <Ionicons name="cart" size={24} color="#fff" />
          <Text style={styles.addToCartButtonText}>
            {t('addToCart') || 'Добавить в корзину'}
          </Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  headerImage: {
    width: '100%',
    height: 300,
    resizeMode: 'cover',
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a4d3a',
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff9e6',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  rating: {
    marginLeft: 6,
    fontSize: 16,
    fontWeight: '600',
    color: '#d4af37',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  shareButton: {
    padding: 8,
    marginRight: 8,
  },
  saveButton: {
    padding: 8,
  },
  categoryBadge: {
    backgroundColor: '#e8f5e9',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  categoryText: {
    fontSize: 14,
    color: '#27ae60',
    fontWeight: '600',
  },
  description: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
    marginBottom: 20,
  },
  mapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  mapButtonText: {
    marginLeft: 12,
    fontSize: 16,
    fontWeight: '600',
    color: '#1a4d3a',
  },
  mapContainer: {
    height: 250,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 20,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  // AI Summary Styles
  aiSummarySection: {
    backgroundColor: '#fffef0',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#d4af37',
  },
  aiSummaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  aiSummaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a4d3a',
    marginLeft: 8,
  },
  aiSummarySummary: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    marginBottom: 12,
  },
  prosConsContainer: {
    flexDirection: 'row',
  },
  prosColumn: {
    flex: 1,
    marginRight: 8,
  },
  consColumn: {
    flex: 1,
    marginLeft: 8,
  },
  prosTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#27ae60',
    marginBottom: 6,
  },
  consTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#e67e22',
    marginBottom: 6,
  },
  proConItem: {
    fontSize: 12,
    color: '#555',
    marginBottom: 4,
    lineHeight: 16,
  },
  // Reviews Styles
  reviewsSection: {
    marginBottom: 20,
  },
  reviewsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a4d3a',
    marginBottom: 12,
  },
  reviewCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  reviewAuthor: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  reviewRating: {
    flexDirection: 'row',
  },
  reviewDate: {
    fontSize: 12,
    color: '#8e8e93',
    marginBottom: 8,
  },
  reviewText: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
  },
  // Tour-specific styles
  tourInfoSection: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  tourInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f5e9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  tourInfoText: {
    marginLeft: 6,
    fontSize: 14,
    color: '#1a4d3a',
    fontWeight: '500',
  },
  discountBadge: {
    backgroundColor: '#ff6b6b',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  discountText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  tourReason: {
    fontSize: 14,
    color: '#e67e22',
    fontWeight: '500',
    width: '100%',
    marginTop: 4,
  },
  // Price styles
  priceSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f9f4',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 10,
  },
  originalPrice: {
    fontSize: 16,
    color: '#999',
    textDecorationLine: 'line-through',
    marginRight: 10,
  },
  discountPrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#e74c3c',
  },
  priceText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a4d3a',
    marginLeft: 10,
  },
  // Add to Cart button
  addToCartButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1a4d3a',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginTop: 20,
  },
  addToCartButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
});

