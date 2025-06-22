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

interface RegisterScreenProps {
  navigation: any;
  onRegisterSuccess?: () => void;
}

export const RegisterScreen: React.FC<RegisterScreenProps> = ({ navigation, onRegisterSuccess }) => {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{
    email?: string;
    username?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

  const validateForm = () => {
    const newErrors: {
      email?: string;
      username?: string;
      password?: string;
      confirmPassword?: string;
    } = {};

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!username.trim()) {
      newErrors.username = 'Username is required';
    } else if (username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    } else if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      newErrors.username = 'Username can only contain letters, numbers, and underscores';
    }

    if (!password.trim()) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (!confirmPassword.trim()) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      await authService.register(email, username, password);
      onRegisterSuccess?.();
      
      setTimeout(() => {
        Alert.alert(
          'Welcome!',
          'Your account has been created successfully and you are now logged in!',
          [{ text: 'OK' }]
        );
      }, 500);
    } catch (error) {
      Alert.alert('Registration Failed', error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
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
              <Text style={styles.title}>Create Account</Text>
              <Text style={styles.subtitle}>Join the future of digital finance</Text>
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
                label="Username"
                placeholder="Choose a username"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                error={errors.username}
                rightIcon="person"
              />

              <Input
                label="Password"
                placeholder="Create a password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                error={errors.password}
                rightIcon="lock-closed"
              />

              <Input
                label="Confirm Password"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                error={errors.confirmPassword}
                rightIcon="lock-closed"
              />

              <Button
                title="Create Account"
                onPress={handleRegister}
                loading={loading}
                style={styles.registerButton}
              />
            </View>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Already have an account?</Text>
              <Button
                title="Sign In"
                onPress={() => navigation.navigate('Login')}
                variant="outline"
                size="small"
                style={styles.loginButton}
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
    marginBottom: SIZES.spacingXl,
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
  registerButton: {
    marginTop: SIZES.spacingLg,
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    ...FONTS.regular,
    color: COLORS.textSecondary,
    marginBottom: SIZES.spacingMd,
  },
  loginButton: {
    minWidth: 150,
  },
}); 