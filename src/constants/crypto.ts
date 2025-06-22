import { CryptoInfo, NetworkConfig, CryptoType } from '../types';
import { COLORS } from './theme';
import { CONFIG } from '../../config';

export const SUPPORTED_CRYPTOS: CryptoInfo[] = [
  {
    symbol: 'ETH',
    name: 'Ethereum',
    type: CryptoType.ETHEREUM,
    decimals: 18,
    color: COLORS.ethereum,
    icon: '🔷',
  },
  {
    symbol: 'BTC',
    name: 'Bitcoin',
    type: CryptoType.BITCOIN,
    decimals: 8,
    color: COLORS.bitcoin,
    icon: '🟡',
  },
  {
    symbol: 'SOL',
    name: 'Solana',
    type: CryptoType.SOLANA,
    decimals: 9,
    color: COLORS.solana,
    icon: '🟢',
  },
];

export const NETWORKS: Record<CryptoType, NetworkConfig> = {
  [CryptoType.ETHEREUM]: {
    name: 'Ethereum Mainnet',
    rpcUrl: CONFIG.ethereum.rpcUrl,
    chainId: CONFIG.ethereum.chainId,
    symbol: 'ETH',
    explorerUrl: CONFIG.ethereum.explorerUrl,
  },
  [CryptoType.BITCOIN]: {
    name: 'Bitcoin Mainnet',
    rpcUrl: CONFIG.bitcoin.rpcUrl,
    chainId: 0,
    symbol: 'BTC',
    explorerUrl: CONFIG.bitcoin.explorerUrl,
  },
  [CryptoType.SOLANA]: {
    name: 'Solana Mainnet',
    rpcUrl: CONFIG.solana.rpcUrl,
    chainId: CONFIG.solana.chainId,
    symbol: 'SOL',
    explorerUrl: CONFIG.solana.explorerUrl,
  },
};

export const GAS_LIMITS = {
  [CryptoType.ETHEREUM]: {
    transfer: 21000,
    swap: 150000,
  },
  [CryptoType.BITCOIN]: {
    transfer: 225,
    swap: 225,
  },
  [CryptoType.SOLANA]: {
    transfer: 5000,
    swap: 200000,
  },
};

export const MINIMUM_BALANCES = {
  [CryptoType.ETHEREUM]: 0.001, // ETH
  [CryptoType.BITCOIN]: 0.0001, // BTC
  [CryptoType.SOLANA]: 0.01, // SOL
};

export const TRANSACTION_TIMEOUTS = {
  [CryptoType.ETHEREUM]: 300000, // 5 minutes
  [CryptoType.BITCOIN]: 600000, // 10 minutes
  [CryptoType.SOLANA]: 60000, // 1 minute
}; 