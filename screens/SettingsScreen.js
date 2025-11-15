import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LANGUAGE_OPTIONS } from '../utils/localization';
import { useLocalization } from '../contexts/LocalizationContext';

const LOGO_URL = 'https://raw.githubusercontent.com/CrazyNoDota/danik/21bad4af7ac400b27c470851e9968c5860b06407/photo_2025-11-15_23-14-57-removebg-preview.png';

export default function SettingsScreen() {
  const { language, setLanguage, t } = useLocalization();

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <Image 
          source={{ uri: LOGO_URL }}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>
      <Text style={styles.title}>{t('languageSettingsTitle')}</Text>
      <Text style={styles.subtitle}>{t('languageSettingsSubtitle')}</Text>

      <View style={styles.list}>
        {LANGUAGE_OPTIONS.map((option) => {
          const isActive = option.code === language;
          return (
            <TouchableOpacity
              key={option.code}
              style={[styles.item, isActive && styles.itemActive]}
              onPress={() => setLanguage(option.code)}
            >
              <View style={styles.labelWrapper}>
                <Text style={styles.flag}>{option.flag}</Text>
                <View>
                  <Text style={styles.languageLabel}>{t(`language_${option.code}`)}</Text>
                  <Text style={styles.nativeLabel}>{option.nativeLabel}</Text>
                </View>
              </View>
              {isActive ? (
                <Ionicons name="radio-button-on" size={22} color="#1a4d3a" />
              ) : (
                <Ionicons name="radio-button-off" size={22} color="#ccc" />
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  logoContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  logo: {
    width: 100,
    height: 100,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1a4d3a',
    marginBottom: 6,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 24,
    textAlign: 'center',
  },
  list: {
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 4,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  itemActive: {
    backgroundColor: '#edf6f2',
  },
  labelWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  flag: {
    fontSize: 20,
  },
  languageLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a4d3a',
  },
  nativeLabel: {
    fontSize: 12,
    color: '#666',
  },
});
