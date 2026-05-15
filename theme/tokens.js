/**
 * Premium-dark design tokens shared by all redesigned screens.
 *
 * These are fixed across light/dark mode — the existing ThemeContext still
 * controls semantic colors (text, background) for legacy screens. Redesigned
 * screens consume `tokens` directly so we get a consistent investor-grade look
 * regardless of system theme.
 */

const palette = {
  // Deep forest / charcoal base
  ink0: '#08110D', // app background, almost black
  ink1: '#0F1B16', // card surface
  ink2: '#16261F', // raised surface
  ink3: '#1F3329', // hovered / pressed

  // Brand
  forest: '#1a4d3a',
  forestLight: '#2d6a4f',
  emerald: '#52b788',
  emeraldGlow: 'rgba(82, 183, 136, 0.45)',

  // Gold accent
  gold: '#d4af37',
  goldSoft: '#e8c560',
  goldGlow: 'rgba(212, 175, 55, 0.35)',

  // Text
  textHi: '#F4F1E8', // primary text
  textMid: '#B8C0BC', // secondary
  textLo: '#7A847F', // muted

  // Semantic
  danger: '#EF4444',
  warning: '#F59E0B',
  success: '#22C55E',
  info: '#3B82F6',

  // Glass / overlays
  glass: 'rgba(255, 255, 255, 0.06)',
  glassStrong: 'rgba(255, 255, 255, 0.12)',
  hairline: 'rgba(255, 255, 255, 0.08)',
};

const gradients = {
  brand: ['#1a4d3a', '#2d6a4f', '#52b788'], // forest -> emerald
  gold: ['#d4af37', '#e8c560'],
  hero: ['#08110D', '#16261F', '#1a4d3a'], // app background -> forest
  glow: ['rgba(212, 175, 55, 0.35)', 'rgba(82, 183, 136, 0.0)'],
  card: ['rgba(255, 255, 255, 0.08)', 'rgba(255, 255, 255, 0.02)'],
  cta: ['#2d6a4f', '#52b788'],
};

const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  hero: 48,
};

const radii = {
  sm: 8,
  md: 14,
  lg: 20,
  xl: 28,
  pill: 999,
};

const shadows = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 8,
  },
  glow: {
    shadowColor: palette.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 24,
    elevation: 12,
  },
  press: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
};

const typography = {
  displayXL: { fontSize: 32, fontWeight: '800', letterSpacing: -0.5 },
  displayL: { fontSize: 26, fontWeight: '800', letterSpacing: -0.3 },
  display: { fontSize: 22, fontWeight: '700' },
  headline: { fontSize: 18, fontWeight: '700' },
  title: { fontSize: 16, fontWeight: '600' },
  body: { fontSize: 14, fontWeight: '400' },
  caption: { fontSize: 12, fontWeight: '500' },
  micro: { fontSize: 10, fontWeight: '600', letterSpacing: 0.8 },
};

export const tokens = {
  palette,
  gradients,
  spacing,
  radii,
  shadows,
  typography,
};

export default tokens;
