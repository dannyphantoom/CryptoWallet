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
import * as Clipboard from 'expo-clipboard';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { COLORS, SIZES, FONTS } from '../constants/theme';
import { SUPPORTED_CRYPTOS } from '../constants/crypto';
import { walletService } from '../services/walletService';
import { authService } from '../services/authService';
import { Wallet, CryptoType } from '../types';

interface ReceiveScreenProps {
  navigation: any;
  route?: any;
}

export const ReceiveScreen: React.FC<ReceiveScreenProps> = ({ navigation, route }) => {
  const [selectedWallet, setSelectedWallet] = useState<Wallet | null>(null);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [loading, setLoading] = useState(true);

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
    } finally {
      setLoading(false);
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

  const handleCopyAddress = async () => {
    if (!selectedWallet) return;

    try {
      await Clipboard.setStringAsync(selectedWallet.address);
      Alert.alert('Copied!', 'Wallet address copied to clipboard');
    } catch (error) {
      Alert.alert('Error', 'Failed to copy address');
    }
  };

  const formatBalance = (balance: number) => {
    return balance.toFixed(6);
  };

  const formatAddress = (address: string) => {
    if (address.length <= 20) return address;
    return `${address.substring(0, 8)}...${address.substring(address.length - 8)}`;
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
          <Text style={styles.title}>Receive Crypto</Text>
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

          {selectedWallet && (
            <View style={styles.section}>
              {/* QR Code Section */}
              <Card style={styles.qrCard}>
                <Text style={styles.qrTitle}>QR Code</Text>
                <View style={styles.qrContainer}>
                  <View style={styles.qrPlaceholder}>
                    <Ionicons name="qr-code" size={80} color={COLORS.textSecondary} />
                    <Text style={styles.qrText}>QR Code will appear here</Text>
                    <Text style={styles.qrSubtext}>
                      Feature coming soon
                    </Text>
                  </View>
                </View>
              </Card>

              {/* Address Section */}
              <Card style={styles.addressCard}>
                <Text style={styles.addressTitle}>Wallet Address</Text>
                <View style={styles.addressContainer}>
                  <Text style={styles.addressLabel}>
                    {getCryptoSymbol(selectedWallet.type)} Address:
                  </Text>
                  <TouchableOpacity
                    style={styles.addressBox}
                    onPress={handleCopyAddress}
                  >
                    <Text style={styles.addressText}>{selectedWallet.address}</Text>
                    <Ionicons name="copy" size={20} color={COLORS.primary} />
                  </TouchableOpacity>
                  <Text style={styles.addressHint}>
                    Tap to copy address
                  </Text>
                </View>
              </Card>

              {/* Wallet Info */}
              <Card style={styles.infoCard}>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Wallet Name:</Text>
                  <Text style={styles.infoValue}>{selectedWallet.name}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Currency:</Text>
                  <Text style={styles.infoValue}>{getCryptoSymbol(selectedWallet.type)}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Balance:</Text>
                  <Text style={styles.infoValue}>
                    {formatBalance(selectedWallet.balance || 0)} {getCryptoSymbol(selectedWallet.type)}
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Short Address:</Text>
                  <Text style={styles.infoValue}>{formatAddress(selectedWallet.address)}</Text>
                </View>
              </Card>

              {/* Action Buttons */}
              <View style={styles.actions}>
                <Button
                  title="Copy Address"
                  onPress={handleCopyAddress}
                  style={styles.actionButton}
                />
                <Button
                  title="Share"
                  onPress={() => Alert.alert('Feature', 'Share functionality will be implemented')}
                  variant="outline"
                  style={styles.actionButton}
                />
              </View>
            </View>
          )}

          {wallets.length === 0 && !loading && (
            <Card style={styles.emptyCard}>
              <Ionicons name="wallet-outline" size={48} color={COLORS.textTertiary} />
              <Text style={styles.emptyText}>No wallets found</Text>
              <Text style={styles.emptySubtext}>Create a wallet to start receiving crypto</Text>
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
  qrCard: {
    marginBottom: SIZES.spacingLg,
  },
  qrTitle: {
    ...FONTS.medium,
    fontSize: SIZES.fontSizeMd,
    color: COLORS.textPrimary,
    marginBottom: SIZES.spacingMd,
    textAlign: 'center',
  },
  qrContainer: {
    alignItems: 'center',
  },
  qrPlaceholder: {
    width: 200,
    height: 200,
    backgroundColor: COLORS.backgroundTertiary,
    borderRadius: SIZES.radius,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
  },
  qrText: {
    ...FONTS.medium,
    fontSize: SIZES.fontSizeSm,
    color: COLORS.textSecondary,
    marginTop: SIZES.spacingSm,
  },
  qrSubtext: {
    ...FONTS.regular,
    fontSize: SIZES.fontSizeXs,
    color: COLORS.textTertiary,
    marginTop: SIZES.spacingXs,
  },
  addressCard: {
    marginBottom: SIZES.spacingLg,
  },
  addressTitle: {
    ...FONTS.medium,
    fontSize: SIZES.fontSizeMd,
    color: COLORS.textPrimary,
    marginBottom: SIZES.spacingMd,
  },
  addressContainer: {
    alignItems: 'center',
  },
  addressLabel: {
    ...FONTS.medium,
    fontSize: SIZES.fontSizeSm,
    color: COLORS.textSecondary,
    marginBottom: SIZES.spacingSm,
  },
  addressBox: {
    backgroundColor: COLORS.backgroundTertiary,
    padding: SIZES.spacingMd,
    borderRadius: SIZES.radius,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
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
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: SIZES.spacingMd,
  },
  actionButton: {
    flex: 1,
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