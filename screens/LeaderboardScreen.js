import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  USER_GROUPS,
  USER_GROUP_LABELS,
} from '../constants/userSegments';
import {
  LEADERBOARD_PERIODS,
  LEADERBOARD_PERIOD_LABELS,
} from '../constants/gamification';

export default function LeaderboardScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [leaderboard, setLeaderboard] = useState([]);
  const [selectedAgeGroup, setSelectedAgeGroup] = useState('all');
  const [selectedPeriod, setSelectedPeriod] = useState(LEADERBOARD_PERIODS.ALL_TIME);
  const [currentUserId, setCurrentUserId] = useState(null);

  useEffect(() => {
    loadLeaderboard();
    loadCurrentUserId();
  }, [selectedAgeGroup, selectedPeriod]);

  const loadCurrentUserId = async () => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      setCurrentUserId(userId);
    } catch (error) {
      console.error('Error loading user ID:', error);
    }
  };

  const loadLeaderboard = async () => {
    try {
      const response = await fetch(
        `http://localhost:3001/api/gamification/leaderboard?ageGroup=${selectedAgeGroup}&period=${selectedPeriod}`
      );
      const data = await response.json();
      setLeaderboard(data.leaderboard || []);
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadLeaderboard();
  };

  const getMedalEmoji = (rank) => {
    switch (rank) {
      case 1:
        return '🥇';
      case 2:
        return '🥈';
      case 3:
        return '🥉';
      default:
        return null;
    }
  };

  const renderLeaderboardItem = (user, index) => {
    const isCurrentUser = user.userId === currentUserId;
    const medal = getMedalEmoji(user.rank);

    return (
      <View
        key={user.userId}
        style={[
          styles.leaderboardItem,
          isCurrentUser && styles.currentUserItem,
        ]}
      >
        <View style={styles.rankContainer}>
          {medal ? (
            <Text style={styles.medalEmoji}>{medal}</Text>
          ) : (
            <Text style={styles.rankText}>{user.rank}</Text>
          )}
        </View>

        <View style={styles.userInfo}>
          <Text style={[styles.username, isCurrentUser && styles.currentUserText]}>
            {user.username}
            {isCurrentUser && ' (Вы)'}
          </Text>
          <View style={styles.userStats}>
            <View style={styles.statItem}>
              <Ionicons name="trophy" size={14} color="#d4af37" />
              <Text style={styles.statText}>{user.points} очков</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="medal" size={14} color="#888" />
              <Text style={styles.statText}>{user.achievements} достижений</Text>
            </View>
          </View>
        </View>

        {user.rank <= 3 && (
          <View style={styles.topBadge}>
            <Ionicons name="star" size={20} color="#d4af37" />
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1a4d3a" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Filters */}
      <View style={styles.filtersContainer}>
        {/* Age Group Filter */}
        <View style={styles.filterSection}>
          <Text style={styles.filterLabel}>Возрастная группа</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <TouchableOpacity
              style={[
                styles.filterChip,
                selectedAgeGroup === 'all' && styles.filterChipActive,
              ]}
              onPress={() => setSelectedAgeGroup('all')}
            >
              <Text
                style={[
                  styles.filterChipText,
                  selectedAgeGroup === 'all' && styles.filterChipTextActive,
                ]}
              >
                Все
              </Text>
            </TouchableOpacity>
            {Object.values(USER_GROUPS).map((group) => (
              <TouchableOpacity
                key={group}
                style={[
                  styles.filterChip,
                  selectedAgeGroup === group && styles.filterChipActive,
                ]}
                onPress={() => setSelectedAgeGroup(group)}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    selectedAgeGroup === group && styles.filterChipTextActive,
                  ]}
                >
                  {USER_GROUP_LABELS[group]}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Period Filter */}
        <View style={styles.filterSection}>
          <Text style={styles.filterLabel}>Период</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {Object.entries(LEADERBOARD_PERIOD_LABELS).map(([key, label]) => (
              <TouchableOpacity
                key={key}
                style={[
                  styles.filterChip,
                  selectedPeriod === key && styles.filterChipActive,
                ]}
                onPress={() => setSelectedPeriod(key)}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    selectedPeriod === key && styles.filterChipTextActive,
                  ]}
                >
                  {label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>

      {/* Leaderboard List */}
      <ScrollView
        style={styles.leaderboardList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {leaderboard.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="trophy-outline" size={64} color="#ccc" />
            <Text style={styles.emptyStateText}>
              Таблица лидеров пока пуста
            </Text>
            <Text style={styles.emptyStateSubtext}>
              Начните путешествовать и зарабатывать очки!
            </Text>
          </View>
        ) : (
          leaderboard.map(renderLeaderboardItem)
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filtersContainer: {
    backgroundColor: '#fff',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  filterSection: {
    marginBottom: 10,
  },
  filterLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginLeft: 15,
    marginBottom: 8,
  },
  filterChip: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    marginLeft: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  filterChipActive: {
    backgroundColor: '#1a4d3a',
    borderColor: '#1a4d3a',
  },
  filterChipText: {
    fontSize: 13,
    color: '#666',
  },
  filterChipTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  leaderboardList: {
    flex: 1,
    padding: 15,
  },
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 15,
    marginBottom: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  currentUserItem: {
    backgroundColor: '#f0f8f5',
    borderColor: '#1a4d3a',
    borderWidth: 2,
  },
  rankContainer: {
    width: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#666',
  },
  medalEmoji: {
    fontSize: 32,
  },
  userInfo: {
    flex: 1,
    marginLeft: 15,
  },
  username: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  currentUserText: {
    color: '#1a4d3a',
  },
  userStats: {
    flexDirection: 'row',
    gap: 15,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  statText: {
    fontSize: 12,
    color: '#666',
  },
  topBadge: {
    marginLeft: 10,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 15,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 5,
    textAlign: 'center',
  },
});
