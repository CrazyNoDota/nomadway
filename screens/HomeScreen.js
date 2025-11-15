import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalization } from '../contexts/LocalizationContext';

export default function HomeScreen({ navigation }) {
  const { t } = useLocalization();

  const quickActions = [
    {
      id: 1,
      titleKey: 'aiGuideTitle',
      subtitleKey: 'aiGuideSubtitle',
      icon: 'sparkles',
      color: '#d4af37',
      screen: 'AIGuide',
    },
    {
      id: 2,
      titleKey: 'toolsTitle',
      subtitleKey: 'toolsSubtitle',
      icon: 'briefcase',
      color: '#3498db',
      screen: 'TravelerTools',
    },
    {
      id: 3,
      titleKey: 'personalizedRouteTitle',
      subtitleKey: 'personalizedRouteSubtitle',
      icon: 'map',
      color: '#27ae60',
      screen: 'PersonalizedRoute',
    },
    {
      id: 4,
      titleKey: 'regionalGuideTitle',
      subtitleKey: 'regionalGuideSubtitle',
      icon: 'location',
      color: '#e74c3c',
      screen: 'RegionalGuide',
    },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Image 
          source={{ uri: 'https://raw.githubusercontent.com/CrazyNoDota/danik/21bad4af7ac400b27c470851e9968c5860b06407/photo_2025-11-15_23-14-57-removebg-preview.png' }}
          style={styles.headerLogo}
          resizeMode="contain"
        />
        <Text style={styles.greeting}>{t('homeGreeting')}</Text>
        <Text style={styles.subtitle}>{t('homeSubtitle')}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('quickAccess')}</Text>
        <View style={styles.quickActionsGrid}>
          {quickActions.map((action) => (
            <TouchableOpacity
              key={action.id}
              style={styles.quickActionCard}
              onPress={() => navigation.navigate(action.screen)}
            >
              <View style={[styles.iconContainer, { backgroundColor: action.color + '20' }]}>
                <Ionicons name={action.icon} size={32} color={action.color} />
              </View>
              <Text style={styles.quickActionTitle}>{t(action.titleKey)}</Text>
              <Text style={styles.quickActionSubtitle}>{t(action.subtitleKey)}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('popularPlaces')}</Text>
        <TouchableOpacity
          style={styles.featureCard}
          onPress={() => navigation.navigate('Explore')}
        >
          <Ionicons name="compass" size={24} color="#d4af37" />
          <View style={styles.featureContent}>
            <Text style={styles.featureTitle}>{t('exploreAttractions')}</Text>
            <Text style={styles.featureSubtitle}>{t('exploreAttractionsSubtitle')}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#8e8e93" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.featureCard}
          onPress={() => navigation.navigate('Routes')}
        >
          <Ionicons name="map" size={24} color="#d4af37" />
          <View style={styles.featureContent}>
            <Text style={styles.featureTitle}>{t('readyRoutes')}</Text>
            <Text style={styles.featureSubtitle}>{t('readyRoutesSubtitle')}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#8e8e93" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.featureCard}
          onPress={() => navigation.navigate('MapScreen', { title: t('mapOfKazakhstan') })}
        >
          <Ionicons name="map-outline" size={24} color="#3498db" />
          <View style={styles.featureContent}>
            <Text style={styles.featureTitle}>{t('interactiveMap')}</Text>
            <Text style={styles.featureSubtitle}>{t('interactiveMapSubtitle')}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#8e8e93" />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#1a4d3a',
    paddingTop: 50,
    paddingBottom: 24,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  headerLogo: {
    width: 80,
    height: 80,
    marginBottom: 12,
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#d4af37',
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a4d3a',
    marginBottom: 16,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickActionCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  quickActionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a4d3a',
    textAlign: 'center',
    marginBottom: 4,
  },
  quickActionSubtitle: {
    fontSize: 12,
    color: '#8e8e93',
    textAlign: 'center',
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  featureContent: {
    flex: 1,
    marginLeft: 12,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a4d3a',
    marginBottom: 4,
  },
  featureSubtitle: {
    fontSize: 14,
    color: '#8e8e93',
  },
});

