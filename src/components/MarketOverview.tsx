import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SIZES } from '../constants/theme';
import { SUPPORTED_CRYPTOS } from '../constants/crypto';
import { priceService, PriceData } from '../services/priceService';
import { CryptoType } from '../types';

interface MarketOverviewProps {
  onCryptoPress?: (cryptoType: CryptoType) => void;
}

export const MarketOverview: React.FC<MarketOverviewProps> = ({ onCryptoPress }) => {
  const [prices, setPrices] = useState<Map<CryptoType, PriceData>>(new Map());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadPrices();
  }, []);

  const loadPrices = async () => {
    try {
      const cryptoTypes = SUPPORTED_CRYPTOS.map(crypto => crypto.type);
      const priceData = await priceService.getCurrentPrices(cryptoTypes);
      setPrices(priceData);
    } catch (error) {
      console.error('Failed to load market prices:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPrices();
    setRefreshing(false);
  };

  const formatPrice = (price: number): string => {
    if (price >= 1000) {
      return `$${(price / 1000).toFixed(1)}k`;
    }
    return `$${price.toFixed(2)}`;
  };

  const formatPercentage = (percentage: number): string => {
    return `${percentage >= 0 ? '+' : ''}${percentage.toFixed(2)}%`;
  };

  const getCryptoIcon = (cryptoType: CryptoType) => {
    const crypto = SUPPORTED_CRYPTOS.find(c => c.type === cryptoType);
    return crypto?.icon || '🔷';
  };

  const getCryptoName = (cryptoType: CryptoType) => {
    const crypto = SUPPORTED_CRYPTOS.find(c => c.type === cryptoType);
    return crypto?.name || cryptoType;
  };

  const getCryptoSymbol = (cryptoType: CryptoType) => {
    const crypto = SUPPORTED_CRYPTOS.find(c => c.type === cryptoType);
    return crypto?.symbol || cryptoType;
  };

  const getCryptoColor = (cryptoType: CryptoType) => {
    switch (cryptoType) {
      case CryptoType.ETHEREUM:
        return COLORS.ethereum;
      case CryptoType.BITCOIN:
        return COLORS.bitcoin;
      case CryptoType.SOLANA:
        return COLORS.solana;
      default:
        return COLORS.primary;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Market Overview</Text>
        <TouchableOpacity onPress={onRefresh} disabled={refreshing}>
          <Ionicons 
            name="refresh" 
            size={20} 
            color={refreshing ? COLORS.textTertiary : COLORS.textSecondary} 
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {SUPPORTED_CRYPTOS.map((crypto) => {
          const priceData = prices.get(crypto.type);
          const isPositive = (priceData?.price_change_percentage_24h || 0) >= 0;

          return (
            <TouchableOpacity
              key={crypto.type}
              style={[
                styles.cryptoCard,
                { borderLeftColor: getCryptoColor(crypto.type) }
              ]}
              onPress={() => onCryptoPress?.(crypto.type)}
              disabled={loading}
            >
              <View style={styles.cryptoHeader}>
                <View style={[
                  styles.cryptoIcon,
                  { backgroundColor: getCryptoColor(crypto.type) + '20' }
                ]}>
                  <Text style={styles.cryptoIconText}>{getCryptoIcon(crypto.type)}</Text>
                </View>
                <View style={styles.cryptoInfo}>
                  <Text style={styles.cryptoSymbol}>{getCryptoSymbol(crypto.type)}</Text>
                  <Text style={styles.cryptoName}>{getCryptoName(crypto.type)}</Text>
                </View>
              </View>

              <View style={styles.priceInfo}>
                {loading || !priceData ? (
                  <View style={styles.loadingContainer}>
                    <View style={styles.loadingBar} />
                    <View style={[styles.loadingBar, styles.loadingBarSmall]} />
                  </View>
                ) : (
                  <>
                    <Text style={styles.price}>
                      {formatPrice(priceData.current_price)}
                    </Text>
                    <Text style={[
                      styles.priceChange,
                      { color: isPositive ? COLORS.success : COLORS.error }
                    ]}>
                      {formatPercentage(priceData.price_change_percentage_24h)}
                    </Text>
                  </>
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: SIZES.spacingMd,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.spacingMd,
    paddingHorizontal: SIZES.spacingMd,
  },
  title: {
    fontSize: SIZES.fontSizeLg,
    color: COLORS.textPrimary,
    ...FONTS.bold,
  },
  scrollView: {
    flexGrow: 0,
  },
  scrollContent: {
    paddingHorizontal: SIZES.spacingMd,
  },
  cryptoCard: {
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: SIZES.radiusLg,
    padding: SIZES.spacingMd,
    marginRight: SIZES.spacingMd,
    minWidth: 140,
    borderLeftWidth: 3,
  },
  cryptoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.spacingMd,
  },
  cryptoIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SIZES.spacingSm,
  },
  cryptoIconText: {
    fontSize: 16,
  },
  cryptoInfo: {
    flex: 1,
  },
  cryptoSymbol: {
    fontSize: SIZES.fontSizeMd,
    color: COLORS.textPrimary,
    ...FONTS.bold,
  },
  cryptoName: {
    fontSize: SIZES.fontSizeXs,
    color: COLORS.textSecondary,
    ...FONTS.regular,
  },
  priceInfo: {
    alignItems: 'flex-start',
  },
  price: {
    fontSize: SIZES.fontSizeLg,
    color: COLORS.textPrimary,
    ...FONTS.bold,
    marginBottom: 4,
  },
  priceChange: {
    fontSize: SIZES.fontSizeSm,
    ...FONTS.medium,
  },
  loadingContainer: {
    width: '100%',
  },
  loadingBar: {
    height: 16,
    backgroundColor: COLORS.border,
    borderRadius: 8,
    marginBottom: 4,
  },
  loadingBarSmall: {
    height: 12,
    width: '60%',
  },
}); 