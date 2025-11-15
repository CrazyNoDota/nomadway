// Phrase translator utility
// Uses a simple translation dictionary for common travel phrases
// In production, could integrate with Google Translate API or similar

import * as Speech from 'expo-speech';

const PHRASES = {
  'ru': {
    'Привет': { 'en': 'Hello', 'kz': 'Сәлем', 'tr': 'Merhaba', 'ka': 'გამარჯობა' },
    'Спасибо': { 'en': 'Thank you', 'kz': 'Рақмет', 'tr': 'Teşekkür ederim', 'ka': 'გმადლობთ' },
    'Пожалуйста': { 'en': 'Please', 'kz': 'Өтінемін', 'tr': 'Lütfen', 'ka': 'გთხოვთ' },
    'Извините': { 'en': 'Excuse me', 'kz': 'Кешіріңіз', 'tr': 'Özür dilerim', 'ka': 'უკაცრავად' },
    'Где туалет?': { 'en': 'Where is the toilet?', 'kz': 'Дәретхана қайда?', 'tr': 'Tuvalet nerede?', 'ka': 'სად არის ტუალეტი?' },
    'Сколько стоит?': { 'en': 'How much does it cost?', 'kz': 'Қанша тұрады?', 'tr': 'Ne kadar?', 'ka': 'რა ღირს?' },
    'Меню, пожалуйста': { 'en': 'Menu, please', 'kz': 'Мәзір, өтінемін', 'tr': 'Menü lütfen', 'ka': 'მენიუ, გთხოვთ' },
    'Помощь': { 'en': 'Help', 'kz': 'Көмек', 'tr': 'Yardım', 'ka': 'დახმარება' },
    'Я не понимаю': { 'en': 'I don\'t understand', 'kz': 'Мен түсінбеймін', 'tr': 'Anlamıyorum', 'ka': 'არ მესმის' },
    'Где отель?': { 'en': 'Where is the hotel?', 'kz': 'Қонақ үй қайда?', 'tr': 'Otel nerede?', 'ka': 'სად არის სასტუმრო?' },
    'Вокзал': { 'en': 'Train station', 'kz': 'Вокзал', 'tr': 'Tren istasyonu', 'ka': 'რკინიგზის სადგური' },
    'Аэропорт': { 'en': 'Airport', 'kz': 'Әуежай', 'tr': 'Havalimanı', 'ka': 'აეროპორტი' },
    'Больница': { 'en': 'Hospital', 'kz': 'Аурухана', 'tr': 'Hastane', 'ka': 'საავადმყოფო' },
    'Аптека': { 'en': 'Pharmacy', 'kz': 'Дәріхана', 'tr': 'Eczane', 'ka': 'ფარმაცევტული' },
    'Банкомат': { 'en': 'ATM', 'kz': 'Банкомат', 'tr': 'ATM', 'ka': 'ბანკომატი' },
  },
};

const LANGUAGE_NAMES = {
  'ru': 'Русский',
  'en': 'English',
  'kz': 'Қазақша',
  'tr': 'Türkçe',
  'ka': 'ქართული',
};

export const translatePhrase = (phrase, fromLang, toLang) => {
  if (fromLang === toLang) return phrase;
  
  const phraseData = PHRASES[fromLang]?.[phrase];
  if (!phraseData) return phrase; // Return original if not found
  
  return phraseData[toLang] || phrase;
};

export const getLanguageName = (code) => LANGUAGE_NAMES[code] || code;

export const speakPhrase = async (text, language = 'en') => {
  const languageCode = {
    'en': 'en-US',
    'ru': 'ru-RU',
    'kz': 'kk-KZ',
    'tr': 'tr-TR',
    'ka': 'ka-GE',
  }[language] || 'en-US';
  
  try {
    await Speech.speak(text, {
      language: languageCode,
      pitch: 1.0,
      rate: 0.9,
    });
  } catch (error) {
    console.error('Error speaking:', error);
  }
};

export const getCommonPhrases = (language) => {
  return Object.keys(PHRASES[language] || {});
};

