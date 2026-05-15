import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { tokens } from '../../theme/tokens';

/**
 * Lightweight in-screen header used by redesigned screens. Designed to sit on
 * the dark scrollable background — no fixed background of its own, so heroes
 * can bleed under it.
 */
export default function ScreenHeader({
  title,
  subtitle,
  onBack,
  right,
  transparent = false,
}) {
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[
        styles.wrap,
        { paddingTop: insets.top + 8 },
        !transparent && styles.opaque,
      ]}
    >
      <View style={styles.row}>
        {onBack ? (
          <TouchableOpacity onPress={onBack} style={styles.icon} hitSlop={10}>
            <Ionicons name="chevron-back" size={22} color={tokens.palette.textHi} />
          </TouchableOpacity>
        ) : (
          <View style={styles.icon} />
        )}
        <View style={styles.center}>
          {title ? <Text style={styles.title}>{title}</Text> : null}
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
        <View style={styles.icon}>{right}</View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: tokens.spacing.lg,
    paddingBottom: tokens.spacing.md,
  },
  opaque: {
    backgroundColor: tokens.palette.ink0,
  },
  row: { flexDirection: 'row', alignItems: 'center' },
  icon: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  center: { flex: 1, alignItems: 'center' },
  title: { color: tokens.palette.textHi, fontSize: 17, fontWeight: '700' },
  subtitle: { color: tokens.palette.textMid, fontSize: 12, marginTop: 2 },
});
