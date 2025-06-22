import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { COLORS, SIZES, FONTS } from '../constants/theme';
import { SUPPORTED_CRYPTOS } from '../constants/crypto';
import { walletService } from '../services/walletService';
import { swapService } from '../services/swapService';
import { authService } from '../services/authService';
import { Wallet, CryptoType } from '../types';

interface SwapScreenProps {
  navigation: any;
}

export const SwapScreen: React.FC<SwapScreenProps> = ({ navigation }) => {
  const [fromWallet, setFromWallet] = useState<Wallet | null>(null);
  const [toWallet, setToWallet] = useState<Wallet | null>(null);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('');
  const [exchangeRate, setExchangeRate] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingRate, setLoadingRate] = useState(false);
  const [errors, setErrors] = useState<{ from?: string; to?: string }>({});

  const currentUser = authService.getCurrentUser();

  useEffect(() => {
    loadWallets();
  }, []);

  useEffect(() => {
    if (fromWallet && toWallet && fromAmount) {
      calculateExchangeRate();
    } else {
      setToAmount('');
      setExchangeRate(0);
    }
  }, [fromWallet, toWallet, fromAmount]);

  const loadWallets = async () => {
    if (!currentUser) return;

    try {
      const userWallets = walletService.getWalletsByUserId(currentUser.id);
      
      // Load balances for each wallet
      for (const wallet of userWallets) {
        try {
          const balance = await walletService.getBalance(wallet.id);
          wallet.balance = balance;
        } catch (error) {
          console.error(`Failed to get balance for wallet ${wallet.id}:`, error);
        }
      }
      
      setWallets(userWallets);
      if (userWallets.length > 0) {
        setFromWallet(userWallets[0]);
        if (userWallets.length > 1) {
          setToWallet(userWallets[1]);
        }
      }
    } catch (error) {
      console.error('Failed to load wallets:', error);
      Alert.alert('Error', 'Failed to load wallets');
    }
  };

  const calculateExchangeRate = async () => {
    if (!fromWallet || !toWallet || !fromAmount) return;

    setLoadingRate(true);
    try {
      const rate = await swapService.getExchangeRate(fromWallet.type, toWallet.type);
      setExchangeRate(rate);
      
      const calculatedToAmount = parseFloat(fromAmount) * rate;
      setToAmount(calculatedToAmount.toFixed(6));
    } catch (error) {
      console.error('Failed to get exchange rate:', error);
      setExchangeRate(0);
      setToAmount('');
    } finally {
      setLoadingRate(false);
    }
  };

  const getCryptoIcon = (cryptoType: CryptoType) => {
    const crypto = SUPPORTED_CRYPTOS.find(c => c.type === cryptoType);
    return crypto?.icon || '🔷';
  };

  const getCryptoSymbol = (cryptoType: CryptoType) => {
    const crypto = SUPPORTED_CRYPTOS.find(c => c.type === cryptoType);
    return crypto?.symbol || cryptoType;
  };

  const formatBalance = (balance: number) => {
    return balance.toFixed(6);
  };

  const validateForm = () => {
    const newErrors: { from?: string; to?: string } = {};

    if (!fromWallet) {
      newErrors.from = 'Please select a source wallet';
    }

    if (!toWallet) {
      newErrors.to = 'Please select a destination wallet';
    }

    if (fromWallet && toWallet && fromWallet.id === toWallet.id) {
      newErrors.from = 'Source and destination must be different';
      newErrors.to = 'Source and destination must be different';
    }

    if (!fromAmount.trim()) {
      newErrors.from = 'Amount is required';
    } else if (isNaN(parseFloat(fromAmount)) || parseFloat(fromAmount) <= 0) {
      newErrors.from = 'Please enter a valid amount';
    } else if (fromWallet && parseFloat(fromAmount) > fromWallet.balance) {
      newErrors.from = 'Insufficient balance';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSwap = async () => {
    if (!validateForm() || !fromWallet || !toWallet) return;

    setLoading(true);
    try {
      const result = await swapService.executeSwap(
        fromWallet.id,
        toWallet.id,
        parseFloat(fromAmount),
        parseFloat(toAmount)
      );

      Alert.alert(
        'Swap Successful',
        `Successfully swapped ${fromAmount} ${getCryptoSymbol(fromWallet.type)} for ${toAmount} ${getCryptoSymbol(toWallet.type)}`,
        [
          {
            text: 'OK',
            onPress: () => {
              setFromAmount('');
              setToAmount('');
              loadWallets();
            },
          },
        ]
      );
    } catch (error) {
      Alert.alert('Swap Failed', error instanceof Error ? error.message : 'Failed to execute swap');
    } finally {
      setLoading(false);
    }
  };

  const handleSwapDirection = () => {
    const tempWallet = fromWallet;
    setFromWallet(toWallet);
    setToWallet(tempWallet);
    setFromAmount(toAmount);
    setToAmount('');
  };

  const getAvailableToWallets = () => {
    return wallets.filter(wallet => wallet.id !== fromWallet?.id);
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={[COLORS.background, COLORS.backgroundSecondary]}
        style={styles.gradient}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Swap Crypto</Text>
            <Text style={styles.subtitle}>Exchange between your cryptocurrencies</Text>
          </View>

          {/* From Section */}
          <Card style={styles.swapCard}>
            <View style={styles.swapSection}>
              <Text style={styles.sectionLabel}>From</Text>
              
              {/* From Wallet Selection */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.walletScroll}
              >
                {wallets.map((wallet) => (
                  <TouchableOpacity
                    key={wallet.id}
                    onPress={() => setFromWallet(wallet)}
                    style={[
                      styles.walletOption,
                      fromWallet?.id === wallet.id && styles.walletOptionSelected,
                    ]}
                  >
                    <Text style={styles.walletIcon}>{getCryptoIcon(wallet.type)}</Text>
                    <Text style={styles.walletName}>{wallet.name}</Text>
                    <Text style={styles.walletBalance}>
                      {formatBalance(wallet.balance || 0)} {getCryptoSymbol(wallet.type)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* From Amount Input */}
              <Input
                placeholder="0.00"
                value={fromAmount}
                onChangeText={setFromAmount}
                keyboardType="numeric"
                error={errors.from}
              />

              {fromWallet && (
                <View style={styles.balanceInfo}>
                  <Text style={styles.balanceText}>
                    Available: {formatBalance(fromWallet.balance || 0)} {getCryptoSymbol(fromWallet.type)}
                  </Text>
                  <TouchableOpacity
                    onPress={() => setFromAmount((fromWallet.balance || 0).toString())}
                    style={styles.maxButton}
                  >
                    <Text style={styles.maxButtonText}>MAX</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </Card>

          {/* Swap Direction Button */}
          <View style={styles.swapDirectionContainer}>
            <TouchableOpacity
              onPress={handleSwapDirection}
              style={styles.swapDirectionButton}
              disabled={!fromWallet || !toWallet}
            >
              <Ionicons name="swap-vertical" size={24} color={COLORS.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* To Section */}
          <Card style={styles.swapCard}>
            <View style={styles.swapSection}>
              <Text style={styles.sectionLabel}>To</Text>
              
              {/* To Wallet Selection */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.walletScroll}
              >
                {getAvailableToWallets().map((wallet) => (
                  <TouchableOpacity
                    key={wallet.id}
                    onPress={() => setToWallet(wallet)}
                    style={[
                      styles.walletOption,
                      toWallet?.id === wallet.id && styles.walletOptionSelected,
                    ]}
                  >
                    <Text style={styles.walletIcon}>{getCryptoIcon(wallet.type)}</Text>
                    <Text style={styles.walletName}>{wallet.name}</Text>
                    <Text style={styles.walletBalance}>
                      {formatBalance(wallet.balance || 0)} {getCryptoSymbol(wallet.type)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* To Amount Display */}
              <View style={styles.toAmountContainer}>
                <Text style={styles.toAmountLabel}>You will receive</Text>
                <Text style={styles.toAmount}>
                  {loadingRate ? 'Calculating...' : toAmount || '0.00'}
                  {toWallet && ` ${getCryptoSymbol(toWallet.type)}`}
                </Text>
              </View>
            </View>
          </Card>

          {/* Exchange Rate Info */}
          {fromWallet && toWallet && exchangeRate > 0 && (
            <Card style={styles.rateCard}>
              <Text style={styles.rateTitle}>Exchange Rate</Text>
              <Text style={styles.rateText}>
                1 {getCryptoSymbol(fromWallet.type)} = {exchangeRate.toFixed(6)} {getCryptoSymbol(toWallet.type)}
              </Text>
              <View style={styles.feeInfo}>
                <Text style={styles.feeLabel}>Swap Fee:</Text>
                <Text style={styles.feeValue}>0.5%</Text>
              </View>
            </Card>
          )}

          {/* Swap Summary */}
          {fromWallet && toWallet && fromAmount && toAmount && (
            <Card style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Swap Summary</Text>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>From:</Text>
                <Text style={styles.summaryValue}>
                  {fromAmount} {getCryptoSymbol(fromWallet.type)}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>To:</Text>
                <Text style={styles.summaryValue}>
                  {toAmount} {getCryptoSymbol(toWallet.type)}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Rate:</Text>
                <Text style={styles.summaryValue}>
                  1:{exchangeRate.toFixed(4)}
                </Text>
              </View>
            </Card>
          )}

          {/* Swap Button */}
          <Button
            title="Execute Swap"
            onPress={handleSwap}
            loading={loading}
            disabled={!fromWallet || !toWallet || !fromAmount || !toAmount || loadingRate}
            style={styles.swapButton}
          />

          {wallets.length < 2 && (
            <Card style={styles.emptyCard}>
              <Ionicons name="swap-horizontal-outline" size={48} color={COLORS.textTertiary} />
              <Text style={styles.emptyText}>Need more wallets</Text>
              <Text style={styles.emptySubtext}>
                Create at least 2 wallets to start swapping
              </Text>
              <Button
                title="Create Wallet"
                onPress={() => navigation.navigate('CreateWallet')}
                style={styles.createWalletButton}
              />
            </Card>
          )}
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SIZES.spacingLg,
  },
  header: {
    alignItems: 'center',
    marginBottom: SIZES.spacingXl,
  },
  title: {
    ...FONTS.bold,
    fontSize: SIZES.fontSizeXxl,
    color: COLORS.textPrimary,
    marginBottom: SIZES.spacingSm,
  },
  subtitle: {
    ...FONTS.regular,
    fontSize: SIZES.fontSizeSm,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  swapCard: {
    marginBottom: SIZES.spacingMd,
  },
  swapSection: {
    // padding already handled by Card component
  },
  sectionLabel: {
    ...FONTS.medium,
    fontSize: SIZES.fontSizeMd,
    color: COLORS.textPrimary,
    marginBottom: SIZES.spacingMd,
  },
  walletScroll: {
    marginBottom: SIZES.spacingMd,
  },
  walletOption: {
    backgroundColor: COLORS.backgroundSecondary,
    padding: SIZES.spacingMd,
    borderRadius: SIZES.radius,
    marginRight: SIZES.spacingMd,
    alignItems: 'center',
    minWidth: 100,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  walletOptionSelected: {
    borderColor: COLORS.primary,
  },
  walletIcon: {
    fontSize: 20,
    marginBottom: SIZES.spacingXs,
  },
  walletName: {
    ...FONTS.medium,
    fontSize: SIZES.fontSizeXs,
    color: COLORS.textPrimary,
    marginBottom: SIZES.spacingXs,
  },
  walletBalance: {
    ...FONTS.regular,
    fontSize: 10,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  balanceInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SIZES.spacingSm,
  },
  balanceText: {
    ...FONTS.regular,
    fontSize: SIZES.fontSizeSm,
    color: COLORS.textSecondary,
  },
  maxButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SIZES.spacingMd,
    paddingVertical: SIZES.spacingXs,
    borderRadius: SIZES.radius,
  },
  maxButtonText: {
    ...FONTS.medium,
    fontSize: SIZES.fontSizeXs,
    color: COLORS.textPrimary,
  },
  swapDirectionContainer: {
    alignItems: 'center',
    marginVertical: SIZES.spacingSm,
  },
  swapDirectionButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toAmountContainer: {
    backgroundColor: COLORS.backgroundTertiary,
    padding: SIZES.spacingMd,
    borderRadius: SIZES.radius,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  toAmountLabel: {
    ...FONTS.regular,
    fontSize: SIZES.fontSizeSm,
    color: COLORS.textSecondary,
    marginBottom: SIZES.spacingSm,
  },
  toAmount: {
    ...FONTS.bold,
    fontSize: SIZES.fontSizeLg,
    color: COLORS.textPrimary,
  },
  rateCard: {
    marginBottom: SIZES.spacingLg,
    backgroundColor: COLORS.backgroundTertiary,
  },
  rateTitle: {
    ...FONTS.medium,
    fontSize: SIZES.fontSizeMd,
    color: COLORS.textPrimary,
    marginBottom: SIZES.spacingSm,
  },
  rateText: {
    ...FONTS.regular,
    fontSize: SIZES.fontSizeSm,
    color: COLORS.textSecondary,
    marginBottom: SIZES.spacingMd,
  },
  feeInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  feeLabel: {
    ...FONTS.regular,
    fontSize: SIZES.fontSizeSm,
    color: COLORS.textSecondary,
  },
  feeValue: {
    ...FONTS.medium,
    fontSize: SIZES.fontSizeSm,
    color: COLORS.warning,
  },
  summaryCard: {
    marginBottom: SIZES.spacingLg,
  },
  summaryTitle: {
    ...FONTS.medium,
    fontSize: SIZES.fontSizeMd,
    color: COLORS.textPrimary,
    marginBottom: SIZES.spacingMd,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.spacingSm,
  },
  summaryLabel: {
    ...FONTS.regular,
    fontSize: SIZES.fontSizeSm,
    color: COLORS.textSecondary,
  },
  summaryValue: {
    ...FONTS.medium,
    fontSize: SIZES.fontSizeSm,
    color: COLORS.textPrimary,
  },
  swapButton: {
    marginBottom: SIZES.spacingLg,
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: SIZES.spacingXxl,
  },
  emptyText: {
    ...FONTS.medium,
    fontSize: SIZES.fontSizeLg,
    color: COLORS.textSecondary,
    marginTop: SIZES.spacingMd,
    marginBottom: SIZES.spacingSm,
  },
  emptySubtext: {
    ...FONTS.regular,
    fontSize: SIZES.fontSizeSm,
    color: COLORS.textTertiary,
    textAlign: 'center',
    marginBottom: SIZES.spacingLg,
  },
  createWalletButton: {
    marginTop: SIZES.spacingMd,
  },
}); 