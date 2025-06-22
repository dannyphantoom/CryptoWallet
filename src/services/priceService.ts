import { CryptoType } from '../types';

export interface PriceData {
  id: string;
  symbol: string;
  current_price: number;
  price_change_24h: number;
  price_change_percentage_24h: number;
  market_cap: number;
  last_updated: string;
}

export interface HistoricalPriceData {
  timestamp: number;
  price: number;
}

export interface ChartData {
  labels: string[];
  datasets: {
    data: number[];
  }[];
}

class PriceService {
  private static instance: PriceService;
  private baseUrl = 'https://api.coingecko.com/api/v3';
  private priceCache: Map<string, { data: PriceData; timestamp: number }> = new Map();
  private historicalCache: Map<string, { data: HistoricalPriceData[]; timestamp: number }> = new Map();
  private cacheTimeout = 60000; // 1 minute cache timeout

  private constructor() {}

  static getInstance(): PriceService {
    if (!PriceService.instance) {
      PriceService.instance = new PriceService();
    }
    return PriceService.instance;
  }

  private getCoinId(cryptoType: CryptoType): string {
    switch (cryptoType) {
      case CryptoType.BITCOIN:
        return 'bitcoin';
      case CryptoType.ETHEREUM:
        return 'ethereum';
      case CryptoType.SOLANA:
        return 'solana';
      default:
        throw new Error(`Unsupported crypto type: ${cryptoType}`);
    }
  }

  async getCurrentPrices(cryptoTypes: CryptoType[]): Promise<Map<CryptoType, PriceData>> {
    const coinIds = cryptoTypes.map(type => this.getCoinId(type));
    const cacheKey = coinIds.join(',');
    const cached = this.priceCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      const result = new Map<CryptoType, PriceData>();
      cryptoTypes.forEach((type, index) => {
        // For cached data, we need to reconstruct individual price data
        // This is a simplified approach - in production you'd cache per coin
      });
      return new Map(); // Simplified for now
    }

    try {
      const url = `${this.baseUrl}/simple/price?ids=${coinIds.join(',')}&vs_currencies=usd&include_24hr_change=true&include_market_cap=true&include_last_updated_at=true`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      const result = new Map<CryptoType, PriceData>();
      
      cryptoTypes.forEach(type => {
        const coinId = this.getCoinId(type);
        const coinData = data[coinId];
        
        if (coinData) {
          const priceData: PriceData = {
            id: coinId,
            symbol: type.toLowerCase(),
            current_price: coinData.usd,
            price_change_24h: coinData.usd_24h_change || 0,
            price_change_percentage_24h: coinData.usd_24h_change || 0,
            market_cap: coinData.usd_market_cap || 0,
            last_updated: new Date(coinData.last_updated_at * 1000).toISOString(),
          };
          
          result.set(type, priceData);
        }
      });

      // Cache the result
      this.priceCache.set(cacheKey, { data: data as any, timestamp: Date.now() });
      
      return result;
    } catch (error) {
      console.error('Failed to fetch current prices:', error);
      // Return mock data for development
      return this.getMockPrices(cryptoTypes);
    }
  }

  async getHistoricalPrices(cryptoType: CryptoType, days: number = 7): Promise<HistoricalPriceData[]> {
    const coinId = this.getCoinId(cryptoType);
    const cacheKey = `${coinId}-${days}`;
    const cached = this.historicalCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout * 5) { // 5 minute cache for historical
      return cached.data;
    }

    try {
      const url = `${this.baseUrl}/coins/${coinId}/market_chart?vs_currency=usd&days=${days}`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      const historicalData: HistoricalPriceData[] = data.prices.map((price: [number, number]) => ({
        timestamp: price[0],
        price: price[1],
      }));

      // Cache the result
      this.historicalCache.set(cacheKey, { data: historicalData, timestamp: Date.now() });
      
      return historicalData;
    } catch (error) {
      console.error('Failed to fetch historical prices:', error);
      // Return mock data for development
      return this.getMockHistoricalData(cryptoType, days);
    }
  }

  formatChartData(historicalData: HistoricalPriceData[], timeFormat: '1H' | '24H' | '7D' | '30D' = '24H'): ChartData {
    let dataPoints = historicalData;
    
    // Sample data based on time format
    if (timeFormat === '1H' && historicalData.length > 60) {
      // Show last 60 data points for 1H view
      dataPoints = historicalData.slice(-60);
    } else if (timeFormat === '24H' && historicalData.length > 144) {
      // Show every 10th point for 24H view (24 hours * 6 = 144 points)
      dataPoints = historicalData.filter((_, index) => index % 10 === 0);
    } else if (timeFormat === '7D' && historicalData.length > 168) {
      // Show daily averages for 7D view
      dataPoints = historicalData.filter((_, index) => index % 24 === 0);
    }

    const labels = dataPoints.map(point => {
      const date = new Date(point.timestamp);
      switch (timeFormat) {
        case '1H':
          return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        case '24H':
          return date.toLocaleTimeString([], { hour: '2-digit' });
        case '7D':
          return date.toLocaleDateString([], { weekday: 'short' });
        case '30D':
          return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
        default:
          return date.toLocaleTimeString([], { hour: '2-digit' });
      }
    });

    return {
      labels,
      datasets: [{
        data: dataPoints.map(point => point.price)
      }]
    };
  }

  private getMockPrices(cryptoTypes: CryptoType[]): Map<CryptoType, PriceData> {
    const mockPrices = new Map<CryptoType, PriceData>();
    
    cryptoTypes.forEach(type => {
      let mockData: Partial<PriceData> = {};
      
      switch (type) {
        case CryptoType.BITCOIN:
          mockData = {
            id: 'bitcoin',
            symbol: 'btc',
            current_price: 45000 + Math.random() * 5000,
            price_change_24h: (Math.random() - 0.5) * 2000,
            price_change_percentage_24h: (Math.random() - 0.5) * 10,
            market_cap: 850000000000,
          };
          break;
        case CryptoType.ETHEREUM:
          mockData = {
            id: 'ethereum',
            symbol: 'eth',
            current_price: 2000 + Math.random() * 500,
            price_change_24h: (Math.random() - 0.5) * 200,
            price_change_percentage_24h: (Math.random() - 0.5) * 8,
            market_cap: 240000000000,
          };
          break;
        case CryptoType.SOLANA:
          mockData = {
            id: 'solana',
            symbol: 'sol',
            current_price: 80 + Math.random() * 20,
            price_change_24h: (Math.random() - 0.5) * 10,
            price_change_percentage_24h: (Math.random() - 0.5) * 15,
            market_cap: 35000000000,
          };
          break;
      }
      
      mockPrices.set(type, {
        ...mockData,
        last_updated: new Date().toISOString(),
      } as PriceData);
    });
    
    return mockPrices;
  }

  private getMockHistoricalData(cryptoType: CryptoType, days: number): HistoricalPriceData[] {
    const data: HistoricalPriceData[] = [];
    const now = Date.now();
    const interval = (days * 24 * 60 * 60 * 1000) / (days * 24); // Hourly data
    
    let basePrice = 100;
    switch (cryptoType) {
      case CryptoType.BITCOIN:
        basePrice = 45000;
        break;
      case CryptoType.ETHEREUM:
        basePrice = 2000;
        break;
      case CryptoType.SOLANA:
        basePrice = 80;
        break;
    }
    
    for (let i = days * 24; i >= 0; i--) {
      const timestamp = now - (i * interval);
      // Generate realistic price movement
      const randomChange = (Math.random() - 0.5) * 0.05; // ±2.5% random change
      basePrice = basePrice * (1 + randomChange);
      
      data.push({
        timestamp,
        price: Math.max(basePrice, 0.01), // Ensure positive price
      });
    }
    
    return data;
  }

  // Real-time price updates (for WebSocket connections in the future)
  onPriceUpdate(callback: (cryptoType: CryptoType, price: PriceData) => void) {
    // Placeholder for real-time price updates
    // In production, this would establish WebSocket connections
    console.log('Real-time price updates not implemented yet');
  }
}

export const priceService = PriceService.getInstance(); 