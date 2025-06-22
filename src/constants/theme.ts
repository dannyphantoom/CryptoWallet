export const COLORS = {
  // Primary colors - more vibrant
  primary: '#6C63FF', // Modern purple
  primaryLight: '#8B7EFF',
  primaryDark: '#5751D4',
  
  // Background colors - more dynamic gradient colors
  background: '#1a1a2e', // Deep blue-purple
  backgroundSecondary: '#16213e', // Darker blue
  backgroundTertiary: '#0f3460', // Accent blue
  
  // Additional gradient colors for more vibrant backgrounds
  gradientStart: '#1a1a2e', // Deep blue-purple
  gradientMiddle: '#16213e', // Dark blue
  gradientEnd: '#0f3460', // Accent blue
  
  // Alternative vibrant gradients
  gradientPurple: '#667eea', // Soft purple
  gradientBlue: '#764ba2', // Deep purple-blue
  gradientCyan: '#00d2ff', // Bright cyan
  gradientPink: '#ff6b9d', // Soft pink
  
  // Text colors
  textPrimary: '#FFFFFF',
  textSecondary: '#B8BCC8',
  textTertiary: '#8B93A6',
  
  // Status colors
  success: '#00D9FF', // Cyan success
  warning: '#FFB800',
  error: '#FF5E7A',
  info: '#6C63FF',
  
  // Border colors
  border: '#2A2A3E',
  borderLight: '#3D3D56',
  
  // Card colors with subtle gradients
  cardBackground: '#1E1E30',
  cardBorder: '#2A2A3E',
  
  // Surface colors
  surface: '#1E1E30',
  
  // Button colors - more vibrant
  buttonPrimary: '#6C63FF',
  buttonSecondary: '#2A2A3E',
  buttonDisabled: '#4A4A5E',
  
  // Input colors
  inputBackground: '#1E1E30',
  inputBorder: '#2A2A3E',
  inputFocus: '#6C63FF',
  
  // Crypto specific colors
  ethereum: '#627EEA',
  bitcoin: '#F7931A',
  solana: '#14F195',
};

export const SIZES = {
  // Font sizes
  fontSizeXs: 12,
  fontSizeSm: 14,
  fontSizeMd: 16,
  fontSizeLg: 18,
  fontSizeXl: 20,
  fontSizeXxl: 24,
  fontSizeXxxl: 32,
  
  // Spacing
  spacingXs: 4,
  spacingSm: 8,
  spacingMd: 16,
  spacingLg: 24,
  spacingXl: 32,
  spacingXxl: 48,
  
  // Border radius
  radius: 8,
  radiusLg: 12,
  radiusXl: 16,
  
  // Shadows
  shadow: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
};

export const FONTS = {
  regular: {
    fontFamily: 'System',
    fontWeight: '400' as const,
  },
  medium: {
    fontFamily: 'System',
    fontWeight: '500' as const,
  },
  bold: {
    fontFamily: 'System',
    fontWeight: '700' as const,
  },
  light: {
    fontFamily: 'System',
    fontWeight: '300' as const,
  },
};

export default {
  COLORS,
  SIZES,
  FONTS,
}; 