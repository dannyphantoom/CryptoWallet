import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
} from 'react-native';
import { COLORS, SIZES, FONTS } from '../constants/theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  style,
  textStyle,
}) => {
  const buttonStyle = [
    styles.button,
    styles[variant],
    styles[size],
    disabled && styles.disabled,
    style,
  ];

  const textStyleArray = [
    styles.text,
    styles[`${variant}Text`],
    styles[`${size}Text`],
    disabled && styles.disabledText,
    textStyle,
  ];

  return (
    <TouchableOpacity
      style={buttonStyle}
      onPress={() => {
        console.log(`Button "${title}" pressed`);
        onPress();
      }}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'primary' ? COLORS.textPrimary : COLORS.primary}
          size="small"
        />
      ) : (
        <Text style={textStyleArray}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: SIZES.radius,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  
  // Variants
  primary: {
    backgroundColor: COLORS.buttonPrimary,
  },
  secondary: {
    backgroundColor: COLORS.buttonSecondary,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  
  // Sizes
  small: {
    paddingHorizontal: SIZES.spacingMd,
    paddingVertical: SIZES.spacingSm,
    minHeight: 36,
  },
  medium: {
    paddingHorizontal: SIZES.spacingLg,
    paddingVertical: SIZES.spacingMd,
    minHeight: 48,
  },
  large: {
    paddingHorizontal: SIZES.spacingXl,
    paddingVertical: SIZES.spacingLg,
    minHeight: 56,
  },
  
  // Text styles
  text: {
    ...FONTS.medium,
    textAlign: 'center',
  },
  primaryText: {
    color: COLORS.textPrimary,
  },
  secondaryText: {
    color: COLORS.textPrimary,
  },
  outlineText: {
    color: COLORS.primary,
  },
  smallText: {
    fontSize: SIZES.fontSizeSm,
  },
  mediumText: {
    fontSize: SIZES.fontSizeMd,
  },
  largeText: {
    fontSize: SIZES.fontSizeLg,
  },
  
  // Disabled state
  disabled: {
    backgroundColor: COLORS.buttonDisabled,
    opacity: 0.6,
  },
  disabledText: {
    color: COLORS.textTertiary,
  },
}); 