import React from 'react';
import {
  View,
  StyleSheet,
  ViewStyle,
  TouchableOpacity,
} from 'react-native';
import { COLORS, SIZES } from '../constants/theme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
  disabled?: boolean;
  variant?: 'default' | 'elevated' | 'outlined';
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  onPress,
  disabled = false,
  variant = 'default',
}) => {
  const cardStyle = [
    styles.card,
    styles[variant],
    disabled && styles.disabled,
    style,
  ];

  if (onPress) {
    return (
      <TouchableOpacity
        style={cardStyle}
        onPress={onPress}
        disabled={disabled}
        activeOpacity={0.8}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={cardStyle}>{children}</View>;
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: SIZES.radiusLg,
    padding: SIZES.spacingMd,
    marginBottom: SIZES.spacingMd,
  },
  default: {
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  elevated: {
    ...SIZES.shadow,
    borderWidth: 0,
  },
  outlined: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  disabled: {
    opacity: 0.6,
  },
}); 