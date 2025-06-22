import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
  TextInput,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { COLORS, SIZES, FONTS } from '../constants/theme';
import { authService } from '../services/authService';
import { configService } from '../services/configService';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SettingsScreenProps {
  navigation: any;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ navigation }) => {
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [priceAlertsEnabled, setPriceAlertsEnabled] = useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [currentApiKeyType, setCurrentApiKeyType] = useState<'infura' | 'coingecko' | 'custom_eth' | 'custom_btc' | 'custom_sol'>('infura');
  const [apiKeyValue, setApiKeyValue] = useState('');

  const currentUser = authService.getCurrentUser();

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
              Alert.alert('Error', 'Failed to logout');
            }
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This action cannot be undone. All your wallets and data will be permanently deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            Alert.alert('Feature', 'Account deletion will be implemented in a future update');
          },
        },
      ]
    );
  };

  const handleBackupWallets = () => {
    Alert.alert(
      'Backup Wallets',
      'This will create a secure backup of all your wallets.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Create Backup',
          onPress: () => {
            Alert.alert('Feature', 'Wallet backup functionality will be implemented');
          },
        },
      ]
    );
  };

  const handleExportData = () => {
    Alert.alert(
      'Export Data',
      'Export your transaction history and wallet information.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Export',
          onPress: () => {
            Alert.alert('Feature', 'Data export functionality will be implemented');
          },
        },
      ]
    );
  };

  const handleApiKeyConfig = (keyType: 'infura' | 'coingecko' | 'custom_eth' | 'custom_btc' | 'custom_sol') => {
    setCurrentApiKeyType(keyType);
    // Load existing API key if available
    loadApiKey(keyType);
    setModalVisible(true);
  };

  const loadApiKey = async (keyType: string) => {
    try {
      const savedKey = await AsyncStorage.getItem(`api_key_${keyType}`);
      setApiKeyValue(savedKey || '');
    } catch (error) {
      console.error('Failed to load API key:', error);
      setApiKeyValue('');
    }
  };

  const saveApiKey = async () => {
    try {
      if (apiKeyValue.trim()) {
        await AsyncStorage.setItem(`api_key_${currentApiKeyType}`, apiKeyValue.trim());
        Alert.alert('Success', 'API key saved successfully');
      } else {
        await AsyncStorage.removeItem(`api_key_${currentApiKeyType}`);
        Alert.alert('Success', 'API key removed');
      }
      
      // Clear the config cache so new API keys take effect immediately
      configService.clearCache();
      
      setModalVisible(false);
      setApiKeyValue('');
    } catch (error) {
      console.error('Failed to save API key:', error);
      Alert.alert('Error', 'Failed to save API key');
    }
  };

  const settingSections = [
    {
      title: 'Account',
      items: [
        {
          icon: 'person-outline',
          title: 'Profile',
          subtitle: 'Manage your account information',
          onPress: () => Alert.alert('Feature', 'Profile management coming soon'),
        },
        {
          icon: 'key-outline',
          title: 'Change Password',
          subtitle: 'Update your account password',
          onPress: () => Alert.alert('Feature', 'Password change coming soon'),
        },
        {
          icon: 'shield-checkmark-outline',
          title: 'Two-Factor Authentication',
          subtitle: 'Add an extra layer of security',
          onPress: () => Alert.alert('Feature', '2FA setup coming soon'),
        },
      ],
    },
    {
      title: 'Network Settings',
      items: [
        {
          icon: 'server-outline',
          title: 'Ethereum API Key',
          subtitle: 'Configure your Infura API key for Ethereum',
          onPress: () => handleApiKeyConfig('infura'),
        },
        {
          icon: 'analytics-outline',
          title: 'Price Data API',
          subtitle: 'CoinGecko API key for price data',
          onPress: () => handleApiKeyConfig('coingecko'),
        },
        {
          icon: 'settings-outline',
          title: 'Custom Ethereum RPC',
          subtitle: 'Set custom Ethereum RPC endpoint',
          onPress: () => handleApiKeyConfig('custom_eth'),
        },
        {
          icon: 'cube-outline',
          title: 'Custom Bitcoin RPC',
          subtitle: 'Set custom Bitcoin RPC endpoint',
          onPress: () => handleApiKeyConfig('custom_btc'),
        },
        {
          icon: 'diamond-outline',
          title: 'Custom Solana RPC',
          subtitle: 'Set custom Solana RPC endpoint',
          onPress: () => handleApiKeyConfig('custom_sol'),
        },
      ],
    },
    {
      title: 'Security',
      items: [
        {
          icon: 'finger-print-outline',
          title: 'Biometric Authentication',
          subtitle: 'Use fingerprint or face recognition',
          rightComponent: (
            <Switch
              value={biometricEnabled}
              onValueChange={setBiometricEnabled}
              trackColor={{ false: COLORS.backgroundTertiary, true: COLORS.primary + '80' }}
              thumbColor={biometricEnabled ? COLORS.primary : COLORS.textSecondary}
            />
          ),
        },
        {
          icon: 'cloud-upload-outline',
          title: 'Backup Wallets',
          subtitle: 'Create secure backup of your wallets',
          onPress: handleBackupWallets,
        },
        {
          icon: 'download-outline',
          title: 'Export Data',
          subtitle: 'Export transaction history and data',
          onPress: handleExportData,
        },
      ],
    },
    {
      title: 'Notifications',
      items: [
        {
          icon: 'notifications-outline',
          title: 'Push Notifications',
          subtitle: 'Receive transaction and security alerts',
          rightComponent: (
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: COLORS.backgroundTertiary, true: COLORS.primary + '80' }}
              thumbColor={notificationsEnabled ? COLORS.primary : COLORS.textSecondary}
            />
          ),
        },
        {
          icon: 'trending-up-outline',
          title: 'Price Alerts',
          subtitle: 'Get notified about price changes',
          rightComponent: (
            <Switch
              value={priceAlertsEnabled}
              onValueChange={setPriceAlertsEnabled}
              trackColor={{ false: COLORS.backgroundTertiary, true: COLORS.primary + '80' }}
              thumbColor={priceAlertsEnabled ? COLORS.primary : COLORS.textSecondary}
            />
          ),
        },
      ],
    },
    {
      title: 'Appearance',
      items: [
        {
          icon: 'moon-outline',
          title: 'Dark Mode',
          subtitle: 'Use dark theme throughout the app',
          rightComponent: (
            <Switch
              value={darkModeEnabled}
              onValueChange={setDarkModeEnabled}
              trackColor={{ false: COLORS.backgroundTertiary, true: COLORS.primary + '80' }}
              thumbColor={darkModeEnabled ? COLORS.primary : COLORS.textSecondary}
            />
          ),
        },
        {
          icon: 'language-outline',
          title: 'Language',
          subtitle: 'English',
          onPress: () => Alert.alert('Feature', 'Language selection coming soon'),
        },
        {
          icon: 'cash-outline',
          title: 'Currency',
          subtitle: 'USD',
          onPress: () => Alert.alert('Feature', 'Currency selection coming soon'),
        },
      ],
    },
    {
      title: 'Support',
      items: [
        {
          icon: 'help-circle-outline',
          title: 'Help & FAQ',
          subtitle: 'Get answers to common questions',
          onPress: () => Alert.alert('Feature', 'Help center coming soon'),
        },
        {
          icon: 'mail-outline',
          title: 'Contact Support',
          subtitle: 'Get help from our support team',
          onPress: () => Alert.alert('Feature', 'Contact support coming soon'),
        },
        {
          icon: 'star-outline',
          title: 'Rate App',
          subtitle: 'Rate us on the app store',
          onPress: () => Alert.alert('Feature', 'App rating coming soon'),
        },
      ],
    },
    {
      title: 'About',
      items: [
        {
          icon: 'information-circle-outline',
          title: 'App Version',
          subtitle: '1.0.0',
          onPress: () => Alert.alert('CryptoWallet', 'Version 1.0.0\nBuilt with React Native'),
        },
        {
          icon: 'document-text-outline',
          title: 'Terms of Service',
          subtitle: 'Read our terms and conditions',
          onPress: () => Alert.alert('Feature', 'Terms of service coming soon'),
        },
        {
          icon: 'lock-closed-outline',
          title: 'Privacy Policy',
          subtitle: 'Learn how we protect your data',
          onPress: () => Alert.alert('Feature', 'Privacy policy coming soon'),
        },
      ],
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={[COLORS.background, COLORS.backgroundSecondary]}
        style={styles.gradient}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Settings</Text>
          {currentUser && (
            <Text style={styles.subtitle}>
              Signed in as {currentUser.username}
            </Text>
          )}
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* User Profile Card */}
          {currentUser && (
            <Card style={styles.profileCard}>
              <View style={styles.profileHeader}>
                <View style={styles.avatar}>
                  <Ionicons name="person" size={32} color={COLORS.textPrimary} />
                </View>
                <View style={styles.profileInfo}>
                  <Text style={styles.profileName}>{currentUser.username}</Text>
                  <Text style={styles.profileEmail}>{currentUser.email}</Text>
                </View>
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() => Alert.alert('Feature', 'Profile editing coming soon')}
                >
                  <Ionicons name="pencil" size={16} color={COLORS.textSecondary} />
                </TouchableOpacity>
              </View>
            </Card>
          )}

          {/* Settings Sections */}
          {settingSections.map((section, sectionIndex) => (
            <View key={sectionIndex} style={styles.section}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              <Card style={styles.sectionCard}>
                {section.items.map((item, itemIndex) => (
                  <TouchableOpacity
                    key={itemIndex}
                    style={[
                      styles.settingItem,
                      itemIndex === section.items.length - 1 && styles.settingItemLast,
                    ]}
                    onPress={item.onPress}
                    disabled={!!item.rightComponent}
                  >
                    <View style={styles.settingIcon}>
                      <Ionicons name={item.icon as any} size={20} color={COLORS.textSecondary} />
                    </View>
                    <View style={styles.settingContent}>
                      <Text style={styles.settingTitle}>{item.title}</Text>
                      <Text style={styles.settingSubtitle}>{item.subtitle}</Text>
                    </View>
                    <View style={styles.settingRight}>
                      {item.rightComponent || (
                        <Ionicons name="chevron-forward" size={16} color={COLORS.textTertiary} />
                      )}
                    </View>
                  </TouchableOpacity>
                ))}
              </Card>
            </View>
          ))}

          {/* Logout Button */}
          <Button
            title="Logout"
            onPress={handleLogout}
            variant="outline"
            style={styles.logoutButton}
          />

          {/* Delete Account Button */}
          <Button
            title="Delete Account"
            onPress={handleDeleteAccount}
            style={StyleSheet.flatten([styles.deleteButton, { backgroundColor: COLORS.error }])}
          />

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              CryptoWallet v1.0.0
            </Text>
            <Text style={styles.footerText}>
              Made with ❤️ for secure crypto management
            </Text>
          </View>
        </ScrollView>
      </LinearGradient>

      {/* API Key Configuration Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => setModalVisible(false)}
              style={styles.modalCloseButton}
            >
              <Ionicons name="close" size={24} color={COLORS.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {currentApiKeyType === 'infura' && 'Ethereum API Key'}
              {currentApiKeyType === 'coingecko' && 'Price Data API Key'}
              {currentApiKeyType === 'custom_eth' && 'Custom Ethereum RPC'}
              {currentApiKeyType === 'custom_btc' && 'Custom Bitcoin RPC'}
              {currentApiKeyType === 'custom_sol' && 'Custom Solana RPC'}
            </Text>
          </View>

          <View style={styles.modalContent}>
            <Text style={styles.modalDescription}>
              {currentApiKeyType === 'infura' && 'Enter your Infura API key to connect to Ethereum network. Get your free API key at infura.io'}
              {currentApiKeyType === 'coingecko' && 'Enter your CoinGecko API key for enhanced price data limits. This is optional.'}
              {currentApiKeyType === 'custom_eth' && 'Enter a custom Ethereum RPC endpoint URL'}
              {currentApiKeyType === 'custom_btc' && 'Enter a custom Bitcoin RPC endpoint URL'}
              {currentApiKeyType === 'custom_sol' && 'Enter a custom Solana RPC endpoint URL'}
            </Text>

            <Input
              label={
                currentApiKeyType.includes('custom') ? 'RPC URL' : 'API Key'
              }
              value={apiKeyValue}
              onChangeText={setApiKeyValue}
              placeholder={
                currentApiKeyType === 'infura' ? 'Your Infura API key...' :
                currentApiKeyType === 'coingecko' ? 'Your CoinGecko API key...' :
                currentApiKeyType === 'custom_eth' ? 'https://mainnet.infura.io/v3/YOUR_KEY' :
                currentApiKeyType === 'custom_btc' ? 'https://blockstream.info/api' :
                'https://api.mainnet-beta.solana.com'
              }
              secureTextEntry={!currentApiKeyType.includes('custom')}
              style={styles.modalInput}
            />

            <View style={styles.modalButtons}>
              <Button
                title="Cancel"
                onPress={() => setModalVisible(false)}
                variant="outline"
                style={StyleSheet.flatten([styles.modalButton, { marginRight: SIZES.spacingMd }])}
              />
              <Button
                title="Save"
                onPress={saveApiKey}
                style={styles.modalButton}
              />
            </View>
          </View>
        </SafeAreaView>
      </Modal>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SIZES.spacingLg,
  },
  profileCard: {
    marginBottom: SIZES.spacingLg,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.backgroundTertiary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SIZES.spacingMd,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    ...FONTS.bold,
    fontSize: SIZES.fontSizeLg,
    color: COLORS.textPrimary,
    marginBottom: SIZES.spacingXs,
  },
  profileEmail: {
    ...FONTS.regular,
    fontSize: SIZES.fontSizeSm,
    color: COLORS.textSecondary,
  },
  editButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.backgroundTertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: {
    marginBottom: SIZES.spacingLg,
  },
  sectionTitle: {
    ...FONTS.medium,
    fontSize: SIZES.fontSizeMd,
    color: COLORS.textPrimary,
    marginBottom: SIZES.spacingMd,
    marginLeft: SIZES.spacingMd,
  },
  sectionCard: {
    paddingVertical: 0,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SIZES.spacingMd,
    paddingHorizontal: SIZES.spacingLg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  settingItemLast: {
    borderBottomWidth: 0,
  },
  settingIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.backgroundTertiary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SIZES.spacingMd,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    ...FONTS.medium,
    fontSize: SIZES.fontSizeMd,
    color: COLORS.textPrimary,
    marginBottom: SIZES.spacingXs,
  },
  settingSubtitle: {
    ...FONTS.regular,
    fontSize: SIZES.fontSizeSm,
    color: COLORS.textSecondary,
  },
  settingRight: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutButton: {
    marginBottom: SIZES.spacingMd,
  },
  deleteButton: {
    marginBottom: SIZES.spacingXl,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: SIZES.spacingLg,
  },
  footerText: {
    ...FONTS.regular,
    fontSize: SIZES.fontSizeXs,
    color: COLORS.textTertiary,
    textAlign: 'center',
    marginBottom: SIZES.spacingXs,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SIZES.spacingLg,
    paddingVertical: SIZES.spacingMd,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalCloseButton: {
    padding: SIZES.spacingSm,
  },
  modalTitle: {
    ...FONTS.bold,
    fontSize: SIZES.fontSizeLg,
    color: COLORS.textPrimary,
    flex: 1,
    textAlign: 'center',
    marginRight: 40, // Balance the close button
  },
  modalContent: {
    flex: 1,
    padding: SIZES.spacingLg,
  },
  modalDescription: {
    ...FONTS.regular,
    fontSize: SIZES.fontSizeSm,
    color: COLORS.textSecondary,
    marginBottom: SIZES.spacingLg,
    lineHeight: 20,
  },
  modalInput: {
    marginBottom: SIZES.spacingLg,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
  },
}); 