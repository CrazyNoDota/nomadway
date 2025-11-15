/**
 * AI Route Builder Utility Functions
 * Helper functions for route optimization and calculations
 */

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param {number} lat1 - Latitude of point 1
 * @param {number} lon1 - Longitude of point 1
 * @param {number} lat2 - Latitude of point 2
 * @param {number} lon2 - Longitude of point 2
 * @returns {number} Distance in meters
 */
export function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

/**
 * Calculate travel time based on distance
 * @param {number} distance - Distance in meters
 * @param {string} mode - Transport mode ('walk'|'drive'|'mixed')
 * @returns {number} Time in minutes
 */
export function calculateTravelTime(distance, mode = 'mixed') {
  const speeds = {
    walk: 5000, // 5 km/h in meters per hour
    drive: 40000, // 40 km/h in meters per hour
    mixed: 25000, // 25 km/h average
  };

  const speedMetersPerMinute = (speeds[mode] || speeds.mixed) / 60;
  return Math.round(distance / speedMetersPerMinute);
}

/**
 * Format duration from minutes to human-readable format
 * @param {number} minutes - Duration in minutes
 * @param {string} lang - Language ('ru'|'en')
 * @returns {string} Formatted duration
 */
export function formatDuration(minutes, lang = 'ru') {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (lang === 'en') {
    if (hours === 0) return `${mins} min`;
    if (mins === 0) return `${hours} hr`;
    return `${hours} hr ${mins} min`;
  }

  // Russian
  if (hours === 0) return `${mins} мин`;
  if (mins === 0) return `${hours} ч`;
  return `${hours} ч ${mins} м`;
}

/**
 * Format distance to human-readable format
 * @param {number} meters - Distance in meters
 * @param {string} lang - Language ('ru'|'en')
 * @returns {string} Formatted distance
 */
export function formatDistance(meters, lang = 'ru') {
  if (meters < 1000) {
    return lang === 'en' ? `${Math.round(meters)} m` : `${Math.round(meters)} м`;
  }

  const km = (meters / 1000).toFixed(1);
  return lang === 'en' ? `${km} km` : `${km} км`;
}

/**
 * Format currency
 * @param {number} amount - Amount in tenge
 * @returns {string} Formatted currency
 */
export function formatCurrency(amount) {
  return `${Math.round(amount).toLocaleString()} ₸`;
}

/**
 * Calculate optimal route sequence using nearest neighbor algorithm
 * @param {Array} attractions - Array of attraction objects
 * @param {Object} startLocation - Starting location {latitude, longitude}
 * @returns {Array} Ordered array of attractions
 */
export function optimizeRouteSequence(attractions, startLocation = null) {
  if (attractions.length <= 1) return attractions;

  const unvisited = [...attractions];
  const route = [];
  let currentLocation = startLocation || {
    latitude: unvisited[0].latitude,
    longitude: unvisited[0].longitude,
  };

  while (unvisited.length > 0) {
    // Find nearest unvisited attraction
    let nearestIndex = 0;
    let minDistance = Infinity;

    unvisited.forEach((attraction, index) => {
      const distance = calculateDistance(
        currentLocation.latitude,
        currentLocation.longitude,
        attraction.latitude,
        attraction.longitude
      );

      if (distance < minDistance) {
        minDistance = distance;
        nearestIndex = index;
      }
    });

    // Add nearest to route
    const nearest = unvisited[nearestIndex];
    route.push(nearest);
    currentLocation = {
      latitude: nearest.latitude,
      longitude: nearest.longitude,
    };
    unvisited.splice(nearestIndex, 1);
  }

  return route;
}

/**
 * Calculate total route statistics
 * @param {Array} route - Route with stops
 * @returns {Object} Statistics
 */
export function calculateRouteStats(route) {
  let totalDistance = 0;
  let totalTime = 0;
  let totalCost = 0;

  route.forEach((stop) => {
    totalDistance += stop.travelDistance || 0;
    totalTime += (stop.visitDuration || 0) + (stop.travelTime || 0);
    totalCost += stop.estimatedCost || 0;
  });

  return {
    totalDistance,
    totalTime,
    totalCost,
    numberOfStops: route.length,
  };
}

/**
 * Filter attractions by age group compatibility
 * @param {Array} attractions - All attractions
 * @param {string} ageGroup - Target age group
 * @returns {Array} Filtered attractions
 */
export function filterByAgeGroup(attractions, ageGroup) {
  return attractions.filter(
    (attr) => attr.ageGroups && attr.ageGroups.includes(ageGroup)
  );
}

/**
 * Filter attractions by activity level
 * @param {Array} attractions - All attractions
 * @param {string} activityLevel - Desired activity level
 * @returns {Array} Filtered attractions
 */
export function filterByActivityLevel(attractions, activityLevel) {
  const levelPriority = { easy: 1, moderate: 2, intense: 3 };
  const maxLevel = levelPriority[activityLevel] || 3;

  return attractions.filter(
    (attr) => levelPriority[attr.activityLevel] <= maxLevel
  );
}

/**
 * Filter attractions by interests
 * @param {Array} attractions - All attractions
 * @param {Array} interests - Array of interest categories
 * @returns {Array} Filtered attractions
 */
export function filterByInterests(attractions, interests) {
  if (!interests || interests.length === 0) return attractions;

  return attractions.filter(
    (attr) =>
      attr.interests &&
      attr.interests.some((interest) => interests.includes(interest))
  );
}

/**
 * Filter attractions by budget
 * @param {Array} attractions - All attractions
 * @param {Object} budget - Budget range {min, max}
 * @returns {Array} Filtered attractions
 */
export function filterByBudget(attractions, budget) {
  return attractions.filter((attr) => {
    if (!attr.budget) return true; // Include free attractions

    const avgCost = (attr.budget.min + attr.budget.max) / 2;
    return avgCost >= budget.min && avgCost <= budget.max;
  });
}

/**
 * Get map region from route
 * @param {Array} route - Route with stops
 * @param {number} padding - Padding factor (default 1.2)
 * @returns {Object} Map region {latitude, longitude, latitudeDelta, longitudeDelta}
 */
export function getMapRegionForRoute(route, padding = 1.2) {
  if (!route || route.length === 0) {
    return {
      latitude: 43.2220,
      longitude: 76.8512,
      latitudeDelta: 5,
      longitudeDelta: 5,
    };
  }

  const coordinates = route.map((stop) => ({
    latitude: stop.attraction.latitude,
    longitude: stop.attraction.longitude,
  }));

  const latitudes = coordinates.map((c) => c.latitude);
  const longitudes = coordinates.map((c) => c.longitude);

  const minLat = Math.min(...latitudes);
  const maxLat = Math.max(...latitudes);
  const minLon = Math.min(...longitudes);
  const maxLon = Math.max(...longitudes);

  const centerLat = (minLat + maxLat) / 2;
  const centerLon = (minLon + maxLon) / 2;

  const latDelta = (maxLat - minLat) * padding || 0.1;
  const lonDelta = (maxLon - minLon) * padding || 0.1;

  return {
    latitude: centerLat,
    longitude: centerLon,
    latitudeDelta: latDelta,
    longitudeDelta: lonDelta,
  };
}

/**
 * Generate shareable route summary
 * @param {Array} route - Route with stops
 * @param {Object} summary - Route summary
 * @returns {string} Shareable text
 */
export function generateRouteShareText(route, summary) {
  const stopNames = route.map((stop, i) => `${i + 1}. ${stop.attraction.name}`).join('\n');
  
  return `
🗺️ Мой маршрут NomadWay

${stopNames}

⏱️ Время: ${formatDuration(summary.totalDuration)}
💰 Бюджет: ${formatCurrency(summary.totalCost)}
📍 Остановок: ${summary.numberOfStops}

#NomadWay #Путешествия #Казахстан
  `.trim();
}

/**
 * Validate route parameters
 * @param {Object} params - Route parameters
 * @returns {Object} Validation result {valid, errors}
 */
export function validateRouteParams(params) {
  const errors = [];

  if (!params.duration) {
    errors.push('Duration is required');
  }

  if (!params.budget || !params.budget.min || !params.budget.max) {
    errors.push('Budget range is required');
  } else if (params.budget.min > params.budget.max) {
    errors.push('Minimum budget cannot exceed maximum budget');
  }

  if (!params.interests || params.interests.length === 0) {
    errors.push('At least one interest must be selected');
  }

  if (!params.activityLevel) {
    errors.push('Activity level is required');
  }

  if (!params.ageGroup) {
    errors.push('Age group is required');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export default {
  calculateDistance,
  calculateTravelTime,
  formatDuration,
  formatDistance,
  formatCurrency,
  optimizeRouteSequence,
  calculateRouteStats,
  filterByAgeGroup,
  filterByActivityLevel,
  filterByInterests,
  filterByBudget,
  getMapRegionForRoute,
  generateRouteShareText,
  validateRouteParams,
};
