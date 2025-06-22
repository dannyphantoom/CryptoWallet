import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const ENCRYPTION_KEY = 'crypto_wallet_encryption_key';
const WALLET_PREFIX = 'wallet_';
const USER_PREFIX = 'user_';

export class SecurityManager {
  private static instance: SecurityManager;
  private encryptionKey: string | null = null;
  private isWeb: boolean = Platform.OS === 'web';

  private constructor() {}

  static getInstance(): SecurityManager {
    if (!SecurityManager.instance) {
      SecurityManager.instance = new SecurityManager();
    }
    return SecurityManager.instance;
  }

  private async getSecureItem(key: string): Promise<string | null> {
    if (this.isWeb) {
      // Use localStorage for web
      return localStorage.getItem(key);
    } else {
      // Use SecureStore for mobile
      return await SecureStore.getItemAsync(key);
    }
  }

  private async setSecureItem(key: string, value: string): Promise<void> {
    if (this.isWeb) {
      // Use localStorage for web
      localStorage.setItem(key, value);
    } else {
      // Use SecureStore for mobile
      await SecureStore.setItemAsync(key, value);
    }
  }

  async initialize(): Promise<void> {
    try {
      // Try to get existing encryption key
      this.encryptionKey = await this.getSecureItem(ENCRYPTION_KEY);
      
      if (!this.encryptionKey) {
        // Generate new encryption key
        this.encryptionKey = await this.generateEncryptionKey();
        await this.setSecureItem(ENCRYPTION_KEY, this.encryptionKey);
      }
    } catch (error) {
      console.error('Failed to initialize security manager:', error);
      throw new Error('Security initialization failed');
    }
  }

  private async generateEncryptionKey(): Promise<string> {
    const randomBytes = await Crypto.getRandomBytesAsync(32);
    return Array.from(randomBytes, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  async encryptPrivateKey(privateKey: string): Promise<string> {
    if (!this.encryptionKey) {
      throw new Error('Security manager not initialized');
    }

    try {
      // Simple XOR encryption for demo purposes
      // In production, use proper encryption like AES
      const encrypted = privateKey
        .split('')
        .map((char, index) => {
          const keyChar = this.encryptionKey![index % this.encryptionKey!.length];
          return String.fromCharCode(char.charCodeAt(0) ^ keyChar.charCodeAt(0));
        })
        .join('');
      
      // Use btoa instead of Buffer for base64 encoding
      return btoa(encrypted);
    } catch (error) {
      console.error('Encryption failed:', error);
      throw new Error('Failed to encrypt private key');
    }
  }

  async decryptPrivateKey(encryptedPrivateKey: string): Promise<string> {
    if (!this.encryptionKey) {
      throw new Error('Security manager not initialized');
    }

    try {
      // Use atob instead of Buffer for base64 decoding
      const encrypted = atob(encryptedPrivateKey);
      
      // Simple XOR decryption
      const decrypted = encrypted
        .split('')
        .map((char, index) => {
          const keyChar = this.encryptionKey![index % this.encryptionKey!.length];
          return String.fromCharCode(char.charCodeAt(0) ^ keyChar.charCodeAt(0));
        })
        .join('');
      
      return decrypted;
    } catch (error) {
      console.error('Decryption failed:', error);
      throw new Error('Failed to decrypt private key');
    }
  }

  async generateMnemonic(): Promise<string> {
    try {
      const entropy = await Crypto.getRandomBytesAsync(16);
      // In production, use a proper BIP39 implementation
      // This is a simplified version for demo purposes
      const words = [
        'abandon', 'ability', 'able', 'about', 'above', 'absent', 'absorb', 'abstract', 'absurd', 'abuse',
        'access', 'accident', 'account', 'accuse', 'achieve', 'acid', 'acoustic', 'acquire', 'across', 'act',
        'action', 'actor', 'actual', 'adapt', 'add', 'addict', 'address', 'adjust', 'admit', 'adult',
        'advance', 'advice', 'aerobic', 'affair', 'afford', 'afraid', 'again', 'age', 'agent', 'agree'
      ];
      
      const mnemonic = [];
      for (let i = 0; i < 12; i++) {
        const index = entropy[i] % words.length;
        mnemonic.push(words[index]);
      }
      
      return mnemonic.join(' ');
    } catch (error) {
      console.error('Failed to generate mnemonic:', error);
      throw new Error('Failed to generate mnemonic');
    }
  }

  async generateSecurePassword(): Promise<string> {
    try {
      const randomBytes = await Crypto.getRandomBytesAsync(32);
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
      let password = '';
      
      for (let i = 0; i < 16; i++) {
        password += chars[randomBytes[i] % chars.length];
      }
      
      return password;
    } catch (error) {
      console.error('Failed to generate password:', error);
      throw new Error('Failed to generate password');
    }
  }

  async hashPassword(password: string): Promise<string> {
    try {
      const digest = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        password
      );
      return digest;
    } catch (error) {
      console.error('Failed to hash password:', error);
      throw new Error('Failed to hash password');
    }
  }

  async verifyPassword(password: string, hash: string): Promise<boolean> {
    try {
      const passwordHash = await this.hashPassword(password);
      return passwordHash === hash;
    } catch (error) {
      console.error('Failed to verify password:', error);
      return false;
    }
  }
}

export const securityManager = SecurityManager.getInstance(); 