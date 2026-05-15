import React from 'react';
import { TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { tokens } from '../../theme/tokens';

/**
 * Small rounded chip. Used for tags, filters, capability indicators, and
 * status badges. `active` flips it to a gold-tinted highlighted state.
 */
export default function Pill({ label, icon, active = false, onPress, style }) {
  const Container = onPress ? TouchableOpacity : View;
  return (
    <Container
      onPress={onPress}
      activeOpacity={0.8}
      style={[styles.base, active && styles.active, style]}
    >
      {icon && (
        <Ionicons
          name={icon}
          size={12}
          color={active ? tokens.palette.gold : tokens.palette.textMid}
          style={styles.icon}
        />
      )}
      <Text style={[styles.label, active && styles.labelActive]}>{label}</Text>
    </Container>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: tokens.radii.pill,
    backgroundColor: tokens.palette.glass,
    borderWidth: 1,
    borderColor: tokens.palette.hairline,
  },
  active: {
    backgroundColor: 'rgba(212, 175, 55, 0.12)',
    borderColor: 'rgba(212, 175, 55, 0.4)',
  },
  icon: { marginRight: 6 },
  label: {
    color: tokens.palette.textMid,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  labelActive: {
    color: tokens.palette.gold,
  },
});
