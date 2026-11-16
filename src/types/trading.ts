export type TradingPlatform = 'Groww' | 'Zerodha' | 'Upstox' | 'AngelOne' | 'Dhan' | 'Other';

export type TradeType = 'Intraday' | 'Delivery' | 'F&O' | 'IPO' | 'ETF' | 'Commodity' | 'Crypto' | 'Other';

export type TradeStatus = 'Open' | 'Closed' | 'Partially Sold' | 'Cancelled';

export interface Trade {
  id: string;
  date: string; // YYYY-MM-DD
  assetName: string; // e.g., Tata Motors
  symbol: string; // e.g., TATAMOTORS
  platform: TradingPlatform;
  tradeType: TradeType;
  buyPrice: number;
  sellPrice: number;
  currentMarketPrice?: number; // Latest market price for Open positions
  quantity: number;
  brokerage: number;
  taxesAndCharges: number; // STT, GST, Stamp Duty, Exchange turnover fees
  status: TradeStatus;
  notes?: string;
  createdAt: number;
  updatedAt: number;
}

export type CapitalTransactionType = 'Initial' | 'Deposit' | 'Withdrawal';

export interface CapitalTransaction {
  id: string;
  date: string; // YYYY-MM-DD
  type: CapitalTransactionType;
  amount: number;
  platform?: string;
  notes?: string;
  createdAt: number;
}

export interface CalculatedTradeMetrics {
  totalPurchaseAmount: number;
  totalSellingAmount: number;
  grossPnL: number;
  totalCharges: number;
  netPnL: number;
  returnPercentage: number;
  unrealizedPnL: number;
}

export interface DayPerformance {
  date: string;
  investedAmount: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  totalProfit: number;
  totalLoss: number;
  netPnL: number;
  totalCharges: number;
  winRate: number;
  dailyReturnPercentage: number;
  bestTrade?: { symbol: string; pnl: number };
  worstTrade?: { symbol: string; pnl: number };
}
