import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  Alert,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Button } from './Button';
import { Input } from './Input';
import { COLORS, SIZES, FONTS } from '../constants/theme';
import { configService } from '../services/configService';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ApiKeyPromptProps {
  visible: boolean;
  keyType: 'infura' | 'coingecko';
  onComplete: () => void;
  onSkip?: () => void;
}

export const ApiKeyPrompt: React.FC<ApiKeyPromptProps> = ({
  visible,
  keyType,
  onComplete,
  onSkip,
}) => {
  const [apiKey, setApiKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const getPromptInfo = () => {
    switch (keyType) {
      case 'infura':
        return {
          title: 'Ethereum Network Access',
          description: 'To use Ethereum features, you need an Infura API key. This is free and takes 2 minutes to set up.',
          placeholder: 'Enter your Infura API key...',
          instructions: 'Get your free API key at infura.io',
          isRequired: true,
        };
      case 'coingecko':
        return {
          title: 'Enhanced Price Data',
          description: 'For real-time price data and better exchange rates, add your CoinGecko API key.',
          placeholder: 'Enter your CoinGecko API key...',
          instructions: 'Get your free API key at coingecko.com/api',
          isRequired: false,
        };
      default:
        return {
          title: 'API Key Required',
          description: 'This feature requires an API key.',
          placeholder: 'Enter API key...',
          instructions: '',
          isRequired: true,
        };
    }
  };

  const handleSave = async () => {
    if (!apiKey.trim()) {
      Alert.alert('Error', 'Please enter a valid API key');
      return;
    }

    setIsLoading(true);
    try {
      await AsyncStorage.setItem(`api_key_${keyType}`, apiKey.trim());
      configService.clearCache();
      Alert.alert('Success', 'API key saved successfully!');
      setApiKey('');
      onComplete();
    } catch (error) {
      console.error('Failed to save API key:', error);
      Alert.alert('Error', 'Failed to save API key');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    const info = getPromptInfo();
    if (info.isRequired) {
      Alert.alert(
        'API Key Required',
        'This feature requires an API key to function properly. You can add it later in Settings.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Skip Anyway', style: 'destructive', onPress: onSkip },
        ]
      );
    } else {
      onSkip?.();
    }
  };

  const info = getPromptInfo();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleSkip}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleSkip} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.title}>{info.title}</Text>
        </View>

        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Ionicons 
              name={keyType === 'infura' ? 'server' : 'analytics'} 
              size={48} 
              color={COLORS.primary} 
            />
          </View>

          <Text style={styles.description}>{info.description}</Text>

          {info.instructions && (
            <Text style={styles.instructions}>{info.instructions}</Text>
          )}

          <Input
            label="API Key"
            value={apiKey}
            onChangeText={setApiKey}
            placeholder={info.placeholder}
            secureTextEntry
            style={styles.input}
          />

          <View style={styles.buttons}>
            {!info.isRequired && (
              <Button
                title="Skip"
                onPress={handleSkip}
                variant="outline"
                style={StyleSheet.flatten([styles.button, { marginRight: SIZES.spacingMd }])}
              />
            )}
            <Button
              title="Save & Continue"
              onPress={handleSave}
              loading={isLoading}
              style={styles.button}
            />
          </View>

          <Text style={styles.note}>
            💡 You can always change this later in Settings → Network Settings
          </Text>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SIZES.spacingLg,
    paddingVertical: SIZES.spacingMd,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  closeButton: {
    padding: SIZES.spacingSm,
  },
  title: {
    ...FONTS.bold,
    fontSize: SIZES.fontSizeLg,
    color: COLORS.textPrimary,
    flex: 1,
    textAlign: 'center',
    marginRight: 40,
  },
  content: {
    flex: 1,
    padding: SIZES.spacingLg,
    alignItems: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SIZES.spacingLg,
  },
  description: {
    ...FONTS.regular,
    fontSize: SIZES.fontSizeMd,
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: SIZES.spacingMd,
    lineHeight: 22,
  },
  instructions: {
    ...FONTS.medium,
    fontSize: SIZES.fontSizeSm,
    color: COLORS.primary,
    textAlign: 'center',
    marginBottom: SIZES.spacingLg,
  },
  input: {
    width: '100%',
    marginBottom: SIZES.spacingLg,
  },
  buttons: {
    flexDirection: 'row',
    width: '100%',
    marginBottom: SIZES.spacingLg,
  },
  button: {
    flex: 1,
  },
  note: {
    ...FONTS.regular,
    fontSize: SIZES.fontSizeXs,
    color: COLORS.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
}); 