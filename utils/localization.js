// Localization constants and translations
export const LANGUAGES = {
  RU: 'ru',
  EN: 'en',
};

export const translations = {
  ru: {
    // Navigation
    explore: 'Исследовать',
    routes: 'Маршруты',
    community: 'Сообщество',
    profile: 'Профиль',
    aiChat: 'Чат с ИИ',
    routeBuilder: 'Создать маршрут',
    achievements: 'Достижения',
    leaderboard: 'Лидеры',
    
    // Common
    loading: 'Загрузка...',
    error: 'Ошибка',
    success: 'Успешно',
    cancel: 'Отмена',
    ok: 'ОК',
    save: 'Сохранить',
    back: 'Назад',
    
    // Route Builder
    buildRoute: 'Построить маршрут',
    ageGroup: 'Возрастная группа',
    duration: 'Продолжительность',
    budget: 'Бюджет',
    interests: 'Интересы',
    activityLevel: 'Уровень активности',
    
    // Gamification
    points: 'Очков',
    achievements_count: 'Достижений',
    places: 'Мест',
    yourRank: 'Ваше место',
    
    // User Groups
    children: 'Дети',
    youth: 'Молодежь',
    adults: 'Взрослое поколение',
    
    // Activity Levels
    easy: 'Лёгко',
    moderate: 'Средне',
    intense: 'Интенсивно',
    
    // Interests
    food: 'Еда',
    nature: 'Природа',
    museums: 'Музеи',
    shopping: 'Шопинг',
    adventure: 'Приключения',
    culture: 'Культура',
    sports: 'Спорт',
    education: 'Образование',
  },
  en: {
    // Navigation
    explore: 'Explore',
    routes: 'Routes',
    community: 'Community',
    profile: 'Profile',
    aiChat: 'AI Chat',
    routeBuilder: 'Route Builder',
    achievements: 'Achievements',
    leaderboard: 'Leaderboard',
    
    // Common
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
    cancel: 'Cancel',
    ok: 'OK',
    save: 'Save',
    back: 'Back',
    
    // Route Builder
    buildRoute: 'Build Route',
    ageGroup: 'Age Group',
    duration: 'Duration',
    budget: 'Budget',
    interests: 'Interests',
    activityLevel: 'Activity Level',
    
    // Gamification
    points: 'Points',
    achievements_count: 'Achievements',
    places: 'Places',
    yourRank: 'Your Rank',
    
    // User Groups
    children: 'Children',
    youth: 'Youth',
    adults: 'Adults',
    
    // Activity Levels
    easy: 'Easy',
    moderate: 'Moderate',
    intense: 'Intense',
    
    // Interests
    food: 'Food',
    nature: 'Nature',
    museums: 'Museums',
    shopping: 'Shopping',
    adventure: 'Adventure',
    culture: 'Culture',
    sports: 'Sports',
    education: 'Education',
  },
};

// Simple translation function
let currentLanguage = LANGUAGES.RU;

export const setLanguage = (lang) => {
  currentLanguage = lang;
};

export const t = (key) => {
  return translations[currentLanguage][key] || key;
};

export const getCurrentLanguage = () => currentLanguage;
