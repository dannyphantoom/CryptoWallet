import { SwapTransaction, SwapStatus, CryptoType } from '../types';
import { walletService } from './walletService';
import { SUPPORTED_CRYPTOS } from '../constants/crypto';

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

  async getExchangeRate(fromSymbol: string, toSymbol: string): Promise<number> {
    try {
      if (fromSymbol === toSymbol) {
        return 1;
      }

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
        return toUsdRate / fromUsdRate;
      }

      throw new Error(`Exchange rate not available for ${fromSymbol} to ${toSymbol}`);
    } catch (error) {
      console.error('Failed to get exchange rate:', error);
      throw new Error('Failed to get exchange rate');
    }
  }

  async calculateSwapAmount(
    fromAmount: number,
    fromSymbol: string,
    toSymbol: string
  ): Promise<{ toAmount: number; rate: number; fee: number }> {
    try {
      const rate = await this.getExchangeRate(fromSymbol, toSymbol);
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
    userId: string,
    fromWalletId: string,
    toWalletId: string,
    fromAmount: number,
    toAmount: number,
    fromSymbol: string,
    toSymbol: string
  ): Promise<SwapTransaction> {
    try {
      // Validate wallets
      const fromWallet = walletService.getWallet(fromWalletId);
      const toWallet = walletService.getWallet(toWalletId);

      if (!fromWallet || !toWallet) {
        throw new Error('Invalid wallet');
      }

      if (fromWallet.userId !== userId || toWallet.userId !== userId) {
        throw new Error('Unauthorized access to wallet');
      }

      // Check balance
      const currentBalance = await walletService.getBalance(fromWalletId);
      if (currentBalance < fromAmount) {
        throw new Error('Insufficient balance');
      }

      // Create swap transaction
      const swapTransaction: SwapTransaction = {
        id: `swap_${Date.now()}`,
        userId,
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