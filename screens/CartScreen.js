import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useCart } from '../contexts/CartContext';
import analyticsService from '../utils/AnalyticsService';

const CartScreen = ({ navigation }) => {
    const {
        cartItems,
        loading,
        aiSuggestions,
        removeFromCart,
        updatePax,
        clearCart,
        getTotalPrice,
        getTotalDuration,
        getItemCount,
        requestAiOptimization,
    } = useCart();

    const [optimizing, setOptimizing] = useState(false);

    useEffect(() => {
        // Request AI optimization when cart has items
        if (cartItems.length > 0 && !aiSuggestions) {
            handleOptimize();
        }
    }, [cartItems.length]);

    const handleOptimize = async () => {
        setOptimizing(true);
        await requestAiOptimization();
        setOptimizing(false);
    };

    const handleRemoveItem = (cartId, itemName) => {
        Alert.alert(
            'Удалить из корзины',
            `Удалить "${itemName}" из корзины?`,
            [
                { text: 'Отмена', style: 'cancel' },
                { text: 'Удалить', style: 'destructive', onPress: () => removeFromCart(cartId) },
            ]
        );
    };

    const handleClearCart = () => {
        Alert.alert(
            'Очистить корзину',
            'Вы уверены, что хотите очистить всю корзину?',
            [
                { text: 'Отмена', style: 'cancel' },
                { text: 'Очистить', style: 'destructive', onPress: clearCart },
            ]
        );
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat('ru-RU').format(price) + ' ₸';
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#1a4d3a" />
                    <Text style={styles.loadingText}>Загрузка корзины...</Text>
                </View>
            </SafeAreaView>
        );
    }

    if (cartItems.length === 0) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.emptyContainer}>
                    <Ionicons name="cart-outline" size={80} color="#ccc" />
                    <Text style={styles.emptyTitle}>Корзина пуста</Text>
                    <Text style={styles.emptySubtitle}>
                        Добавьте туры или достопримечательности, чтобы начать планирование
                    </Text>
                    <TouchableOpacity
                        style={styles.exploreButton}
                        onPress={() => navigation.navigate('Home', { screen: 'Tours' })}
                    >
                        <Ionicons name="compass-outline" size={20} color="#fff" />
                        <Text style={styles.exploreButtonText}>Исследовать</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {/* Header Stats */}
                <View style={styles.statsRow}>
                    <View style={styles.statItem}>
                        <Text style={styles.statNumber}>{getItemCount()}</Text>
                        <Text style={styles.statLabel}>Позиций</Text>
                    </View>
                    <View style={styles.statItem}>
                        <Text style={styles.statNumber}>{getTotalDuration()}</Text>
                        <Text style={styles.statLabel}>Дней</Text>
                    </View>
                    <View style={styles.statItem}>
                        <Text style={styles.statNumber}>{formatPrice(getTotalPrice())}</Text>
                        <Text style={styles.statLabel}>Итого</Text>
                    </View>
                </View>

                {/* AI Analysis Button */}
                <TouchableOpacity
                    style={styles.aiAnalysisButton}
                    onPress={handleOptimize}
                    disabled={optimizing}
                >
                    <View style={styles.aiAnalysisContent}>
                        <Ionicons name="sparkles" size={24} color="#d4af37" />
                        <View style={styles.aiAnalysisTextContainer}>
                            <Text style={styles.aiAnalysisTitle}>🤖 AI Анализ корзины</Text>
                            <Text style={styles.aiAnalysisSubtitle}>
                                Скидки • Доступные туры • Альтернативы • Оптимизация
                            </Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#1a4d3a" />
                    </View>
                </TouchableOpacity>

                {/* AI Suggestions Panel */}
                {(aiSuggestions && aiSuggestions.length > 0) && (
                    <View style={styles.suggestionsPanel}>
                        <View style={styles.suggestionHeader}>
                            <Ionicons name="bulb" size={20} color="#d4af37" />
                            <Text style={styles.suggestionTitle}>AI Рекомендации</Text>
                        </View>
                        {aiSuggestions.map((suggestion, index) => (
                            <View key={index} style={styles.suggestionItem}>
                                <Text style={styles.suggestionIcon}>{suggestion.icon}</Text>
                                <View style={styles.suggestionContent}>
                                    <Text style={styles.suggestionItemTitle}>{suggestion.title}</Text>
                                    <Text style={styles.suggestionMessage}>{suggestion.message}</Text>
                                </View>
                            </View>
                        ))}
                    </View>
                )}

                {optimizing && (
                    <View style={styles.optimizingBanner}>
                        <ActivityIndicator size="small" color="#1a4d3a" />
                        <Text style={styles.optimizingText}>Анализируем вашу корзину...</Text>
                    </View>
                )}

                {/* Cart Items */}
                <View style={styles.cartItemsContainer}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Ваши туры</Text>
                        <TouchableOpacity onPress={handleClearCart}>
                            <Text style={styles.clearAllText}>Очистить всё</Text>
                        </TouchableOpacity>
                    </View>

                    {cartItems.map((item) => (
                        <View key={item.cartId} style={styles.cartItem}>
                            <View style={styles.cartItemHeader}>
                                <View style={styles.tourTypeTag}>
                                    <Text style={styles.tourTypeText}>
                                        {item.type === 'tour' ? '🗺️ Тур' : '📍 Место'}
                                    </Text>
                                </View>
                                <TouchableOpacity
                                    onPress={() => handleRemoveItem(item.cartId, item.name)}
                                    style={styles.removeButton}
                                >
                                    <Ionicons name="trash-outline" size={18} color="#e74c3c" />
                                </TouchableOpacity>
                            </View>

                            <Text style={styles.itemName}>{item.name}</Text>

                            <View style={styles.itemDetails}>
                                {item.city && (
                                    <View style={styles.detailRow}>
                                        <Ionicons name="location-outline" size={14} color="#666" />
                                        <Text style={styles.detailText}>{item.city}</Text>
                                    </View>
                                )}
                                {item.durationDays && (
                                    <View style={styles.detailRow}>
                                        <Ionicons name="time-outline" size={14} color="#666" />
                                        <Text style={styles.detailText}>{item.durationDays} дн.</Text>
                                    </View>
                                )}
                                {item.region && (
                                    <View style={styles.detailRow}>
                                        <Ionicons name="map-outline" size={14} color="#666" />
                                        <Text style={styles.detailText}>{item.region}</Text>
                                    </View>
                                )}
                            </View>

                            <View style={styles.itemFooter}>
                                {/* Pax Counter */}
                                <View style={styles.paxContainer}>
                                    <Text style={styles.paxLabel}>Человек:</Text>
                                    <View style={styles.paxControls}>
                                        <TouchableOpacity
                                            style={[styles.paxButton, item.pax <= 1 && styles.paxButtonDisabled]}
                                            onPress={() => updatePax(item.cartId, item.pax - 1)}
                                            disabled={item.pax <= 1}
                                        >
                                            <Ionicons name="remove" size={16} color={item.pax <= 1 ? '#ccc' : '#1a4d3a'} />
                                        </TouchableOpacity>
                                        <Text style={styles.paxNumber}>{item.pax}</Text>
                                        <TouchableOpacity
                                            style={styles.paxButton}
                                            onPress={() => updatePax(item.cartId, item.pax + 1)}
                                        >
                                            <Ionicons name="add" size={16} color="#1a4d3a" />
                                        </TouchableOpacity>
                                    </View>
                                </View>

                                {/* Price */}
                                <View style={styles.priceContainer}>
                                    <Text style={styles.itemPrice}>
                                        {formatPrice((item.price?.max || item.price || 0) * item.pax)}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    ))}
                </View>
            </ScrollView>

            {/* Bottom Checkout Bar */}
            <View style={styles.checkoutBar}>
                <View style={styles.checkoutInfo}>
                    <Text style={styles.checkoutTotal}>{formatPrice(getTotalPrice())}</Text>
                    <Text style={styles.checkoutSubtext}>{getItemCount()} позиций • {getTotalDuration()} дней</Text>
                </View>
                <TouchableOpacity
                    style={styles.checkoutButton}
                    onPress={() => {
                        // Track the checkout button click
                        analyticsService.logAction('Checkout', {
                            itemCount: getItemCount(),
                            totalPrice: getTotalPrice(),
                            totalDays: getTotalDuration(),
                        });
                        
                        Alert.alert('Бронирование', 'Функция бронирования будет доступна в следующем обновлении!');
                    }}
                >
                    <Ionicons name="card-outline" size={20} color="#fff" />
                    <Text style={styles.checkoutButtonText}>Забронировать</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    scrollView: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 10,
        color: '#666',
        fontSize: 16,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    emptyTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#333',
        marginTop: 20,
    },
    emptySubtitle: {
        fontSize: 15,
        color: '#666',
        textAlign: 'center',
        marginTop: 10,
        lineHeight: 22,
    },
    exploreButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1a4d3a',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 25,
        marginTop: 30,
    },
    exploreButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
    statsRow: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        marginHorizontal: 16,
        marginTop: 16,
        borderRadius: 12,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
    },
    statNumber: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1a4d3a',
    },
    statLabel: {
        fontSize: 12,
        color: '#666',
        marginTop: 4,
    },
    suggestionsPanel: {
        backgroundColor: '#fffef0',
        marginHorizontal: 16,
        marginTop: 16,
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: '#d4af37',
    },
    suggestionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    suggestionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1a4d3a',
        marginLeft: 8,
    },
    suggestionItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 10,
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: '#f0e6c0',
    },
    suggestionIcon: {
        fontSize: 20,
        marginRight: 10,
    },
    suggestionContent: {
        flex: 1,
    },
    suggestionItemTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 2,
    },
    suggestionMessage: {
        fontSize: 13,
        color: '#666',
        lineHeight: 18,
    },
    optimizingBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#e8f5e9',
        marginHorizontal: 16,
        marginTop: 16,
        borderRadius: 8,
        padding: 12,
    },
    optimizingText: {
        marginLeft: 10,
        color: '#1a4d3a',
        fontSize: 14,
    },
    cartItemsContainer: {
        marginTop: 16,
        paddingHorizontal: 16,
        paddingBottom: 100,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    clearAllText: {
        fontSize: 14,
        color: '#e74c3c',
    },
    cartItem: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    cartItemHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    tourTypeTag: {
        backgroundColor: '#e8f5e9',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    tourTypeText: {
        fontSize: 12,
        color: '#1a4d3a',
        fontWeight: '500',
    },
    removeButton: {
        padding: 4,
    },
    itemName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    itemDetails: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 12,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 16,
        marginBottom: 4,
    },
    detailText: {
        fontSize: 13,
        color: '#666',
        marginLeft: 4,
    },
    itemFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
    },
    paxContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    paxLabel: {
        fontSize: 14,
        color: '#666',
        marginRight: 8,
    },
    paxControls: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
        borderRadius: 8,
        padding: 4,
    },
    paxButton: {
        width: 28,
        height: 28,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#ddd',
    },
    paxButtonDisabled: {
        backgroundColor: '#f5f5f5',
        borderColor: '#eee',
    },
    paxNumber: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginHorizontal: 12,
    },
    priceContainer: {
        alignItems: 'flex-end',
    },
    itemPrice: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1a4d3a',
    },
    checkoutBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#fff',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderTopWidth: 1,
        borderTopColor: '#eee',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 5,
    },
    checkoutInfo: {
        flex: 1,
    },
    checkoutTotal: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1a4d3a',
    },
    checkoutSubtext: {
        fontSize: 12,
        color: '#666',
        marginTop: 2,
    },
    checkoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#d4af37',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 25,
    },
    checkoutButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
    aiAnalysisButton: {
        backgroundColor: '#fff',
        marginHorizontal: 16,
        marginTop: 16,
        borderRadius: 12,
        padding: 16,
        borderWidth: 2,
        borderColor: '#d4af37',
        borderStyle: 'dashed',
    },
    aiAnalysisContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    aiAnalysisTextContainer: {
        flex: 1,
        marginLeft: 12,
    },
    aiAnalysisTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1a4d3a',
    },
    aiAnalysisSubtitle: {
        fontSize: 12,
        color: '#666',
        marginTop: 2,
    },
});

export default CartScreen;
