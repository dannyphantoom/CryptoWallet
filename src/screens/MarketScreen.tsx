import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { PriceChart } from '../components/PriceChart';
import { MarketOverview } from '../components/MarketOverview';
import { COLORS, SIZES, FONTS } from '../constants/theme';
import { SUPPORTED_CRYPTOS } from '../constants/crypto';
import { CryptoType } from '../types';

interface MarketScreenProps {
  navigation: any;
}

export const MarketScreen: React.FC<MarketScreenProps> = ({ navigation }) => {
  const handleCryptoPress = (cryptoType: CryptoType) => {
    // Navigate to detailed crypto view or wallet detail
    console.log(`Selected ${cryptoType}`);
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={[COLORS.background, COLORS.backgroundSecondary]}
        style={styles.gradient}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Market</Text>
          <Text style={styles.subtitle}>Real-time cryptocurrency prices</Text>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Market Overview */}
          <MarketOverview onCryptoPress={handleCryptoPress} />

          {/* Individual Price Charts */}
          <View style={styles.chartsSection}>
            <Text style={styles.sectionTitle}>Price Charts</Text>
            
            {SUPPORTED_CRYPTOS.map((crypto) => (
              <View key={crypto.type} style={styles.chartSection}>
                <View style={styles.chartHeader}>
                  <View style={styles.cryptoInfo}>
                    <Text style={styles.cryptoIcon}>{crypto.icon}</Text>
                    <View style={styles.cryptoDetails}>
                      <Text style={styles.cryptoName}>{crypto.name}</Text>
                      <Text style={styles.cryptoSymbol}>{crypto.symbol}</Text>
                    </View>
                  </View>
                </View>
                
                <PriceChart
                  cryptoType={crypto.type}
                  height={200}
                  showTimeControls={false}
                />
              </View>
            ))}
          </View>
        </ScrollView>
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
  header: {
    paddingHorizontal: SIZES.spacingLg,
    paddingTop: SIZES.spacingMd,
    paddingBottom: SIZES.spacingLg,
  },
  title: {
    fontSize: SIZES.fontSizeXxxl,
    color: COLORS.textPrimary,
    ...FONTS.bold,
    marginBottom: SIZES.spacingXs,
  },
  subtitle: {
    fontSize: SIZES.fontSizeMd,
    color: COLORS.textSecondary,
    ...FONTS.regular,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: SIZES.spacingXxl,
  },
  chartsSection: {
    paddingHorizontal: SIZES.spacingLg,
  },
  sectionTitle: {
    fontSize: SIZES.fontSizeLg,
    color: COLORS.textPrimary,
    ...FONTS.bold,
    marginBottom: SIZES.spacingMd,
  },
  chartSection: {
    marginBottom: SIZES.spacingXl,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.spacingMd,
  },
  cryptoInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cryptoIcon: {
    fontSize: 24,
    marginRight: SIZES.spacingMd,
  },
  cryptoDetails: {
    flex: 1,
  },
  cryptoName: {
    fontSize: SIZES.fontSizeLg,
    color: COLORS.textPrimary,
    ...FONTS.bold,
  },
  cryptoSymbol: {
    fontSize: SIZES.fontSizeSm,
    color: COLORS.textSecondary,
    ...FONTS.regular,
  },
}); 