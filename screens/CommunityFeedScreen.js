import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalization } from '../contexts/LocalizationContext';
import * as CommunityApi from '../utils/communityApi';

const POST_CATEGORIES = {
  question: { label: { ru: 'Вопрос', en: 'Question', kk: 'Сұрақ' }, icon: 'help-circle' },
  experience: { label: { ru: 'Опыт', en: 'Experience', kk: 'Тәжірибе' }, icon: 'book' },
  guide: { label: { ru: 'Гид', en: 'Guide', kk: 'Гид' }, icon: 'map' },
  seek_travel_mates: { label: { ru: 'Ищу попутчиков', en: 'Seek Travel Mates', kk: 'Серіктес іздеу' }, icon: 'people' },
  recommendations: { label: { ru: 'Рекомендации', en: 'Recommendations', kk: 'Ұсыныстар' }, icon: 'star' },
};

export default function CommunityFeedScreen({ navigation }) {
  const { t, language } = useLocalization();
  const [activeTab, setActiveTab] = useState('popular'); // popular, new, subscriptions
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchLocation, setSearchLocation] = useState('');

  const loadFeed = useCallback(async (reset = false, cursor = null) => {
    try {
      if (reset) {
        setLoading(true);
        setPosts([]);
        setNextCursor(null);
      } else {
        setLoadingMore(true);
      }

      const params = {
        sort: activeTab === 'subscriptions' ? 'new' : activeTab,
        scope: activeTab === 'subscriptions' ? 'subscriptions' : 'all',
        limit: 20,
        cursor: cursor || nextCursor,
      };

      if (selectedCategory) {
        params.category = selectedCategory;
      }

      if (searchLocation) {
        // Simple parsing - in production, use proper location picker
        const parts = searchLocation.split(',').map(s => s.trim());
        if (parts.length >= 2) {
          params.location_city = parts[0];
          params.location_country = parts[1];
        } else {
          params.location_country = parts[0];
        }
      }

      const response = await CommunityApi.getFeed(params);
      
      if (reset) {
        setPosts(response.items || []);
      } else {
        setPosts(prev => [...prev, ...(response.items || [])]);
      }
      
      setNextCursor(response.next_cursor || null);
    } catch (error) {
      console.error('Error loading feed:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, [activeTab, selectedCategory, searchLocation, nextCursor]);

  useEffect(() => {
    loadFeed(true);
  }, [activeTab, selectedCategory, searchLocation]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadFeed(true);
  }, [loadFeed]);

  const loadMore = useCallback(() => {
    if (!loadingMore && nextCursor) {
      loadFeed(false, nextCursor);
    }
  }, [loadingMore, nextCursor, loadFeed]);

  const handleLike = async (postId, isLiked) => {
    try {
      // Optimistic update
      setPosts(prev => prev.map(post => {
        if (post.id === postId) {
          return {
            ...post,
            is_liked: !isLiked,
            counters: {
              ...post.counters,
              likes: isLiked ? post.counters.likes - 1 : post.counters.likes + 1,
            },
          };
        }
        return post;
      }));

      if (isLiked) {
        await CommunityApi.unlikePost(postId);
      } else {
        await CommunityApi.likePost(postId);
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      // Revert optimistic update
      setPosts(prev => prev.map(post => {
        if (post.id === postId) {
          return {
            ...post,
            is_liked: isLiked,
            counters: {
              ...post.counters,
              likes: isLiked ? post.counters.likes : post.counters.likes - 1,
            },
          };
        }
        return post;
      }));
    }
  };

  const handleBookmark = async (postId, isBookmarked) => {
    try {
      // Optimistic update
      setPosts(prev => prev.map(post => {
        if (post.id === postId) {
          return {
            ...post,
            is_bookmarked: !isBookmarked,
          };
        }
        return post;
      }));

      if (isBookmarked) {
        await CommunityApi.unbookmarkPost(postId);
      } else {
        await CommunityApi.bookmarkPost(postId);
      }
    } catch (error) {
      console.error('Error toggling bookmark:', error);
      // Revert optimistic update
      setPosts(prev => prev.map(post => {
        if (post.id === postId) {
          return {
            ...post,
            is_bookmarked: isBookmarked,
          };
        }
        return post;
      }));
    }
  };

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return language === 'ru' ? 'только что' : language === 'kk' ? 'дәл қазір' : 'just now';
    if (diffMins < 60) return `${diffMins}${language === 'ru' ? 'м' : language === 'kk' ? 'мин' : 'm'}`;
    if (diffHours < 24) return `${diffHours}${language === 'ru' ? 'ч' : language === 'kk' ? 'сағ' : 'h'}`;
    if (diffDays < 7) return `${diffDays}${language === 'ru' ? 'д' : language === 'kk' ? 'к' : 'd'}`;
    return date.toLocaleDateString(language === 'ru' ? 'ru-RU' : language === 'kk' ? 'kk-KZ' : 'en-US');
  };

  const renderPost = ({ item }) => {
    const categoryInfo = POST_CATEGORIES[item.category] || POST_CATEGORIES.question;
    const categoryLabel = categoryInfo.label[language] || categoryInfo.label.en;

    return (
      <TouchableOpacity
        style={styles.postCard}
        onPress={() => navigation.navigate('PostDetails', { postId: item.id })}
        activeOpacity={0.7}
      >
        {/* Header */}
        <View style={styles.postHeader}>
          <TouchableOpacity
            style={styles.authorInfo}
            onPress={() => navigation.navigate('CommunityProfile', { userId: item.author.id })}
          >
            <Image source={{ uri: item.author.avatar_url }} style={styles.avatar} />
            <View style={styles.authorDetails}>
              <Text style={styles.authorName}>{item.author.name}</Text>
              {item.location && (
                <Text style={styles.location}>
                  <Ionicons name="location-outline" size={12} color="#8e8e93" />
                  {' '}
                  {item.location.city ? `${item.location.city}, ` : ''}
                  {item.location.country_code}
                </Text>
              )}
            </View>
          </TouchableOpacity>
          <Text style={styles.timeAgo}>{formatTimeAgo(item.published_at)}</Text>
        </View>

        {/* Category Badge */}
        <View style={styles.categoryBadge}>
          <Ionicons name={categoryInfo.icon} size={14} color="#d4af37" />
          <Text style={styles.categoryText}>{categoryLabel}</Text>
        </View>

        {/* Title */}
        <Text style={styles.postTitle}>{item.title}</Text>

        {/* Body Preview */}
        <Text style={styles.postBody} numberOfLines={3}>
          {item.body_preview}
        </Text>

        {/* Media */}
        {item.media && item.media.length > 0 && (
          <View style={styles.mediaContainer}>
            <Image
              source={{ uri: item.media[0].thumb_url }}
              style={styles.mediaImage}
              resizeMode="cover"
            />
            {item.media.length > 1 && (
              <View style={styles.moreMediaBadge}>
                <Ionicons name="images" size={16} color="#fff" />
                <Text style={styles.moreMediaText}>+{item.media.length - 1}</Text>
              </View>
            )}
          </View>
        )}

        {/* Tags */}
        {item.tags && item.tags.length > 0 && (
          <View style={styles.tagsContainer}>
            {item.tags.slice(0, 3).map((tag, index) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>#{tag}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Footer */}
        <View style={styles.postFooter}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={(e) => {
              e.stopPropagation();
              handleLike(item.id, item.is_liked);
            }}
          >
            <Ionicons
              name={item.is_liked ? 'heart' : 'heart-outline'}
              size={20}
              color={item.is_liked ? '#e74c3c' : '#8e8e93'}
            />
            <Text style={[styles.actionText, item.is_liked && styles.actionTextActive]}>
              {item.counters.likes}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={(e) => {
              e.stopPropagation();
              navigation.navigate('PostDetails', { postId: item.id });
            }}
          >
            <Ionicons name="chatbubble-outline" size={20} color="#8e8e93" />
            <Text style={styles.actionText}>{item.counters.comments}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={(e) => {
              e.stopPropagation();
              handleBookmark(item.id, item.is_bookmarked);
            }}
          >
            <Ionicons
              name={item.is_bookmarked ? 'bookmark' : 'bookmark-outline'}
              size={20}
              color={item.is_bookmarked ? '#d4af37' : '#8e8e93'}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={(e) => {
              e.stopPropagation();
              // Share functionality
            }}
          >
            <Ionicons name="share-outline" size={20} color="#8e8e93" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'popular' && styles.activeTab]}
          onPress={() => setActiveTab('popular')}
        >
          <Text style={[styles.tabText, activeTab === 'popular' && styles.activeTabText]}>
            {language === 'ru' ? 'Популярное' : language === 'kk' ? 'Танымал' : 'Popular'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'new' && styles.activeTab]}
          onPress={() => setActiveTab('new')}
        >
          <Text style={[styles.tabText, activeTab === 'new' && styles.activeTabText]}>
            {language === 'ru' ? 'Новое' : language === 'kk' ? 'Жаңа' : 'New'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'subscriptions' && styles.activeTab]}
          onPress={() => setActiveTab('subscriptions')}
        >
          <Text style={[styles.tabText, activeTab === 'subscriptions' && styles.activeTabText]}>
            {language === 'ru' ? 'Подписки' : language === 'kk' ? 'Жазылымдар' : 'Subscriptions'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Filters */}
      <View style={styles.filtersContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder={language === 'ru' ? 'Поиск по локации...' : language === 'kk' ? 'Орналасқан жер бойынша іздеу...' : 'Search location...'}
          value={searchLocation}
          onChangeText={setSearchLocation}
          placeholderTextColor="#8e8e93"
        />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryFilter}>
          <TouchableOpacity
            style={[styles.categoryFilterButton, !selectedCategory && styles.categoryFilterButtonActive]}
            onPress={() => setSelectedCategory(null)}
          >
            <Text style={[styles.categoryFilterText, !selectedCategory && styles.categoryFilterTextActive]}>
              {t('all')}
            </Text>
          </TouchableOpacity>
          {Object.keys(POST_CATEGORIES).map(category => (
            <TouchableOpacity
              key={category}
              style={[styles.categoryFilterButton, selectedCategory === category && styles.categoryFilterButtonActive]}
              onPress={() => setSelectedCategory(category)}
            >
              <Text style={[styles.categoryFilterText, selectedCategory === category && styles.categoryFilterTextActive]}>
                {POST_CATEGORIES[category].label[language] || POST_CATEGORIES[category].label.en}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Feed */}
      {loading && posts.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#d4af37" />
        </View>
      ) : (
        <FlatList
          data={posts}
          renderItem={renderPost}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#d4af37" />
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            loadingMore ? (
              <View style={styles.loadingMore}>
                <ActivityIndicator size="small" color="#d4af37" />
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="document-text-outline" size={64} color="#8e8e93" />
              <Text style={styles.emptyText}>
                {language === 'ru' ? 'Пока нет постов' : language === 'kk' ? 'Әзірге жазбалар жоқ' : 'No posts yet'}
              </Text>
            </View>
          }
        />
      )}

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('CreatePost')}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
    fontSize: 14,
    color: '#8e8e93',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#1a4d3a',
    fontWeight: 'bold',
  },
  filtersContainer: {
    backgroundColor: '#fff',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  searchInput: {
    marginHorizontal: 16,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    fontSize: 14,
    color: '#333',
  },
  categoryFilter: {
    paddingHorizontal: 16,
  },
  categoryFilterButton: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    marginRight: 8,
    borderRadius: 16,
    backgroundColor: '#f5f5f5',
  },
  categoryFilterButtonActive: {
    backgroundColor: '#d4af37',
  },
  categoryFilterText: {
    fontSize: 12,
    color: '#8e8e93',
    fontWeight: '500',
  },
  categoryFilterTextActive: {
    color: '#fff',
  },
  list: {
    padding: 16,
  },
  postCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  authorDetails: {
    flex: 1,
  },
  authorName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a4d3a',
    marginBottom: 2,
  },
  location: {
    fontSize: 12,
    color: '#8e8e93',
  },
  timeAgo: {
    fontSize: 12,
    color: '#8e8e93',
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#fff8e1',
    borderRadius: 12,
    marginBottom: 8,
  },
  categoryText: {
    fontSize: 12,
    color: '#d4af37',
    fontWeight: '600',
    marginLeft: 4,
  },
  postTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a4d3a',
    marginBottom: 8,
  },
  postBody: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    marginBottom: 12,
  },
  mediaContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  mediaImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
  },
  moreMediaBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  moreMediaText: {
    color: '#fff',
    fontSize: 12,
    marginLeft: 4,
    fontWeight: '600',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    marginRight: 6,
    marginBottom: 4,
  },
  tagText: {
    fontSize: 12,
    color: '#3498db',
  },
  postFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 24,
  },
  actionText: {
    marginLeft: 6,
    fontSize: 14,
    color: '#8e8e93',
  },
  actionTextActive: {
    color: '#e74c3c',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#d4af37',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingMore: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#8e8e93',
  },
});

