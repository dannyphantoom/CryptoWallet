import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { MarketOverview } from '../components/MarketOverview';
import { COLORS, SIZES, FONTS } from '../constants/theme';
import { SUPPORTED_CRYPTOS } from '../constants/crypto';
import { walletService } from '../services/walletService';
import { authService } from '../services/authService';
import { Wallet, CryptoType } from '../types';

const { width } = Dimensions.get('window');

interface DashboardScreenProps {
  navigation: any;
  route?: {
    params?: {
      newWalletCreated?: boolean;
      walletName?: string;
      cryptoType?: string;
    };
  };
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({ navigation, route }) => {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [totalBalance, setTotalBalance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const currentUser = authService.getCurrentUser();

  useEffect(() => {
    loadWallets();
    
    // Check if we just created a new wallet
    if (route?.params?.newWalletCreated) {
      const { walletName, cryptoType } = route.params;
      console.log(`🎉 Welcome to your new ${cryptoType} wallet: ${walletName}!`);
      // Clear the params to prevent showing the message again
      navigation.setParams({ newWalletCreated: false });
    }
  }, [route?.params]);

  const loadWallets = async () => {
    if (!currentUser) {
      console.log('No current user found');
      return;
    }

    try {
      console.log('Loading wallets for user:', currentUser.id);
      
      // Initialize demo wallets if user doesn't have any
      await walletService.initializeDemoWallets(currentUser.id);
      
      const userWallets = walletService.getWalletsByUserId(currentUser.id);
      console.log('Found wallets:', userWallets.length, userWallets);
      setWallets(userWallets);
      
      // Calculate total balance
      let total = 0;
      for (const wallet of userWallets) {
        try {
          const balance = await walletService.getBalance(wallet.id);
          wallet.balance = balance;
          total += balance;
        } catch (error) {
          console.error(`Failed to get balance for wallet ${wallet.id}:`, error);
        }
      }
      
      setWallets([...userWallets]);
      setTotalBalance(total);
      console.log('Loaded', userWallets.length, 'wallets with total balance:', total);
    } catch (error) {
      console.error('Failed to load wallets:', error);
      Alert.alert('Error', 'Failed to load wallets');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadWallets();
    setRefreshing(false);
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await authService.logout();
              // Navigation will be handled by the app's navigation logic
            } catch (error) {
              console.error('Logout failed:', error);
            }
          },
        },
      ]
    );
  };

  const getCryptoIcon = (cryptoType: CryptoType) => {
    const crypto = SUPPORTED_CRYPTOS.find(c => c.type === cryptoType);
    return crypto?.icon || '🔷';
  };

  const formatBalance = (balance: number, decimals: number = 6) => {
    return balance.toFixed(decimals);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const quickActions = [
    {
      name: 'Send',
      icon: 'paper-plane',
      color: COLORS.primary,
      onPress: () => Alert.alert('Coming Soon', 'Send feature will be available soon'),
    },
    {
      name: 'Receive',
      icon: 'arrow-down',
      color: COLORS.success,
      onPress: () => Alert.alert('Coming Soon', 'Receive feature will be available soon'),
    },
    {
      name: 'Swap',
      icon: 'swap-horizontal',
      color: COLORS.info,
      onPress: () => Alert.alert('Coming Soon', 'Swap feature will be available soon'),
    },
    {
      name: 'History',
      icon: 'time',
      color: COLORS.warning,
      onPress: () => Alert.alert('Coming Soon', 'Transaction history will be available soon'),
    },
  ];

  // Refresh wallets when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      if (currentUser) {
        loadWallets();
      }
    }, [currentUser])
  );

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={[COLORS.background, COLORS.backgroundSecondary]}
        style={styles.gradient}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={styles.greeting}>Welcome back,</Text>
              <Text style={styles.username}>{currentUser?.username || 'User'}</Text>
            </View>
            <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
              <Ionicons name="log-out-outline" size={24} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Balance Card */}
          <Card style={styles.balanceCard}>
            <View style={styles.balanceHeader}>
              <Text style={styles.balanceLabel}>Total Portfolio Value</Text>
              <TouchableOpacity>
                <Ionicons name="eye-outline" size={20} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>
            <Text style={styles.balanceAmount}>{formatCurrency(totalBalance)}</Text>
            <View style={styles.balanceChange}>
              <Ionicons name="trending-up" size={16} color={COLORS.success} />
              <Text style={styles.balanceChangeText}>+2.45% Today</Text>
            </View>
          </Card>

          {/* Market Overview */}
          <MarketOverview onCryptoPress={(cryptoType) => {
            Alert.alert('Coming Soon', `${cryptoType} price details will be available soon`);
          }} />

          {/* Quick Actions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.quickActionsGrid}>
              {quickActions.map((action, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.quickActionItem}
                  onPress={action.onPress}
                >
                  <View style={[styles.quickActionIcon, { backgroundColor: action.color + '20' }]}>
                    <Ionicons name={action.icon as any} size={24} color={action.color} />
                  </View>
                  <Text style={styles.quickActionText}>{action.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Wallets Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>My Wallets</Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('CreateWallet')}
                style={styles.addButton}
              >
                <Ionicons name="add" size={20} color={COLORS.primary} />
                <Text style={styles.addButtonText}>Add</Text>
              </TouchableOpacity>
            </View>

            {loading ? (
              <Card style={styles.loadingCard}>
                <Text style={styles.loadingText}>Loading wallets...</Text>
              </Card>
            ) : wallets.length === 0 ? (
              <Card style={styles.emptyCard}>
                <View style={styles.emptyIcon}>
                  <Ionicons name="wallet-outline" size={48} color={COLORS.textTertiary} />
                </View>
                <Text style={styles.emptyTitle}>No wallets yet</Text>
                <Text style={styles.emptySubtext}>Create your first wallet to start managing your crypto</Text>
                <Button
                  title="Create Wallet"
                  onPress={() => navigation.navigate('CreateWallet')}
                  style={styles.createWalletButton}
                  size="small"
                />
              </Card>
            ) : (
              <View style={styles.walletsContainer}>
                {wallets.map((wallet, index) => (
                  <TouchableOpacity
                    key={wallet.id}
                    onPress={() => Alert.alert('Coming Soon', 'Wallet details will be available soon')}
                    style={styles.walletCard}
                  >
                    <View style={styles.walletHeader}>
                      <View style={styles.walletIconContainer}>
                        <Text style={styles.walletIcon}>{getCryptoIcon(wallet.type)}</Text>
                      </View>
                      <View style={styles.walletInfo}>
                        <Text style={styles.walletName}>{wallet.name}</Text>
                        <Text style={styles.walletAddress}>
                          {wallet.address.substring(0, 6)}...{wallet.address.substring(wallet.address.length - 4)}
                        </Text>
                      </View>
                      <View style={styles.walletBalance}>
                        <Text style={styles.walletBalanceAmount}>
                          {formatBalance(wallet.balance, 4)} {wallet.symbol}
                        </Text>
                        <Text style={styles.walletBalanceValue}>
                          {formatCurrency(wallet.balance * 3000)} {/* Mock USD value */}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SIZES.spacingMd,
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.spacingXl,
    paddingTop: SIZES.spacingSm,
  },
  headerLeft: {
    flex: 1,
  },
  greeting: {
    ...FONTS.regular,
    color: COLORS.textSecondary,
    fontSize: SIZES.fontSizeMd,
    marginBottom: 2,
  },
  username: {
    ...FONTS.bold,
    color: COLORS.textPrimary,
    fontSize: SIZES.fontSizeXl,
  },
  logoutButton: {
    padding: SIZES.spacingSm,
    borderRadius: 8,
    backgroundColor: COLORS.backgroundTertiary,
  },
  balanceCard: {
    marginBottom: SIZES.spacingXl,
    padding: SIZES.spacingLg,
  },
  balanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.spacingSm,
  },
  balanceLabel: {
    ...FONTS.medium,
    color: COLORS.textSecondary,
    fontSize: SIZES.fontSizeMd,
  },
  balanceAmount: {
    ...FONTS.bold,
    color: COLORS.textPrimary,
    fontSize: 32,
    marginBottom: SIZES.spacingSm,
  },
  balanceChange: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  balanceChangeText: {
    ...FONTS.medium,
    color: COLORS.success,
    fontSize: SIZES.fontSizeSm,
    marginLeft: 4,
  },
  section: {
    marginBottom: SIZES.spacingXl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.spacingMd,
  },
  sectionTitle: {
    ...FONTS.bold,
    color: COLORS.textPrimary,
    fontSize: SIZES.fontSizeLg,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary + '20',
    paddingHorizontal: SIZES.spacingMd,
    paddingVertical: SIZES.spacingSm,
    borderRadius: 20,
  },
  addButtonText: {
    ...FONTS.medium,
    color: COLORS.primary,
    fontSize: SIZES.fontSizeSm,
    marginLeft: 4,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  quickActionItem: {
    alignItems: 'center',
    width: (width - SIZES.spacingMd * 2 - SIZES.spacingMd * 3) / 4,
    marginBottom: SIZES.spacingMd,
  },
  quickActionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SIZES.spacingSm,
  },
  quickActionText: {
    ...FONTS.medium,
    color: COLORS.textPrimary,
    fontSize: SIZES.fontSizeSm,
    textAlign: 'center',
  },
  loadingCard: {
    padding: SIZES.spacingXl,
    alignItems: 'center',
  },
  loadingText: {
    ...FONTS.medium,
    color: COLORS.textSecondary,
    fontSize: SIZES.fontSizeMd,
  },
  emptyCard: {
    padding: SIZES.spacingXl,
    alignItems: 'center',
  },
  emptyIcon: {
    marginBottom: SIZES.spacingMd,
  },
  emptyTitle: {
    ...FONTS.bold,
    color: COLORS.textPrimary,
    fontSize: SIZES.fontSizeLg,
    marginBottom: SIZES.spacingSm,
  },
  emptySubtext: {
    ...FONTS.regular,
    color: COLORS.textSecondary,
    fontSize: SIZES.fontSizeMd,
    textAlign: 'center',
    marginBottom: SIZES.spacingLg,
    lineHeight: 20,
  },
  createWalletButton: {
    minWidth: 140,
  },
  walletsContainer: {
    gap: SIZES.spacingMd,
  },
  walletCard: {
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: 16,
    padding: SIZES.spacingLg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  walletHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  walletIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.backgroundTertiary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SIZES.spacingMd,
  },
  walletIcon: {
    fontSize: 24,
  },
  walletInfo: {
    flex: 1,
  },
  walletName: {
    ...FONTS.bold,
    color: COLORS.textPrimary,
    fontSize: SIZES.fontSizeMd,
    marginBottom: 2,
  },
  walletAddress: {
    ...FONTS.regular,
    color: COLORS.textSecondary,
    fontSize: SIZES.fontSizeSm,
  },
  walletBalance: {
    alignItems: 'flex-end',
  },
  walletBalanceAmount: {
    ...FONTS.bold,
    color: COLORS.textPrimary,
    fontSize: SIZES.fontSizeMd,
    marginBottom: 2,
  },
  walletBalanceValue: {
    ...FONTS.regular,
    color: COLORS.textSecondary,
    fontSize: SIZES.fontSizeSm,
  },
}); 