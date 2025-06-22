import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { COLORS, SIZES, FONTS } from '../constants/theme';
import { SUPPORTED_CRYPTOS } from '../constants/crypto';
import { walletService } from '../services/walletService';
import { Wallet, CryptoType } from '../types';

interface WalletDetailScreenProps {
  navigation: any;
  route: {
    params: {
      walletId: string;
    };
  };
}

export const WalletDetailScreen: React.FC<WalletDetailScreenProps> = ({ navigation, route }) => {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const { walletId } = route.params;

  useEffect(() => {
    loadWallet();
  }, [walletId]);

  const loadWallet = async () => {
    try {
      const walletData = walletService.getWallet(walletId);
      if (walletData) {
        // Load current balance
        const balance = await walletService.getBalance(walletData.id);
        walletData.balance = balance;
        setWallet(walletData);
      } else {
        Alert.alert('Error', 'Wallet not found');
        navigation.goBack();
      }
    } catch (error) {
      console.error('Failed to load wallet:', error);
      Alert.alert('Error', 'Failed to load wallet details');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadWallet();
    setRefreshing(false);
  };

  const getCryptoIcon = (cryptoType: CryptoType) => {
    const crypto = SUPPORTED_CRYPTOS.find(c => c.type === cryptoType);
    return crypto?.icon || '🔷';
  };

  const getCryptoSymbol = (cryptoType: CryptoType) => {
    const crypto = SUPPORTED_CRYPTOS.find(c => c.type === cryptoType);
    return crypto?.symbol || cryptoType;
  };

  const getCryptoColor = (cryptoType: CryptoType) => {
    const crypto = SUPPORTED_CRYPTOS.find(c => c.type === cryptoType);
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

  const handleCopyAddress = async () => {
    if (!wallet) return;

    try {
      await Clipboard.setStringAsync(wallet.address);
      Alert.alert('Copied!', 'Wallet address copied to clipboard');
    } catch (error) {
      Alert.alert('Error', 'Failed to copy address');
    }
  };

  const formatBalance = (balance: number) => {
    return balance.toFixed(6);
  };

  const formatAddress = (address: string) => {
    if (address.length <= 30) return address;
    return `${address.substring(0, 15)}...${address.substring(address.length - 15)}`;
  };

  const formatDate = (date: Date) => {
    return date.toLocaleString();
  };

  const calculateUSDValue = (balance: number, cryptoType: CryptoType) => {
    // Mock exchange rates for demo
    const rates = {
      [CryptoType.ETHEREUM]: 2000,
      [CryptoType.BITCOIN]: 45000,
      [CryptoType.SOLANA]: 80,
    };
    
    const rate = rates[cryptoType] || 0;
    return (balance * rate).toFixed(2);
  };

  if (loading || !wallet) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient
          colors={[COLORS.background, COLORS.backgroundSecondary]}
          style={styles.gradient}
        >
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading wallet...</Text>
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

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
          <Text style={styles.title}>Wallet Details</Text>
          <TouchableOpacity
            onPress={() => Alert.alert('Feature', 'Settings coming soon')}
            style={styles.settingsButton}
          >
            <Ionicons name="settings-outline" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
        >
          {/* Wallet Overview Card */}
          <Card style={[styles.overviewCard, { borderColor: getCryptoColor(wallet.type) }]}>
            <View style={styles.walletHeader}>
              <View style={[styles.cryptoIcon, { backgroundColor: getCryptoColor(wallet.type) + '20' }]}>
                <Text style={styles.cryptoIconText}>{getCryptoIcon(wallet.type)}</Text>
              </View>
              <View style={styles.walletInfo}>
                <Text style={styles.walletName}>{wallet.name}</Text>
                <Text style={styles.cryptoType}>{getCryptoSymbol(wallet.type)} Wallet</Text>
              </View>
            </View>

            <View style={styles.balanceSection}>
              <Text style={styles.balanceLabel}>Balance</Text>
              <Text style={styles.balanceAmount}>
                {formatBalance(wallet.balance || 0)} {getCryptoSymbol(wallet.type)}
              </Text>
              <Text style={styles.balanceUSD}>
                ≈ ${calculateUSDValue(wallet.balance || 0, wallet.type)} USD
              </Text>
            </View>

            {/* Quick Actions */}
            <View style={styles.quickActions}>
              <Button
                title="Send"
                onPress={() => navigation.navigate('Send', { walletId: wallet.id })}
                size="small"
                style={styles.actionButton}
              />
              <Button
                title="Receive"
                onPress={() => navigation.navigate('Receive', { walletId: wallet.id })}
                variant="outline"
                size="small"
                style={styles.actionButton}
              />
            </View>
          </Card>

          {/* Address Card */}
          <Card style={styles.addressCard}>
            <Text style={styles.cardTitle}>Wallet Address</Text>
            <TouchableOpacity
              style={styles.addressContainer}
              onPress={handleCopyAddress}
            >
              <Text style={styles.addressText}>{wallet.address}</Text>
              <Ionicons name="copy" size={20} color={COLORS.primary} />
            </TouchableOpacity>
            <Text style={styles.addressHint}>
              Tap to copy address to clipboard
            </Text>
          </Card>

          {/* Wallet Information Card */}
          <Card style={styles.infoCard}>
            <Text style={styles.cardTitle}>Wallet Information</Text>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Wallet ID:</Text>
              <Text style={styles.infoValue}>{wallet.id}</Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Currency:</Text>
              <Text style={styles.infoValue}>{getCryptoSymbol(wallet.type)}</Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Decimals:</Text>
              <Text style={styles.infoValue}>{wallet.decimals}</Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Created:</Text>
              <Text style={styles.infoValue}>{formatDate(wallet.createdAt)}</Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Last Updated:</Text>
              <Text style={styles.infoValue}>{formatDate(wallet.updatedAt)}</Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Short Address:</Text>
              <Text style={styles.infoValue}>{formatAddress(wallet.address)}</Text>
            </View>
          </Card>

          {/* Security Card */}
          <Card style={styles.securityCard}>
            <Text style={styles.cardTitle}>Security</Text>
            <View style={styles.securityItem}>
              <Ionicons name="shield-checkmark" size={20} color={COLORS.success} />
              <Text style={styles.securityText}>Private key encrypted</Text>
            </View>
            <View style={styles.securityItem}>
              <Ionicons name="lock-closed" size={20} color={COLORS.success} />
              <Text style={styles.securityText}>Secure storage enabled</Text>
            </View>
            <View style={styles.securityItem}>
              <Ionicons name="finger-print" size={20} color={COLORS.warning} />
              <Text style={styles.securityText}>Biometric auth (coming soon)</Text>
            </View>
          </Card>

          {/* Actions Card */}
          <Card style={styles.actionsCard}>
            <Text style={styles.cardTitle}>Actions</Text>
            
            <TouchableOpacity
              style={styles.actionRow}
              onPress={() => navigation.navigate('Send', { walletId: wallet.id })}
            >
              <Ionicons name="arrow-up-circle-outline" size={24} color={COLORS.error} />
              <Text style={styles.actionText}>Send {getCryptoSymbol(wallet.type)}</Text>
              <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.actionRow}
              onPress={() => navigation.navigate('Receive', { walletId: wallet.id })}
            >
              <Ionicons name="arrow-down-circle-outline" size={24} color={COLORS.success} />
              <Text style={styles.actionText}>Receive {getCryptoSymbol(wallet.type)}</Text>
              <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.actionRow}
              onPress={handleCopyAddress}
            >
              <Ionicons name="copy-outline" size={24} color={COLORS.info} />
              <Text style={styles.actionText}>Copy Address</Text>
              <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.actionRow}
              onPress={() => Alert.alert('Feature', 'Export functionality coming soon')}
            >
              <Ionicons name="download-outline" size={24} color={COLORS.warning} />
              <Text style={styles.actionText}>Export Wallet</Text>
              <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </Card>
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
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    ...FONTS.regular,
    fontSize: SIZES.fontSizeMd,
    color: COLORS.textSecondary,
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
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SIZES.spacingLg,
  },
  overviewCard: {
    marginBottom: SIZES.spacingLg,
    borderWidth: 2,
  },
  walletHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.spacingLg,
  },
  cryptoIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SIZES.spacingMd,
  },
  cryptoIconText: {
    fontSize: 32,
  },
  walletInfo: {
    flex: 1,
  },
  walletName: {
    ...FONTS.bold,
    fontSize: SIZES.fontSizeLg,
    color: COLORS.textPrimary,
    marginBottom: SIZES.spacingXs,
  },
  cryptoType: {
    ...FONTS.regular,
    fontSize: SIZES.fontSizeSm,
    color: COLORS.textSecondary,
  },
  balanceSection: {
    alignItems: 'center',
    marginBottom: SIZES.spacingLg,
  },
  balanceLabel: {
    ...FONTS.regular,
    fontSize: SIZES.fontSizeSm,
    color: COLORS.textSecondary,
    marginBottom: SIZES.spacingSm,
  },
  balanceAmount: {
    ...FONTS.bold,
    fontSize: SIZES.fontSizeXxxl,
    color: COLORS.textPrimary,
    marginBottom: SIZES.spacingXs,
  },
  balanceUSD: {
    ...FONTS.regular,
    fontSize: SIZES.fontSizeMd,
    color: COLORS.textSecondary,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: SIZES.spacingMd,
  },
  actionButton: {
    flex: 1,
  },
  addressCard: {
    marginBottom: SIZES.spacingLg,
  },
  cardTitle: {
    ...FONTS.medium,
    fontSize: SIZES.fontSizeMd,
    color: COLORS.textPrimary,
    marginBottom: SIZES.spacingMd,
  },
  addressContainer: {
    backgroundColor: COLORS.backgroundTertiary,
    padding: SIZES.spacingMd,
    borderRadius: SIZES.radius,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SIZES.spacingSm,
  },
  addressText: {
    ...FONTS.regular,
    fontSize: SIZES.fontSizeSm,
    color: COLORS.textPrimary,
    flex: 1,
    marginRight: SIZES.spacingSm,
  },
  addressHint: {
    ...FONTS.regular,
    fontSize: SIZES.fontSizeXs,
    color: COLORS.textTertiary,
    textAlign: 'center',
  },
  infoCard: {
    marginBottom: SIZES.spacingLg,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.spacingSm,
  },
  infoLabel: {
    ...FONTS.regular,
    fontSize: SIZES.fontSizeSm,
    color: COLORS.textSecondary,
  },
  infoValue: {
    ...FONTS.medium,
    fontSize: SIZES.fontSizeSm,
    color: COLORS.textPrimary,
    flex: 1,
    textAlign: 'right',
  },
  securityCard: {
    marginBottom: SIZES.spacingLg,
  },
  securityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.spacingSm,
  },
  securityText: {
    ...FONTS.regular,
    fontSize: SIZES.fontSizeSm,
    color: COLORS.textSecondary,
    marginLeft: SIZES.spacingMd,
  },
  actionsCard: {
    marginBottom: SIZES.spacingLg,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SIZES.spacingMd,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  actionText: {
    ...FONTS.medium,
    fontSize: SIZES.fontSizeMd,
    color: COLORS.textPrimary,
    flex: 1,
    marginLeft: SIZES.spacingMd,
  },
}); 