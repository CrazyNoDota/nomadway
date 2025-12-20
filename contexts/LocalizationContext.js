import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LANGUAGES, translations, translate } from '../utils/localization';

const STORAGE_KEY = 'nomadway_language';

const LocalizationContext = createContext({
  language: LANGUAGES.RU,
  setLanguage: () => {},
  t: (key) => translations[LANGUAGES.RU][key] || key,
});

export const LocalizationProvider = ({ children }) => {
  const [language, setLanguageState] = useState(LANGUAGES.RU);

  useEffect(() => {
    const loadLanguage = async () => {
      try {
        const savedLanguage = await AsyncStorage.getItem(STORAGE_KEY);
        if (savedLanguage && translations[savedLanguage]) {
          setLanguageState(savedLanguage);
        }
      } catch (error) {
        console.warn('Failed to load saved language', error);
      }
    };

    loadLanguage();
  }, []);

  const updateLanguage = useCallback(async (lang) => {
    if (!translations[lang]) return;
    setLanguageState(lang);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, lang);
    } catch (error) {
      console.warn('Failed to save language', error);
    }
  }, []);

  const translator = useCallback((key) => translate(language, key), [language]);

  const value = useMemo(() => ({
    language,
    setLanguage: updateLanguage,
    t: translator,
  }), [language, updateLanguage, translator]);

  return (
    <LocalizationContext.Provider value={value}>
      {children}
    </LocalizationContext.Provider>
  );
};

export const useLocalization = () => useContext(LocalizationContext);
