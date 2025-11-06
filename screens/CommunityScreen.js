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
import communityData from '../data/community.json';

export default function CommunityScreen({ navigation }) {
  const [activeTab, setActiveTab] = useState('reviews');
  const [reviews, setReviews] = useState([]);
  const [tips, setTips] = useState([]);

  useEffect(() => {
    setReviews(communityData.reviews);
    setTips(communityData.tips);
  }, []);

  const renderStars = (rating) => {
    return Array.from({ length: 5 }).map((_, index) => (
      <Ionicons
        key={index}
        name={index < rating ? 'star' : 'star-outline'}
        size={16}
        color="#d4af37"
      />
    ));
  };

  const renderReview = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Image source={{ uri: item.avatar }} style={styles.avatar} />
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{item.userName}</Text>
          <View style={styles.ratingRow}>
            {renderStars(item.rating)}
          </View>
        </View>
        <Text style={styles.date}>{new Date(item.date).toLocaleDateString('ru-RU')}</Text>
      </View>
      
      <TouchableOpacity
        onPress={() => {
          // Navigate to attraction if available
          const attraction = require('../data/attractions.json').attractions.find(
            (a) => a.id === item.attractionId
          );
          if (attraction) {
            navigation.navigate('AttractionDetails', { attraction });
          }
        }}
      >
        <Text style={styles.attractionName}>{item.attractionName}</Text>
      </TouchableOpacity>
      
      <Text style={styles.reviewText}>{item.text}</Text>
      
      <View style={styles.cardFooter}>
        <TouchableOpacity style={styles.likeButton}>
          <Ionicons name="heart-outline" size={18} color="#8e8e93" />
          <Text style={styles.likeCount}>{item.likes}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderTip = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Image source={{ uri: `https://i.pravatar.cc/150?img=${item.id}` }} style={styles.avatar} />
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{item.userName}</Text>
        </View>
      </View>
      
      <Text style={styles.tipText}>{item.text}</Text>
      
      <View style={styles.cardFooter}>
        <TouchableOpacity style={styles.likeButton}>
          <Ionicons name="heart-outline" size={18} color="#8e8e93" />
          <Text style={styles.likeCount}>{item.likes}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'reviews' && styles.activeTab]}
          onPress={() => setActiveTab('reviews')}
        >
          <Text style={[styles.tabText, activeTab === 'reviews' && styles.activeTabText]}>
            Отзывы
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'tips' && styles.activeTab]}
          onPress={() => setActiveTab('tips')}
        >
          <Text style={[styles.tabText, activeTab === 'tips' && styles.activeTabText]}>
            Советы
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={activeTab === 'reviews' ? reviews : tips}
        renderItem={activeTab === 'reviews' ? renderReview : renderTip}
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
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingTop: 8,
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
    fontSize: 16,
    color: '#8e8e93',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#1a4d3a',
    fontWeight: 'bold',
  },
  list: {
    padding: 16,
  },
  card: {
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
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a4d3a',
    marginBottom: 4,
  },
  ratingRow: {
    flexDirection: 'row',
  },
  date: {
    fontSize: 12,
    color: '#8e8e93',
  },
  attractionName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3498db',
    marginBottom: 8,
  },
  reviewText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    marginBottom: 12,
  },
  tipText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    marginBottom: 12,
    fontStyle: 'italic',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  likeButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  likeCount: {
    marginLeft: 6,
    fontSize: 14,
    color: '#8e8e93',
  },
});

