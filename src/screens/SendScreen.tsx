import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
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
import { authService } from '../services/authService';
import { Wallet, CryptoType } from '../types';

interface SendScreenProps {
  navigation: any;
  route?: any;
}

export const SendScreen: React.FC<SendScreenProps> = ({ navigation, route }) => {
  const [selectedWallet, setSelectedWallet] = useState<Wallet | null>(null);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [recipientAddress, setRecipientAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ address?: string; amount?: string }>({});

  const currentUser = authService.getCurrentUser();

  useEffect(() => {
    loadWallets();
    if (route?.params?.walletId) {
      const wallet = walletService.getWallet(route.params.walletId);
      if (wallet) {
        setSelectedWallet(wallet);
      }
    }
  }, [route?.params?.walletId]);

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
      if (!selectedWallet && userWallets.length > 0) {
        setSelectedWallet(userWallets[0]);
      }
    } catch (error) {
      console.error('Failed to load wallets:', error);
      Alert.alert('Error', 'Failed to load wallets');
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

  const validateForm = () => {
    const newErrors: { address?: string; amount?: string } = {};

    if (!recipientAddress.trim()) {
      newErrors.address = 'Recipient address is required';
    } else if (recipientAddress.length < 20) {
      newErrors.address = 'Please enter a valid wallet address';
    }

    if (!amount.trim()) {
      newErrors.amount = 'Amount is required';
    } else if (isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      newErrors.amount = 'Please enter a valid amount';
    } else if (selectedWallet && parseFloat(amount) > selectedWallet.balance) {
      newErrors.amount = 'Insufficient balance';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSend = async () => {
    if (!validateForm() || !selectedWallet) return;

    setLoading(true);
    try {
      const result = await walletService.sendTransaction(
        selectedWallet.id,
        recipientAddress,
        parseFloat(amount)
      );

      Alert.alert(
        'Transaction Sent',
        `Successfully sent ${amount} ${getCryptoSymbol(selectedWallet.type)} to ${recipientAddress.substring(0, 10)}...`,
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      Alert.alert('Transaction Failed', error instanceof Error ? error.message : 'Failed to send transaction');
    } finally {
      setLoading(false);
    }
  };

  const formatBalance = (balance: number) => {
    return balance.toFixed(6);
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={[COLORS.background, COLORS.backgroundSecondary]}
        style={styles.gradient}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.title}>Send Crypto</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Wallet Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Select Wallet</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.walletScroll}
            >
              {wallets.map((wallet) => (
                <TouchableOpacity
                  key={wallet.id}
                  onPress={() => setSelectedWallet(wallet)}
                  style={[
                    styles.walletOption,
                    selectedWallet?.id === wallet.id && styles.walletOptionSelected,
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
          </View>

          {/* Transaction Form */}
          <View style={styles.section}>
            <Input
              label="Recipient Address"
              placeholder="Enter wallet address"
              value={recipientAddress}
              onChangeText={setRecipientAddress}
              error={errors.address}
              rightIcon="copy-outline"
              onRightIconPress={() => {
                // TODO: Implement paste from clipboard
                Alert.alert('Feature', 'Paste from clipboard feature will be implemented');
              }}
            />

            <Input
              label="Amount"
              placeholder="0.00"
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
              error={errors.amount}
            />
            {selectedWallet && (
              <Text style={styles.currencyHint}>
                Currency: {getCryptoSymbol(selectedWallet.type)}
              </Text>
            )}

            {selectedWallet && (
              <View style={styles.balanceInfo}>
                <Text style={styles.balanceText}>
                  Available: {formatBalance(selectedWallet.balance || 0)} {getCryptoSymbol(selectedWallet.type)}
                </Text>
                <TouchableOpacity
                  onPress={() => setAmount((selectedWallet.balance || 0).toString())}
                  style={styles.maxButton}
                >
                  <Text style={styles.maxButtonText}>MAX</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Transaction Summary */}
          {selectedWallet && amount && recipientAddress && (
            <Card style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Transaction Summary</Text>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>From:</Text>
                <Text style={styles.summaryValue}>{selectedWallet.name}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>To:</Text>
                <Text style={styles.summaryValue}>
                  {recipientAddress.substring(0, 10)}...{recipientAddress.substring(recipientAddress.length - 10)}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Amount:</Text>
                <Text style={styles.summaryValue}>
                  {amount} {getCryptoSymbol(selectedWallet.type)}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Fee:</Text>
                <Text style={styles.summaryValue}>0.001 {getCryptoSymbol(selectedWallet.type)}</Text>
              </View>
            </Card>
          )}

          {/* Send Button */}
          <Button
            title="Send Transaction"
            onPress={handleSend}
            loading={loading}
            disabled={!selectedWallet || !amount || !recipientAddress}
            style={styles.sendButton}
          />
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SIZES.spacingLg,
    paddingTop: SIZES.spacingMd,
    paddingBottom: SIZES.spacingLg,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...FONTS.bold,
    fontSize: SIZES.fontSizeLg,
    color: COLORS.textPrimary,
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SIZES.spacingLg,
  },
  section: {
    marginBottom: SIZES.spacingXl,
  },
  sectionTitle: {
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
    minWidth: 120,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  walletOptionSelected: {
    borderColor: COLORS.primary,
  },
  walletIcon: {
    fontSize: 24,
    marginBottom: SIZES.spacingSm,
  },
  walletName: {
    ...FONTS.medium,
    fontSize: SIZES.fontSizeSm,
    color: COLORS.textPrimary,
    marginBottom: SIZES.spacingXs,
  },
  walletBalance: {
    ...FONTS.regular,
    fontSize: SIZES.fontSizeXs,
    color: COLORS.textSecondary,
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
  sendButton: {
    marginTop: SIZES.spacingLg,
  },
  currencyHint: {
    ...FONTS.regular,
    fontSize: SIZES.fontSizeSm,
    color: COLORS.textSecondary,
    marginTop: SIZES.spacingXs,
  },
}); 