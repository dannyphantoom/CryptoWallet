import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, SIZES, FONTS } from '../constants/theme';

interface TestDashboardProps {
  navigation: any;
}

export const TestDashboard: React.FC<TestDashboardProps> = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>CryptoWallet</Text>
      <Text style={styles.subtitle}>Test Dashboard - App is working!</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SIZES.spacingLg,
  },
  title: {
    ...FONTS.bold,
    fontSize: SIZES.fontSizeXxl,
    color: COLORS.textPrimary,
    marginBottom: SIZES.spacingMd,
  },
  subtitle: {
    ...FONTS.regular,
    fontSize: SIZES.fontSizeMd,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
}); 