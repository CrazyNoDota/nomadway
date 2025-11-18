import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalization } from '../contexts/LocalizationContext';
import * as CommunityApi from '../utils/communityApi';

export default function CommunityProfileScreen({ route, navigation }) {
  const { userId } = route.params || {};
  const { language } = useLocalization();
  const [activeTab, setActiveTab] = useState('posts'); // posts, bookmarks, followers, following
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [bookmarks, setBookmarks] = useState([]);
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, [userId]);

  useEffect(() => {
    if (profile) {
      loadTabData();
    }
  }, [activeTab, profile]);

  const loadProfile = async () => {
    try {
      // In a real app, you'd fetch user profile from API
      // For now, we'll use mock data
      setProfile({
        id: userId || 'user1',
        display_name: `User ${(userId || 'user1').substring(0, 8)}`,
        avatar_url: `https://i.pravatar.cc/150?img=${Math.floor(Math.random() * 70)}`,
        location: { city: 'Almaty', country_code: 'KZ' },
        bio: language === 'ru' ? 'Путешественник и исследователь' : language === 'kk' ? 'Саяхатшы және зерттеуші' : 'Traveler and explorer',
        posts_count: 0,
        followers_count: 0,
        following_count: 0,
      });
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTabData = async () => {
    try {
      if (activeTab === 'posts') {
        const response = await CommunityApi.getFeed({ limit: 50 });
        // Filter by author (in real app, use API filter)
        const userPosts = (response.items || []).filter(p => p.author.id === profile.id);
        setPosts(userPosts);
      } else if (activeTab === 'bookmarks') {
        // In real app, fetch bookmarks from API
        setBookmarks([]);
      }
    } catch (error) {
      console.error('Error loading tab data:', error);
    }
  };

  const handleFollow = async () => {
    if (!profile) return;
    
    try {
      if (isFollowing) {
        await CommunityApi.unfollowUser(profile.id);
        setIsFollowing(false);
        setProfile(prev => ({ ...prev, followers_count: prev.followers_count - 1 }));
      } else {
        await CommunityApi.followUser(profile.id);
        setIsFollowing(true);
        setProfile(prev => ({ ...prev, followers_count: prev.followers_count + 1 }));
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
    }
  };

  const renderPost = ({ item }) => (
    <TouchableOpacity
      style={styles.postCard}
      onPress={() => navigation.navigate('PostDetails', { postId: item.id })}
    >
      {item.media && item.media.length > 0 && (
        <Image
          source={{ uri: item.media[0].thumb_url }}
          style={styles.postImage}
          resizeMode="cover"
        />
      )}
      <View style={styles.postContent}>
        <Text style={styles.postTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={styles.postBody} numberOfLines={2}>
          {item.body_preview}
        </Text>
        <View style={styles.postFooter}>
          <View style={styles.postStat}>
            <Ionicons name="heart-outline" size={14} color="#8e8e93" />
            <Text style={styles.postStatText}>{item.counters.likes}</Text>
          </View>
          <View style={styles.postStat}>
            <Ionicons name="chatbubble-outline" size={14} color="#8e8e93" />
            <Text style={styles.postStatText}>{item.counters.comments}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#d4af37" />
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>
          {language === 'ru' ? 'Профиль не найден' : language === 'kk' ? 'Профиль табылмады' : 'Profile not found'}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Profile Header */}
        <View style={styles.header}>
          <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
          <Text style={styles.name}>{profile.display_name}</Text>
          {profile.location && (
            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={14} color="#8e8e93" />
              <Text style={styles.location}>
                {profile.location.city ? `${profile.location.city}, ` : ''}
                {profile.location.country_code}
              </Text>
            </View>
          )}
          {profile.bio && (
            <Text style={styles.bio}>{profile.bio}</Text>
          )}
          
          {/* Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{profile.posts_count || posts.length}</Text>
              <Text style={styles.statLabel}>
                {language === 'ru' ? 'Постов' : language === 'kk' ? 'Жазбалар' : 'Posts'}
              </Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{profile.followers_count}</Text>
              <Text style={styles.statLabel}>
                {language === 'ru' ? 'Подписчиков' : language === 'kk' ? 'Жазылушылар' : 'Followers'}
              </Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{profile.following_count}</Text>
              <Text style={styles.statLabel}>
                {language === 'ru' ? 'Подписок' : language === 'kk' ? 'Жазылымдар' : 'Following'}
              </Text>
            </View>
          </View>

          {/* Follow Button */}
          {userId && (
            <TouchableOpacity
              style={[styles.followButton, isFollowing && styles.followButtonActive]}
              onPress={handleFollow}
            >
              <Text style={[styles.followButtonText, isFollowing && styles.followButtonTextActive]}>
                {isFollowing
                  ? (language === 'ru' ? 'Отписаться' : language === 'kk' ? 'Жазылудан бас тарту' : 'Unfollow')
                  : (language === 'ru' ? 'Подписаться' : language === 'kk' ? 'Жазылу' : 'Follow')}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Tabs */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'posts' && styles.activeTab]}
            onPress={() => setActiveTab('posts')}
          >
            <Text style={[styles.tabText, activeTab === 'posts' && styles.activeTabText]}>
              {language === 'ru' ? 'Посты' : language === 'kk' ? 'Жазбалар' : 'Posts'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'bookmarks' && styles.activeTab]}
            onPress={() => setActiveTab('bookmarks')}
          >
            <Text style={[styles.tabText, activeTab === 'bookmarks' && styles.activeTabText]}>
              {language === 'ru' ? 'Закладки' : language === 'kk' ? 'Бетбелгілер' : 'Bookmarks'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'followers' && styles.activeTab]}
            onPress={() => setActiveTab('followers')}
          >
            <Text style={[styles.tabText, activeTab === 'followers' && styles.activeTabText]}>
              {language === 'ru' ? 'Подписчики' : language === 'kk' ? 'Жазылушылар' : 'Followers'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'following' && styles.activeTab]}
            onPress={() => setActiveTab('following')}
          >
            <Text style={[styles.tabText, activeTab === 'following' && styles.activeTabText]}>
              {language === 'ru' ? 'Подписки' : language === 'kk' ? 'Жазылымдар' : 'Following'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        {activeTab === 'posts' && (
          <FlatList
            data={posts}
            renderItem={renderPost}
            keyExtractor={(item) => item.id}
            numColumns={2}
            scrollEnabled={false}
            contentContainerStyle={styles.postsGrid}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="document-text-outline" size={48} color="#8e8e93" />
                <Text style={styles.emptyText}>
                  {language === 'ru' ? 'Нет постов' : language === 'kk' ? 'Жазбалар жоқ' : 'No posts'}
                </Text>
              </View>
            }
          />
        )}

        {activeTab === 'bookmarks' && (
          <View style={styles.emptyContainer}>
            <Ionicons name="bookmark-outline" size={48} color="#8e8e93" />
            <Text style={styles.emptyText}>
              {language === 'ru' ? 'Нет закладок' : language === 'kk' ? 'Бетбелгілер жоқ' : 'No bookmarks'}
            </Text>
          </View>
        )}

        {activeTab === 'followers' && (
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={48} color="#8e8e93" />
            <Text style={styles.emptyText}>
              {language === 'ru' ? 'Нет подписчиков' : language === 'kk' ? 'Жазылушылар жоқ' : 'No followers'}
            </Text>
          </View>
        )}

        {activeTab === 'following' && (
          <View style={styles.emptyContainer}>
            <Ionicons name="person-add-outline" size={48} color="#8e8e93" />
            <Text style={styles.emptyText}>
              {language === 'ru' ? 'Нет подписок' : language === 'kk' ? 'Жазылымдар жоқ' : 'No following'}
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#8e8e93',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 12,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a4d3a',
    marginBottom: 8,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  location: {
    fontSize: 14,
    color: '#8e8e93',
    marginLeft: 4,
  },
  bio: {
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
    marginBottom: 16,
    paddingHorizontal: 24,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#f0f0f0',
    marginBottom: 16,
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a4d3a',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#8e8e93',
  },
  followButton: {
    paddingHorizontal: 32,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#d4af37',
    backgroundColor: '#fff',
  },
  followButtonActive: {
    backgroundColor: '#d4af37',
  },
  followButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#d4af37',
  },
  followButtonTextActive: {
    color: '#fff',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#d4af37',
  },
  tabText: {
    fontSize: 12,
    color: '#8e8e93',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#1a4d3a',
    fontWeight: 'bold',
  },
  postsGrid: {
    padding: 8,
  },
  postCard: {
    flex: 1,
    margin: 8,
    borderRadius: 12,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  postImage: {
    width: '100%',
    height: 150,
  },
  postContent: {
    padding: 12,
  },
  postTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a4d3a',
    marginBottom: 4,
  },
  postBody: {
    fontSize: 12,
    color: '#8e8e93',
    marginBottom: 8,
  },
  postFooter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  postStat: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  postStatText: {
    marginLeft: 4,
    fontSize: 12,
    color: '#8e8e93',
  },
  emptyContainer: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#8e8e93',
  },
});

