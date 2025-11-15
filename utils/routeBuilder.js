// Route building utility
// Helps build routes between points

export const buildRoute = (points) => {
  if (!points || points.length < 2) return null;
  
  const coordinates = points.map(point => ({
    latitude: point.latitude,
    longitude: point.longitude,
  }));
  
  // Calculate total distance (simplified - in production use proper routing API)
  let totalDistance = 0;
  for (let i = 0; i < coordinates.length - 1; i++) {
    totalDistance += calculateDistance(
      coordinates[i].latitude,
      coordinates[i].longitude,
      coordinates[i + 1].latitude,
      coordinates[i + 1].longitude
    );
  }
  
  // Estimate duration (assuming average speed)
  const averageSpeed = 60; // km/h
  const estimatedDuration = Math.round((totalDistance / averageSpeed) * 60); // minutes
  
  return {
    coordinates,
    totalDistance: Math.round(totalDistance * 10) / 10,
    estimatedDuration,
    points,
  };
};

const calculateDistance = (lat1, lon1, lat2, lon2) => {
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

export const optimizeRoute = (points) => {
  // Simple optimization: sort by distance from start
  // In production, use proper TSP algorithm or routing API
  if (points.length <= 2) return points;
  
  const start = points[0];
  const remaining = points.slice(1);
  
  const sorted = [start];
  let current = start;
  
  while (remaining.length > 0) {
    let nearest = remaining[0];
    let nearestDistance = calculateDistance(
      current.latitude,
      current.longitude,
      nearest.latitude,
      nearest.longitude
    );
    
    for (const point of remaining) {
      const distance = calculateDistance(
        current.latitude,
        current.longitude,
        point.latitude,
        point.longitude
      );
      if (distance < nearestDistance) {
        nearest = point;
        nearestDistance = distance;
      }
    }
    
    sorted.push(nearest);
    remaining.splice(remaining.indexOf(nearest), 1);
    current = nearest;
  }
  
  return sorted;
};

