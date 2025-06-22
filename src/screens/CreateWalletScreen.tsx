import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
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
import { CryptoType } from '../types';

interface CreateWalletScreenProps {
  navigation: any;
}

export const CreateWalletScreen: React.FC<CreateWalletScreenProps> = ({ navigation }) => {
  const [selectedCrypto, setSelectedCrypto] = useState<CryptoType | null>(null);
  const [walletName, setWalletName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; crypto?: string }>({});

  const currentUser = authService.getCurrentUser();

  const validateForm = () => {
    const newErrors: { name?: string; crypto?: string } = {};

    if (!walletName.trim()) {
      newErrors.name = 'Wallet name is required';
    } else if (walletName.trim().length < 3) {
      newErrors.name = 'Wallet name must be at least 3 characters';
    } else if (walletName.trim().length > 20) {
      newErrors.name = 'Wallet name must be less than 20 characters';
    }

    if (!selectedCrypto) {
      newErrors.crypto = 'Please select a cryptocurrency';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreateWallet = async () => {
    console.log('handleCreateWallet called');
    console.log('selectedCrypto:', selectedCrypto);
    console.log('walletName:', walletName);
    console.log('currentUser:', currentUser);
    
    if (!validateForm() || !currentUser || !selectedCrypto) {
      console.log('Validation failed or missing data');
      console.log('validateForm():', validateForm());
      console.log('currentUser exists:', !!currentUser);
      console.log('selectedCrypto exists:', !!selectedCrypto);
      return;
    }

    setLoading(true);
    try {
      console.log('Attempting to create wallet...');
      const wallet = await walletService.createWallet(
        currentUser.id,
        selectedCrypto,
        walletName.trim()
      );

      console.log('Wallet created successfully:', wallet);

      // Show success message and navigate back to dashboard
      // Note: Alert doesn't work well in React Native Web, so we'll navigate directly
      console.log(`✅ Success: ${getCryptoName(selectedCrypto)} wallet "${walletName}" created!`);
      
      // Navigate back to dashboard to show the new wallet
      navigation.navigate('MainTabs', { 
        screen: 'Dashboard',
        params: { 
          newWalletCreated: true,
          walletName: walletName,
          cryptoType: selectedCrypto 
        }
      });
    } catch (error) {
      console.error('Error creating wallet:', error);
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to create wallet');
    } finally {
      setLoading(false);
    }
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

  const getCryptoDescription = (cryptoType: CryptoType) => {
    switch (cryptoType) {
      case CryptoType.ETHEREUM:
        return 'Smart contracts and DeFi applications';
      case CryptoType.BITCOIN:
        return 'Digital gold and store of value';
      case CryptoType.SOLANA:
        return 'Fast and low-cost transactions';
      default:
        return 'Cryptocurrency wallet';
    }
  };

  const generateDefaultName = (cryptoType: CryptoType) => {
    const symbol = getCryptoSymbol(cryptoType);
    return `My ${symbol} Wallet`;
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
          <Text style={styles.title}>Create New Wallet</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={true}
          bounces={true}
          keyboardShouldPersistTaps="handled"
          alwaysBounceVertical={true}
        >
          {/* Step 1: Select Cryptocurrency */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Step 1: Choose Cryptocurrency</Text>
            <Text style={styles.sectionSubtitle}>
              Select the type of cryptocurrency wallet you want to create
            </Text>

            {SUPPORTED_CRYPTOS.map((crypto) => (
              <TouchableOpacity
                key={crypto.type}
                onPress={() => {
                  setSelectedCrypto(crypto.type);
                  if (!walletName) {
                    setWalletName(generateDefaultName(crypto.type));
                  }
                }}
                style={[
                  styles.cryptoOption,
                  selectedCrypto === crypto.type && styles.cryptoOptionSelected,
                ]}
              >
                <View style={styles.cryptoHeader}>
                  <View style={[styles.cryptoIconContainer, { backgroundColor: getCryptoColor(crypto.type) + '20' }]}>
                    <Text style={styles.cryptoIcon}>{crypto.icon}</Text>
                  </View>
                  <View style={styles.cryptoInfo}>
                    <Text style={styles.cryptoName}>{crypto.name}</Text>
                    <Text style={styles.cryptoSymbol}>{crypto.symbol}</Text>
                  </View>
                  <View style={styles.cryptoSelection}>
                    {selectedCrypto === crypto.type && (
                      <Ionicons name="checkmark-circle" size={24} color={COLORS.success} />
                    )}
                  </View>
                </View>
                <Text style={styles.cryptoDescription}>
                  {getCryptoDescription(crypto.type)}
                </Text>
              </TouchableOpacity>
            ))}

            {errors.crypto && (
              <Text style={styles.errorText}>{errors.crypto}</Text>
            )}
          </View>

          {/* Step 2: Wallet Name */}
          {selectedCrypto && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Step 2: Name Your Wallet</Text>
              <Text style={styles.sectionSubtitle}>
                Give your wallet a memorable name
              </Text>

              <Input
                label="Wallet Name"
                placeholder="Enter wallet name"
                value={walletName}
                onChangeText={setWalletName}
                error={errors.name}
                maxLength={20}
              />

              <View style={styles.namePreview}>
                <Text style={styles.previewLabel}>Preview:</Text>
                <View style={styles.previewContainer}>
                  <Text style={styles.previewIcon}>{getCryptoIcon(selectedCrypto)}</Text>
                  <Text style={styles.previewName}>
                    {walletName || 'Wallet Name'}
                  </Text>
                  <Text style={styles.previewSymbol}>
                    {getCryptoSymbol(selectedCrypto)}
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Step 3: Security Information */}
          {selectedCrypto && walletName && (
            <Card style={styles.securityCard}>
              <Text style={styles.cardTitle}>Security Information</Text>
              <View style={styles.securityItem}>
                <Ionicons name="shield-checkmark" size={20} color={COLORS.success} />
                <Text style={styles.securityText}>
                  Your private key will be encrypted and stored securely
                </Text>
              </View>
              <View style={styles.securityItem}>
                <Ionicons name="lock-closed" size={20} color={COLORS.success} />
                <Text style={styles.securityText}>
                  Only you have access to your wallet
                </Text>
              </View>
              <View style={styles.securityItem}>
                <Ionicons name="warning" size={20} color={COLORS.warning} />
                <Text style={styles.securityText}>
                  Make sure to backup your wallet after creation
                </Text>
              </View>
            </Card>
          )}

          {/* Create Wallet Button */}
          <Button
            title={`Create ${selectedCrypto ? getCryptoName(selectedCrypto) : ''} Wallet`}
            onPress={handleCreateWallet}
            loading={loading}
            disabled={!selectedCrypto || !walletName.trim()}
            style={styles.createButton}
          />

          {/* Help Section */}
          <Card style={styles.helpCard}>
            <Text style={styles.cardTitle}>Need Help?</Text>
            <Text style={styles.helpText}>
              • Choose the cryptocurrency you want to use most often
            </Text>
            <Text style={styles.helpText}>
              • You can create multiple wallets for different cryptocurrencies
            </Text>
            <Text style={styles.helpText}>
              • Wallet names help you identify your wallets easily
            </Text>
            <Text style={styles.helpText}>
              • All wallets are secured with encryption
            </Text>
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
    paddingBottom: SIZES.spacingXxl * 3,
    minHeight: '120%',
  },
  section: {
    marginBottom: SIZES.spacingXl,
  },
  sectionTitle: {
    ...FONTS.bold,
    fontSize: SIZES.fontSizeLg,
    color: COLORS.textPrimary,
    marginBottom: SIZES.spacingSm,
  },
  sectionSubtitle: {
    ...FONTS.regular,
    fontSize: SIZES.fontSizeSm,
    color: COLORS.textSecondary,
    marginBottom: SIZES.spacingLg,
  },
  cryptoOption: {
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: SIZES.radius,
    padding: SIZES.spacingLg,
    marginBottom: SIZES.spacingMd,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  cryptoOptionSelected: {
    borderColor: COLORS.primary,
  },
  cryptoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.spacingSm,
  },
  cryptoIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SIZES.spacingMd,
  },
  cryptoIcon: {
    fontSize: 24,
  },
  cryptoInfo: {
    flex: 1,
  },
  cryptoName: {
    ...FONTS.bold,
    fontSize: SIZES.fontSizeMd,
    color: COLORS.textPrimary,
    marginBottom: SIZES.spacingXs,
  },
  cryptoSymbol: {
    ...FONTS.regular,
    fontSize: SIZES.fontSizeSm,
    color: COLORS.textSecondary,
  },
  cryptoSelection: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cryptoDescription: {
    ...FONTS.regular,
    fontSize: SIZES.fontSizeSm,
    color: COLORS.textTertiary,
    marginLeft: SIZES.spacingXxl + SIZES.spacingMd,
  },
  errorText: {
    ...FONTS.regular,
    color: COLORS.error,
    fontSize: SIZES.fontSizeSm,
    marginTop: SIZES.spacingSm,
  },
  namePreview: {
    marginTop: SIZES.spacingMd,
  },
  previewLabel: {
    ...FONTS.medium,
    fontSize: SIZES.fontSizeSm,
    color: COLORS.textSecondary,
    marginBottom: SIZES.spacingSm,
  },
  previewContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundTertiary,
    padding: SIZES.spacingMd,
    borderRadius: SIZES.radius,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  previewIcon: {
    fontSize: 20,
    marginRight: SIZES.spacingMd,
  },
  previewName: {
    ...FONTS.medium,
    fontSize: SIZES.fontSizeMd,
    color: COLORS.textPrimary,
    flex: 1,
  },
  previewSymbol: {
    ...FONTS.regular,
    fontSize: SIZES.fontSizeSm,
    color: COLORS.textSecondary,
  },
  securityCard: {
    marginBottom: SIZES.spacingLg,
    backgroundColor: COLORS.backgroundTertiary,
  },
  cardTitle: {
    ...FONTS.medium,
    fontSize: SIZES.fontSizeMd,
    color: COLORS.textPrimary,
    marginBottom: SIZES.spacingMd,
  },
  securityItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SIZES.spacingSm,
  },
  securityText: {
    ...FONTS.regular,
    fontSize: SIZES.fontSizeSm,
    color: COLORS.textSecondary,
    marginLeft: SIZES.spacingMd,
    flex: 1,
  },
  createButton: {
    marginBottom: SIZES.spacingLg,
  },
  helpCard: {
    backgroundColor: COLORS.backgroundTertiary,
  },
  helpText: {
    ...FONTS.regular,
    fontSize: SIZES.fontSizeSm,
    color: COLORS.textSecondary,
    marginBottom: SIZES.spacingSm,
  },
}); 