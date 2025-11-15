// Nearby places service
// Uses location data to find nearby places

import * as Location from 'expo-location';

const PLACE_TYPES = {
  'cafe': { name: 'Кафе', icon: '☕' },
  'restaurant': { name: 'Ресторан', icon: '🍽️' },
  'atm': { name: 'Банкомат', icon: '🏦' },
  'pharmacy': { name: 'Аптека', icon: '💊' },
  'gas_station': { name: 'Заправка', icon: '⛽' },
  'hotel': { name: 'Отель', icon: '🏨' },
  'hospital': { name: 'Больница', icon: '🏥' },
  'supermarket': { name: 'Супермаркет', icon: '🛒' },
  'park': { name: 'Парк', icon: '🌳' },
  'museum': { name: 'Музей', icon: '🏛️' },
};

// Mock nearby places data
// In production, use Google Places API or similar
const MOCK_PLACES = {
  'cafe': [
    { name: 'Кофейня "Арабика"', distance: 0.3, rating: 4.5 },
    { name: 'Café Central', distance: 0.8, rating: 4.7 },
    { name: 'Starbucks', distance: 1.2, rating: 4.3 },
  ],
  'restaurant': [
    { name: 'Ресторан "Астана"', distance: 0.5, rating: 4.6 },
    { name: 'Steak House', distance: 1.1, rating: 4.8 },
  ],
  'atm': [
    { name: 'ATM Halyk Bank', distance: 0.2, rating: null },
    { name: 'ATM Kaspi Bank', distance: 0.6, rating: null },
  ],
  'pharmacy': [
    { name: 'Аптека №1', distance: 0.4, rating: null },
    { name: 'Аптека "Здоровье"', distance: 0.9, rating: null },
  ],
};

export const findNearbyPlaces = async (placeType, latitude, longitude, radius = 2) => {
  // In production, use Google Places API or similar
  // For now, return mock data
  return new Promise((resolve) => {
    setTimeout(() => {
      const places = MOCK_PLACES[placeType] || [];
      resolve(places.filter(p => p.distance <= radius));
    }, 300);
  });
};

export const getPlaceTypeInfo = (type) => PLACE_TYPES[type] || { name: type, icon: '📍' };

export const getAllPlaceTypes = () => Object.keys(PLACE_TYPES);

export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

