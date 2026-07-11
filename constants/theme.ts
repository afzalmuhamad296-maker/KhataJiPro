export type ThemeColorKey = 'green' | 'gold' | 'blue' | 'black' | 'desert';

const baseTheme = {
  // Semantic (constant across variants)
  credit: '#DC2626',
  creditLight: '#FEE2E2',
  creditSurface: '#FFF5F5',
  payment: '#16A34A',
  paymentLight: '#DCFCE7',
  paymentSurface: '#F0FFF4',
  warning: '#F59E0B',
  warningDark: '#D97706',
  warningSurface: '#FFFBEB',

  background: '#F4F7F5',
  backgroundSecondary: '#E8F5ED',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',

  textPrimary: '#0F3D24',
  textSecondary: '#4B6B5A',
  textDark: '#111827',
  textMuted: '#9CA3AF',
  textLight: '#D1D5DB',

  border: '#E2E8F0',
  borderLight: '#F1F5F9',

  success: '#16A34A',
  error: '#DC2626',
  info: '#2563EB',

  cardShadow: {
    shadowColor: '#0D7C4A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  cardShadowLg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 6,
  },

  spacing: { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32 },
  borderRadius: { xs: 6, sm: 10, md: 14, lg: 18, xl: 24, full: 9999 },
};

export const themeVariants: Record<ThemeColorKey, {
  primary: string;
  primaryLight: string;
  primaryDark: string;
  primaryGradientStart: string;
  primaryGradientEnd: string;
  primaryGradient: readonly [string, string, string];
  accentColor: string;
}> = {
  green: {
    primary: '#0D7C4A',
    primaryLight: '#34D399',
    primaryDark: '#065F37',
    primaryGradientStart: '#0D7C4A',
    primaryGradientEnd: '#065F37',
    primaryGradient: ['#0A6B3F', '#0D7C4A', '#065F37'] as const,
    accentColor: '#FFD700',
  },
  gold: {
    primary: '#B8860B',
    primaryLight: '#FCD34D',
    primaryDark: '#8B6508',
    primaryGradientStart: '#D97706',
    primaryGradientEnd: '#8B6508',
    primaryGradient: ['#D97706', '#B8860B', '#8B6508'] as const,
    accentColor: '#065F37',
  },
  blue: {
    primary: '#1565C0',
    primaryLight: '#42A5F5',
    primaryDark: '#0D47A1',
    primaryGradientStart: '#1E88E5',
    primaryGradientEnd: '#0D47A1',
    primaryGradient: ['#1E88E5', '#1565C0', '#0D47A1'] as const,
    accentColor: '#FFD700',
  },
  black: {
    primary: '#1A1A2E',
    primaryLight: '#4B5563',
    primaryDark: '#0F0F1E',
    primaryGradientStart: '#16213E',
    primaryGradientEnd: '#0F0F1E',
    primaryGradient: ['#16213E', '#1A1A2E', '#0F0F1E'] as const,
    accentColor: '#FFD700',
  },
  desert: {
    primary: '#C2956B',
    primaryLight: '#DAAB86',
    primaryDark: '#9C7250',
    primaryGradientStart: '#DAAB86',
    primaryGradientEnd: '#9C7250',
    primaryGradient: ['#DAAB86', '#C2956B', '#9C7250'] as const,
    accentColor: '#065F37',
  },
};

const darkOverrides = {
  background: '#0F172A',
  backgroundSecondary: '#1E293B',
  surface: '#1E293B',
  surfaceElevated: '#293449',
  textDark: '#F1F5F9',
  textPrimary: '#F1F5F9',
  textSecondary: '#CBD5E1',
  textMuted: '#94A3B8',
  border: '#334155',
  borderLight: '#1E293B',
};

export type AppTheme = typeof baseTheme & typeof themeVariants.green;

export const getTheme = (colorKey: ThemeColorKey = 'green', darkMode = false): AppTheme => {
  const variant = themeVariants[colorKey] || themeVariants.green;
  return {
    ...baseTheme,
    ...variant,
    ...(darkMode ? darkOverrides : {}),
  } as AppTheme;
};

// Static default export - backward compatibility (green light)
export const theme = getTheme('green', false);
