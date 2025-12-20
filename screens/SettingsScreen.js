import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Switch, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LANGUAGE_OPTIONS } from '../utils/localization';
import { useLocalization } from '../contexts/LocalizationContext';
import { useTheme } from '../contexts/ThemeContext';

const LOGO_URL = 'https://raw.githubusercontent.com/CrazyNoDota/danik/21bad4af7ac400b27c470851e9968c5860b06407/photo_2025-11-15_23-14-57-removebg-preview.png';

export default function SettingsScreen() {
  const { language, setLanguage, t } = useLocalization();
  const { colors, isDark, themeMode, setTheme, toggleTheme } = useTheme();

  const themeModes = [
    { key: 'light', label: language === 'en' ? 'Light' : 'Светлая', icon: 'sunny' },
    { key: 'dark', label: language === 'en' ? 'Dark' : 'Тёмная', icon: 'moon' },
    { key: 'system', label: language === 'en' ? 'System' : 'Системная', icon: 'phone-portrait' },
  ];

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
      <View style={styles.logoContainer}>
        <Image 
          source={{ uri: LOGO_URL }}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>

      {/* Theme Settings */}
      <Text style={[styles.title, { color: colors.primary }]}>
        {language === 'en' ? 'Theme' : 'Тема'}
      </Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        {language === 'en' ? 'Choose your preferred theme' : 'Выберите предпочитаемую тему'}
      </Text>

      <View style={[styles.list, { backgroundColor: colors.card }]}>
        {themeModes.map((mode) => {
          const isActive = mode.key === themeMode;
          return (
            <TouchableOpacity
              key={mode.key}
              style={[
                styles.item, 
                isActive && { backgroundColor: isDark ? '#2d3d35' : '#edf6f2' },
                { borderBottomColor: colors.border }
              ]}
              onPress={() => setTheme(mode.key)}
            >
              <View style={styles.labelWrapper}>
                <View style={[styles.iconCircle, { backgroundColor: isActive ? colors.primary : colors.border }]}>
                  <Ionicons 
                    name={mode.icon} 
                    size={18} 
                    color={isActive ? '#fff' : colors.textMuted} 
                  />
                </View>
                <Text style={[styles.languageLabel, { color: colors.text }]}>{mode.label}</Text>
              </View>
              {isActive ? (
                <Ionicons name="radio-button-on" size={22} color={colors.primary} />
              ) : (
                <Ionicons name="radio-button-off" size={22} color={colors.textMuted} />
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Quick Dark Mode Toggle */}
      <View style={[styles.quickToggle, { backgroundColor: colors.card }]}>
        <View style={styles.toggleContent}>
          <View style={[styles.iconCircle, { backgroundColor: isDark ? '#d4af37' : '#1a4d3a' }]}>
            <Ionicons name={isDark ? 'moon' : 'sunny'} size={18} color="#fff" />
          </View>
          <View>
            <Text style={[styles.toggleTitle, { color: colors.text }]}>
              {language === 'en' ? 'Dark Mode' : 'Тёмный режим'}
            </Text>
            <Text style={[styles.toggleSubtitle, { color: colors.textMuted }]}>
              {isDark 
                ? (language === 'en' ? 'Currently on' : 'Сейчас включен') 
                : (language === 'en' ? 'Currently off' : 'Сейчас выключен')}
            </Text>
          </View>
        </View>
        <Switch
          value={isDark}
          onValueChange={toggleTheme}
          trackColor={{ false: colors.border, true: colors.primary }}
          thumbColor={isDark ? colors.secondary : '#f4f3f4'}
        />
      </View>

      {/* Language Settings */}
      <Text style={[styles.title, { color: colors.primary, marginTop: 24 }]}>{t('languageSettingsTitle')}</Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{t('languageSettingsSubtitle')}</Text>

      <View style={[styles.list, { backgroundColor: colors.card }]}>
        {LANGUAGE_OPTIONS.map((option) => {
          const isActive = option.code === language;
          return (
            <TouchableOpacity
              key={option.code}
              style={[
                styles.item, 
                isActive && { backgroundColor: isDark ? '#2d3d35' : '#edf6f2' },
                { borderBottomColor: colors.border }
              ]}
              onPress={() => setLanguage(option.code)}
            >
              <View style={styles.labelWrapper}>
                <Text style={styles.flag}>{option.flag}</Text>
                <View>
                  <Text style={[styles.languageLabel, { color: colors.text }]}>{t(`language_${option.code}`)}</Text>
                  <Text style={[styles.nativeLabel, { color: colors.textMuted }]}>{option.nativeLabel}</Text>
                </View>
              </View>
              {isActive ? (
                <Ionicons name="radio-button-on" size={22} color={colors.primary} />
              ) : (
                <Ionicons name="radio-button-off" size={22} color={colors.textMuted} />
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
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
    marginBottom: 16,
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
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  labelWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  flag: {
    fontSize: 24,
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
  quickToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
  },
  toggleContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  toggleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a4d3a',
  },
  toggleSubtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
});
