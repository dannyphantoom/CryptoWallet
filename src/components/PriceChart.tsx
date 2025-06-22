import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { COLORS, FONTS } from '../constants/theme';
import { priceService, HistoricalPriceData, ChartData } from '../services/priceService';
import { CryptoType } from '../types';

const { width } = Dimensions.get('window');

interface PriceChartProps {
  cryptoType: CryptoType;
  height?: number;
  showTimeControls?: boolean;
  style?: any;
}

type TimeFrame = '1H' | '24H' | '7D' | '30D';

export const PriceChart: React.FC<PriceChartProps> = ({ 
  cryptoType, 
  height = 200, 
  showTimeControls = true,
  style 
}) => {
  const [timeFrame, setTimeFrame] = useState<TimeFrame>('24H');
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const timeFrameOptions: { label: string; value: TimeFrame; days: number }[] = [
    { label: '1H', value: '1H', days: 1 },
    { label: '24H', value: '24H', days: 1 },
    { label: '7D', value: '7D', days: 7 },
    { label: '30D', value: '30D', days: 30 },
  ];

  useEffect(() => {
    loadPriceData();
  }, [cryptoType, timeFrame]);

  const loadPriceData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const selectedTimeFrame = timeFrameOptions.find(tf => tf.value === timeFrame);
      const days = selectedTimeFrame?.days || 1;
      
      const historicalData = await priceService.getHistoricalPrices(cryptoType, days);
      const formattedData = priceService.formatChartData(historicalData, timeFrame);
      
      setChartData(formattedData);
    } catch (err) {
      console.error('Failed to load price data:', err);
      setError('Failed to load price data');
    } finally {
      setLoading(false);
    }
  };

  const getCryptoColor = (cryptoType: CryptoType): string => {
    switch (cryptoType) {
      case CryptoType.BITCOIN:
        return COLORS.bitcoin;
      case CryptoType.ETHEREUM:
        return COLORS.ethereum;
      case CryptoType.SOLANA:
        return COLORS.solana;
      default:
        return COLORS.primary;
    }
  };

  const calculatePriceChange = (): { change: number; percentage: number; isPositive: boolean } => {
    if (!chartData?.datasets[0]?.data || chartData.datasets[0].data.length < 2) {
      return { change: 0, percentage: 0, isPositive: true };
    }

    const data = chartData.datasets[0].data;
    const firstPrice = data[0];
    const lastPrice = data[data.length - 1];
    const change = lastPrice - firstPrice;
    const percentage = ((change / firstPrice) * 100);

    return {
      change,
      percentage,
      isPositive: change >= 0,
    };
  };

  const chartConfig = {
    backgroundColor: 'transparent',
    backgroundGradientFrom: 'transparent',
    backgroundGradientTo: 'transparent',
    decimalPlaces: cryptoType === CryptoType.BITCOIN ? 0 : 2,
    color: (opacity = 1) => getCryptoColor(cryptoType) + Math.round(opacity * 255).toString(16).padStart(2, '0'),
    labelColor: (opacity = 1) => COLORS.textSecondary + Math.round(opacity * 255).toString(16).padStart(2, '0'),
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '0',
    },
    propsForBackgroundLines: {
      strokeDasharray: '',
      stroke: COLORS.border,
      strokeWidth: 1,
    },
    formatYLabel: (value: string) => {
      const num = parseFloat(value);
      if (num >= 1000) {
        return `$${(num / 1000).toFixed(1)}k`;
      }
      return `$${num.toFixed(cryptoType === CryptoType.BITCOIN ? 0 : 2)}`;
    },
  };

  if (loading) {
    return (
      <View style={[styles.container, style, { height }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={getCryptoColor(cryptoType)} />
          <Text style={styles.loadingText}>Loading price data...</Text>
        </View>
      </View>
    );
  }

  if (error || !chartData) {
    return (
      <View style={[styles.container, style, { height }]}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error || 'No data available'}</Text>
          <TouchableOpacity onPress={loadPriceData} style={styles.retryButton}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const priceChange = calculatePriceChange();

  return (
    <View style={[styles.container, style]}>
      {/* Price Change Indicator */}
      <View style={styles.priceChangeContainer}>
        <Text style={[
          styles.priceChangeText,
          { color: priceChange.isPositive ? COLORS.success : COLORS.error }
        ]}>
          {priceChange.isPositive ? '+' : ''}{priceChange.percentage.toFixed(2)}%
        </Text>
        <Text style={styles.timeFrameText}>({timeFrame})</Text>
      </View>

      {/* Chart */}
      <LineChart
        data={chartData}
        width={width - 40}
        height={height}
        chartConfig={chartConfig}
        bezier
        style={styles.chart}
        withHorizontalLabels={true}
        withVerticalLabels={false}
        withInnerLines={false}
        withOuterLines={false}
        withHorizontalLines={true}
        withVerticalLines={false}
        segments={3}
      />

      {/* Time Frame Controls */}
      {showTimeControls && (
        <View style={styles.timeControlsContainer}>
          {timeFrameOptions.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.timeButton,
                timeFrame === option.value && [
                  styles.timeButtonActive,
                  { backgroundColor: getCryptoColor(cryptoType) + '20' }
                ]
              ]}
              onPress={() => setTimeFrame(option.value)}
            >
              <Text
                style={[
                  styles.timeButtonText,
                  timeFrame === option.value && [
                    styles.timeButtonTextActive,
                    { color: getCryptoColor(cryptoType) }
                  ]
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: 16,
    padding: 16,
    marginVertical: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    color: COLORS.textSecondary,
    fontSize: 14,
    ...FONTS.regular,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: COLORS.error,
    fontSize: 14,
    ...FONTS.regular,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  retryText: {
    color: COLORS.textPrimary,
    fontSize: 14,
    ...FONTS.medium,
  },
  priceChangeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  priceChangeText: {
    fontSize: 16,
    ...FONTS.bold,
    marginRight: 8,
  },
  timeFrameText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    ...FONTS.regular,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  timeControlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: 4,
  },
  timeButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  timeButtonActive: {
    backgroundColor: COLORS.primary + '20',
  },
  timeButtonText: {
    fontSize: 12,
    ...FONTS.medium,
    color: COLORS.textSecondary,
  },
  timeButtonTextActive: {
    color: COLORS.primary,
    ...FONTS.bold,
  },
}); 