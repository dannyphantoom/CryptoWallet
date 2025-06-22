import { ethers } from 'ethers';
import { Connection, Keypair, PublicKey, Transaction as SolanaTransaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import * as bitcoin from 'bitcoinjs-lib';
import * as Crypto from 'expo-crypto';
import { Wallet, Transaction, CryptoType, TransactionType, TransactionStatus } from '../types';
import { NETWORKS, GAS_LIMITS, MINIMUM_BALANCES } from '../constants/crypto';
import { securityManager } from '../utils/security';
import { configService } from './configService';

export class WalletService {
  private static instance: WalletService;
  private wallets: Map<string, Wallet> = new Map();

  private constructor() {}

  static getInstance(): WalletService {
    if (!WalletService.instance) {
      WalletService.instance = new WalletService();
    }
    return WalletService.instance;
  }

  async createWallet(userId: string, cryptoType: CryptoType, name: string): Promise<Wallet> {
    try {
      let address: string;
      let privateKey: string;

      switch (cryptoType) {
        case CryptoType.ETHEREUM:
          const ethWallet = ethers.Wallet.createRandom();
          address = ethWallet.address;
          privateKey = ethWallet.privateKey;
          break;

        case CryptoType.BITCOIN:
          // Simplified Bitcoin wallet creation for demo
          // In production, use proper BIP32/BIP39 implementation
          const randomBytes = await Crypto.getRandomBytesAsync(32);
          // For demo purposes, create a mock Bitcoin address
          const hexString = Array.from(randomBytes, byte => byte.toString(16).padStart(2, '0')).join('');
          address = `bc1${hexString.substring(0, 40)}`;
          privateKey = hexString;
          break;

        case CryptoType.SOLANA:
          const solanaKeypair = Keypair.generate();
          address = solanaKeypair.publicKey.toString();
          // Convert Uint8Array to base64 string without Buffer
          const secretKeyArray = Array.from(solanaKeypair.secretKey);
          privateKey = btoa(String.fromCharCode(...secretKeyArray));
          break;

        default:
          throw new Error(`Unsupported crypto type: ${cryptoType}`);
      }

      const encryptedPrivateKey = await securityManager.encryptPrivateKey(privateKey);
      
      const wallet: Wallet = {
        id: `${cryptoType}_${Date.now()}`,
        userId,
        name,
        type: cryptoType,
        address,
        privateKey: encryptedPrivateKey,
        balance: 0,
        symbol: NETWORKS[cryptoType].symbol,
        decimals: this.getDecimals(cryptoType),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      this.wallets.set(wallet.id, wallet);
      return wallet;
    } catch (error) {
      console.error('Failed to create wallet:', error);
      throw new Error('Failed to create wallet');
    }
  }



  async sendTransaction(
    walletId: string,
    toAddress: string,
    amount: number,
    fee?: number
  ): Promise<Transaction> {
    const wallet = this.wallets.get(walletId);
    if (!wallet) {
      throw new Error('Wallet not found');
    }

    try {
      const privateKey = await securityManager.decryptPrivateKey(wallet.privateKey);
      let txHash: string;
      let gasUsed: number | undefined;
      let gasPrice: number | undefined;

      switch (wallet.type) {
        case CryptoType.ETHEREUM:
          const ethResult = await this.sendEthereumTransaction(
            privateKey,
            toAddress,
            amount,
            fee
          );
          txHash = ethResult.hash;
          gasUsed = ethResult.gasUsed;
          gasPrice = ethResult.gasPrice;
          break;

        case CryptoType.BITCOIN:
          txHash = await this.sendBitcoinTransaction(
            privateKey,
            toAddress,
            amount,
            fee
          );
          break;

        case CryptoType.SOLANA:
          txHash = await this.sendSolanaTransaction(
            privateKey,
            toAddress,
            amount,
            fee
          );
          break;

        default:
          throw new Error(`Unsupported crypto type: ${wallet.type}`);
      }

      const transaction: Transaction = {
        id: `tx_${Date.now()}`,
        walletId,
        type: TransactionType.SEND,
        amount,
        fee: fee || 0,
        fromAddress: wallet.address,
        toAddress,
        hash: txHash,
        status: TransactionStatus.PENDING,
        timestamp: new Date(),
        gasUsed,
        gasPrice,
      };

      return transaction;
    } catch (error) {
      console.error('Failed to send transaction:', error);
      throw new Error('Failed to send transaction');
    }
  }

  private async getEthereumBalance(address: string): Promise<number> {
    try {
      const config = await configService.getConfig();
      const provider = new ethers.JsonRpcProvider(config.ethereum.rpcUrl);
      const balance = await provider.getBalance(address);
      return parseFloat(ethers.formatEther(balance));
    } catch (error) {
      console.error('Failed to get Ethereum balance:', error);
      return 0;
    }
  }

  private async getBitcoinBalance(address: string): Promise<number> {
    try {
      const config = await configService.getConfig();
      const response = await fetch(`${config.bitcoin.rpcUrl}/address/${address}`);
      const data = await response.json();
      return data.chain_stats.funded_txo_sum / 100000000; // Convert satoshis to BTC
    } catch (error) {
      console.error('Failed to get Bitcoin balance:', error);
      return 0;
    }
  }

  private async getSolanaBalance(address: string): Promise<number> {
    try {
      const config = await configService.getConfig();
      const connection = new Connection(config.solana.rpcUrl);
      const publicKey = new PublicKey(address);
      const balance = await connection.getBalance(publicKey);
      return balance / LAMPORTS_PER_SOL;
    } catch (error) {
      console.error('Failed to get Solana balance:', error);
      return 0;
    }
  }

  private async sendEthereumTransaction(
    privateKey: string,
    toAddress: string,
    amount: number,
    fee?: number
  ): Promise<{ hash: string; gasUsed: number; gasPrice: number }> {
    const config = await configService.getConfig();
    const provider = new ethers.JsonRpcProvider(config.ethereum.rpcUrl);
    const wallet = new ethers.Wallet(privateKey, provider);
    
    const gasPrice = fee || await provider.getFeeData().then(data => data.gasPrice!);
    const gasLimit = GAS_LIMITS[CryptoType.ETHEREUM].transfer;
    
    const tx = await wallet.sendTransaction({
      to: toAddress,
      value: ethers.parseEther(amount.toString()),
      gasLimit,
      gasPrice,
    });

    const receipt = await tx.wait();
    
    return {
      hash: tx.hash,
      gasUsed: Number(receipt?.gasUsed || 0),
      gasPrice: Number(gasPrice),
    };
  }

  private async sendBitcoinTransaction(
    privateKey: string,
    toAddress: string,
    amount: number,
    fee?: number
  ): Promise<string> {
    // For demo purposes, simulate Bitcoin transaction
    // In production, implement proper Bitcoin transaction signing
    console.log(`Simulating Bitcoin transaction: ${amount} BTC to ${toAddress}`);
    await new Promise(resolve => setTimeout(resolve, 1000));
    return `btc_tx_${Date.now()}_${Math.random().toString(36).substring(2)}`;
  }

  private async sendSolanaTransaction(
    privateKey: string,
    toAddress: string,
    amount: number,
    fee?: number
  ): Promise<string> {
    try {
      // For demo purposes, simulate Solana transaction
      // In production, implement proper Solana transaction
      console.log(`Simulating Solana transaction: ${amount} SOL to ${toAddress}`);
      await new Promise(resolve => setTimeout(resolve, 1000));
      return `sol_tx_${Date.now()}_${Math.random().toString(36).substring(2)}`;
    } catch (error) {
      console.error('Solana transaction failed:', error);
      throw new Error('Failed to send Solana transaction');
    }
  }

  private getDecimals(cryptoType: CryptoType): number {
    switch (cryptoType) {
      case CryptoType.ETHEREUM:
        return 18;
      case CryptoType.BITCOIN:
        return 8;
      case CryptoType.SOLANA:
        return 9;
      default:
        return 18;
    }
  }

  getWallet(walletId: string): Wallet | undefined {
    return this.wallets.get(walletId);
  }

  getWalletsByUserId(userId: string): Wallet[] {
    return Array.from(this.wallets.values()).filter(wallet => wallet.userId === userId);
  }

  updateWallet(wallet: Wallet): void {
    wallet.updatedAt = new Date();
    this.wallets.set(wallet.id, wallet);
  }

  deleteWallet(walletId: string): boolean {
    return this.wallets.delete(walletId);
  }

  async initializeDemoWallets(userId: string): Promise<void> {
    // Check if user already has wallets
    const existingWallets = this.getWalletsByUserId(userId);
    if (existingWallets.length > 0) {
      return; // User already has wallets
    }

    try {
      // Create demo wallets for each supported crypto
      await this.createWallet(userId, CryptoType.ETHEREUM, 'My ETH Wallet');
      await this.createWallet(userId, CryptoType.BITCOIN, 'My BTC Wallet');
      await this.createWallet(userId, CryptoType.SOLANA, 'My SOL Wallet');

      // Add some demo balances (mock data with variety)
      const userWallets = this.getWalletsByUserId(userId);
      userWallets.forEach(wallet => {
        let balance: number;
        switch (wallet.type) {
          case CryptoType.ETHEREUM:
            // Random between 0.1 and 5.0 ETH
            balance = 0.1 + Math.random() * 4.9;
            break;
          case CryptoType.BITCOIN:
            // Random between 0.001 and 0.1 BTC
            balance = 0.001 + Math.random() * 0.099;
            break;
          case CryptoType.SOLANA:
            // Random between 5 and 100 SOL
            balance = 5 + Math.random() * 95;
            break;
          default:
            balance = 0;
        }
        wallet.balance = parseFloat(balance.toFixed(6));
        this.updateWallet(wallet);
      });

      console.log('Demo wallets initialized for user:', userId);
    } catch (error) {
      console.error('Failed to initialize demo wallets:', error);
    }
  }

  async getBalance(walletId: string): Promise<number> {
    const wallet = this.wallets.get(walletId);
    if (!wallet) {
      throw new Error('Wallet not found');
    }

    try {
      let balance: number;
      
      switch (wallet.type) {
        case CryptoType.ETHEREUM:
          balance = await this.getEthereumBalance(wallet.address);
          break;
        case CryptoType.BITCOIN:
          balance = await this.getBitcoinBalance(wallet.address);
          break;
        case CryptoType.SOLANA:
          balance = await this.getSolanaBalance(wallet.address);
          break;
        default:
          // For demo purposes, return stored balance if unable to fetch
          balance = wallet.balance || 0;
      }

      // Update wallet with fetched balance
      wallet.balance = balance;
      wallet.updatedAt = new Date();
      this.wallets.set(walletId, wallet);
      
      return balance;
    } catch (error) {
      console.error(`Failed to get balance for ${wallet.type}:`, error);
      // Return stored balance as fallback
      return wallet.balance || 0;
    }
  }

  // Add method to find user by username or address
  async findUserByIdentifier(identifier: string): Promise<{ address: string; username?: string } | null> {
    // For demo purposes, simulate user lookup
    // In production, this would query your user database
    
    if (identifier.includes('@')) {
      // Email format - simulate user lookup
      return {
        address: `0x${Math.random().toString(16).substring(2, 42)}`,
        username: identifier.split('@')[0]
      };
    }
    
    if (identifier.length >= 20) {
      // Looks like an address
      return {
        address: identifier
      };
    }
    
    // Username format - simulate user lookup
    return {
      address: `0x${Math.random().toString(16).substring(2, 42)}`,
      username: identifier
    };
  }

  // Add method to get transaction history
  async getTransactionHistory(walletId: string): Promise<Transaction[]> {
    // For demo purposes, return mock transactions
    // In production, fetch from blockchain/database
    return [
      {
        id: `tx_${Date.now()}_1`,
        walletId,
        type: TransactionType.RECEIVE,
        amount: 1.5,
        fee: 0.002,
        fromAddress: '0x1234567890abcdef1234567890abcdef12345678',
        toAddress: this.wallets.get(walletId)?.address || '',
        hash: `0x${Math.random().toString(16).substring(2, 66)}`,
        status: TransactionStatus.CONFIRMED,
        timestamp: new Date(Date.now() - 86400000), // 1 day ago
      },
      {
        id: `tx_${Date.now()}_2`,
        walletId,
        type: TransactionType.SEND,
        amount: 0.5,
        fee: 0.001,
        fromAddress: this.wallets.get(walletId)?.address || '',
        toAddress: '0x9876543210fedcba9876543210fedcba98765432',
        hash: `0x${Math.random().toString(16).substring(2, 66)}`,
        status: TransactionStatus.CONFIRMED,
        timestamp: new Date(Date.now() - 172800000), // 2 days ago
      }
    ];
  }
}

export const walletService = WalletService.getInstance(); 