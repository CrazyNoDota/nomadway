import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  TextInput,
  Modal,
  Alert,
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

export default function PostDetailsScreen({ route, navigation }) {
  const { postId } = route.params;
  const { t, language } = useLocalization();
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [expandedReplies, setExpandedReplies] = useState(new Set());
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    loadPost();
    loadComments();
  }, [postId]);

  const loadPost = async () => {
    try {
      const data = await CommunityApi.getPost(postId);
      setPost(data);
    } catch (error) {
      console.error('Error loading post:', error);
      Alert.alert('Error', 'Failed to load post');
    } finally {
      setLoading(false);
    }
  };

  const loadComments = async () => {
    try {
      const data = await CommunityApi.getComments(postId);
      setComments(data.items || []);
    } catch (error) {
      console.error('Error loading comments:', error);
    }
  };

  const handleLike = async () => {
    if (!post) return;
    
    try {
      const wasLiked = post.is_liked;
      setPost({ ...post, is_liked: !wasLiked, counters: { ...post.counters, likes: wasLiked ? post.counters.likes - 1 : post.counters.likes + 1 } });
      
      if (wasLiked) {
        await CommunityApi.unlikePost(postId);
      } else {
        await CommunityApi.likePost(postId);
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      loadPost();
    }
  };

  const handleBookmark = async () => {
    if (!post) return;
    
    try {
      const wasBookmarked = post.is_bookmarked;
      setPost({ ...post, is_bookmarked: !wasBookmarked });
      
      if (wasBookmarked) {
        await CommunityApi.unbookmarkPost(postId);
      } else {
        await CommunityApi.bookmarkPost(postId);
      }
    } catch (error) {
      console.error('Error toggling bookmark:', error);
      loadPost();
    }
  };

  const handleSubmitComment = async () => {
    if (!commentText.trim()) return;
    
    try {
      await CommunityApi.createComment(postId, {
        body: commentText.trim(),
        parent_comment_id: replyingTo,
      });
      
      setCommentText('');
      setReplyingTo(null);
      loadComments();
      if (post) {
        setPost({ ...post, counters: { ...post.counters, comments: post.counters.comments + 1 } });
      }
    } catch (error) {
      console.error('Error submitting comment:', error);
      Alert.alert('Error', 'Failed to post comment');
    }
  };

  const handleLikeComment = async (commentId, isLiked) => {
    try {
      setComments(prev => prev.map(comment => {
        if (comment.id === commentId) {
          return {
            ...comment,
            is_liked: !isLiked,
            likes: isLiked ? comment.likes - 1 : comment.likes + 1,
          };
        }
        if (comment.replies) {
          return {
            ...comment,
            replies: comment.replies.map(reply => {
              if (reply.id === commentId) {
                return {
                  ...reply,
                  is_liked: !isLiked,
                  likes: isLiked ? reply.likes - 1 : reply.likes + 1,
                };
              }
              return reply;
            }),
          };
        }
        return comment;
      }));

      if (isLiked) {
        await CommunityApi.unlikeComment(commentId);
      } else {
        await CommunityApi.likeComment(commentId);
      }
    } catch (error) {
      console.error('Error toggling comment like:', error);
      loadComments();
    }
  };

  const toggleReplies = (commentId) => {
    setExpandedReplies(prev => {
      const newSet = new Set(prev);
      if (newSet.has(commentId)) {
        newSet.delete(commentId);
      } else {
        newSet.add(commentId);
      }
      return newSet;
    });
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

  const renderComment = (comment, isReply = false) => {
    return (
      <View key={comment.id} style={[styles.comment, isReply && styles.replyComment]}>
        <TouchableOpacity
          onPress={() => navigation.navigate('CommunityProfile', { userId: comment.author.id })}
        >
          <Image source={{ uri: comment.author.avatar_url }} style={styles.commentAvatar} />
        </TouchableOpacity>
        <View style={styles.commentContent}>
          <View style={styles.commentHeader}>
            <Text style={styles.commentAuthor}>{comment.author.name}</Text>
            <Text style={styles.commentTime}>{formatTimeAgo(comment.created_at)}</Text>
          </View>
          <Text style={styles.commentBody}>{comment.body}</Text>
          <View style={styles.commentActions}>
            <TouchableOpacity
              style={styles.commentAction}
              onPress={() => handleLikeComment(comment.id, comment.is_liked)}
            >
              <Ionicons
                name={comment.is_liked ? 'heart' : 'heart-outline'}
                size={16}
                color={comment.is_liked ? '#e74c3c' : '#8e8e93'}
              />
              <Text style={[styles.commentActionText, comment.is_liked && styles.commentActionTextActive]}>
                {comment.likes}
              </Text>
            </TouchableOpacity>
            {!isReply && (
              <TouchableOpacity
                style={styles.commentAction}
                onPress={() => setReplyingTo(comment.id)}
              >
                <Ionicons name="arrow-undo-outline" size={16} color="#8e8e93" />
                <Text style={styles.commentActionText}>
                  {language === 'ru' ? 'Ответить' : language === 'kk' ? 'Жауап беру' : 'Reply'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
          {!isReply && comment.replies && comment.replies.length > 0 && (
            <View style={styles.repliesContainer}>
              {expandedReplies.has(comment.id)
                ? comment.replies.map(reply => renderComment(reply, true))
                : (
                  <TouchableOpacity onPress={() => toggleReplies(comment.id)}>
                    <Text style={styles.showRepliesText}>
                      {language === 'ru' 
                        ? `Показать ${comment.replies_count} ответов` 
                        : language === 'kk' 
                        ? `${comment.replies_count} жауапты көрсету`
                        : `Show ${comment.replies_count} replies`}
                    </Text>
                  </TouchableOpacity>
                )}
            </View>
          )}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#d4af37" />
      </View>
    );
  }

  if (!post) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Post not found</Text>
      </View>
    );
  }

  const categoryInfo = POST_CATEGORIES[post.category] || POST_CATEGORIES.question;
  const categoryLabel = categoryInfo.label[language] || categoryInfo.label.en;

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Post Header */}
        <View style={styles.postHeader}>
          <TouchableOpacity
            style={styles.authorInfo}
            onPress={() => navigation.navigate('CommunityProfile', { userId: post.author.id })}
          >
            <Image source={{ uri: post.author.avatar_url }} style={styles.avatar} />
            <View style={styles.authorDetails}>
              <Text style={styles.authorName}>{post.author.name}</Text>
              {post.location && (
                <Text style={styles.location}>
                  <Ionicons name="location-outline" size={12} color="#8e8e93" />
                  {' '}
                  {post.location.city ? `${post.location.city}, ` : ''}
                  {post.location.country_code}
                </Text>
              )}
            </View>
          </TouchableOpacity>
        </View>

        {/* Category */}
        <View style={styles.categoryBadge}>
          <Ionicons name={categoryInfo.icon} size={14} color="#d4af37" />
          <Text style={styles.categoryText}>{categoryLabel}</Text>
        </View>

        {/* Title */}
        <Text style={styles.postTitle}>{post.title}</Text>

        {/* Body */}
        <Text style={styles.postBody}>{post.body}</Text>

        {/* Media */}
        {post.media && post.media.length > 0 && (
          <View style={styles.mediaContainer}>
            {post.media.map((media, index) => (
              <TouchableOpacity
                key={media.id || index}
                onPress={() => setSelectedImage(media.original_url)}
              >
                <Image
                  source={{ uri: media.thumb_url || media.original_url }}
                  style={styles.mediaImage}
                  resizeMode="cover"
                />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <View style={styles.tagsContainer}>
            {post.tags.map((tag, index) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>#{tag}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Actions */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity style={styles.actionButton} onPress={handleLike}>
            <Ionicons
              name={post.is_liked ? 'heart' : 'heart-outline'}
              size={24}
              color={post.is_liked ? '#e74c3c' : '#8e8e93'}
            />
            <Text style={[styles.actionText, post.is_liked && styles.actionTextActive]}>
              {post.counters.likes}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="chatbubble-outline" size={24} color="#8e8e93" />
            <Text style={styles.actionText}>{post.counters.comments}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={handleBookmark}>
            <Ionicons
              name={post.is_bookmarked ? 'bookmark' : 'bookmark-outline'}
              size={24}
              color={post.is_bookmarked ? '#d4af37' : '#8e8e93'}
            />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="share-outline" size={24} color="#8e8e93" />
          </TouchableOpacity>
        </View>

        {/* Comments Section */}
        <View style={styles.commentsSection}>
          <Text style={styles.commentsTitle}>
            {language === 'ru' ? 'Комментарии' : language === 'kk' ? 'Пікірлер' : 'Comments'} ({post.counters.comments})
          </Text>
          
          {comments.map(comment => renderComment(comment))}
        </View>
      </ScrollView>

      {/* Comment Input */}
      <View style={styles.commentInputContainer}>
        {replyingTo && (
          <View style={styles.replyingToBanner}>
            <Text style={styles.replyingToText}>
              {language === 'ru' ? 'Отвечаете на комментарий' : language === 'kk' ? 'Пікірге жауап бересіз' : 'Replying to comment'}
            </Text>
            <TouchableOpacity onPress={() => setReplyingTo(null)}>
              <Ionicons name="close" size={20} color="#8e8e93" />
            </TouchableOpacity>
          </View>
        )}
        <View style={styles.commentInputRow}>
          <TextInput
            style={styles.commentInput}
            placeholder={language === 'ru' ? 'Написать комментарий...' : language === 'kk' ? 'Пікір жазу...' : 'Write a comment...'}
            value={commentText}
            onChangeText={setCommentText}
            multiline
            placeholderTextColor="#8e8e93"
          />
          <TouchableOpacity
            style={[styles.sendButton, !commentText.trim() && styles.sendButtonDisabled]}
            onPress={handleSubmitComment}
            disabled={!commentText.trim()}
          >
            <Ionicons name="send" size={20} color={commentText.trim() ? '#d4af37' : '#ccc'} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Image Modal */}
      <Modal
        visible={selectedImage !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedImage(null)}
      >
        <TouchableOpacity
          style={styles.imageModal}
          activeOpacity={1}
          onPress={() => setSelectedImage(null)}
        >
          <Image
            source={{ uri: selectedImage }}
            style={styles.fullImage}
            resizeMode="contain"
          />
        </TouchableOpacity>
      </Modal>
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
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  authorDetails: {
    flex: 1,
  },
  authorName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a4d3a',
    marginBottom: 4,
  },
  location: {
    fontSize: 12,
    color: '#8e8e93',
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#fff8e1',
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 12,
  },
  categoryText: {
    fontSize: 12,
    color: '#d4af37',
    fontWeight: '600',
    marginLeft: 6,
  },
  postTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a4d3a',
    marginHorizontal: 16,
    marginBottom: 12,
  },
  postBody: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  mediaContainer: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  mediaImage: {
    width: '100%',
    height: 300,
    borderRadius: 12,
    marginBottom: 8,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: 16,
    marginBottom: 16,
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 4,
  },
  tagText: {
    fontSize: 12,
    color: '#3498db',
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#f0f0f0',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 24,
  },
  actionText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#8e8e93',
  },
  actionTextActive: {
    color: '#e74c3c',
  },
  commentsSection: {
    padding: 16,
  },
  commentsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a4d3a',
    marginBottom: 16,
  },
  comment: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  replyComment: {
    marginLeft: 40,
    marginTop: 8,
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 12,
  },
  commentContent: {
    flex: 1,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  commentAuthor: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a4d3a',
    marginRight: 8,
  },
  commentTime: {
    fontSize: 12,
    color: '#8e8e93',
  },
  commentBody: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    marginBottom: 8,
  },
  commentActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  commentAction: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  commentActionText: {
    marginLeft: 4,
    fontSize: 12,
    color: '#8e8e93',
  },
  commentActionTextActive: {
    color: '#e74c3c',
  },
  repliesContainer: {
    marginTop: 8,
  },
  showRepliesText: {
    fontSize: 12,
    color: '#3498db',
    marginTop: 4,
  },
  commentInputContainer: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    backgroundColor: '#fff',
  },
  replyingToBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f5f5f5',
  },
  replyingToText: {
    fontSize: 12,
    color: '#8e8e93',
  },
  commentInputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 16,
  },
  commentInput: {
    flex: 1,
    maxHeight: 100,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    fontSize: 14,
    color: '#333',
    marginRight: 8,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff8e1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#f5f5f5',
  },
  imageModal: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullImage: {
    width: '100%',
    height: '100%',
  },
});

