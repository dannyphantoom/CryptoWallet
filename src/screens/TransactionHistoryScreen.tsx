import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../components/Card';
import { COLORS, SIZES, FONTS } from '../constants/theme';
import { SUPPORTED_CRYPTOS } from '../constants/crypto';
import { walletService } from '../services/walletService';
import { authService } from '../services/authService';
import { Transaction, TransactionType, TransactionStatus, CryptoType } from '../types';

interface TransactionHistoryScreenProps {
  navigation: any;
}

export const TransactionHistoryScreen: React.FC<TransactionHistoryScreenProps> = ({ navigation }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<'all' | TransactionType>('all');

  const currentUser = authService.getCurrentUser();

  useEffect(() => {
    loadTransactions();
  }, []);

  useEffect(() => {
    filterTransactions();
  }, [transactions, selectedFilter]);

  const loadTransactions = async () => {
    if (!currentUser) return;

    try {
      // Load transactions from all user wallets
      const userWallets = walletService.getWalletsByUserId(currentUser.id);
      const allTransactions: Transaction[] = [];

      for (const wallet of userWallets) {
        try {
          const walletTransactions = await walletService.getTransactionHistory(wallet.id);
          allTransactions.push(...walletTransactions);
        } catch (error) {
          console.error(`Failed to load transactions for wallet ${wallet.id}:`, error);
        }
      }

      // Sort transactions by timestamp (newest first)
      allTransactions.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

      setTransactions(allTransactions);
    } catch (error) {
      console.error('Failed to load transactions:', error);
      Alert.alert('Error', 'Failed to load transaction history');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTransactions();
    setRefreshing(false);
  };

  const filterTransactions = () => {
    if (selectedFilter === 'all') {
      setFilteredTransactions(transactions);
    } else {
      setFilteredTransactions(transactions.filter(tx => tx.type === selectedFilter));
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

  const getTransactionIcon = (type: TransactionType) => {
    switch (type) {
      case TransactionType.SEND:
        return 'arrow-up-circle';
      case TransactionType.RECEIVE:
        return 'arrow-down-circle';
      case TransactionType.SWAP:
        return 'swap-horizontal';
      default:
        return 'radio-button-off';
    }
  };

  const getTransactionColor = (type: TransactionType) => {
    switch (type) {
      case TransactionType.SEND:
        return COLORS.error;
      case TransactionType.RECEIVE:
        return COLORS.success;
      case TransactionType.SWAP:
        return COLORS.warning;
      default:
        return COLORS.textSecondary;
    }
  };

  const getStatusColor = (status: TransactionStatus) => {
    switch (status) {
      case TransactionStatus.CONFIRMED:
        return COLORS.success;
      case TransactionStatus.PENDING:
        return COLORS.warning;
      case TransactionStatus.FAILED:
        return COLORS.error;
      default:
        return COLORS.textSecondary;
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleString();
  };

  const formatAddress = (address: string) => {
    if (address.length <= 20) return address;
    return `${address.substring(0, 8)}...${address.substring(address.length - 8)}`;
  };

  const handleTransactionPress = (transaction: Transaction) => {
    Alert.alert(
      'Transaction Details',
      `Hash: ${transaction.hash}\nAmount: ${transaction.amount}\nFee: ${transaction.fee}\nStatus: ${transaction.status}\nDate: ${formatDate(transaction.timestamp)}`,
      [{ text: 'OK' }]
    );
  };

  const filterOptions = [
    { key: 'all', label: 'All', icon: 'list' },
    { key: TransactionType.SEND, label: 'Sent', icon: 'arrow-up-circle' },
    { key: TransactionType.RECEIVE, label: 'Received', icon: 'arrow-down-circle' },
    { key: TransactionType.SWAP, label: 'Swapped', icon: 'swap-horizontal' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={[COLORS.background, COLORS.backgroundSecondary]}
        style={styles.gradient}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Transaction History</Text>
          <Text style={styles.subtitle}>
            {filteredTransactions.length} transaction{filteredTransactions.length !== 1 ? 's' : ''}
          </Text>
        </View>

        {/* Filter Tabs */}
        <View style={styles.filterContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterScroll}
          >
            {filterOptions.map((option) => (
              <TouchableOpacity
                key={option.key}
                onPress={() => setSelectedFilter(option.key as any)}
                style={[
                  styles.filterTab,
                  selectedFilter === option.key && styles.filterTabActive,
                ]}
              >
                <Ionicons
                  name={option.icon as any}
                  size={16}
                  color={selectedFilter === option.key ? COLORS.textPrimary : COLORS.textSecondary}
                />
                <Text
                  style={[
                    styles.filterTabText,
                    selectedFilter === option.key && styles.filterTabTextActive,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Transaction List */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
        >
          {filteredTransactions.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Ionicons name="receipt-outline" size={48} color={COLORS.textTertiary} />
              <Text style={styles.emptyText}>No transactions found</Text>
              <Text style={styles.emptySubtext}>
                {selectedFilter === 'all'
                  ? 'Your transaction history will appear here'
                  : `No ${selectedFilter} transactions found`}
              </Text>
            </Card>
          ) : (
            filteredTransactions.map((transaction) => (
              <TouchableOpacity
                key={transaction.id}
                onPress={() => handleTransactionPress(transaction)}
              >
                <Card style={styles.transactionCard}>
                  <View style={styles.transactionHeader}>
                    <View style={styles.transactionIcon}>
                      <Ionicons
                        name={getTransactionIcon(transaction.type)}
                        size={24}
                        color={getTransactionColor(transaction.type)}
                      />
                    </View>
                    <View style={styles.transactionInfo}>
                      <Text style={styles.transactionType}>
                        {transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
                      </Text>
                      <Text style={styles.transactionDate}>
                        {formatDate(transaction.timestamp)}
                      </Text>
                    </View>
                    <View style={styles.transactionAmount}>
                      <Text
                        style={[
                          styles.amountText,
                          { color: getTransactionColor(transaction.type) },
                        ]}
                      >
                        {transaction.type === TransactionType.SEND ? '-' : '+'}
                        {transaction.amount}
                      </Text>
                      <Text
                        style={[
                          styles.statusText,
                          { color: getStatusColor(transaction.status) },
                        ]}
                      >
                        {transaction.status}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.transactionDetails}>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Hash:</Text>
                      <Text style={styles.detailValue}>{formatAddress(transaction.hash)}</Text>
                    </View>
                    
                    {transaction.type === TransactionType.SWAP && transaction.swapInfo ? (
                      <View style={styles.swapDetails}>
                        <View style={styles.detailRow}>
                          <Text style={styles.detailLabel}>From:</Text>
                          <Text style={styles.detailValue}>
                            {transaction.swapInfo.fromAmount} {getCryptoSymbol(transaction.swapInfo.fromCrypto)}
                          </Text>
                        </View>
                        <View style={styles.detailRow}>
                          <Text style={styles.detailLabel}>To:</Text>
                          <Text style={styles.detailValue}>
                            {transaction.swapInfo.toAmount} {getCryptoSymbol(transaction.swapInfo.toCrypto)}
                          </Text>
                        </View>
                      </View>
                    ) : (
                      <>
                        <View style={styles.detailRow}>
                          <Text style={styles.detailLabel}>From:</Text>
                          <Text style={styles.detailValue}>{formatAddress(transaction.fromAddress)}</Text>
                        </View>
                        <View style={styles.detailRow}>
                          <Text style={styles.detailLabel}>To:</Text>
                          <Text style={styles.detailValue}>{formatAddress(transaction.toAddress)}</Text>
                        </View>
                      </>
                    )}
                    
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Fee:</Text>
                      <Text style={styles.detailValue}>{transaction.fee}</Text>
                    </View>
                  </View>
                </Card>
              </TouchableOpacity>
            ))
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
    alignItems: 'center',
    paddingHorizontal: SIZES.spacingLg,
    paddingTop: SIZES.spacingMd,
    paddingBottom: SIZES.spacingLg,
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
  },
  filterContainer: {
    paddingHorizontal: SIZES.spacingLg,
    marginBottom: SIZES.spacingLg,
  },
  filterScroll: {
    paddingRight: SIZES.spacingLg,
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SIZES.spacingMd,
    paddingVertical: SIZES.spacingSm,
    marginRight: SIZES.spacingSm,
    borderRadius: SIZES.radius,
    backgroundColor: COLORS.backgroundSecondary,
  },
  filterTabActive: {
    backgroundColor: COLORS.primary,
  },
  filterTabText: {
    ...FONTS.medium,
    fontSize: SIZES.fontSizeSm,
    color: COLORS.textSecondary,
    marginLeft: SIZES.spacingXs,
  },
  filterTabTextActive: {
    color: COLORS.textPrimary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SIZES.spacingLg,
  },
  transactionCard: {
    marginBottom: SIZES.spacingMd,
  },
  transactionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.spacingMd,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SIZES.spacingMd,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionType: {
    ...FONTS.medium,
    fontSize: SIZES.fontSizeMd,
    color: COLORS.textPrimary,
    marginBottom: SIZES.spacingXs,
  },
  transactionDate: {
    ...FONTS.regular,
    fontSize: SIZES.fontSizeSm,
    color: COLORS.textSecondary,
  },
  transactionAmount: {
    alignItems: 'flex-end',
  },
  amountText: {
    ...FONTS.bold,
    fontSize: SIZES.fontSizeMd,
    marginBottom: SIZES.spacingXs,
  },
  statusText: {
    ...FONTS.regular,
    fontSize: SIZES.fontSizeXs,
    textTransform: 'uppercase',
  },
  transactionDetails: {
    paddingTop: SIZES.spacingMd,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.spacingSm,
  },
  detailLabel: {
    ...FONTS.regular,
    fontSize: SIZES.fontSizeSm,
    color: COLORS.textSecondary,
  },
  detailValue: {
    ...FONTS.regular,
    fontSize: SIZES.fontSizeSm,
    color: COLORS.textPrimary,
  },
  swapDetails: {
    // Additional styling for swap transaction details
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
  },
}); 