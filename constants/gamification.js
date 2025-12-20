// Achievement types
export const ACHIEVEMENT_TYPES = {
  PLACES_VISITED: 'places_visited',
  CITIES_VISITED: 'cities_visited',
  DISTANCE_WALKED: 'distance_walked',
  ROUTES_COMPLETED: 'routes_completed',
  SEASONAL_CHALLENGE: 'seasonal_challenge',
};

// Achievement definitions
export const ACHIEVEMENTS = {
  // Places visited
  EXPLORER_BEGINNER: {
    id: 'explorer_beginner',
    type: ACHIEVEMENT_TYPES.PLACES_VISITED,
    name: 'Начинающий исследователь',
    nameEn: 'Beginner Explorer',
    description: 'Посетите 5 мест',
    descriptionEn: 'Visit 5 places',
    threshold: 5,
    points: 50,
    icon: '🎯',
    ageGroups: ['family', 'young', 'adults'],
  },
  EXPLORER_INTERMEDIATE: {
    id: 'explorer_intermediate',
    type: ACHIEVEMENT_TYPES.PLACES_VISITED,
    name: 'Опытный путешественник',
    nameEn: 'Experienced Traveler',
    description: 'Посетите 10 мест',
    descriptionEn: 'Visit 10 places',
    threshold: 10,
    points: 100,
    icon: '🌟',
    ageGroups: ['family', 'young', 'adults'],
  },
  EXPLORER_EXPERT: {
    id: 'explorer_expert',
    type: ACHIEVEMENT_TYPES.PLACES_VISITED,
    name: 'Мастер путешествий',
    nameEn: 'Travel Master',
    description: 'Посетите 25 мест',
    descriptionEn: 'Visit 25 places',
    threshold: 25,
    points: 250,
    icon: '👑',
    ageGroups: ['young', 'adults'],
  },
  
  // Cities visited
  CITY_EXPLORER: {
    id: 'city_explorer',
    type: ACHIEVEMENT_TYPES.CITIES_VISITED,
    name: 'Городской исследователь',
    nameEn: 'City Explorer',
    description: 'Посетите 3 города',
    descriptionEn: 'Visit 3 cities',
    threshold: 3,
    points: 150,
    icon: '🏙️',
    ageGroups: ['family', 'young', 'adults'],
  },
  CITY_MASTER: {
    id: 'city_master',
    type: ACHIEVEMENT_TYPES.CITIES_VISITED,
    name: 'Знаток городов',
    nameEn: 'City Master',
    description: 'Посетите 5 городов',
    descriptionEn: 'Visit 5 cities',
    threshold: 5,
    points: 300,
    icon: '🗺️',
    ageGroups: ['young', 'adults'],
  },
  
  // Distance walked
  WALKER_BRONZE: {
    id: 'walker_bronze',
    type: ACHIEVEMENT_TYPES.DISTANCE_WALKED,
    name: 'Бронзовый пешеход',
    nameEn: 'Bronze Walker',
    description: 'Пройдите 10 км',
    descriptionEn: 'Walk 10 km',
    threshold: 10000, // meters
    points: 100,
    icon: '🥉',
    ageGroups: ['family', 'young', 'adults'],
  },
  WALKER_SILVER: {
    id: 'walker_silver',
    type: ACHIEVEMENT_TYPES.DISTANCE_WALKED,
    name: 'Серебряный пешеход',
    nameEn: 'Silver Walker',
    description: 'Пройдите 50 км',
    descriptionEn: 'Walk 50 km',
    threshold: 50000, // meters
    points: 250,
    icon: '🥈',
    ageGroups: ['young', 'adults'],
  },
  WALKER_GOLD: {
    id: 'walker_gold',
    type: ACHIEVEMENT_TYPES.DISTANCE_WALKED,
    name: 'Золотой пешеход',
    nameEn: 'Gold Walker',
    description: 'Пройдите 100 км',
    descriptionEn: 'Walk 100 km',
    threshold: 100000, // meters
    points: 500,
    icon: '🥇',
    ageGroups: ['young', 'adults'],
  },
  
  // Age-specific achievements
  FAMILY_EXPLORER: {
    id: 'family_explorer',
    type: ACHIEVEMENT_TYPES.PLACES_VISITED,
    name: 'Семейный исследователь',
    nameEn: 'Family Explorer',
    description: 'Посетите 3 семейных/образовательных места',
    descriptionEn: 'Visit 3 family-friendly or educational places',
    threshold: 3,
    points: 100,
    icon: '🎓',
    ageGroups: ['family'],
  },
  CULTURAL_GURU: {
    id: 'cultural_guru',
    type: ACHIEVEMENT_TYPES.PLACES_VISITED,
    name: 'Гуру культуры',
    nameEn: 'Cultural Guru',
    description: 'Посетите 5 музеев',
    descriptionEn: 'Visit 5 museums',
    threshold: 5,
    points: 200,
    icon: '🏛️',
    ageGroups: ['young', 'adults'],
  },
  ADVENTURE_SEEKER: {
    id: 'adventure_seeker',
    type: ACHIEVEMENT_TYPES.PLACES_VISITED,
    name: 'Искатель приключений',
    nameEn: 'Adventure Seeker',
    description: 'Посетите 5 экстремальных мест',
    descriptionEn: 'Visit 5 adventure spots',
    threshold: 5,
    points: 200,
    icon: '⛰️',
    ageGroups: ['young', 'adults'],
  },
};

// Seasonal challenges
export const SEASONAL_CHALLENGES = [
  {
    id: 'almaty_tour_2025',
    name: 'Тур по Алматы 2025',
    nameEn: 'Almaty Tour 2025',
    description: 'Посетите все основные достопримечательности Алматы',
    descriptionEn: 'Visit all major Almaty attractions',
    startDate: '2025-01-01',
    endDate: '2025-12-31',
    requiredPlaces: ['Медеу', 'Озеро Каинды', 'Алматы - Южная столица'],
    points: 500,
    badge: '🏔️',
    ageGroups: ['family', 'young', 'adults'],
  },
  {
    id: 'winter_astana_2025',
    name: 'Зимний маршрут Астаны',
    nameEn: 'Winter Astana Route',
    description: 'Исследуйте Астану в зимний период',
    descriptionEn: 'Explore Astana in winter',
    startDate: '2025-12-01',
    endDate: '2026-02-28',
    requiredPlaces: [], // Will be configured with Astana attractions
    points: 400,
    badge: '❄️',
    ageGroups: ['family', 'young', 'adults'],
  },
  {
    id: 'spring_tulips_2025',
    name: 'Тюльпаны весны 2025',
    nameEn: 'Spring Tulips 2025',
    description: 'Увидьте цветение тюльпанов в степи',
    descriptionEn: 'See tulips blooming in the steppe',
    startDate: '2025-03-15',
    endDate: '2025-05-15',
    requiredPlaces: ['Тюльпаны в степи'],
    points: 300,
    badge: '🌷',
    ageGroups: ['family', 'young', 'adults'],
  },
];

// Points for various actions
export const POINTS = {
  VISIT_PLACE: 20,
  COMPLETE_ROUTE: 50,
  SHARE_POST: 10,
  WRITE_REVIEW: 15,
  ADD_PHOTO: 5,
  DAILY_LOGIN: 5,
  COMPLETE_CHALLENGE: 100,
};

// Leaderboard periods
export const LEADERBOARD_PERIODS = {
  ALL_TIME: 'all_time',
  MONTHLY: 'monthly',
  WEEKLY: 'weekly',
};

export const LEADERBOARD_PERIOD_LABELS = {
  [LEADERBOARD_PERIODS.ALL_TIME]: 'За всё время',
  [LEADERBOARD_PERIODS.MONTHLY]: 'За месяц',
  [LEADERBOARD_PERIODS.WEEKLY]: 'За неделю',
};

export const LEADERBOARD_PERIOD_LABELS_EN = {
  [LEADERBOARD_PERIODS.ALL_TIME]: 'All Time',
  [LEADERBOARD_PERIODS.MONTHLY]: 'Monthly',
  [LEADERBOARD_PERIODS.WEEKLY]: 'Weekly',
};
