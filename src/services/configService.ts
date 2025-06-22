import AsyncStorage from '@react-native-async-storage/async-storage';
import { CONFIG } from '../../config';

export interface DynamicConfig {
  ethereum: {
    rpcUrl: string;
    chainId: number;
    explorerUrl: string;
  };
  bitcoin: {
    rpcUrl: string;
    network: string;
    explorerUrl: string;
  };
  solana: {
    rpcUrl: string;
    chainId: number;
    explorerUrl: string;
  };
  exchange: {
    apiKey: string;
    baseUrl: string;
  };
}

export class ConfigService {
  private static instance: ConfigService;
  private cachedConfig: DynamicConfig | null = null;

  private constructor() {}

  static getInstance(): ConfigService {
    if (!ConfigService.instance) {
      ConfigService.instance = new ConfigService();
    }
    return ConfigService.instance;
  }

  async getConfig(): Promise<DynamicConfig> {
    if (this.cachedConfig) {
      return this.cachedConfig;
    }

    try {
      // Load user-configured API keys
      const infuraKey = await AsyncStorage.getItem('api_key_infura');
      const coingeckoKey = await AsyncStorage.getItem('api_key_coingecko');
      const customEthRpc = await AsyncStorage.getItem('api_key_custom_eth');
      const customBtcRpc = await AsyncStorage.getItem('api_key_custom_btc');
      const customSolRpc = await AsyncStorage.getItem('api_key_custom_sol');

      // Build dynamic configuration
      const dynamicConfig: DynamicConfig = {
        ethereum: {
          rpcUrl: customEthRpc || (infuraKey ? 
            `https://mainnet.infura.io/v3/${infuraKey}` : 
            CONFIG.ethereum.rpcUrl
          ),
          chainId: CONFIG.ethereum.chainId,
          explorerUrl: CONFIG.ethereum.explorerUrl,
        },
        bitcoin: {
          rpcUrl: customBtcRpc || CONFIG.bitcoin.rpcUrl,
          network: CONFIG.bitcoin.network,
          explorerUrl: CONFIG.bitcoin.explorerUrl,
        },
        solana: {
          rpcUrl: customSolRpc || CONFIG.solana.rpcUrl,
          chainId: CONFIG.solana.chainId,
          explorerUrl: CONFIG.solana.explorerUrl,
        },
        exchange: {
          apiKey: coingeckoKey || CONFIG.exchange.apiKey,
          baseUrl: CONFIG.exchange.baseUrl,
        },
      };

      this.cachedConfig = dynamicConfig;
      return dynamicConfig;
    } catch (error) {
      console.error('Failed to load user configuration:', error);
      // Return default config on error
      return {
        ethereum: CONFIG.ethereum,
        bitcoin: CONFIG.bitcoin,
        solana: CONFIG.solana,
        exchange: CONFIG.exchange,
      };
    }
  }

  // Clear cache when API keys are updated
  clearCache(): void {
    this.cachedConfig = null;
  }

  async hasUserApiKey(keyType: 'infura' | 'coingecko' | 'custom_eth' | 'custom_btc' | 'custom_sol'): Promise<boolean> {
    try {
      const value = await AsyncStorage.getItem(`api_key_${keyType}`);
      return !!value && value.trim().length > 0;
    } catch (error) {
      return false;
    }
  }

  async getUserApiKey(keyType: 'infura' | 'coingecko' | 'custom_eth' | 'custom_btc' | 'custom_sol'): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(`api_key_${keyType}`);
    } catch (error) {
      return null;
    }
  }
}

export const configService = ConfigService.getInstance(); 