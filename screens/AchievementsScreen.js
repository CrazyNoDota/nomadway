import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ACHIEVEMENTS } from '../constants/gamification';
import { useLocalization } from '../contexts/LocalizationContext';
import { useAuth } from '../contexts/AuthContext';

const LOGO_URL = 'https://raw.githubusercontent.com/CrazyNoDota/danik/21bad4af7ac400b27c470851e9968c5860b06407/photo_2025-11-15_23-14-57-removebg-preview.png';

export default function AchievementsScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [userProgress, setUserProgress] = useState(null);
  const { t } = useLocalization();
  const { user, isAuthenticated, authFetch } = useAuth();

  useEffect(() => {
    loadUserData();
  }, [isAuthenticated]);

  const loadUserData = async () => {
    try {
      if (!isAuthenticated) {
        // Use default empty progress for guests
        setUserProgress({ achievements: [], placesVisited: [], citiesVisited: [], routesCompleted: 0, distanceWalked: 0 });
        return;
      }

      // Fetch user progress from server
      const response = await authFetch('/gamification/progress');
      if (response.ok) {
        const data = await response.json();
        setUserProgress(data);
      } else {
        setUserProgress({ achievements: [], placesVisited: [], citiesVisited: [], routesCompleted: 0, distanceWalked: 0 });
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      setUserProgress({ achievements: [], placesVisited: [], citiesVisited: [], routesCompleted: 0, distanceWalked: 0 });
    } finally {
      setLoading(false);
    }
  };

  const getAchievementProgress = (achievement) => {
    if (!userProgress) return 0;

    switch (achievement.type) {
      case 'places_visited':
        return userProgress.placesVisited?.length || 0;
      case 'cities_visited':
        return userProgress.citiesVisited?.length || 0;
      case 'distance_walked':
        return userProgress.distanceWalked || 0;
      case 'routes_completed':
        return userProgress.routesCompleted || 0;
      default:
        return 0;
    }
  };

  const isAchievementUnlocked = (achievementId) => {
    return userProgress?.achievements?.includes(achievementId) || false;
  };

  const renderAchievementCard = (achievement) => {
    const unlocked = isAchievementUnlocked(achievement.id);
    const progress = getAchievementProgress(achievement);
    const progressPercent = Math.min((progress / achievement.threshold) * 100, 100);

    return (
      <View
        key={achievement.id}
        style={[
          styles.achievementCard,
          unlocked && styles.achievementCardUnlocked,
        ]}
      >
        <View style={styles.achievementIcon}>
          <Text style={styles.achievementEmoji}>{achievement.icon}</Text>
        </View>
        <View style={styles.achievementContent}>
          <Text style={[styles.achievementName, unlocked && styles.achievementNameUnlocked]}>
            {achievement.name}
          </Text>
          <Text style={styles.achievementDescription}>{achievement.description}</Text>
          
          {/* Progress Bar */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${progressPercent}%` },
                  unlocked && styles.progressFillUnlocked,
                ]}
              />
            </View>
            <Text style={styles.progressText}>
              {t('progress')}: {progress}/{achievement.threshold}
            </Text>
          </View>

          {/* Points */}
          <View style={styles.pointsBadge}>
            <Ionicons name="star" size={14} color="#d4af37" />
            <Text style={styles.pointsText}>{achievement.points} очков</Text>
          </View>
        </View>
        
        {unlocked && (
          <View style={styles.unlockedBadge}>
            <Ionicons name="checkmark-circle" size={24} color="#4caf50" />
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
      {/* Header with Logo */}
      <View style={styles.logoHeader}>
        <Image 
          source={{ uri: LOGO_URL }}
          style={styles.headerLogo}
          resizeMode="contain"
        />
      </View>

      {/* Header Stats */}
      <View style={styles.header}>
        <View style={styles.statCard}>
          <Ionicons name="trophy" size={32} color="#d4af37" />
          <Text style={styles.statValue}>{userProgress?.points || 0}</Text>
          <Text style={styles.statLabel}>{t('points')}</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="medal" size={32} color="#d4af37" />
          <Text style={styles.statValue}>{userProgress?.achievements?.length || 0}</Text>
          <Text style={styles.statLabel}>{t('achievements_count')}</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="location" size={32} color="#d4af37" />
          <Text style={styles.statValue}>{userProgress?.placesVisited?.length || 0}</Text>
          <Text style={styles.statLabel}>{t('places')}</Text>
        </View>
      </View>

      {/* Achievements List */}
      <ScrollView style={styles.scrollView}>
        <Text style={styles.sectionTitle}>{t('achievementsTitle')}</Text>
        
        {Object.values(ACHIEVEMENTS).map(achievement => renderAchievementCard(achievement))}
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
  logoHeader: {
    backgroundColor: '#1a4d3a',
    paddingVertical: 15,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: '#d4af37',
  },
  headerLogo: {
    width: 60,
    height: 60,
  },
  header: {
    flexDirection: 'row',
    padding: 15,
    backgroundColor: '#1a4d3a',
    justifyContent: 'space-around',
  },
  statCard: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#d4af37',
    marginTop: 2,
  },
  scrollView: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1a4d3a',
    padding: 15,
    paddingBottom: 10,
  },
  achievementCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 15,
    marginBottom: 10,
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    opacity: 0.7,
  },
  achievementCardUnlocked: {
    opacity: 1,
    borderColor: '#4caf50',
    borderWidth: 2,
  },
  achievementIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  achievementEmoji: {
    fontSize: 32,
  },
  achievementContent: {
    flex: 1,
  },
  achievementName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 5,
  },
  achievementNameUnlocked: {
    color: '#1a4d3a',
  },
  achievementDescription: {
    fontSize: 13,
    color: '#888',
    marginBottom: 10,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
    marginRight: 10,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#d4af37',
    borderRadius: 4,
  },
  progressFillUnlocked: {
    backgroundColor: '#4caf50',
  },
  progressText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
    minWidth: 50,
  },
  pointsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  pointsText: {
    fontSize: 12,
    color: '#d4af37',
    fontWeight: '600',
  },
  unlockedBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
});
