export interface User {
  id: string;
  email: string;
  username: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Wallet {
  id: string;
  userId: string;
  name: string;
  type: CryptoType;
  address: string;
  privateKey: string; // Encrypted
  balance: number;
  symbol: string;
  decimals: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Transaction {
  id: string;
  walletId: string;
  type: TransactionType;
  amount: number;
  fee: number;
  fromAddress: string;
  toAddress: string;
  hash: string;
  status: TransactionStatus;
  timestamp: Date;
  blockNumber?: number;
  gasUsed?: number;
  gasPrice?: number;
  swapInfo?: SwapInfo;
}

export interface SwapInfo {
  fromCrypto: CryptoType;
  toCrypto: CryptoType;
  fromAmount: number;
  toAmount: number;
}

export interface SwapTransaction {
  id: string;
  userId: string;
  fromWalletId: string;
  toWalletId: string;
  fromAmount: number;
  toAmount: number;
  fromSymbol: string;
  toSymbol: string;
  status: SwapStatus;
  timestamp: Date;
  txHash?: string;
}

export enum CryptoType {
  ETHEREUM = 'ethereum',
  BITCOIN = 'bitcoin',
  SOLANA = 'solana',
}

export enum TransactionType {
  SEND = 'send',
  RECEIVE = 'receive',
  SWAP = 'swap',
}

export enum TransactionStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  FAILED = 'failed',
}

export enum SwapStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export interface CryptoInfo {
  symbol: string;
  name: string;
  type: CryptoType;
  decimals: number;
  color: string;
  icon: string;
}

export interface NetworkConfig {
  name: string;
  rpcUrl: string;
  chainId: number;
  symbol: string;
  explorerUrl: string;
}

export interface AppState {
  user: User | null;
  wallets: Wallet[];
  transactions: Transaction[];
  swapTransactions: SwapTransaction[];
  isLoading: boolean;
  error: string | null;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
  error: string | null;
} 