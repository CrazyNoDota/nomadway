// AI Guide service
// Connects to backend OpenAI API for real AI chat responses

import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Backend API URL - environment aware
// Production: Uses embedded config or EXPO_PUBLIC_API_URL from .env
// Development fallbacks:
// - Android emulator: http://10.0.2.2:3001
// - iOS simulator: http://localhost:3001
function getApiBaseUrl() {
  // Check embedded config in app.json first (for EAS builds)
  const embeddedApiUrl = Constants.expoConfig?.extra?.apiUrl;
  if (embeddedApiUrl) {
    return embeddedApiUrl;
  }

  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  if (__DEV__) {
    return Platform.OS === 'android'
      ? 'http://10.0.2.2:3001'
      : 'http://localhost:3001';
  }

  // Production fallback
  return 'http://91.228.154.82';
}

const API_BASE_URL = getApiBaseUrl();
console.log('AI Guide API URL:', API_BASE_URL);

// Fallback mock responses for when backend is unavailable
const AI_RESPONSES = {
  tbilisi: {
    '2 дня': `За 2 дня в Тбилиси рекомендую:

День 1:
- Старый город Тбилиси
- Крепость Нарикала
- Мост Мира
- Серные бани

День 2:
- Кафедральный собор Святой Троицы
- Проспект Руставели
- Национальный музей Грузии
- Вечерняя прогулка по набережной`,
  },
  алматы: {
    '2 дня': `За 2 дня в Алматы:

День 1:
- Центральный парк
- Кок-Тобе (канатная дорога)
- Медеу (высокогорный каток)
- Вечер в ресторанах на проспекте Абая

День 2:
- Чарынский каньон (экскурсия)
- Озеро Каинды
- Возвращение в город, прогулка по вечернему Алматы`,
  },
};

const DEFAULT_RESPONSES = [
  'Отличный вопрос! Рекомендую начать с главных достопримечательностей города.',
  'Для такого маршрута важно учитывать время года и погодные условия.',
  'Учтите местные праздники и особенности климата при планировании.',
  'Рекомендую посетить музеи и исторические места в первой половине дня.',
  'Не забудьте попробовать местную кухню - это важная часть путешествия!',
];

/**
 * Call OpenAI API through backend server
 */
export const askAIGuide = async (message, conversationHistory = [], stream = false) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, conversationHistory, stream: false }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    return data.response || data.content || 'Извините, не удалось получить ответ.';
  } catch (error) {
    console.warn('Backend API not available, using fallback:', error.message);
    return getFallbackResponse(message);
  }
};

/**
 * Stream AI response from backend
 */
export const streamAIGuide = async (message, conversationHistory = [], onChunk) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, conversationHistory, stream: false }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    const fullResponse = data.response || data.content || '';

    if (onChunk && fullResponse) {
      const words = fullResponse.split(' ');
      for (let i = 0; i < words.length; i++) {
        const chunk = i === 0 ? words[i] : ' ' + words[i];
        onChunk(chunk);
        await new Promise(resolve => setTimeout(resolve, 30));
      }
    }
  } catch (error) {
    console.warn('Streaming not available, falling back:', error.message);
    const response = await askAIGuide(message, conversationHistory, false);
    if (onChunk && response) {
      const words = response.split(' ');
      for (let i = 0; i < words.length; i++) {
        const chunk = i === 0 ? words[i] : ' ' + words[i];
        onChunk(chunk);
        await new Promise(resolve => setTimeout(resolve, 30));
      }
    }
  }
};

/**
 * Get fallback response when backend is unavailable
 */
const getFallbackResponse = (message) => {
  const lowerMessage = message.toLowerCase();

  if (lowerMessage.includes('тбилиси') || lowerMessage.includes('tbilisi')) {
    if (lowerMessage.includes('2 дня')) {
      return AI_RESPONSES.tbilisi['2 дня'];
    }
  }

  if (lowerMessage.includes('алматы') || lowerMessage.includes('almaty')) {
    if (lowerMessage.includes('2 дня')) {
      return AI_RESPONSES.алматы['2 дня'];
    }
  }

  return (
    DEFAULT_RESPONSES[Math.floor(Math.random() * DEFAULT_RESPONSES.length)] +
    '\n\n' +
    'Для более точных рекомендаций укажите:\n' +
    '- Город или регион\n' +
    '- Длительность поездки\n' +
    '- Ваши интересы (история, природа, развлечения)'
  );
};

/**
 * Legacy route advice
 */
export const getRouteAdvice = async (currentLocation, destination) => {
  const message = `Дай советы по маршруту из ${currentLocation} в ${destination}`;
  return await askAIGuide(message);
};