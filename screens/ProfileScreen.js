import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';

import { useLocalization } from '../contexts/LocalizationContext';
import { useAuth } from '../contexts/AuthContext';
import { useFavorites } from '../contexts/FavoritesContext';
import AvatarUpload from '../components/AvatarUpload';
import Card from '../components/ui/Card';
import Pill from '../components/ui/Pill';
import Button from '../components/ui/Button';
import { tokens } from '../theme/tokens';

const MENU = [
  { id: 'routes', icon: 'map', screen: 'PersonalizedRoute', accent: tokens.palette.info },
  { id: 'achievements', icon: 'trophy', screen: 'Achievements', accent: tokens.palette.gold },
  { id: 'leaderboard', icon: 'podium', screen: 'Leaderboard', accent: tokens.palette.emerald },
  { id: 'community', icon: 'people', screen: 'CommunityProfile', accent: '#A855F7' },
  { id: 'settings', icon: 'settings', screen: 'Settings', accent: tokens.palette.textMid },
];

const MENU_LABEL = {
  ru: {
    routes: 'Мои маршруты',
    achievements: 'Достижения',
    leaderboard: 'Рейтинг',
    community: 'Профиль сообщества',
    settings: 'Настройки',
  },
  en: {
    routes: 'My routes',
    achievements: 'Achievements',
    leaderboard: 'Leaderboard',
    community: 'Community profile',
    settings: 'Settings',
  },
};

export default function ProfileScreen({ navigation }) {
  const { isRussian, language } = useLocalization();
  const { user, isAuthenticated, logout } = useAuth();
  const { favorites, removeFromFavorites } = useFavorites();
  const insets = useSafeAreaInsets();
  const isRu = isRussian;
  const labels = MENU_LABEL[language === 'en' ? 'en' : 'ru'];

  const handleLogout = () => {
    Alert.alert(
      isRu ? 'Выход' : 'Logout',
      isRu ? 'Вы уверены?' : 'Are you sure?',
      [
        { text: isRu ? 'Отмена' : 'Cancel', style: 'cancel' },
        { text: isRu ? 'Выйти' : 'Logout', style: 'destructive', onPress: () => logout() },
      ]
    );
  };

  /* ============== Guest view ============== */
  if (!isAuthenticated) {
    return (
      <View style={styles.root}>
        <LinearGradient
          colors={tokens.gradients.hero}
          style={StyleSheet.absoluteFillObject}
        />
        <View style={[styles.guest, { paddingTop: insets.top + 80 }]}>
          <Animated.View entering={FadeIn.duration(600)}>
            <View style={styles.guestBadge}>
              <Ionicons name="compass" size={32} color={tokens.palette.ink0} />
            </View>
            <Text style={styles.guestTitle}>NomadWay</Text>
            <Text style={styles.guestSubtitle}>
              {isRu
                ? 'Войдите, чтобы сохранять маршруты, открывать AI-агента и собирать достижения.'
                : 'Sign in to save routes, use the AI agent, and earn achievements.'}
            </Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(150).duration(550)} style={{ width: '100%' }}>
            <Button
              label={isRu ? 'Войти / Регистрация' : 'Sign in / Register'}
              icon="log-in-outline"
              onPress={() => navigation.navigate('Auth')}
              fullWidth
            />
            <View style={{ height: 12 }} />
            <Button
              label={isRu ? 'Настройки' : 'Settings'}
              icon="settings-outline"
              variant="ghost"
              onPress={() => navigation.navigate('Settings')}
              fullWidth
            />
          </Animated.View>
        </View>
      </View>
    );
  }

  /* ============== Authenticated view ============== */
  const providerLabel =
    user?.authProvider === 'google'
      ? 'Google'
      : user?.role === 'ADMIN'
      ? 'Admin'
      : isRu
      ? 'Путешественник'
      : 'Traveler';
  const providerIcon =
    user?.authProvider === 'google' ? 'logo-google' : user?.role === 'ADMIN' ? 'shield-checkmark' : 'person';

  return (
    <View style={styles.root}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 80 }}
      >
        {/* ===== Hero ===== */}
        <View style={[styles.heroWrap, { paddingTop: insets.top + 16 }]}>
          <LinearGradient
            colors={['rgba(212, 175, 55, 0.18)', 'rgba(82, 183, 136, 0.06)', 'transparent']}
            style={StyleSheet.absoluteFillObject}
          />
          <Animated.View entering={FadeInDown.duration(500)} style={styles.profileHead}>
            <AvatarUpload size={88} />
            <View style={styles.profileMeta}>
              <Text style={styles.userName} numberOfLines={1}>
                {user?.fullName || user?.displayName || 'Nomad'}
              </Text>
              <Text style={styles.userEmail} numberOfLines={1}>
                {user?.email}
              </Text>
              <View style={styles.providerRow}>
                <Pill icon={providerIcon} label={providerLabel} active={user?.role === 'ADMIN'} />
                {user?.emailVerified && (
                  <Pill icon="checkmark-circle" label={isRu ? 'Подтверждён' : 'Verified'} />
                )}
              </View>
            </View>
          </Animated.View>

          {/* Stats */}
          <Animated.View entering={FadeInDown.delay(100).duration(500)} style={styles.statsRow}>
            <TouchableOpacity
              style={styles.statItem}
              onPress={() => navigation.navigate('Achievements')}
              activeOpacity={0.85}
            >
              <Text style={styles.statValue}>{user?.points || 0}</Text>
              <Text style={styles.statLabel}>{isRu ? 'Баллы' : 'Points'}</Text>
            </TouchableOpacity>
            <View style={styles.statDivider} />
            <TouchableOpacity
              style={styles.statItem}
              onPress={() => navigation.navigate('Achievements')}
              activeOpacity={0.85}
            >
              <Text style={styles.statValue}>{favorites.length}</Text>
              <Text style={styles.statLabel}>{isRu ? 'Сохранено' : 'Saved'}</Text>
            </TouchableOpacity>
            <View style={styles.statDivider} />
            <TouchableOpacity
              style={styles.statItem}
              onPress={() => navigation.navigate('CommunityProfile')}
              activeOpacity={0.85}
            >
              <Text style={styles.statValue}>0</Text>
              <Text style={styles.statLabel}>{isRu ? 'Посты' : 'Posts'}</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>

        {/* ===== Menu ===== */}
        <View style={styles.section}>
          {MENU.filter((m) => m.id !== 'community' || true).map((item, idx) => (
            <Animated.View
              key={item.id}
              entering={FadeInDown.delay(150 + idx * 50).duration(450)}
              style={{ marginBottom: 8 }}
            >
              <TouchableOpacity
                activeOpacity={0.88}
                onPress={() => navigation.navigate(item.screen)}
              >
                <Card style={styles.menuRow}>
                  <View
                    style={[styles.menuIcon, { backgroundColor: item.accent + '22', borderColor: item.accent + '55' }]}
                  >
                    <Ionicons name={item.icon} size={18} color={item.accent} />
                  </View>
                  <Text style={styles.menuText}>{labels[item.id]}</Text>
                  <Ionicons name="chevron-forward" size={18} color={tokens.palette.textLo} />
                </Card>
              </TouchableOpacity>
            </Animated.View>
          ))}

          {user?.role === 'ADMIN' && (
            <Animated.View entering={FadeInDown.delay(450).duration(450)}>
              <TouchableOpacity
                activeOpacity={0.88}
                onPress={() => Alert.alert('Admin', 'Coming soon')}
              >
                <Card style={styles.menuRow}>
                  <View style={[styles.menuIcon, { backgroundColor: 'rgba(239, 68, 68, 0.2)', borderColor: 'rgba(239, 68, 68, 0.5)' }]}>
                    <Ionicons name="shield-checkmark" size={18} color="#EF4444" />
                  </View>
                  <Text style={styles.menuText}>Admin Dashboard</Text>
                  <Ionicons name="chevron-forward" size={18} color={tokens.palette.textLo} />
                </Card>
              </TouchableOpacity>
            </Animated.View>
          )}
        </View>

        {/* ===== Favorites ===== */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{isRu ? 'Избранное' : 'Favorites'}</Text>
          {favorites.length > 0 ? (
            favorites.map((item, idx) => (
              <Animated.View
                key={`${item.type}_${item.id}`}
                entering={FadeInDown.delay(idx * 40).duration(400)}
                style={{ marginBottom: 8 }}
              >
                <TouchableOpacity
                  activeOpacity={0.92}
                  onPress={() =>
                    item.type === 'route'
                      ? navigation.navigate('RouteDetails', { route: item })
                      : navigation.navigate('AttractionDetails', { attraction: item })
                  }
                >
                  <Card padding={0} style={styles.favCard}>
                    <Image source={{ uri: item.image }} style={styles.favImage} />
                    <View style={styles.favBody}>
                      <Text style={styles.favTitle} numberOfLines={1}>
                        {item.name}
                      </Text>
                      <Text style={styles.favMeta} numberOfLines={1}>
                        {item.region} {item.category ? `· ${item.category}` : ''}
                      </Text>
                      <View style={styles.favRow}>
                        <Pill
                          icon={item.type === 'route' ? 'map' : 'location'}
                          label={
                            item.type === 'route'
                              ? isRu ? 'Маршрут' : 'Route'
                              : isRu ? 'Место' : 'Place'
                          }
                        />
                        <TouchableOpacity
                          onPress={() => removeFromFavorites(item.id, item.type)}
                          hitSlop={8}
                        >
                          <Ionicons name="trash-outline" size={16} color="#EF4444" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </Card>
                </TouchableOpacity>
              </Animated.View>
            ))
          ) : (
            <Card style={styles.emptyCard}>
              <Ionicons name="heart-outline" size={36} color={tokens.palette.textLo} />
              <Text style={styles.emptyText}>
                {isRu ? 'Пока ничего не сохранено' : 'No favorites yet'}
              </Text>
            </Card>
          )}
        </View>

        {/* ===== Logout ===== */}
        <View style={styles.section}>
          <Button
            label={isRu ? 'Выйти из аккаунта' : 'Sign out'}
            icon="log-out-outline"
            variant="ghost"
            onPress={handleLogout}
            fullWidth
          />
        </View>

        <Text style={styles.versionText}>NomadWay v2.0</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: tokens.palette.ink0 },

  // Guest
  guest: {
    flex: 1,
    paddingHorizontal: tokens.spacing.xl,
    alignItems: 'center',
  },
  guestBadge: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: tokens.palette.gold,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: tokens.spacing.lg,
    ...tokens.shadows.glow,
  },
  guestTitle: {
    color: tokens.palette.textHi,
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  guestSubtitle: {
    color: tokens.palette.textMid,
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
    marginTop: tokens.spacing.sm,
    marginBottom: tokens.spacing.xxl,
  },

  // Hero
  heroWrap: {
    paddingHorizontal: tokens.spacing.lg,
    paddingBottom: tokens.spacing.lg,
    overflow: 'hidden',
  },
  profileHead: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: tokens.spacing.xl,
  },
  profileMeta: { flex: 1, marginLeft: tokens.spacing.md },
  userName: {
    color: tokens.palette.textHi,
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  userEmail: {
    color: tokens.palette.textMid,
    fontSize: 12,
    marginTop: 2,
  },
  providerRow: { flexDirection: 'row', gap: 6, marginTop: 8 },

  // Stats
  statsRow: {
    flexDirection: 'row',
    backgroundColor: tokens.palette.ink1,
    borderRadius: tokens.radii.lg,
    borderWidth: 1,
    borderColor: tokens.palette.hairline,
    paddingVertical: 14,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: {
    color: tokens.palette.gold,
    fontSize: 22,
    fontWeight: '800',
  },
  statLabel: {
    color: tokens.palette.textMid,
    fontSize: 11,
    marginTop: 2,
    letterSpacing: 0.3,
  },
  statDivider: {
    width: 1,
    backgroundColor: tokens.palette.hairline,
    marginVertical: 6,
  },

  // Sections
  section: {
    paddingHorizontal: tokens.spacing.lg,
    marginTop: tokens.spacing.lg,
  },
  sectionTitle: {
    color: tokens.palette.textHi,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: tokens.spacing.sm,
  },

  // Menu
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginRight: 12,
  },
  menuText: { flex: 1, color: tokens.palette.textHi, fontSize: 14, fontWeight: '600' },

  // Favorites
  favCard: { flexDirection: 'row', overflow: 'hidden' },
  favImage: { width: 90, height: 90 },
  favBody: { flex: 1, padding: 12, justifyContent: 'space-between' },
  favTitle: { color: tokens.palette.textHi, fontSize: 14, fontWeight: '700' },
  favMeta: { color: tokens.palette.textMid, fontSize: 11, marginTop: 2 },
  favRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },

  // Empty
  emptyCard: { alignItems: 'center', paddingVertical: 28 },
  emptyText: { color: tokens.palette.textMid, fontSize: 13, marginTop: 8 },

  versionText: {
    color: tokens.palette.textLo,
    fontSize: 11,
    textAlign: 'center',
    marginTop: tokens.spacing.lg,
  },
});
