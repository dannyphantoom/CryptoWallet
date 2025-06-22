import { ethers } from 'ethers';
import { Connection, Keypair, PublicKey, Transaction as SolanaTransaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import * as bitcoin from 'bitcoinjs-lib';
import { Wallet, Transaction, CryptoType, TransactionType, TransactionStatus } from '../types';
import { NETWORKS, GAS_LIMITS, MINIMUM_BALANCES } from '../constants/crypto';
import { securityManager } from '../utils/security';

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
          const randomBytes = await crypto.getRandomValues(new Uint8Array(32));
          // For demo purposes, create a mock Bitcoin address
          address = `bc1${Buffer.from(randomBytes).toString('hex').substring(0, 40)}`;
          privateKey = Buffer.from(randomBytes).toString('hex');
          break;

        case CryptoType.SOLANA:
          const solanaKeypair = Keypair.generate();
          address = solanaKeypair.publicKey.toString();
          privateKey = Buffer.from(solanaKeypair.secretKey).toString('base64');
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
      const provider = new ethers.JsonRpcProvider(NETWORKS[CryptoType.ETHEREUM].rpcUrl);
      const balance = await provider.getBalance(address);
      return parseFloat(ethers.formatEther(balance));
    } catch (error) {
      console.error('Failed to get Ethereum balance:', error);
      return 0;
    }
  }

  private async getBitcoinBalance(address: string): Promise<number> {
    try {
      const response = await fetch(`${NETWORKS[CryptoType.BITCOIN].rpcUrl}/address/${address}`);
      const data = await response.json();
      return data.chain_stats.funded_txo_sum / 100000000; // Convert satoshis to BTC
    } catch (error) {
      console.error('Failed to get Bitcoin balance:', error);
      return 0;
    }
  }

  private async getSolanaBalance(address: string): Promise<number> {
    try {
      const connection = new Connection(NETWORKS[CryptoType.SOLANA].rpcUrl);
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
    const provider = new ethers.JsonRpcProvider(NETWORKS[CryptoType.ETHEREUM].rpcUrl);
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
    // Simplified Bitcoin transaction for demo purposes
    // In production, implement proper UTXO handling
    const txHash = `btc_${Date.now()}_${Math.random().toString(36).substring(2)}`;
    return txHash;
  }

  private async sendSolanaTransaction(
    privateKey: string,
    toAddress: string,
    amount: number,
    fee?: number
  ): Promise<string> {
    const connection = new Connection(NETWORKS[CryptoType.SOLANA].rpcUrl);
    const keypair = Keypair.fromSecretKey(Buffer.from(privateKey, 'base64'));
    const toPublicKey = new PublicKey(toAddress);
    
    const transaction = new SolanaTransaction().add(
      SystemProgram.transfer({
        fromPubkey: keypair.publicKey,
        toPubkey: toPublicKey,
        lamports: amount * LAMPORTS_PER_SOL,
      })
    );

    const signature = await connection.sendTransaction(transaction, [keypair]);
    return signature;
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

      // Add some demo balances (mock data)
      const userWallets = this.getWalletsByUserId(userId);
      userWallets.forEach(wallet => {
        switch (wallet.type) {
          case CryptoType.ETHEREUM:
            wallet.balance = 1.5; // 1.5 ETH
            break;
          case CryptoType.BITCOIN:
            wallet.balance = 0.05; // 0.05 BTC
            break;
          case CryptoType.SOLANA:
            wallet.balance = 25.0; // 25 SOL
            break;
        }
        this.updateWallet(wallet);
      });

      console.log('Demo wallets initialized for user:', userId);
    } catch (error) {
      console.error('Failed to initialize demo wallets:', error);
    }
  }

  // Override getBalance for demo purposes to return mock data
  async getBalance(walletId: string): Promise<number> {
    const wallet = this.wallets.get(walletId);
    if (!wallet) {
      throw new Error('Wallet not found');
    }

    // For demo purposes, return the stored balance or generate mock balance
    if (wallet.balance !== undefined && wallet.balance > 0) {
      return wallet.balance;
    }

    // Generate mock balance based on crypto type
    let mockBalance: number;
    switch (wallet.type) {
      case CryptoType.ETHEREUM:
        mockBalance = Math.random() * 5; // 0-5 ETH
        break;
      case CryptoType.BITCOIN:
        mockBalance = Math.random() * 0.1; // 0-0.1 BTC
        break;
      case CryptoType.SOLANA:
        mockBalance = Math.random() * 100; // 0-100 SOL
        break;
      default:
        mockBalance = 0;
    }

    wallet.balance = mockBalance;
    this.updateWallet(wallet);
    return mockBalance;
  }
}

export const walletService = WalletService.getInstance(); 