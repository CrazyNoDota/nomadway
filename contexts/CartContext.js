import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContext';

const CartContext = createContext();

const CART_STORAGE_KEY = '@nomadway_cart';

export const CartProvider = ({ children }) => {
    const { isAuthenticated, authFetch, requireAuth } = useAuth();
    const [cartItems, setCartItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [aiSuggestions, setAiSuggestions] = useState(null);
    const [syncStatus, setSyncStatus] = useState('idle'); // idle, syncing, synced, error

    // Load cart based on authentication status
    useEffect(() => {
        if (isAuthenticated) {
            loadCartFromServer();
        } else {
            loadCartFromStorage();
        }
    }, [isAuthenticated]);

    // Sync local cart to server when user logs in
    useEffect(() => {
        if (isAuthenticated && cartItems.length > 0 && syncStatus === 'idle') {
            syncLocalCartToServer();
        }
    }, [isAuthenticated]);

    // Load cart from local storage (for unauthenticated users)
    const loadCartFromStorage = async () => {
        try {
            const storedCart = await AsyncStorage.getItem(CART_STORAGE_KEY);
            if (storedCart) {
                setCartItems(JSON.parse(storedCart));
            }
        } catch (error) {
            console.error('Error loading cart from storage:', error);
        } finally {
            setLoading(false);
        }
    };

    // Load cart from server (for authenticated users)
    const loadCartFromServer = async () => {
        try {
            setLoading(true);
            const response = await authFetch('/cart');
            
            if (response.ok) {
                const data = await response.json();
                // Transform server cart items to local format
                const serverItems = data.items.map(item => ({
                    id: item.attractionId || item.routeId,
                    cartId: item.id,
                    type: (item.itemType || 'attraction').toLowerCase(),
                    name: item.attraction?.name || item.name,
                    image: item.attraction?.image || item.image,
                    price: {
                        min: item.attraction?.budgetMin || 0,
                        max: item.attraction?.budgetMax || item.estimatedCost || 0,
                    },
                    region: item.attraction?.region || item.region,
                    pax: item.paxCount || item.quantity || 1,
                    selectedDate: item.selectedDate,
                    notes: item.notes,
                    addedAt: item.addedAt || item.createdAt,
                    attraction: item.attraction,
                }));
                setCartItems(serverItems);
                setSyncStatus('synced');
            }
        } catch (error) {
            console.error('Error loading cart from server:', error);
            // Fall back to local storage
            await loadCartFromStorage();
        } finally {
            setLoading(false);
        }
    };

    // Sync local cart to server after login
    const syncLocalCartToServer = async () => {
        try {
            setSyncStatus('syncing');
            const localCart = await AsyncStorage.getItem(CART_STORAGE_KEY);
            
            if (localCart) {
                const items = JSON.parse(localCart);
                if (items.length > 0) {
                    const response = await authFetch('/cart/sync', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ items: items }),
                    });

                    if (response.ok) {
                        // Clear local storage after successful sync
                        await AsyncStorage.removeItem(CART_STORAGE_KEY);
                        // Reload cart from server to get merged items
                        await loadCartFromServer();
                    }
                }
            }
            setSyncStatus('synced');
        } catch (error) {
            console.error('Error syncing cart:', error);
            setSyncStatus('error');
        }
    };

    // Save cart (to storage or server based on auth status)
    const saveCart = async (items) => {
        if (isAuthenticated) {
            // Cart is saved via API calls, no need to save locally
            return;
        }
        try {
            await AsyncStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
        } catch (error) {
            console.error('Error saving cart:', error);
        }
    };

    // Add item to cart
    const addToCart = useCallback(async (item) => {
        if (!requireAuth()) {
            return { success: false, error: 'Authentication required' };
        }

        const isServerCompatible = isAuthenticated && item?.type === 'attraction' && item?.id;

        if (isServerCompatible) {
            try {
                const response = await authFetch('/cart', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        itemType: 'attraction',
                        attractionId: item.id,
                        paxCount: item.pax || 1,
                        selectedDate: item.selectedDate,
                        notes: item.notes,
                    }),
                });

                if (response.ok) {
                    await loadCartFromServer();
                    setAiSuggestions(null);
                    return { success: true };
                } else {
                    const data = await response.json().catch(() => ({}));
                    const message = data?.error?.message || data?.error || `HTTP ${response.status}`;
                    console.error('Failed to add to cart:', message);
                    Alert.alert('Не удалось добавить в корзину', message);
                    return { success: false, error: message };
                }
            } catch (error) {
                console.error('Error adding to cart:', error);
                if (error.message !== 'Session expired') {
                    Alert.alert('Ошибка', 'Не удалось добавить в корзину. Попробуйте позже.');
                }
                return { success: false, error: error.message };
            }
        } else {
            // Fallback: store locally (tours/hot tours/routes or when offline)
            const addedItem = {
                ...item,
                cartId: item.cartId || `local_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
                pax: item.pax || 1,
            };
            setCartItems((prev) => {
                const newItems = [...prev, addedItem];
                saveCart(newItems);
                return newItems;
            });
            setAiSuggestions(null);
            return { success: true, item: addedItem };
        }
    }, [isAuthenticated, authFetch, requireAuth]);

    // Remove item from cart
    const removeFromCart = useCallback(async (cartId) => {
        const isLocalItem = cartId?.startsWith('local_');

        if (isLocalItem) {
            setCartItems((prevItems) => {
                const newItems = prevItems.filter((item) => item.cartId !== cartId);
                saveCart(newItems);
                return newItems;
            });
            setAiSuggestions(null);
            return { success: true };
        }

        if (!requireAuth()) {
            return { success: false, error: 'Authentication required' };
        }

        if (isAuthenticated) {
            try {
                const response = await authFetch(`/cart/${cartId}`, {
                    method: 'DELETE',
                });

                if (response.ok) {
                    setCartItems((prevItems) => prevItems.filter((item) => item.cartId !== cartId));
                    setAiSuggestions(null);
                    return { success: true };
                }
                const data = await response.json().catch(() => ({}));
                const message = data?.error?.message || data?.error || `HTTP ${response.status}`;
                console.error('Failed to remove from cart:', message);
                return { success: false, error: message };
            } catch (error) {
                console.error('Error removing from cart:', error);
                return { success: false, error: error.message };
            }
        }
        return { success: false, error: 'Cart item is not removable in the current auth state' };
    }, [isAuthenticated, authFetch, requireAuth]);

    // Update pax count
    const updatePax = useCallback(async (cartId, newPax) => {
        if (newPax < 1) return;

        const isLocalItem = cartId?.startsWith('local_');

        if (isAuthenticated && !isLocalItem) {
            try {
                const response = await authFetch(`/cart/${cartId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ paxCount: newPax }),
                });

                if (response.ok) {
                    setCartItems((prevItems) =>
                        prevItems.map((item) =>
                            item.cartId === cartId ? { ...item, pax: newPax } : item
                        )
                    );
                }
            } catch (error) {
                console.error('Error updating cart:', error);
            }
        } else {
            setCartItems((prevItems) => {
                const newItems = prevItems.map((item) =>
                    item.cartId === cartId ? { ...item, pax: newPax } : item
                );
                saveCart(newItems);
                return newItems;
            });
        }
        setAiSuggestions(null);
    }, [isAuthenticated, authFetch]);

    // Clear entire cart
    const clearCart = useCallback(async () => {
        if (isAuthenticated) {
            try {
                const response = await authFetch('/cart', {
                    method: 'DELETE',
                });

                if (response.ok) {
                    setCartItems([]);
                }
            } catch (error) {
                console.error('Error clearing cart:', error);
            }
        } else {
            setCartItems([]);
            await AsyncStorage.removeItem(CART_STORAGE_KEY);
        }
        setAiSuggestions(null);
    }, [isAuthenticated, authFetch]);

    // Calculate total price
    const getTotalPrice = useCallback(() => {
        return cartItems.reduce((total, item) => {
            const itemPrice = item.price?.max || item.price || 0;
            return total + (itemPrice * item.pax);
        }, 0);
    }, [cartItems]);

    // Calculate total duration
    const getTotalDuration = useCallback(() => {
        return cartItems.reduce((total, item) => {
            return total + (item.durationDays || 1);
        }, 0);
    }, [cartItems]);

    // Get cart item count
    const getItemCount = useCallback(() => {
        return cartItems.reduce((count, item) => count + item.pax, 0);
    }, [cartItems]);

    // Request AI optimization
    const requestAiOptimization = useCallback(async () => {
        if (cartItems.length === 0) return null;

        try {
            // Generate AI suggestions based on cart analysis
            const suggestions = [];

            // Always show a helpful tip first
            suggestions.push({
                type: 'tip',
                icon: '✨',
                title: 'Совет от AI',
                titleEn: 'AI Tip',
                message: `В вашей корзине ${cartItems.length} ${cartItems.length === 1 ? 'позиция' : 'позиций'}. Мы проанализировали ваш выбор и подготовили рекомендации.`,
                messageEn: `You have ${cartItems.length} item(s) in your cart. We analyzed your selection and prepared recommendations.`,
            });

            // Check for logical ordering issues
            const regions = cartItems.map(item => item.region).filter(Boolean);
            const uniqueRegions = new Set(regions);
            const hasMultipleRegions = uniqueRegions.size > 1;

            if (hasMultipleRegions) {
                suggestions.push({
                    type: 'logistics',
                    icon: '🗺️',
                    title: 'Оптимизация маршрута',
                    titleEn: 'Route Optimization',
                    message: `У вас туры в ${uniqueRegions.size} разных регионах. Рекомендуем сгруппировать туры по региону для удобства.`,
                    messageEn: `You have tours in ${uniqueRegions.size} different regions. We recommend grouping tours by region.`,
                });
            }

            // Check for group discount opportunity
            const totalPax = cartItems.reduce((sum, item) => sum + item.pax, 0);
            if (totalPax >= 4) {
                suggestions.push({
                    type: 'discount',
                    icon: '💰',
                    title: 'Групповая скидка',
                    titleEn: 'Group Discount',
                    message: `При бронировании ${totalPax} человек вы можете получить групповую скидку до 15%!`,
                    messageEn: `Booking for ${totalPax} people may qualify you for a group discount of up to 15%!`,
                });
            } else if (totalPax < 4) {
                suggestions.push({
                    type: 'discount',
                    icon: '👥',
                    title: 'Добавьте попутчиков',
                    titleEn: 'Add Travelers',
                    message: `Добавьте ещё ${4 - totalPax} человек для получения групповой скидки до 15%!`,
                    messageEn: `Add ${4 - totalPax} more travelers to qualify for up to 15% group discount!`,
                });
            }

            // Check for seasonal recommendations
            const currentMonth = new Date().getMonth();
            const isWinter = currentMonth >= 10 || currentMonth <= 2;
            const isSummer = currentMonth >= 5 && currentMonth <= 7;
            const currentSeason = isWinter ? 'winter' : (isSummer ? 'summer' : 'spring');

            cartItems.forEach(item => {
                if (item.bestSeason && Array.isArray(item.bestSeason) && item.bestSeason.length > 0) {
                    if (!item.bestSeason.includes(currentSeason)) {
                        suggestions.push({
                            type: 'season',
                            icon: '📅',
                            title: 'Сезонная рекомендация',
                            titleEn: 'Seasonal Recommendation',
                            message: `"${item.name}" лучше посещать в другое время года. Лучший сезон: ${item.bestSeason.join(', ')}.`,
                            messageEn: `"${item.name}" is best visited in a different season. Best time: ${item.bestSeason.join(', ')}.`,
                            itemId: item.id,
                        });
                    }
                }
            });

            // Budget optimization
            const total = getTotalPrice();
            if (total > 100000) {
                suggestions.push({
                    type: 'budget',
                    icon: '💡',
                    title: 'Экономия бюджета',
                    titleEn: 'Budget Savings',
                    message: `Общая сумма ${new Intl.NumberFormat('ru-RU').format(total)} ₸. Рассмотрите похожие туры по более выгодным ценам.`,
                    messageEn: `Total is ${new Intl.NumberFormat('ru-RU').format(total)} ₸. Consider similar tours at better prices.`,
                });
            } else if (total > 0) {
                suggestions.push({
                    type: 'savings',
                    icon: '🎯',
                    title: 'Отличный выбор',
                    titleEn: 'Great Choice',
                    message: `Ваш бюджет ${new Intl.NumberFormat('ru-RU').format(total)} ₸ — это хороший выбор для знакомства с Казахстаном!`,
                    messageEn: `Your budget of ${new Intl.NumberFormat('ru-RU').format(total)} ₸ is a great choice for exploring Kazakhstan!`,
                });
            }

            // Duration optimization
            const totalDays = getTotalDuration();
            if (totalDays > 7) {
                suggestions.push({
                    type: 'duration',
                    icon: '⏰',
                    title: 'Длительное путешествие',
                    titleEn: 'Extended Trip',
                    message: `Общая продолжительность ${totalDays} дней. Не забудьте забронировать проживание заранее!`,
                    messageEn: `Total duration is ${totalDays} days. Don't forget to book accommodation in advance!`,
                });
            }

            setAiSuggestions(suggestions);
            return suggestions;
        } catch (error) {
            console.error('Error getting AI optimization:', error);
            // Return a default suggestion even on error
            const fallbackSuggestions = [{
                type: 'info',
                icon: '📋',
                title: 'Анализ завершён',
                titleEn: 'Analysis Complete',
                message: 'Ваша корзина готова к оформлению. Нажмите "Оформить" для продолжения.',
                messageEn: 'Your cart is ready. Click "Checkout" to continue.',
            }];
            setAiSuggestions(fallbackSuggestions);
            return fallbackSuggestions;
        }
    }, [cartItems, getTotalPrice, getTotalDuration]);

    const value = {
        cartItems,
        loading,
        aiSuggestions,
        syncStatus,
        addToCart,
        removeFromCart,
        updatePax,
        clearCart,
        getTotalPrice,
        getTotalDuration,
        getItemCount,
        requestAiOptimization,
        syncLocalCartToServer,
    };

    return (
        <CartContext.Provider value={value}>
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
};

export default CartContext;
