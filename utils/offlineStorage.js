// Offline storage utility
// Stores data locally for offline access

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';

const STORAGE_KEYS = {
  ATTRACTIONS: 'offline_attractions',
  ROUTES: 'offline_routes',
  REGIONS: 'offline_regions',
  MAP_DATA: 'offline_map_data',
  USER_DATA: 'offline_user_data',
};

export const saveForOffline = async (key, data) => {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error('Error saving offline data:', error);
    return false;
  }
};

export const loadOfflineData = async (key) => {
  try {
    const data = await AsyncStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error loading offline data:', error);
    return null;
  }
};

export const saveAttractionsOffline = async (attractions) => {
  return saveForOffline(STORAGE_KEYS.ATTRACTIONS, attractions);
};

export const loadAttractionsOffline = async () => {
  return loadOfflineData(STORAGE_KEYS.ATTRACTIONS);
};

export const saveRoutesOffline = async (routes) => {
  return saveForOffline(STORAGE_KEYS.ROUTES, routes);
};

export const loadRoutesOffline = async () => {
  return loadOfflineData(STORAGE_KEYS.ROUTES);
};

export const saveRegionsOffline = async (regions) => {
  return saveForOffline(STORAGE_KEYS.REGIONS, regions);
};

export const loadRegionsOffline = async () => {
  return loadOfflineData(STORAGE_KEYS.REGIONS);
};

export const clearOfflineData = async () => {
  try {
    await AsyncStorage.multiRemove(Object.values(STORAGE_KEYS));
    return true;
  } catch (error) {
    console.error('Error clearing offline data:', error);
    return false;
  }
};

export const getOfflineDataSize = async () => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const offlineKeys = keys.filter(key => Object.values(STORAGE_KEYS).includes(key));
    const data = await AsyncStorage.multiGet(offlineKeys);
    const totalSize = data.reduce((size, [key, value]) => {
      return size + (value ? value.length : 0);
    }, 0);
    return totalSize;
  } catch (error) {
    console.error('Error calculating offline data size:', error);
    return 0;
  }
};

