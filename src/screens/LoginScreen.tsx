import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { COLORS, SIZES, FONTS } from '../constants/theme';
import { authService } from '../services/authService';

interface LoginScreenProps {
  navigation: any;
  onLoginSuccess?: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ navigation, onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {};

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!password.trim()) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      await authService.login(email, password);
      onLoginSuccess?.();
    } catch (error) {
      Alert.alert('Login Failed', error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email address first');
      return;
    }

    Alert.alert(
      'Reset Password',
      'A new password will be generated and logged to the console for demo purposes.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          onPress: async () => {
            try {
              await authService.resetPassword(email);
              Alert.alert('Success', 'Password reset successful. Check console for new password.');
            } catch (error) {
              Alert.alert('Error', error instanceof Error ? error.message : 'Failed to reset password');
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={[COLORS.gradientStart, COLORS.gradientMiddle, COLORS.gradientEnd]}
        locations={[0, 0.5, 1]}
        style={styles.gradient}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoidingView}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.header}>
              <View style={styles.logoContainer}>
                <Ionicons name="wallet" size={60} color={COLORS.primary} />
              </View>
              <Text style={styles.title}>CryptoWallet</Text>
              <Text style={styles.subtitle}>Secure • Fast • Reliable</Text>
            </View>

            <View style={styles.form}>
              <Input
                label="Email"
                placeholder="Enter your email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                error={errors.email}
                rightIcon="mail"
              />

              <Input
                label="Password"
                placeholder="Enter your password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                error={errors.password}
                rightIcon="lock-closed"
              />

              <Button
                title="Sign In"
                onPress={handleLogin}
                loading={loading}
                style={styles.loginButton}
              />

              <Button
                title="Forgot Password?"
                onPress={handleForgotPassword}
                variant="outline"
                size="small"
                style={styles.forgotButton}
              />
            </View>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Don't have an account?</Text>
              <Button
                title="Create Account"
                onPress={() => {
                  console.log('Create Account button pressed');
                  console.log('Navigation object:', navigation);
                  navigation?.navigate('Register');
                }}
                variant="outline"
                size="small"
                style={styles.registerButton}
              />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: SIZES.spacingLg,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: SIZES.spacingXxl,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SIZES.spacingLg,
  },
  title: {
    ...FONTS.bold,
    fontSize: SIZES.fontSizeXxl,
    color: COLORS.textPrimary,
    marginBottom: SIZES.spacingSm,
  },
  subtitle: {
    ...FONTS.regular,
    fontSize: SIZES.fontSizeMd,
    color: COLORS.textSecondary,
  },
  form: {
    marginBottom: SIZES.spacingXl,
  },
  loginButton: {
    marginTop: SIZES.spacingLg,
  },
  forgotButton: {
    marginTop: SIZES.spacingMd,
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    ...FONTS.regular,
    color: COLORS.textSecondary,
    marginBottom: SIZES.spacingMd,
  },
  registerButton: {
    minWidth: 150,
  },
}); 