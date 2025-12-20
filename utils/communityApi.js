// Community API service layer
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';

// Helper: Get API base URL (platform-aware)
function getApiBaseUrl() {
  // Check for environment variable first
  if (process.env.EXPO_PUBLIC_API_URL) {
    return `${process.env.EXPO_PUBLIC_API_URL}/api/v1`;
  }

  // Try to get host from Expo Constants (works with Expo Go)
  const hostUri =
    Constants.expoConfig?.hostUri ||
    Constants.expoGoConfig?.hostUri ||
    Constants.manifest?.debuggerHost;

  if (hostUri) {
    const hostname = hostUri.split(':')[0];
    return `http://${hostname}:3000/api/v1`;
  }

  // Platform-specific fallbacks
  if (Platform.OS === 'android') {
    // Android emulator uses 10.0.2.2 to access host machine's localhost
    return 'http://10.0.2.2:3000/api/v1';
  }

  // iOS simulator and web can use localhost
  return 'http://localhost:3000/api/v1';
}

const API_BASE_URL = getApiBaseUrl();

// Log the API URL being used (helpful for debugging)
console.log('Community API Base URL:', API_BASE_URL);

// Helper: Get auth token from SecureStore
async function getAuthToken() {
  try {
    if (Platform.OS === 'web') {
      return localStorage.getItem('nomadway_access_token');
    }
    const token = await SecureStore.getItemAsync('nomadway_access_token');
    return token;
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
}

// Helper: Make API request with JWT auth
async function apiRequest(endpoint, options = {}) {
  try {
    const token = await getAuthToken();
    const url = `${API_BASE_URL}${endpoint}`;
    
    console.log(`Making API request to: ${url}`);
    
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };
    
    // Add authorization header if token exists
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(url, {
      ...options,
      headers,
    });
    
    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.error?.message || errorMessage;
      } catch (e) {
        // If response is not JSON, use status text
        errorMessage = response.statusText || errorMessage;
      }
      throw new Error(errorMessage);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    // Enhanced error logging
    if (error.message === 'Network request failed' || error.message.includes('Network')) {
      console.error(
        `Network Error (${endpoint}):`,
        `\n- URL: ${API_BASE_URL}${endpoint}`,
        `\n- Make sure the backend server is running on port 3000`,
        `\n- For Android emulator, use: http://10.0.2.2:3000`,
        `\n- For iOS simulator, use: http://localhost:3000`,
        `\n- For physical device, use your computer's IP address`,
        `\n- Error: ${error.message}`
      );
    } else {
      console.error(`API Error (${endpoint}):`, error.message);
    }
    throw error;
  }
}

// Feed
export async function getFeed(params = {}) {
  const {
    sort = 'popular',
    location_country,
    location_city,
    category,
    tags,
    scope = 'all',
    limit = 20,
    cursor,
  } = params;
  
  const queryParams = new URLSearchParams();
  queryParams.append('sort', sort);
  queryParams.append('scope', scope);
  queryParams.append('limit', limit.toString());
  if (location_country) queryParams.append('location_country', location_country);
  if (location_city) queryParams.append('location_city', location_city);
  if (category) {
    if (Array.isArray(category)) {
      category.forEach(c => queryParams.append('category', c));
    } else {
      queryParams.append('category', category);
    }
  }
  if (tags) {
    if (Array.isArray(tags)) {
      tags.forEach(t => queryParams.append('tags', t));
    } else {
      queryParams.append('tags', tags);
    }
  }
  if (cursor) queryParams.append('cursor', cursor);
  
  return apiRequest(`/community/feed?${queryParams.toString()}`);
}

// Posts
export async function getPost(postId) {
  return apiRequest(`/community/posts/${postId}`);
}

export async function createPost(postData) {
  return apiRequest('/community/posts', {
    method: 'POST',
    body: JSON.stringify(postData),
  });
}

export async function deletePost(postId) {
  return apiRequest(`/community/posts/${postId}`, {
    method: 'DELETE',
  });
}

// Likes
export async function likePost(postId) {
  return apiRequest(`/community/posts/${postId}/like`, {
    method: 'POST',
  });
}

export async function unlikePost(postId) {
  return apiRequest(`/community/posts/${postId}/like`, {
    method: 'DELETE',
  });
}

// Bookmarks
export async function bookmarkPost(postId) {
  return apiRequest(`/community/posts/${postId}/bookmark`, {
    method: 'POST',
  });
}

export async function unbookmarkPost(postId) {
  return apiRequest(`/community/posts/${postId}/bookmark`, {
    method: 'DELETE',
  });
}

// Comments
export async function getComments(postId, params = {}) {
  const { limit = 20, cursor } = params;
  const queryParams = new URLSearchParams();
  queryParams.append('limit', limit.toString());
  if (cursor) queryParams.append('cursor', cursor);
  
  return apiRequest(`/community/posts/${postId}/comments?${queryParams.toString()}`);
}

export async function createComment(postId, commentData) {
  return apiRequest(`/community/posts/${postId}/comments`, {
    method: 'POST',
    body: JSON.stringify(commentData),
  });
}

export async function likeComment(commentId) {
  return apiRequest(`/community/comments/${commentId}/like`, {
    method: 'POST',
  });
}

export async function unlikeComment(commentId) {
  return apiRequest(`/community/comments/${commentId}/like`, {
    method: 'DELETE',
  });
}

// Follow
export async function followUser(userId) {
  return apiRequest(`/community/users/${userId}/follow`, {
    method: 'POST',
  });
}

export async function unfollowUser(userId) {
  return apiRequest(`/community/users/${userId}/follow`, {
    method: 'DELETE',
  });
}

// Reports
export async function reportContent(reportData) {
  return apiRequest('/community/reports', {
    method: 'POST',
    body: JSON.stringify(reportData),
  });
}

// Media
export async function getUploadUrl(mediaData) {
  return apiRequest('/media/upload-url', {
    method: 'POST',
    body: JSON.stringify(mediaData),
  });
}

