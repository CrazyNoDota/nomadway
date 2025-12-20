import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../contexts/ThemeContext';
import { TOURS, HOT_TOURS } from '../data/tours';

const { width } = Dimensions.get('window');

const HotToursSection = ({ onTourPress, onAddToCart, onSeeAllPress, language = 'ru' }) => {
    const { colors, isDark } = useTheme();
    
    const formatPrice = (price) => {
        return new Intl.NumberFormat('ru-RU').format(price) + ' ₸';
    };

    const getName = (tour) => language === 'en' ? tour.nameEn : tour.name;
    const getReason = (tour) => language === 'en' ? tour.reasonEn : tour.reason;
    const getCategory = (tour) => language === 'en' ? tour.categoryEn : tour.category;

    // Regular Tour Card Component
    const TourCard = ({ tour }) => (
        <TouchableOpacity
            style={[styles.tourCard, { backgroundColor: colors.card }]}
            onPress={() => onTourPress?.(tour)}
            activeOpacity={0.9}
        >
            <View style={styles.tourImageContainer}>
                <Image source={{ uri: tour.image }} style={styles.tourImage} />
                <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.7)']}
                    style={styles.tourImageGradient}
                />
                <View style={styles.categoryBadge}>
                    <Text style={styles.categoryText}>{getCategory(tour)}</Text>
                </View>
                <View style={styles.ratingContainer}>
                    <Ionicons name="star" size={12} color="#FFD700" />
                    <Text style={styles.ratingText}>{tour.rating}</Text>
                    <Text style={styles.reviewCount}>({tour.reviewCount})</Text>
                </View>
            </View>

            <View style={styles.tourContent}>
                <Text style={[styles.tourName, { color: colors.text }]} numberOfLines={1}>
                    {getName(tour)}
                </Text>

                <View style={styles.tourMeta}>
                    <View style={styles.metaItem}>
                        <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
                        <Text style={[styles.metaText, { color: colors.textSecondary }]}>{tour.duration}</Text>
                    </View>
                    <View style={styles.metaItem}>
                        <Ionicons name="location-outline" size={14} color={colors.textSecondary} />
                        <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                            {tour.region === 'south' ? (language === 'en' ? 'South' : 'Юг') :
                             tour.region === 'north' ? (language === 'en' ? 'North' : 'Север') :
                             tour.region === 'west' ? (language === 'en' ? 'West' : 'Запад') :
                             (language === 'en' ? 'Central' : 'Центр')}
                        </Text>
                    </View>
                </View>

                <View style={styles.priceActionRow}>
                    <Text style={[styles.tourPrice, { color: colors.primary }]}>
                        {formatPrice(tour.price)}
                    </Text>
                    <TouchableOpacity
                        style={[styles.addToCartBtn, { backgroundColor: colors.primary }]}
                        onPress={() => onAddToCart?.({
                            ...tour,
                            type: 'tour',
                            price: { min: tour.price * 0.9, max: tour.price },
                        })}
                    >
                        <Ionicons name="add" size={18} color="#fff" />
                    </TouchableOpacity>
                </View>
            </View>
        </TouchableOpacity>
    );

    // Hot Tour Card Component
    const HotTourCard = ({ tour }) => (
        <TouchableOpacity
            style={[styles.hotTourCard, { backgroundColor: colors.card }]}
            onPress={() => onTourPress?.(tour)}
            activeOpacity={0.9}
        >
            <View style={styles.hotTourImageContainer}>
                <Image source={{ uri: tour.image }} style={styles.hotTourImage} />
                <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.8)']}
                    style={styles.hotTourGradient}
                />
                
                {/* Animated Fire Badge */}
                <View style={styles.fireBadge}>
                    <Text style={styles.fireEmoji}>🔥</Text>
                    <Text style={styles.discountBadgeText}>-{tour.discount}%</Text>
                </View>

                {/* Tour Info Overlay */}
                <View style={styles.hotTourOverlay}>
                    <Text style={styles.hotTourName} numberOfLines={1}>{getName(tour)}</Text>
                    <Text style={styles.hotTourReason}>{getReason(tour)}</Text>
                </View>
            </View>

            <View style={styles.hotTourContent}>
                <View style={styles.hotTourMeta}>
                    <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
                    <Text style={[styles.hotMetaText, { color: colors.textSecondary }]}>{tour.duration}</Text>
                </View>

                <View style={styles.hotPriceRow}>
                    <View>
                        <Text style={[styles.originalPrice, { color: colors.textMuted }]}>
                            {formatPrice(tour.originalPrice)}
                        </Text>
                        <Text style={styles.hotDiscountPrice}>
                            {formatPrice(tour.discountPrice)}
                        </Text>
                    </View>
                    <TouchableOpacity
                        style={styles.hotAddButton}
                        onPress={() => onAddToCart?.({
                            ...tour,
                            type: 'tour',
                            price: { min: tour.discountPrice * 0.9, max: tour.discountPrice },
                        })}
                    >
                        <Ionicons name="cart" size={16} color="#fff" />
                        <Text style={styles.hotAddButtonText}>
                            {language === 'en' ? 'Book' : 'Забронировать'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            {/* Tours Section */}
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <View style={styles.sectionTitleContainer}>
                        <View style={[styles.iconCircle, { backgroundColor: colors.primary + '20' }]}>
                            <Ionicons name="compass" size={20} color={colors.primary} />
                        </View>
                        <View>
                            <Text style={[styles.sectionTitle, { color: colors.text }]}>
                                {language === 'en' ? 'Tours' : 'Туры'}
                            </Text>
                            <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
                                {language === 'en' ? 'Explore Kazakhstan' : 'Исследуйте Казахстан'}
                            </Text>
                        </View>
                    </View>
                    <TouchableOpacity style={styles.seeAllButton} onPress={() => onSeeAllPress?.()}>
                        <Text style={[styles.seeAllText, { color: colors.primary }]}>
                            {language === 'en' ? 'See all' : 'Все'}
                        </Text>
                        <Ionicons name="arrow-forward" size={16} color={colors.primary} />
                    </TouchableOpacity>
                </View>

                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.scrollContent}
                    decelerationRate="fast"
                    snapToInterval={width * 0.6 + 12}
                >
                    {TOURS.map((tour) => (
                        <TourCard key={tour.id} tour={tour} />
                    ))}
                </ScrollView>
            </View>

            {/* Hot Tours Section */}
            <View style={styles.section}>
                <View style={styles.hotSectionHeader}>
                    <LinearGradient
                        colors={['#FF6B35', '#F7931E']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.hotHeaderGradient}
                    >
                        <View style={styles.hotTitleContainer}>
                            <Text style={styles.hotFireIcon}>🔥</Text>
                            <View>
                                <Text style={styles.hotSectionTitle}>
                                    {language === 'en' ? 'Hot Tours' : 'Горящие туры'}
                                </Text>
                                <Text style={styles.hotSectionSubtitle}>
                                    {language === 'en' ? 'Limited time offers' : 'Ограниченное предложение'}
                                </Text>
                            </View>
                        </View>
                        <TouchableOpacity style={styles.hotSeeAllButton} onPress={() => onSeeAllPress?.()}>
                            <Text style={styles.hotSeeAllText}>
                                {language === 'en' ? 'All deals' : 'Все акции'}
                            </Text>
                            <Ionicons name="arrow-forward" size={14} color="#fff" />
                        </TouchableOpacity>
                    </LinearGradient>
                </View>

                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.hotScrollContent}
                    decelerationRate="fast"
                    snapToInterval={width * 0.75 + 12}
                >
                    {HOT_TOURS.map((tour) => (
                        <HotTourCard key={tour.id} tour={tour} />
                    ))}
                </ScrollView>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginVertical: 8,
    },
    
    // Section Styles
    section: {
        marginBottom: 24,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        marginBottom: 16,
    },
    sectionTitleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '700',
    },
    sectionSubtitle: {
        fontSize: 12,
        marginTop: 2,
    },
    seeAllButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    seeAllText: {
        fontSize: 14,
        fontWeight: '600',
    },
    scrollContent: {
        paddingHorizontal: 16,
    },

    // Tour Card Styles
    tourCard: {
        width: width * 0.6,
        borderRadius: 20,
        marginRight: 12,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 5,
    },
    tourImageContainer: {
        position: 'relative',
    },
    tourImage: {
        width: '100%',
        height: 140,
        resizeMode: 'cover',
    },
    tourImageGradient: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 60,
    },
    categoryBadge: {
        position: 'absolute',
        top: 12,
        left: 12,
        backgroundColor: 'rgba(255,255,255,0.95)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    categoryText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#333',
    },
    ratingContainer: {
        position: 'absolute',
        bottom: 12,
        left: 12,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.6)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    ratingText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
        marginLeft: 4,
    },
    reviewCount: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 10,
        marginLeft: 2,
    },
    tourContent: {
        padding: 14,
    },
    tourName: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 8,
    },
    tourMeta: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 12,
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    metaText: {
        fontSize: 12,
    },
    priceActionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    tourPrice: {
        fontSize: 18,
        fontWeight: '700',
    },
    addToCartBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },

    // Hot Section Styles
    hotSectionHeader: {
        paddingHorizontal: 16,
        marginBottom: 16,
    },
    hotHeaderGradient: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderRadius: 16,
    },
    hotTitleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    hotFireIcon: {
        fontSize: 28,
        marginRight: 12,
    },
    hotSectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#fff',
    },
    hotSectionSubtitle: {
        fontSize: 11,
        color: 'rgba(255,255,255,0.85)',
        marginTop: 2,
    },
    hotSeeAllButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        gap: 4,
    },
    hotSeeAllText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
    },
    hotScrollContent: {
        paddingHorizontal: 16,
    },

    // Hot Tour Card Styles
    hotTourCard: {
        width: width * 0.75,
        borderRadius: 20,
        marginRight: 12,
        overflow: 'hidden',
        shadowColor: '#FF6B35',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
        elevation: 6,
    },
    hotTourImageContainer: {
        position: 'relative',
        height: 160,
    },
    hotTourImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    hotTourGradient: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 100,
    },
    fireBadge: {
        position: 'absolute',
        top: 12,
        right: 12,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#e74c3c',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 16,
        gap: 4,
    },
    fireEmoji: {
        fontSize: 14,
    },
    discountBadgeText: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '700',
    },
    hotTourOverlay: {
        position: 'absolute',
        bottom: 12,
        left: 12,
        right: 12,
    },
    hotTourName: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 4,
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
    },
    hotTourReason: {
        color: '#FFD700',
        fontSize: 12,
        fontWeight: '600',
    },
    hotTourContent: {
        padding: 14,
    },
    hotTourMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginBottom: 12,
    },
    hotMetaText: {
        fontSize: 13,
    },
    hotPriceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    originalPrice: {
        fontSize: 12,
        textDecorationLine: 'line-through',
    },
    hotDiscountPrice: {
        fontSize: 20,
        fontWeight: '700',
        color: '#e74c3c',
    },
    hotAddButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FF6B35',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 25,
        gap: 6,
    },
    hotAddButtonText: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '600',
    },
});

export default HotToursSection;
