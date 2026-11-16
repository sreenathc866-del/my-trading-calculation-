import type { Trade, CalculatedTradeMetrics, CapitalTransaction } from '../types/trading';

/**
 * Format any number as Indian Rupee currency (e.g. ₹1,23,456.00)
 */
export function formatINR(amount: number, showDecimals: boolean = true): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return '₹0.00';
  }
  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);

  const formatted = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: showDecimals ? 2 : 0,
  }).format(absAmount);

  return isNegative ? `-${formatted}` : formatted;
}

export function formatPercent(value: number): string {
  if (isNaN(value) || !isFinite(value)) return '0.00%';
  const prefix = value > 0 ? '+' : '';
  return `${prefix}${value.toFixed(2)}%`;
}

/**
 * Calculate trade metrics for a single trade according to specifications:
 * Gross P&L = (Sell Price − Buy Price) × Quantity
 * Net P&L = Gross P&L − Brokerage − Taxes − Other Charges
 * Return % = (Net P&L ÷ Purchase Amount) × 100
 */
export function calculateTradeMetrics(trade: Trade): CalculatedTradeMetrics {
  const buyPrice = trade.buyPrice || 0;
  const sellPrice = trade.sellPrice || 0;
  const qty = trade.quantity || 0;
  const brokerage = trade.brokerage || 0;
  const taxes = trade.taxesAndCharges || 0;
  const totalCharges = brokerage + taxes;

  const totalPurchaseAmount = buyPrice * qty;
  const totalSellingAmount = sellPrice * qty;

  // If trade is Closed or Partially Sold
  if (trade.status === 'Closed' || (trade.status === 'Partially Sold' && sellPrice > 0)) {
    const grossPnL = (sellPrice - buyPrice) * qty;
    const netPnL = grossPnL - totalCharges;
    const returnPercentage = totalPurchaseAmount > 0 ? (netPnL / totalPurchaseAmount) * 100 : 0;
    return {
      totalPurchaseAmount,
      totalSellingAmount,
      grossPnL,
      totalCharges,
      netPnL,
      returnPercentage,
      unrealizedPnL: 0,
    };
  }

  // If trade is Open
  if (trade.status === 'Open') {
    // Current market price falls back to buy price if not entered
    const cmp = trade.currentMarketPrice !== undefined && trade.currentMarketPrice !== null && trade.currentMarketPrice > 0
      ? trade.currentMarketPrice
      : buyPrice;

    // Unrealized Gross P&L based on CMP
    const unrealizedGross = (cmp - buyPrice) * qty;
    const unrealizedPnL = unrealizedGross - totalCharges;
    const returnPercentage = totalPurchaseAmount > 0 ? (unrealizedPnL / totalPurchaseAmount) * 100 : 0;

    return {
      totalPurchaseAmount,
      totalSellingAmount: 0,
      grossPnL: 0, // Realized is 0 for Open positions
      totalCharges,
      netPnL: 0, // Not realized
      returnPercentage,
      unrealizedPnL,
    };
  }

  // Cancelled or other
  return {
    totalPurchaseAmount: 0,
    totalSellingAmount: 0,
    grossPnL: 0,
    totalCharges,
    netPnL: -totalCharges, // Any charges paid on cancelled
    returnPercentage: 0,
    unrealizedPnL: 0,
  };
}

export interface PortfolioSummary {
  totalTradingCapital: number;
  totalDeposited: number;
  totalWithdrawn: number;
  totalInvestment: number;
  currentPortfolioValue: number;
  totalRealizedProfit: number;
  totalRealizedLoss: number;
  netRealizedPnL: number;
  currentUnrealizedPnL: number;
  todayPnL: number;
  todayReturnPct: number;
  thisWeekPnL: number;
  thisMonthPnL: number;
  overallPnLPercentage: number;
  availableCash: number;
  totalChargesPaid: number;
  totalTradesCount: number;
  closedTradesCount: number;
  winningTradesCount: number;
  losingTradesCount: number;
  winRate: number;
}

/**
 * Calculates complete dashboard metrics given all trades and capital transactions.
 */
export function calculateDashboardSummary(
  trades: Trade[],
  capitalTransactions: CapitalTransaction[]
): PortfolioSummary {
  // 1. Capital Transactions breakdown
  let totalDeposited = 0;
  let totalWithdrawn = 0;

  for (const tx of capitalTransactions) {
    if (tx.type === 'Deposit' || tx.type === 'Initial') {
      totalDeposited += tx.amount || 0;
    } else if (tx.type === 'Withdrawal') {
      totalWithdrawn += tx.amount || 0;
    }
  }

  // 2. Trades breakdown
  let totalRealizedProfit = 0;
  let totalRealizedLoss = 0;
  let totalChargesPaid = 0;
  let currentUnrealizedPnL = 0;
  let currentOpenPositionsCost = 0;
  let currentOpenPositionsMarketVal = 0;

  let winningTradesCount = 0;
  let losingTradesCount = 0;
  let closedTradesCount = 0;

  // Dates handling in IST / local time
  const now = new Date();
  const todayStr = getLocalDateString(now);

  const startOfWeek = getStartOfWeek(now);
  const startOfMonth = getStartOfMonth(now);

  let todayPnL = 0;
  let todayInvested = 0;
  let thisWeekPnL = 0;
  let thisMonthPnL = 0;

  for (const trade of trades) {
    const metrics = calculateTradeMetrics(trade);
    const tradeDateStr = trade.date;
    const tradeDate = new Date(tradeDateStr + 'T00:00:00');

    if (trade.status === 'Closed' || trade.status === 'Partially Sold') {
      closedTradesCount++;
      totalChargesPaid += metrics.totalCharges;

      if (metrics.netPnL > 0) {
        totalRealizedProfit += metrics.netPnL;
        winningTradesCount++;
      } else if (metrics.netPnL < 0) {
        totalRealizedLoss += Math.abs(metrics.netPnL);
        losingTradesCount++;
      }

      // Check Today
      if (tradeDateStr === todayStr) {
        todayPnL += metrics.netPnL;
        todayInvested += metrics.totalPurchaseAmount;
      }

      // Check This Week (Monday to Sunday)
      if (tradeDate >= startOfWeek) {
        thisWeekPnL += metrics.netPnL;
      }

      // Check This Month
      if (tradeDate >= startOfMonth) {
        thisMonthPnL += metrics.netPnL;
      }
    } else if (trade.status === 'Open') {
      // For open positions, invested capital is total purchase amount
      currentOpenPositionsCost += metrics.totalPurchaseAmount;
      
      const cmp = trade.currentMarketPrice !== undefined && trade.currentMarketPrice !== null && trade.currentMarketPrice > 0
        ? trade.currentMarketPrice
        : trade.buyPrice;

      const currentVal = cmp * trade.quantity;
      currentOpenPositionsMarketVal += currentVal;
      currentUnrealizedPnL += metrics.unrealizedPnL;
      totalChargesPaid += metrics.totalCharges;

      // If open trade was initiated today
      if (tradeDateStr === todayStr) {
        todayInvested += metrics.totalPurchaseAmount;
      }
    }
  }

  const netRealizedPnL = totalRealizedProfit - totalRealizedLoss;

  // Total Trading Capital = Deposited - Withdrawn + Realized PnL - Charges on open/cancelled
  // Available Cash = Total Net Capital - Current Open Positions Cost
  const netInjectedCapital = totalDeposited - totalWithdrawn;
  const totalTradingCapital = netInjectedCapital + netRealizedPnL;
  const availableCash = Math.max(0, totalTradingCapital - currentOpenPositionsCost);

  // Total Investment currently = cost of active open positions
  const totalInvestment = currentOpenPositionsCost;

  // Current Portfolio Value = Available Cash + Current Market Value of Open Positions
  const currentPortfolioValue = availableCash + currentOpenPositionsMarketVal;

  // Overall P&L Percentage based on total capital deposited
  const overallPnLPercentage = totalDeposited > 0
    ? ((netRealizedPnL + currentUnrealizedPnL) / totalDeposited) * 100
    : 0;

  const winRate = closedTradesCount > 0 ? (winningTradesCount / closedTradesCount) * 100 : 0;
  const todayReturnPct = todayInvested > 0 ? (todayPnL / todayInvested) * 100 : 0;

  return {
    totalTradingCapital,
    totalDeposited,
    totalWithdrawn,
    totalInvestment,
    currentPortfolioValue,
    totalRealizedProfit,
    totalRealizedLoss,
    netRealizedPnL,
    currentUnrealizedPnL,
    todayPnL,
    todayReturnPct,
    thisWeekPnL,
    thisMonthPnL,
    overallPnLPercentage,
    availableCash,
    totalChargesPaid,
    totalTradesCount: trades.length,
    closedTradesCount,
    winningTradesCount,
    losingTradesCount,
    winRate,
  };
}

// Helper: Formats Date to YYYY-MM-DD in local time
export function getLocalDateString(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Helper: Get start of week (Monday)
export function getStartOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

// Helper: Get end of week (Sunday)
export function getEndOfWeek(date: Date): Date {
  const start = getStartOfWeek(date);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return end;
}

// Helper: Get start of month
export function getStartOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0);
}

// Helper: Get end of month
export function getEndOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
}
