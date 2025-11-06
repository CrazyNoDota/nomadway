import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import routesData from '../data/routes.json';

export default function RoutesScreen({ navigation }) {
  const [routes, setRoutes] = useState([]);

  useEffect(() => {
    setRoutes(routesData.routes);
  }, []);

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'Лёгкая':
        return '#27ae60';
      case 'Средняя':
        return '#f39c12';
      case 'Сложная':
        return '#e74c3c';
      default:
        return '#8e8e93';
    }
  };

  const renderRoute = ({ item }) => (
    <TouchableOpacity
      style={[styles.card, { borderLeftColor: item.color, borderLeftWidth: 4 }]}
      onPress={() => navigation.navigate('RouteDetails', { route: item })}
    >
      <Image source={{ uri: item.image }} style={styles.cardImage} />
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle}>{item.name}</Text>
        <Text style={styles.cardDescription} numberOfLines={2}>
          {item.description}
        </Text>
        <View style={styles.cardFooter}>
          <View style={styles.infoRow}>
            <Ionicons name="time-outline" size={16} color="#8e8e93" />
            <Text style={styles.infoText}>{item.duration}</Text>
          </View>
          <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(item.difficulty) + '20' }]}>
            <Text style={[styles.difficultyText, { color: getDifficultyColor(item.difficulty) }]}>
              {item.difficulty}
            </Text>
          </View>
        </View>
        <View style={styles.stopsContainer}>
          <Ionicons name="location" size={16} color={item.color} />
          <Text style={styles.stopsText}>{item.stops.length} остановок</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={routes}
        renderItem={renderRoute}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  list: {
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardImage: {
    width: '100%',
    height: 180,
    resizeMode: 'cover',
  },
  cardContent: {
    padding: 16,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1a4d3a',
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoText: {
    marginLeft: 6,
    fontSize: 14,
    color: '#8e8e93',
  },
  difficultyBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  difficultyText: {
    fontSize: 12,
    fontWeight: '600',
  },
  stopsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  stopsText: {
    marginLeft: 6,
    fontSize: 14,
    color: '#1a4d3a',
    fontWeight: '500',
  },
});

