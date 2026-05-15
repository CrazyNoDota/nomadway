import React from 'react';
import { View, StyleSheet } from 'react-native';
import { tokens } from '../../theme/tokens';

/**
 * Glassmorphism card on a dark backdrop. Default: a subtly raised surface with
 * hairline border. Pass `tint="gold"` for a featured/AI-themed card.
 */
export default function Card({ children, style, tint, padding = tokens.spacing.lg }) {
  return (
    <View
      style={[
        styles.base,
        { padding },
        tint === 'gold' && styles.tintGold,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: tokens.palette.ink1,
    borderRadius: tokens.radii.lg,
    borderWidth: 1,
    borderColor: tokens.palette.hairline,
    ...tokens.shadows.card,
  },
  tintGold: {
    borderColor: 'rgba(212, 175, 55, 0.3)',
    backgroundColor: 'rgba(212, 175, 55, 0.06)',
  },
});
