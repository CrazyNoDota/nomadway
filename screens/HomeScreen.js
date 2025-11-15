import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function HomeScreen({ navigation }) {
  const quickActions = [
    {
      id: 1,
      title: 'AI-Гид',
      subtitle: 'Задайте вопрос о путешествиях',
      icon: 'sparkles',
      color: '#d4af37',
      screen: 'AIGuide',
    },
    {
      id: 2,
      title: 'Инструменты',
      subtitle: 'Валюта, переводчик, погода',
      icon: 'briefcase',
      color: '#3498db',
      screen: 'TravelerTools',
    },
    {
      id: 3,
      title: 'Персонализированный маршрут',
      subtitle: 'Создайте маршрут по вашим интересам',
      icon: 'map',
      color: '#27ae60',
      screen: 'PersonalizedRoute',
    },
    {
      id: 4,
      title: 'Гид по регионам',
      subtitle: 'Информация о городах и регионах',
      icon: 'location',
      color: '#e74c3c',
      screen: 'RegionalGuide',
    },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.greeting}>Добро пожаловать!</Text>
        <Text style={styles.subtitle}>Ваш путеводитель по миру</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Быстрый доступ</Text>
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
              <Text style={styles.quickActionTitle}>{action.title}</Text>
              <Text style={styles.quickActionSubtitle}>{action.subtitle}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Популярные места</Text>
        <TouchableOpacity
          style={styles.featureCard}
          onPress={() => navigation.navigate('Explore')}
        >
          <Ionicons name="compass" size={24} color="#d4af37" />
          <View style={styles.featureContent}>
            <Text style={styles.featureTitle}>Исследовать достопримечательности</Text>
            <Text style={styles.featureSubtitle}>
              Откройте для себя удивительные места
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#8e8e93" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.featureCard}
          onPress={() => navigation.navigate('Routes')}
        >
          <Ionicons name="map" size={24} color="#d4af37" />
          <View style={styles.featureContent}>
            <Text style={styles.featureTitle}>Готовые маршруты</Text>
            <Text style={styles.featureSubtitle}>
              Выберите готовый маршрут для путешествия
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#8e8e93" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.featureCard}
          onPress={() => navigation.navigate('MapScreen', { title: 'Карта Казахстана' })}
        >
          <Ionicons name="map-outline" size={24} color="#3498db" />
          <View style={styles.featureContent}>
            <Text style={styles.featureTitle}>Интерактивная карта</Text>
            <Text style={styles.featureSubtitle}>
              Просмотрите все места на карте
            </Text>
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

