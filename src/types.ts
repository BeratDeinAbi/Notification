export type AssetType = 'STOCK' | 'CRYPTO' | 'COMMODITY';
export type Timeframe = '15m' | '2h' | '4h' | '1d' | '1w';
export type IndicatorType = 'RSI' | 'MACD';
export type ComparisonOperator = 'GREATER_THAN' | 'LESS_THAN' | 'CROSS_ABOVE' | 'CROSS_BELOW';

export interface Asset {
  id: string;
  symbol: string;
  name: string;
  type: AssetType;
  price: number;
  change24h: number;
  change: {
    '15m': number;
    '2h': number;
    '4h': number;
    '1d': number;
    '1w': number;
  };
  rsi: {
    '15m': number;
    '2h': number;
    '4h': number;
    '1d': number;
    '1w': number;
  };
  macd: {
    '15m': { macd: number; signal: number; histogram: number; prevHistogram?: number };
    '2h': { macd: number; signal: number; histogram: number; prevHistogram?: number };
    '4h': { macd: number; signal: number; histogram: number; prevHistogram?: number };
    '1d': { macd: number; signal: number; histogram: number; prevHistogram?: number };
    '1w': { macd: number; signal: number; histogram: number; prevHistogram?: number };
  };
}

export interface RuleCondition {
  id: string;
  indicator: IndicatorType;
  operator: ComparisonOperator;
  threshold?: number;
}

export interface AlertRule {
  id: string;
  assetId: string | 'ALL_CRYPTO' | 'ALL_STOCKS';
  timeframe: Timeframe;
  // Legacy single condition fields (kept for backward compatibility or simple rules)
  indicator: IndicatorType;
  operator: ComparisonOperator;
  threshold?: number;
  // New multi-condition support
  conditions?: RuleCondition[];
  logic?: 'AND' | 'OR'; // Default AND

  active: boolean;
  triggered?: boolean;
  triggeredAt?: Date;
  triggeredValue?: number;
}

export interface Signal {
  id: string;
  ruleId: string;
  assetSymbol: string;
  assetName: string;
  timeframe: Timeframe;
  message: string;
  timestamp: Date;
  type: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
}

export interface EmailConfig {
  serviceId: string;
  templateId: string;
  publicKey: string;
  targetEmail: string;
  enabled: boolean;
}

export interface PortfolioItem {
  id: string;
  assetSymbol: string;
  amount: number;
  buyPrice: number;
  buyDate: string;
  isSold: boolean;
  sellPrice?: number;
  sellDate?: string;
}
