// User age group segmentation
export const USER_GROUPS = {
  FAMILY: 'family',
  YOUNG: 'young',
  ADULTS: 'adults',
};

export const USER_GROUP_LABELS = {
  [USER_GROUPS.FAMILY]: 'Семейный отдых',
  [USER_GROUPS.YOUNG]: 'Молодёжь',
  [USER_GROUPS.ADULTS]: 'Взрослые путешественники',
};

export const USER_GROUP_LABELS_EN = {
  [USER_GROUPS.FAMILY]: 'Family Travel',
  [USER_GROUPS.YOUNG]: 'Young People',
  [USER_GROUPS.ADULTS]: 'Adults',
};

export const USER_GROUP_LABELS_KK = {
  [USER_GROUPS.FAMILY]: 'Отбасылық демалыс',
  [USER_GROUPS.YOUNG]: 'Жастар',
  [USER_GROUPS.ADULTS]: 'Ересек саяхатшылар',
};

// Activity levels
export const ACTIVITY_LEVELS = {
  EASY: 'easy',
  MODERATE: 'moderate',
  INTENSE: 'intense',
};

export const ACTIVITY_LEVEL_LABELS = {
  [ACTIVITY_LEVELS.EASY]: 'Лёгко',
  [ACTIVITY_LEVELS.MODERATE]: 'Средне',
  [ACTIVITY_LEVELS.INTENSE]: 'Интенсивно',
};

export const ACTIVITY_LEVEL_LABELS_EN = {
  [ACTIVITY_LEVELS.EASY]: 'Easy',
  [ACTIVITY_LEVELS.MODERATE]: 'Moderate',
  [ACTIVITY_LEVELS.INTENSE]: 'Intense',
};

// Interest categories
export const INTERESTS = {
  FOOD: 'food',
  NATURE: 'nature',
  MUSEUMS: 'museums',
  SHOPPING: 'shopping',
  ADVENTURE: 'adventure',
  CULTURE: 'culture',
  SPORTS: 'sports',
  EDUCATION: 'education',
};

export const INTEREST_LABELS = {
  [INTERESTS.FOOD]: 'Еда',
  [INTERESTS.NATURE]: 'Природа',
  [INTERESTS.MUSEUMS]: 'Музеи',
  [INTERESTS.SHOPPING]: 'Шопинг',
  [INTERESTS.ADVENTURE]: 'Приключения',
  [INTERESTS.CULTURE]: 'Культура',
  [INTERESTS.SPORTS]: 'Спорт',
  [INTERESTS.EDUCATION]: 'Образование',
};

export const INTEREST_LABELS_EN = {
  [INTERESTS.FOOD]: 'Food',
  [INTERESTS.NATURE]: 'Nature',
  [INTERESTS.MUSEUMS]: 'Museums',
  [INTERESTS.SHOPPING]: 'Shopping',
  [INTERESTS.ADVENTURE]: 'Adventure',
  [INTERESTS.CULTURE]: 'Culture',
  [INTERESTS.SPORTS]: 'Sports',
  [INTERESTS.EDUCATION]: 'Education',
};

// Duration options
export const DURATIONS = {
  THREE_HOURS: '3_hours',
  ONE_DAY: '1_day',
  THREE_DAYS: '3_days',
};

export const DURATION_LABELS = {
  [DURATIONS.THREE_HOURS]: '3 часа',
  [DURATIONS.ONE_DAY]: '1 день',
  [DURATIONS.THREE_DAYS]: '3 дня',
};

export const DURATION_LABELS_EN = {
  [DURATIONS.THREE_HOURS]: '3 hours',
  [DURATIONS.ONE_DAY]: '1 day',
  [DURATIONS.THREE_DAYS]: '3 days',
};

// Duration in minutes for calculations
export const DURATION_MINUTES = {
  [DURATIONS.THREE_HOURS]: 180,
  [DURATIONS.ONE_DAY]: 480, // 8 hours
  [DURATIONS.THREE_DAYS]: 1440, // 24 hours (active time across 3 days)
};

// Age group specific parameters
export const AGE_GROUP_PARAMS = {
  [USER_GROUPS.ADULTS]: {
    maxWalkingDistance: 1500, // meters
    avgVisitDuration: 60, // minutes
    restFrequency: 90, // minutes
    preferredInterests: [INTERESTS.CULTURE, INTERESTS.MUSEUMS, INTERESTS.NATURE, INTERESTS.FOOD],
  },
  [USER_GROUPS.YOUNG]: {
    maxWalkingDistance: 2000, // meters
    avgVisitDuration: 45, // minutes
    restFrequency: 120, // minutes
    preferredInterests: [INTERESTS.ADVENTURE, INTERESTS.SPORTS, INTERESTS.SHOPPING, INTERESTS.FOOD],
  },
  [USER_GROUPS.FAMILY]: {
    maxWalkingDistance: 800, // meters
    avgVisitDuration: 40, // minutes
    restFrequency: 75, // minutes
    preferredInterests: [INTERESTS.EDUCATION, INTERESTS.NATURE, INTERESTS.CULTURE, INTERESTS.FOOD],
  },
};
