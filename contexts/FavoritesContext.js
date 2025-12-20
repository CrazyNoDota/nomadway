import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContext';

const FavoritesContext = createContext();

const FAVORITES_STORAGE_KEY = '@nomadway_favorites';

export const FavoritesProvider = ({ children }) => {
    const { isAuthenticated, authFetch, requireAuth } = useAuth();
    const [favorites, setFavorites] = useState([]);
    const [loading, setLoading] = useState(true);
    const [syncStatus, setSyncStatus] = useState('idle');

    // Load favorites based on authentication status
    useEffect(() => {
        if (isAuthenticated) {
            loadFavoritesFromServer();
        } else {
            loadFavoritesFromStorage();
        }
    }, [isAuthenticated]);

    // Sync local favorites to server when user logs in
    useEffect(() => {
        if (isAuthenticated && favorites.length > 0 && syncStatus === 'idle') {
            syncLocalFavoritesToServer();
        }
    }, [isAuthenticated]);

    // Load favorites from local storage (for unauthenticated users)
    const loadFavoritesFromStorage = async () => {
        try {
            const storedFavorites = await AsyncStorage.getItem(FAVORITES_STORAGE_KEY);
            if (storedFavorites) {
                setFavorites(JSON.parse(storedFavorites));
            }
        } catch (error) {
            console.error('Error loading favorites from storage:', error);
        } finally {
            setLoading(false);
        }
    };

    // Load favorites from server (for authenticated users)
    const loadFavoritesFromServer = async () => {
        try {
            setLoading(true);
            const response = await authFetch('/favorites');
            
            if (response.ok) {
                const data = await response.json();
                const items = data?.favorites || data?.items || [];
                const serverFavorites = Array.isArray(items) ? items.map((fav) => ({
                    id: fav.attractionId || fav.routeId || fav.id,
                    favoriteId: fav.id,
                    type: (fav.itemType || fav.type || 'attraction').toLowerCase(),
                    name: fav.name || fav.attraction?.name,
                    image: fav.image || fav.attraction?.image,
                    region: fav.region || fav.attraction?.region,
                    category: fav.category || fav.attraction?.category,
                    notes: fav.notes,
                    addedAt: fav.createdAt || fav.addedAt,
                })) : [];
                setFavorites(serverFavorites);
                setSyncStatus('synced');
            } else {
                setFavorites([]);
            }
        } catch (error) {
            console.error('Error loading favorites from server:', error);
            await loadFavoritesFromStorage();
        } finally {
            setLoading(false);
        }
    };

    // Sync local favorites to server after login
    const syncLocalFavoritesToServer = async () => {
        try {
            setSyncStatus('syncing');
            const localFavorites = await AsyncStorage.getItem(FAVORITES_STORAGE_KEY);
            
            if (localFavorites) {
                const items = JSON.parse(localFavorites);
                // Add each local favorite to server
                for (const item of items) {
                    try {
                        await authFetch('/favorites', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                itemType: (item.type || 'attraction').toLowerCase(),
                                attractionId: item.type === 'attraction' ? item.id : undefined,
                                routeId: item.type === 'route' ? item.id : undefined,
                                name: item.name,
                                image: item.image,
                                region: item.region,
                                category: item.category,
                            }),
                        });
                    } catch (err) {
                        // Ignore duplicates
                    }
                }
                // Clear local storage after sync
                await AsyncStorage.removeItem(FAVORITES_STORAGE_KEY);
                await loadFavoritesFromServer();
            }
            setSyncStatus('synced');
        } catch (error) {
            console.error('Error syncing favorites:', error);
            setSyncStatus('error');
        }
    };

    // Save favorites to local storage
    const saveFavorites = async (items) => {
        if (isAuthenticated) return;
        try {
            await AsyncStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(items));
        } catch (error) {
            console.error('Error saving favorites:', error);
        }
    };

    // Add item to favorites
    const addToFavorites = useCallback(async (item) => {
        // Check if already exists
        if (favorites.some((fav) => fav.id === item.id && fav.type === item.type)) {
            return;
        }

        if (!requireAuth()) {
            return;
        }

        if (isAuthenticated) {
            try {
                const response = await authFetch('/favorites', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        itemType: (item.type || 'attraction').toLowerCase(),
                        attractionId: item.type === 'attraction' ? item.id : undefined,
                        routeId: item.type === 'route' ? item.id : undefined,
                        name: item.name,
                        image: item.image,
                        region: item.region,
                        category: item.category,
                    }),
                });

                if (response.ok) {
                    const data = await response.json();
                    const created = data.favorite || data.item || data;
                    setFavorites(prev => [...prev, {
                        ...item,
                        favoriteId: created.id,
                        addedAt: new Date().toISOString(),
                    }]);
                }
            } catch (error) {
                console.error('Error adding to favorites:', error);
            }
        }
    }, [favorites, isAuthenticated, authFetch]);

    // Remove item from favorites
    const removeFromFavorites = useCallback(async (itemId, itemType) => {
        if (!requireAuth()) {
            return;
        }

        if (isAuthenticated) {
            try {
                const favorite = favorites.find(f => f.id === itemId && f.type === itemType);
                if (favorite?.favoriteId) {
                    const response = await authFetch(`/favorites/${favorite.favoriteId}`, {
                        method: 'DELETE',
                    });

                    if (response.ok) {
                        setFavorites(prev =>
                            prev.filter((item) => !(item.id === itemId && item.type === itemType))
                        );
                    }
                }
            } catch (error) {
                console.error('Error removing from favorites:', error);
            }
        } else {
            setFavorites(prev => {
                const newFavorites = prev.filter((item) => !(item.id === itemId && item.type === itemType));
                saveFavorites(newFavorites);
                return newFavorites;
            });
        }
    }, [favorites, isAuthenticated, authFetch]);

    // Toggle favorite status
    const toggleFavorite = useCallback((item) => {
        const isFav = favorites.some((fav) => fav.id === item.id && fav.type === item.type);
        if (isFav) {
            removeFromFavorites(item.id, item.type);
        } else {
            addToFavorites(item);
        }
    }, [favorites, addToFavorites, removeFromFavorites]);

    // Check if item is favorite
    const isFavorite = useCallback((itemId, itemType) => {
        return favorites.some((fav) => fav.id === itemId && fav.type === itemType);
    }, [favorites]);

    // Get favorites count
    const getFavoritesCount = useCallback(() => {
        return favorites.length;
    }, [favorites]);

    // Clear all favorites
    const clearFavorites = useCallback(async () => {
        if (isAuthenticated) {
            // Delete all favorites on server
            for (const fav of favorites) {
                if (fav.favoriteId) {
                    try {
                        await authFetch(`/favorites/${fav.favoriteId}`, { method: 'DELETE' });
                    } catch (err) {
                        // Continue on error
                    }
                }
            }
        } else {
            await AsyncStorage.removeItem(FAVORITES_STORAGE_KEY);
        }
        setFavorites([]);
    }, [favorites, isAuthenticated, authFetch]);

    // Update notes for a favorite
    const updateFavoriteNotes = useCallback(async (itemId, itemType, notes) => {
        if (isAuthenticated) {
            const favorite = favorites.find(f => f.id === itemId && f.type === itemType);
            if (favorite?.favoriteId) {
                try {
                    const response = await authFetch(`/favorites/${favorite.favoriteId}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ notes }),
                    });

                    if (response.ok) {
                        setFavorites(prev =>
                            prev.map(f =>
                                f.id === itemId && f.type === itemType
                                    ? { ...f, notes }
                                    : f
                            )
                        );
                    }
                } catch (error) {
                    console.error('Error updating favorite notes:', error);
                }
            }
        }
    }, [favorites, isAuthenticated, authFetch]);

    const value = {
        favorites,
        loading,
        syncStatus,
        addToFavorites,
        removeFromFavorites,
        toggleFavorite,
        isFavorite,
        getFavoritesCount,
        clearFavorites,
        updateFavoriteNotes,
        syncLocalFavoritesToServer,
    };

    return (
        <FavoritesContext.Provider value={value}>
            {children}
        </FavoritesContext.Provider>
    );
};

export const useFavorites = () => {
    const context = useContext(FavoritesContext);
    if (!context) {
        throw new Error('useFavorites must be used within a FavoritesProvider');
    }
    return context;
};

export default FavoritesContext;
