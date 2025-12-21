/**
 * AnalyticsService - Track user behavior in the mobile app
 * Sends events to the backend for analytics dashboards
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// API base URL - uses EXPO_PUBLIC_API_URL from .env or fallback
function getAnalyticsApiBase() {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return `${process.env.EXPO_PUBLIC_API_URL}/api/analytics`;
  }
  // Fallback for development
  return Platform.OS === 'android'
    ? 'http://10.0.2.2:3001/api/analytics'
    : 'http://localhost:3001/api/analytics';
}

const API_BASE = getAnalyticsApiBase();
console.log('Analytics API URL:', API_BASE);

// Queue for offline event storage
const EVENTS_QUEUE_KEY = '@analytics_events_queue';
const DEVICE_ID_KEY = '@analytics_device_id';

// Event types
export const EventType = {
  VIEW: 'VIEW',
  ACTION: 'ACTION',
  ERROR: 'ERROR',
};

class AnalyticsService {
  constructor() {
    this.deviceId = null;
    this.userId = null;
    this.isInitialized = false;
    this.appVersion = Constants.expoConfig?.version || '1.0.0';
    this.platform = Platform.OS;
  }

  /**
   * Initialize the analytics service
   * Call this once when the app starts
   */
  async initialize(userId = null) {
    try {
      // Get or create device ID
      let deviceId = await AsyncStorage.getItem(DEVICE_ID_KEY);
      if (!deviceId) {
        deviceId = this.generateDeviceId();
        await AsyncStorage.setItem(DEVICE_ID_KEY, deviceId);
      }
      this.deviceId = deviceId;
      this.userId = userId;
      this.isInitialized = true;

      // Attempt to sync any queued offline events
      await this.syncQueuedEvents();
    } catch (error) {
      console.warn('Analytics initialization failed:', error);
    }
  }

  /**
   * Set the current user ID (call when user logs in)
   */
  setUserId(userId) {
    this.userId = userId;
  }

  /**
   * Clear user ID (call when user logs out)
   */
  clearUserId() {
    this.userId = null;
  }

  /**
   * Generate a unique device ID
   */
  generateDeviceId() {
    return 'device_' + Date.now().toString(36) + Math.random().toString(36).substring(2);
  }

  /**
   * Log a screen view event
   * @param {string} screenName - Name of the screen (e.g., 'HomeScreen', 'CartScreen')
   * @param {object} metadata - Optional additional data
   */
  async logScreenView(screenName, metadata = {}) {
    await this.logEvent(EventType.VIEW, screenName, metadata);
  }

  /**
   * Log a user action event
   * @param {string} actionName - Name of the action (e.g., 'AddToCart', 'Checkout', 'Search')
   * @param {object} metadata - Optional additional data (e.g., { productId: '123', price: 500 })
   */
  async logAction(actionName, metadata = {}) {
    await this.logEvent(EventType.ACTION, actionName, metadata);
  }

  /**
   * Log an error event
   * @param {string} errorName - Name/type of error
   * @param {object} metadata - Error details
   */
  async logError(errorName, metadata = {}) {
    await this.logEvent(EventType.ERROR, errorName, metadata);
  }

  /**
   * Core event logging method
   */
  async logEvent(eventType, eventName, metadata = {}) {
    const event = {
      userId: this.userId,
      eventType,
      eventName,
      metadata: Object.keys(metadata).length > 0 ? metadata : null,
      deviceId: this.deviceId,
      platform: this.platform,
      appVersion: this.appVersion,
      timestamp: new Date().toISOString(),
    };

    try {
      const response = await fetch(`${API_BASE}/event`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
      });

      if (!response.ok) {
        throw new Error('Failed to send event');
      }
    } catch (error) {
      // Queue event for later if network fails
      console.warn('Failed to send analytics event, queuing for later:', error.message);
      await this.queueEvent(event);
    }
  }

  /**
   * Queue an event for later sync (offline support)
   */
  async queueEvent(event) {
    try {
      const queuedEventsJson = await AsyncStorage.getItem(EVENTS_QUEUE_KEY);
      const queuedEvents = queuedEventsJson ? JSON.parse(queuedEventsJson) : [];
      
      // Limit queue size to prevent storage issues
      if (queuedEvents.length >= 100) {
        queuedEvents.shift(); // Remove oldest event
      }
      
      queuedEvents.push(event);
      await AsyncStorage.setItem(EVENTS_QUEUE_KEY, JSON.stringify(queuedEvents));
    } catch (error) {
      console.warn('Failed to queue analytics event:', error);
    }
  }

  /**
   * Sync queued events to the server
   */
  async syncQueuedEvents() {
    try {
      const queuedEventsJson = await AsyncStorage.getItem(EVENTS_QUEUE_KEY);
      if (!queuedEventsJson) return;

      const queuedEvents = JSON.parse(queuedEventsJson);
      if (queuedEvents.length === 0) return;

      const response = await fetch(`${API_BASE}/events/batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ events: queuedEvents }),
      });

      if (response.ok) {
        // Clear the queue on success
        await AsyncStorage.removeItem(EVENTS_QUEUE_KEY);
        console.log(`Synced ${queuedEvents.length} queued analytics events`);
      }
    } catch (error) {
      console.warn('Failed to sync queued analytics events:', error);
    }
  }

  /**
   * Get the current screen name from navigation state
   * Utility for React Navigation integration
   */
  getActiveRouteName(state) {
    if (!state) return null;
    
    const route = state.routes[state.index];
    
    // Drill down into nested navigators
    if (route.state) {
      return this.getActiveRouteName(route.state);
    }
    
    return route.name;
  }
}

// Export singleton instance
const analyticsService = new AnalyticsService();
export default analyticsService;
