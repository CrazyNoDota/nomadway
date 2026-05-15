import React from 'react';
import { TouchableOpacity, View, Text, Image, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { tokens } from '../../theme/tokens';

/**
 * Premium attraction tile. Photo-first, with a glassy meta footer.
 * Two layouts:
 *   - default: portrait card, used in carousels / grids
 *   - wide:    horizontal banner, used in featured strips
 */
export default function AttractionCard({ attraction, onPress, layout = 'default', index = 0 }) {
  const image = attraction.imageThumb || attraction.image;
  const isWide = layout === 'wide';

  return (
    <Animated.View entering={FadeInUp.delay(index * 60).duration(450)}>
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.92}
        style={[styles.base, isWide ? styles.wide : styles.portrait]}
      >
        <Image source={{ uri: image }} style={styles.image} resizeMode="cover" />
        <LinearGradient
          colors={['transparent', 'rgba(8, 17, 13, 0.35)', 'rgba(8, 17, 13, 0.95)']}
          style={StyleSheet.absoluteFillObject}
        />

        {/* Category pill top-left */}
        {attraction.category && (
          <View style={styles.categoryPill}>
            <Text style={styles.categoryText}>{attraction.category}</Text>
          </View>
        )}

        {/* Rating top-right */}
        {attraction.rating != null && (
          <View style={styles.ratingPill}>
            <Ionicons name="star" size={11} color={tokens.palette.gold} />
            <Text style={styles.ratingText}>{attraction.rating.toFixed(1)}</Text>
          </View>
        )}

        {/* Footer content */}
        <View style={styles.footer}>
          <Text style={styles.title} numberOfLines={isWide ? 1 : 2}>
            {attraction.name}
          </Text>
          {attraction.city && (
            <View style={styles.metaRow}>
              <Ionicons name="location-outline" size={12} color={tokens.palette.textMid} />
              <Text style={styles.meta} numberOfLines={1}>
                {attraction.city}
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: tokens.palette.ink2,
    borderRadius: tokens.radii.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: tokens.palette.hairline,
    ...tokens.shadows.card,
  },
  portrait: { width: 220, height: 280 },
  wide: { width: '100%', height: 180 },
  image: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  categoryPill: {
    position: 'absolute',
    top: 12,
    left: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: tokens.radii.pill,
    backgroundColor: 'rgba(8, 17, 13, 0.7)',
    borderWidth: 1,
    borderColor: tokens.palette.hairline,
  },
  categoryText: {
    color: tokens.palette.textHi,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.4,
  },
  ratingPill: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: tokens.radii.pill,
    backgroundColor: 'rgba(8, 17, 13, 0.7)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
  },
  ratingText: {
    color: tokens.palette.gold,
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 3,
  },
  footer: {
    position: 'absolute',
    left: 14,
    right: 14,
    bottom: 14,
  },
  title: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.2,
    marginBottom: 4,
  },
  metaRow: { flexDirection: 'row', alignItems: 'center' },
  meta: {
    color: tokens.palette.textMid,
    fontSize: 12,
    marginLeft: 4,
    flex: 1,
  },
});
