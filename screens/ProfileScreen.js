import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalization } from '../contexts/LocalizationContext';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { useFavorites } from '../contexts/FavoritesContext';
import AvatarUpload from '../components/AvatarUpload';

const LOGO_URL = 'https://raw.githubusercontent.com/CrazyNoDota/danik/21bad4af7ac400b27c470851e9968c5860b06407/photo_2025-11-15_23-14-57-removebg-preview.png';

export default function ProfileScreen({ navigation }) {
  const { t, isRussian } = useLocalization();
  const { colors, isDark } = useTheme();
  const { user, isAuthenticated, logout } = useAuth();
  const { favorites, removeFromFavorites } = useFavorites();

  const handleLogout = () => {
    Alert.alert(
      isRussian ? 'Выход' : 'Logout',
      isRussian ? 'Вы уверены, что хотите выйти?' : 'Are you sure you want to logout?',
      [
        { text: isRussian ? 'Отмена' : 'Cancel', style: 'cancel' },
        {
          text: isRussian ? 'Выйти' : 'Logout',
          style: 'destructive',
          onPress: async () => {
            await logout();
          },
        },
      ]
    );
  };

  const renderFavoriteItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.card }]}
      onPress={() => {
        if (item.type === 'route') {
          navigation.navigate('RouteDetails', { route: item });
        } else {
          navigation.navigate('AttractionDetails', { attraction: item });
        }
      }}
    >
      <Image source={{ uri: item.image }} style={styles.cardImage} />
      <View style={styles.cardContent}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>{item.name}</Text>
        <Text style={[styles.cardDescription, { color: colors.textSecondary }]} numberOfLines={2}>
          {item.region} • {item.category}
        </Text>
        <View style={styles.cardFooter}>
          <View style={[styles.typeTag, { backgroundColor: isDark ? '#3d3420' : '#fff9e6' }]}>
            <Ionicons 
              name={item.type === 'route' ? 'map' : 'location'} 
              size={14} 
              color="#d4af37" 
            />
            <Text style={styles.typeText}>
              {item.type === 'route' 
                ? (isRussian ? 'Маршрут' : 'Route') 
                : (isRussian ? 'Место' : 'Place')}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => removeFromFavorites(item.id, item.type)}
            style={styles.removeButton}
          >
            <Ionicons name="trash-outline" size={20} color="#e74c3c" />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (!isAuthenticated) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.guestContent}>
          <Image source={{ uri: LOGO_URL }} style={styles.guestLogo} />
          <Text style={[styles.guestTitle, { color: colors.text }]}>
            {isRussian ? 'Добро пожаловать в NomadWay' : 'Welcome to NomadWay'}
          </Text>
          <Text style={[styles.guestSubtitle, { color: colors.textSecondary }]}>
            {isRussian 
              ? 'Войдите, чтобы сохранять маршруты, получать достижения и общаться с сообществом' 
              : 'Sign in to save routes, earn achievements, and connect with the community'}
          </Text>
          
          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => navigation.navigate('Auth')}
          >
            <Text style={styles.loginButtonText}>
              {isRussian ? 'Войти / Регистрация' : 'Login / Register'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.settingsButton, { backgroundColor: colors.card }]}
            onPress={() => navigation.navigate('Settings')}
          >
            <Ionicons name="settings-outline" size={20} color={colors.text} />
            <Text style={[styles.settingsButtonText, { color: colors.text }]}>
              {isRussian ? 'Настройки' : 'Settings'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header Section */}
        <View style={[styles.header, { backgroundColor: colors.headerBackground }]}>
          <View style={styles.profileHeader}>
            <AvatarUpload size={100} />
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{user?.fullName || user?.displayName || 'Nomad'}</Text>
              <Text style={styles.userEmail}>{user?.email}</Text>
              <View style={styles.roleTag}>
                <Text style={styles.roleText}>
                  {user?.role === 'ADMIN' ? 'Admin' : 'Traveler'}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.statsRow}>
            <TouchableOpacity 
              style={styles.statItem}
              onPress={() => navigation.navigate('Achievements')}
            >
              <Text style={styles.statValue}>{user?.points || 0}</Text>
              <Text style={styles.statLabel}>{isRussian ? 'Баллы' : 'Points'}</Text>
            </TouchableOpacity>
            <View style={styles.statDivider} />
            <TouchableOpacity 
              style={styles.statItem}
              onPress={() => navigation.navigate('Achievements')}
            >
              <Text style={styles.statValue}>{favorites.length}</Text>
              <Text style={styles.statLabel}>{isRussian ? 'Избранное' : 'Favorites'}</Text>
            </TouchableOpacity>
            <View style={styles.statDivider} />
            <TouchableOpacity 
              style={styles.statItem}
              onPress={() => navigation.navigate('CommunityProfile')}
            >
              <Text style={styles.statValue}>0</Text>
              <Text style={styles.statLabel}>{isRussian ? 'Посты' : 'Posts'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Menu Actions */}
        <View style={styles.menuContainer}>
          <TouchableOpacity
            style={[styles.menuItem, { backgroundColor: colors.card }]}
            onPress={() => navigation.navigate('PersonalizedRoute')}
          >
            <View style={[styles.menuIcon, { backgroundColor: '#e3f2fd' }]}>
              <Ionicons name="map" size={22} color="#1976d2" />
            </View>
            <Text style={[styles.menuText, { color: colors.text }]}>
              {isRussian ? 'Мои маршруты' : 'My Routes'}
            </Text>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuItem, { backgroundColor: colors.card }]}
            onPress={() => navigation.navigate('Achievements')}
          >
            <View style={[styles.menuIcon, { backgroundColor: '#fff3e0' }]}>
              <Ionicons name="trophy" size={22} color="#f57c00" />
            </View>
            <Text style={[styles.menuText, { color: colors.text }]}>
              {isRussian ? 'Достижения' : 'Achievements'}
            </Text>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuItem, { backgroundColor: colors.card }]}
            onPress={() => navigation.navigate('Settings')}
          >
            <View style={[styles.menuIcon, { backgroundColor: '#f3e5f5' }]}>
              <Ionicons name="settings" size={22} color="#7b1fa2" />
            </View>
            <Text style={[styles.menuText, { color: colors.text }]}>
              {isRussian ? 'Настройки' : 'Settings'}
            </Text>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </TouchableOpacity>

          {user?.role === 'ADMIN' && (
            <TouchableOpacity
              style={[styles.menuItem, { backgroundColor: colors.card }]}
              onPress={() => Alert.alert('Admin Dashboard', 'Coming soon!')}
            >
              <View style={[styles.menuIcon, { backgroundColor: '#ffebee' }]}>
                <Ionicons name="shield-checkmark" size={22} color="#d32f2f" />
              </View>
              <Text style={[styles.menuText, { color: colors.text }]}>
                Admin Dashboard
              </Text>
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Favorites Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {isRussian ? 'Избранное' : 'Favorites'}
          </Text>
          {favorites.length > 0 ? (
            favorites.map((item) => (
              <View key={`${item.type}_${item.id}`}>
                {renderFavoriteItem({ item })}
              </View>
            ))
          ) : (
            <View style={[styles.emptyState, { backgroundColor: colors.card }]}>
              <Ionicons name="heart-outline" size={48} color={colors.textSecondary} />
              <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
                {isRussian ? 'У вас пока нет избранных мест' : 'No favorites yet'}
              </Text>
            </View>
          )}
        </View>

        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <Text style={styles.logoutText}>
            {isRussian ? 'Выйти из аккаунта' : 'Log Out'}
          </Text>
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={[styles.versionText, { color: colors.textSecondary }]}>
            Version 2.0.0
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  // Guest Styles
  guestContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  guestLogo: {
    width: 120,
    height: 120,
    marginBottom: 24,
    borderRadius: 60,
  },
  guestTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  guestSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  loginButton: {
    backgroundColor: '#FF6B35',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    marginBottom: 16,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  settingsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  settingsButtonText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '500',
  },
  // Authenticated Styles
  header: {
    padding: 24,
    paddingTop: 60,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  userInfo: {
    marginLeft: 20,
    flex: 1,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 8,
  },
  roleTag: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  roleText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 16,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  // Menu
  menuContainer: {
    padding: 24,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  // Favorites
  section: {
    padding: 24,
    paddingTop: 0,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  card: {
    flexDirection: 'row',
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardImage: {
    width: 100,
    height: 100,
  },
  cardContent: {
    flex: 1,
    padding: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 12,
    marginBottom: 8,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  typeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  typeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#d4af37',
    marginLeft: 4,
  },
  removeButton: {
    padding: 4,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    borderRadius: 16,
  },
  emptyStateText: {
    marginTop: 12,
    fontSize: 16,
  },
  // Logout
  logoutButton: {
    margin: 24,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e74c3c',
    alignItems: 'center',
  },
  logoutText: {
    color: '#e74c3c',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  versionText: {
    fontSize: 12,
  },
});

