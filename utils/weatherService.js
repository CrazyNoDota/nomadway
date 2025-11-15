// Weather service utility
// Uses OpenWeatherMap API (free tier) - in production, add API key to environment variables
// For Expo Go compatibility, using a mock service that can be replaced with real API

const WEATHER_DATA = {
  'Almaty': {
    current: { temp: 22, condition: 'Ясно', icon: '☀️', humidity: 45, wind: 8 },
    forecast: [
      { day: 'Сегодня', temp: 22, condition: 'Ясно', icon: '☀️' },
      { day: 'Завтра', temp: 24, condition: 'Облачно', icon: '⛅' },
      { day: 'Послезавтра', temp: 20, condition: 'Дождь', icon: '🌧️' },
    ],
  },
  'Astana': {
    current: { temp: 18, condition: 'Облачно', icon: '⛅', humidity: 60, wind: 12 },
    forecast: [
      { day: 'Сегодня', temp: 18, condition: 'Облачно', icon: '⛅' },
      { day: 'Завтра', temp: 16, condition: 'Ветер', icon: '💨' },
      { day: 'Послезавтра', temp: 19, condition: 'Ясно', icon: '☀️' },
    ],
  },
  'Shymkent': {
    current: { temp: 25, condition: 'Ясно', icon: '☀️', humidity: 40, wind: 6 },
    forecast: [
      { day: 'Сегодня', temp: 25, condition: 'Ясно', icon: '☀️' },
      { day: 'Завтра', temp: 27, condition: 'Ясно', icon: '☀️' },
      { day: 'Послезавтра', temp: 23, condition: 'Облачно', icon: '⛅' },
    ],
  },
};

export const getWeather = async (city) => {
  // In production, replace with actual API call
  // const API_KEY = 'your-api-key';
  // const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric&lang=ru`);
  // return await response.json();
  
  // Mock data for now
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(WEATHER_DATA[city] || WEATHER_DATA['Almaty']);
    }, 500);
  });
};

export const getWeatherByCoordinates = async (latitude, longitude) => {
  // In production, use coordinates-based API call
  // For now, return default data
  return getWeather('Almaty');
};

export const getWeatherIcon = (condition) => {
  const icons = {
    'Ясно': '☀️',
    'Облачно': '⛅',
    'Дождь': '🌧️',
    'Снег': '❄️',
    'Ветер': '💨',
    'Туман': '🌫️',
  };
  return icons[condition] || '☀️';
};

