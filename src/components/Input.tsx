import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, FONTS } from '../constants/theme';

interface InputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  autoCorrect?: boolean;
  multiline?: boolean;
  numberOfLines?: number;
  error?: string;
  disabled?: boolean;
  style?: ViewStyle;
  inputStyle?: TextStyle;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightIconPress?: () => void;
  maxLength?: number;
}

export const Input: React.FC<InputProps> = ({
  label,
  placeholder,
  value,
  onChangeText,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'none',
  autoCorrect = false,
  multiline = false,
  numberOfLines = 1,
  error,
  disabled = false,
  style,
  inputStyle,
  rightIcon,
  onRightIconPress,
  maxLength,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleFocus = () => setIsFocused(true);
  const handleBlur = () => setIsFocused(false);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const containerStyle = [
    styles.container,
    isFocused && styles.focused,
    error && styles.error,
    disabled && styles.disabled,
    style,
  ];

  const inputContainerStyle = [
    styles.inputContainer,
    isFocused && styles.inputContainerFocused,
    error && styles.inputContainerError,
    disabled && styles.inputContainerDisabled,
  ];

  const inputTextStyle = [
    styles.input,
    multiline && styles.inputMultiline,
    disabled && styles.inputDisabled,
    inputStyle,
  ];

  return (
    <View style={containerStyle}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={inputContainerStyle}>
        <TextInput
          style={inputTextStyle}
          placeholder={placeholder}
          placeholderTextColor={COLORS.textTertiary}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry && !showPassword}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={autoCorrect}
          multiline={multiline}
          numberOfLines={numberOfLines}
          editable={!disabled}
          onFocus={handleFocus}
          onBlur={handleBlur}
          maxLength={maxLength}
        />
        <View style={styles.rightContainer}>
          {secureTextEntry && (
            <TouchableOpacity
              style={styles.iconButton}
              onPress={togglePasswordVisibility}
            >
              <Ionicons
                name={showPassword ? 'eye-off' : 'eye'}
                size={20}
                color={COLORS.textSecondary}
              />
            </TouchableOpacity>
          )}
          {rightIcon && (
            <TouchableOpacity
              style={styles.iconButton}
              onPress={onRightIconPress}
            >
              <Ionicons
                name={rightIcon}
                size={20}
                color={COLORS.textSecondary}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: SIZES.spacingMd,
  },
  label: {
    ...FONTS.medium,
    color: COLORS.textPrimary,
    marginBottom: SIZES.spacingXs,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.inputBackground,
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
    borderRadius: SIZES.radius,
    paddingHorizontal: SIZES.spacingMd,
  },
  inputContainerFocused: {
    borderColor: COLORS.inputFocus,
  },
  inputContainerError: {
    borderColor: COLORS.error,
  },
  inputContainerDisabled: {
    backgroundColor: COLORS.backgroundTertiary,
    opacity: 0.6,
  },
  input: {
    flex: 1,
    ...FONTS.regular,
    color: COLORS.textPrimary,
    paddingVertical: SIZES.spacingMd,
    fontSize: SIZES.fontSizeMd,
  },
  inputMultiline: {
    textAlignVertical: 'top',
    minHeight: 80,
  },
  inputDisabled: {
    color: COLORS.textTertiary,
  },
  rightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    padding: SIZES.spacingXs,
    marginLeft: SIZES.spacingXs,
  },
  errorText: {
    ...FONTS.regular,
    color: COLORS.error,
    fontSize: SIZES.fontSizeSm,
    marginTop: SIZES.spacingXs,
  },
  focused: {},
  error: {},
  disabled: {},
}); 