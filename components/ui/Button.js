import React from 'react';
import { TouchableOpacity, Text, View, StyleSheet, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { tokens } from '../../theme/tokens';

/**
 * Premium-dark button. Three variants:
 *   - primary: gradient brand background (default)
 *   - gold:    gold gradient — use sparingly for AI / featured CTAs
 *   - ghost:   transparent with hairline border
 */
export default function Button({
  label,
  onPress,
  variant = 'primary',
  icon,
  iconPosition = 'left',
  loading = false,
  disabled = false,
  fullWidth = false,
  style,
}) {
  const isGhost = variant === 'ghost';

  const inner = (
    <View style={styles.row}>
      {loading ? (
        <ActivityIndicator size="small" color={isGhost ? tokens.palette.textHi : '#fff'} />
      ) : (
        <>
          {icon && iconPosition === 'left' && (
            <Ionicons name={icon} size={18} color={isGhost ? tokens.palette.gold : '#fff'} style={styles.iconLeft} />
          )}
          <Text style={[styles.label, isGhost && styles.labelGhost]}>{label}</Text>
          {icon && iconPosition === 'right' && (
            <Ionicons name={icon} size={18} color={isGhost ? tokens.palette.gold : '#fff'} style={styles.iconRight} />
          )}
        </>
      )}
    </View>
  );

  if (isGhost) {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled || loading}
        activeOpacity={0.85}
        style={[
          styles.base,
          styles.ghost,
          fullWidth && styles.fullWidth,
          (disabled || loading) && styles.disabled,
          style,
        ]}
      >
        {inner}
      </TouchableOpacity>
    );
  }

  const gradient = variant === 'gold' ? tokens.gradients.gold : tokens.gradients.cta;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.9}
      style={[
        fullWidth && styles.fullWidth,
        (disabled || loading) && styles.disabled,
        styles.shadow,
        style,
      ]}
    >
      <LinearGradient
        colors={gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.base]}
      >
        {inner}
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: 14,
    paddingHorizontal: tokens.spacing.xl,
    borderRadius: tokens.radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ghost: {
    backgroundColor: tokens.palette.glass,
    borderWidth: 1,
    borderColor: tokens.palette.hairline,
  },
  fullWidth: { alignSelf: 'stretch' },
  disabled: { opacity: 0.5 },
  shadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
    borderRadius: tokens.radii.lg,
  },
  row: { flexDirection: 'row', alignItems: 'center' },
  label: { color: '#fff', fontWeight: '700', fontSize: 15, letterSpacing: 0.2 },
  labelGhost: { color: tokens.palette.textHi },
  iconLeft: { marginRight: 8 },
  iconRight: { marginLeft: 8 },
});
