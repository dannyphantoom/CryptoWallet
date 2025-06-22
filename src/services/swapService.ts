import { SwapTransaction, SwapStatus, CryptoType } from '../types';
import { walletService } from './walletService';
import { SUPPORTED_CRYPTOS } from '../constants/crypto';
import { configService } from './configService';

// Mock exchange rates for demo purposes
// In production, integrate with real exchange APIs like CoinGecko, Binance, etc.
const MOCK_EXCHANGE_RATES: Record<string, number> = {
  'ETH_USD': 3000,
  'BTC_USD': 45000,
  'SOL_USD': 100,
  'ETH_BTC': 0.067,
  'SOL_ETH': 0.033,
  'BTC_SOL': 450,
};

export class SwapService {
  private static instance: SwapService;
  private swapTransactions: Map<string, SwapTransaction> = new Map();

  private constructor() {}

  static getInstance(): SwapService {
    if (!SwapService.instance) {
      SwapService.instance = new SwapService();
    }
    return SwapService.instance;
  }

  async getExchangeRate(fromCrypto: CryptoType, toCrypto: CryptoType): Promise<number> {
    try {
      if (fromCrypto === toCrypto) {
        return 1;
      }

      const fromSymbol = this.getCryptoSymbol(fromCrypto);
      const toSymbol = this.getCryptoSymbol(toCrypto);

      // Try to get live exchange rate from CoinGecko API
      try {
        const liveRate = await this.getLiveExchangeRate(fromSymbol, toSymbol);
        if (liveRate) {
          return liveRate;
        }
      } catch (error) {
        console.warn('Failed to get live exchange rate, falling back to mock data:', error);
      }

      // Fallback to mock rates
      // Try direct rate
      const directKey = `${fromSymbol}_${toSymbol}`;
      if (MOCK_EXCHANGE_RATES[directKey]) {
        return MOCK_EXCHANGE_RATES[directKey];
      }

      // Try reverse rate
      const reverseKey = `${toSymbol}_${fromSymbol}`;
      if (MOCK_EXCHANGE_RATES[reverseKey]) {
        return 1 / MOCK_EXCHANGE_RATES[reverseKey];
      }

      // Calculate through USD if available
      const fromUsdRate = MOCK_EXCHANGE_RATES[`${fromSymbol}_USD`];
      const toUsdRate = MOCK_EXCHANGE_RATES[`${toSymbol}_USD`];

      if (fromUsdRate && toUsdRate) {
        return fromUsdRate / toUsdRate;
      }

      throw new Error(`Exchange rate not available for ${fromSymbol} to ${toSymbol}`);
    } catch (error) {
      console.error('Failed to get exchange rate:', error);
      throw new Error('Failed to get exchange rate');
    }
  }

  private async getLiveExchangeRate(fromSymbol: string, toSymbol: string): Promise<number | null> {
    try {
      const config = await configService.getConfig();
      const coinGeckoIds: Record<string, string> = {
        'ETH': 'ethereum',
        'BTC': 'bitcoin',
        'SOL': 'solana'
      };

      const fromId = coinGeckoIds[fromSymbol];
      const toId = coinGeckoIds[toSymbol];

      if (!fromId || !toId) {
        return null;
      }

      const url = `${config.exchange.baseUrl}/simple/price?ids=${fromId}&vs_currencies=${toSymbol.toLowerCase()}`;
      const headers: any = {};
      
      // Add API key if available
      if (config.exchange.apiKey && config.exchange.apiKey !== 'your_api_key_here') {
        headers['X-CG-Pro-API-Key'] = config.exchange.apiKey;
      }

      const response = await fetch(url, { headers });
      const data = await response.json();

      if (data[fromId] && data[fromId][toSymbol.toLowerCase()]) {
        return data[fromId][toSymbol.toLowerCase()];
      }

      return null;
    } catch (error) {
      console.error('Failed to get live exchange rate:', error);
      return null;
    }
  }

  private getCryptoSymbol(cryptoType: CryptoType): string {
    const crypto = SUPPORTED_CRYPTOS.find(c => c.type === cryptoType);
    return crypto?.symbol || cryptoType.toUpperCase();
  }

  async calculateSwapAmount(
    fromAmount: number,
    fromCrypto: CryptoType,
    toCrypto: CryptoType
  ): Promise<{ toAmount: number; rate: number; fee: number }> {
    try {
      const rate = await this.getExchangeRate(fromCrypto, toCrypto);
      const fromSymbol = this.getCryptoSymbol(fromCrypto);
      const fee = this.calculateSwapFee(fromAmount, fromSymbol);
      const toAmount = (fromAmount - fee) * rate;

      return {
        toAmount: Math.max(0, toAmount),
        rate,
        fee,
      };
    } catch (error) {
      console.error('Failed to calculate swap amount:', error);
      throw new Error('Failed to calculate swap amount');
    }
  }

  async executeSwap(
    fromWalletId: string,
    toWalletId: string,
    fromAmount: number,
    toAmount: number
  ): Promise<SwapTransaction> {
    try {
      // Validate wallets
      const fromWallet = walletService.getWallet(fromWalletId);
      const toWallet = walletService.getWallet(toWalletId);

      if (!fromWallet || !toWallet) {
        throw new Error('Invalid wallet');
      }

      if (fromWallet.userId !== toWallet.userId) {
        throw new Error('Can only swap between your own wallets');
      }

      // Check balance
      const currentBalance = await walletService.getBalance(fromWalletId);
      if (currentBalance < fromAmount) {
        throw new Error('Insufficient balance');
      }

      const fromSymbol = this.getCryptoSymbol(fromWallet.type);
      const toSymbol = this.getCryptoSymbol(toWallet.type);

      // Create swap transaction
      const swapTransaction: SwapTransaction = {
        id: `swap_${Date.now()}`,
        userId: fromWallet.userId,
        fromWalletId,
        toWalletId,
        fromAmount,
        toAmount,
        fromSymbol,
        toSymbol,
        status: SwapStatus.PENDING,
        timestamp: new Date(),
      };

      this.swapTransactions.set(swapTransaction.id, swapTransaction);

      // Simulate swap execution
      await this.simulateSwapExecution(swapTransaction);

      return swapTransaction;
    } catch (error) {
      console.error('Failed to execute swap:', error);
      throw new Error('Failed to execute swap');
    }
  }

  private async simulateSwapExecution(swapTransaction: SwapTransaction): Promise<void> {
    try {
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Simulate success (90% success rate for demo)
      const isSuccess = Math.random() > 0.1;

      if (isSuccess) {
        swapTransaction.status = SwapStatus.COMPLETED;
        swapTransaction.txHash = `swap_tx_${Date.now()}_${Math.random().toString(36).substring(2)}`;
        
        // Update wallet balances (in production, this would be done through actual blockchain transactions)
        const fromWallet = walletService.getWallet(swapTransaction.fromWalletId);
        const toWallet = walletService.getWallet(swapTransaction.toWalletId);

        if (fromWallet && toWallet) {
          fromWallet.balance -= swapTransaction.fromAmount;
          toWallet.balance += swapTransaction.toAmount;
          
          walletService.updateWallet(fromWallet);
          walletService.updateWallet(toWallet);
        }
      } else {
        swapTransaction.status = SwapStatus.FAILED;
      }

      this.swapTransactions.set(swapTransaction.id, swapTransaction);
    } catch (error) {
      console.error('Swap execution failed:', error);
      swapTransaction.status = SwapStatus.FAILED;
      this.swapTransactions.set(swapTransaction.id, swapTransaction);
    }
  }

  private calculateSwapFee(amount: number, symbol: string): number {
    // Fee calculation based on crypto type
    const feeRates: Record<string, number> = {
      'ETH': 0.005, // 0.5%
      'BTC': 0.003, // 0.3%
      'SOL': 0.01,  // 1%
    };

    const feeRate = feeRates[symbol] || 0.01;
    return amount * feeRate;
  }

  async getSwapTransaction(swapId: string): Promise<SwapTransaction | undefined> {
    return this.swapTransactions.get(swapId);
  }

  async getSwapTransactionsByUserId(userId: string): Promise<SwapTransaction[]> {
    return Array.from(this.swapTransactions.values()).filter(
      swap => swap.userId === userId
    );
  }

  async getSwapHistory(userId: string): Promise<SwapTransaction[]> {
    const swaps = await this.getSwapTransactionsByUserId(userId);
    return swaps.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  async cancelSwap(swapId: string, userId: string): Promise<boolean> {
    const swap = this.swapTransactions.get(swapId);
    
    if (!swap || swap.userId !== userId) {
      return false;
    }

    if (swap.status === SwapStatus.PENDING) {
      swap.status = SwapStatus.FAILED;
      this.swapTransactions.set(swapId, swap);
      return true;
    }

    return false;
  }

  getSupportedPairs(): Array<{ from: string; to: string; rate: number }> {
    const pairs: Array<{ from: string; to: string; rate: number }> = [];
    const symbols = SUPPORTED_CRYPTOS.map(crypto => crypto.symbol);

    for (let i = 0; i < symbols.length; i++) {
      for (let j = 0; j < symbols.length; j++) {
        if (i !== j) {
          const from = symbols[i];
          const to = symbols[j];
          const rate = this.getStaticExchangeRate(from, to);
          pairs.push({ from, to, rate });
        }
      }
    }

    return pairs;
  }

  private getStaticExchangeRate(fromSymbol: string, toSymbol: string): number {
    const directKey = `${fromSymbol}_${toSymbol}`;
    const reverseKey = `${toSymbol}_${fromSymbol}`;

    if (MOCK_EXCHANGE_RATES[directKey]) {
      return MOCK_EXCHANGE_RATES[directKey];
    }

    if (MOCK_EXCHANGE_RATES[reverseKey]) {
      return 1 / MOCK_EXCHANGE_RATES[reverseKey];
    }

    // Default fallback
    return 1;
  }
}

export const swapService = SwapService.getInstance(); 