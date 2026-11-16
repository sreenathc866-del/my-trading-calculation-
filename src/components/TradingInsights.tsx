import React, { useMemo } from 'react';
import type { Trade } from '../types/trading';
import { calculateTradeMetrics, formatINR, formatPercent } from '../utils/calculations';
import {
  TrendingUp,
  TrendingDown,
  Award,
  AlertOctagon,
  Percent,
  Activity,
  CheckCircle2,
  Calendar,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
} from 'recharts';

interface TradingInsightsProps {
  trades: Trade[];
}

export const TradingInsights: React.FC<TradingInsightsProps> = ({ trades }) => {
  const insights = useMemo(() => {
    const closedTrades = trades.filter((t) => t.status === 'Closed' || t.status === 'Partially Sold');
    if (closedTrades.length === 0) {
      return null;
    }

    let totalProfit = 0;
    let totalLoss = 0;
    let winCount = 0;
    let lossCount = 0;
    let totalCharges = 0;

    let largestProfit = -Infinity;
    let largestProfitTrade: Trade | null = null;

    let largestLoss = Infinity; // positive number representing magnitude of loss
    let largestLossTrade: Trade | null = null;

    // By Day of Week (0 = Sunday, 1 = Monday...)
    const dayMap: Record<string, { pnl: number; count: number; wins: number }> = {
      Monday: { pnl: 0, count: 0, wins: 0 },
      Tuesday: { pnl: 0, count: 0, wins: 0 },
      Wednesday: { pnl: 0, count: 0, wins: 0 },
      Thursday: { pnl: 0, count: 0, wins: 0 },
      Friday: { pnl: 0, count: 0, wins: 0 },
      Saturday: { pnl: 0, count: 0, wins: 0 },
      Sunday: { pnl: 0, count: 0, wins: 0 },
    };

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    // By Trade Type
    const typeMap: Record<string, { pnl: number; count: number; wins: number; charges: number }> = {};

    closedTrades.forEach((t) => {
      const m = calculateTradeMetrics(t);
      totalCharges += m.totalCharges;

      if (m.netPnL > 0) {
        totalProfit += m.netPnL;
        winCount++;
        if (m.netPnL > largestProfit) {
          largestProfit = m.netPnL;
          largestProfitTrade = t;
        }
      } else if (m.netPnL < 0) {
        const absLoss = Math.abs(m.netPnL);
        totalLoss += absLoss;
        lossCount++;
        if (absLoss > (largestLoss === Infinity ? 0 : largestLoss)) {
          largestLoss = absLoss;
          largestLossTrade = t;
        }
      }

      // Day analysis
      const d = new Date(t.date + 'T00:00:00');
      const dayName = dayNames[d.getDay()];
      if (dayMap[dayName]) {
        dayMap[dayName].pnl += m.netPnL;
        dayMap[dayName].count += 1;
        if (m.netPnL > 0) dayMap[dayName].wins += 1;
      }

      // Type analysis
      if (!typeMap[t.tradeType]) {
        typeMap[t.tradeType] = { pnl: 0, count: 0, wins: 0, charges: 0 };
      }
      typeMap[t.tradeType].pnl += m.netPnL;
      typeMap[t.tradeType].count += 1;
      typeMap[t.tradeType].charges += m.totalCharges;
      if (m.netPnL > 0) typeMap[t.tradeType].wins += 1;
    });

    const netOverall = totalProfit - totalLoss;
    const winRate = (winCount / closedTrades.length) * 100;
    const avgProfit = winCount > 0 ? totalProfit / winCount : 0;
    const avgLoss = lossCount > 0 ? totalLoss / lossCount : 0;
    const profitFactor = totalLoss > 0 ? totalProfit / totalLoss : totalProfit > 0 ? 99 : 0;

    // Find Best performing day
    let bestDay = 'None';
    let maxDayPnL = -Infinity;
    Object.entries(dayMap).forEach(([day, data]) => {
      if (data.count > 0 && data.pnl > maxDayPnL) {
        maxDayPnL = data.pnl;
        bestDay = day;
      }
    });

    // Find Best and Worst Trading Types
    let bestType = 'None';
    let maxTypePnL = -Infinity;
    let worstType = 'None';
    let minTypePnL = Infinity;

    Object.entries(typeMap).forEach(([tType, data]) => {
      if (data.pnl > maxTypePnL) {
        maxTypePnL = data.pnl;
        bestType = tType;
      }
      if (data.pnl < minTypePnL) {
        minTypePnL = data.pnl;
        worstType = tType;
      }
    });

    // Daily summary based on actual latest day records
    const todayStr = new Date().toISOString().slice(0, 10);
    const todayTrades = closedTrades.filter((t) => t.date === todayStr);

    let todaySummaryText = '';
    if (todayTrades.length > 0) {
      const todayWins = todayTrades.filter((t) => calculateTradeMetrics(t).netPnL > 0).length;
      const todayLosses = todayTrades.filter((t) => calculateTradeMetrics(t).netPnL < 0).length;
      const todayNet = todayTrades.reduce((acc, t) => acc + calculateTradeMetrics(t).netPnL, 0);
      const todayWinRate = ((todayWins / todayTrades.length) * 100).toFixed(0);

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yestStr = yesterday.toISOString().slice(0, 10);
      const yestTrades = closedTrades.filter((t) => t.date === yestStr);
      const yestNet = yestTrades.reduce((acc, t) => acc + calculateTradeMetrics(t).netPnL, 0);

      const diff = todayNet - yestNet;
      const diffText =
        diff >= 0
          ? `improved by ${formatINR(diff)} compared with yesterday.`
          : `decreased by ${formatINR(Math.abs(diff))} compared with yesterday.`;

      todaySummaryText = `Today's net profit is ${formatINR(todayNet)} from ${todayTrades.length} completed trades. You made ${todayWins} profitable trades and ${todayLosses} losing trades. Your winning rate was ${todayWinRate}%. Performance ${diffText}`;
    }

    // Chart data by day of week
    const dayChartData = Object.entries(dayMap)
      .filter(([_, d]) => d.count > 0)
      .map(([name, d]) => ({
        day: name.slice(0, 3),
        pnl: Math.round(d.pnl),
      }));

    // Chart data by type
    const typeChartData = Object.entries(typeMap).map(([type, d]) => ({
      name: type,
      pnl: Math.round(d.pnl),
      charges: Math.round(d.charges),
    }));

    return {
      totalClosed: closedTrades.length,
      winCount,
      lossCount,
      winRate,
      netOverall,
      totalCharges,
      avgProfit,
      avgLoss,
      profitFactor,
      largestProfit: largestProfit === -Infinity ? 0 : largestProfit,
      largestProfitTrade,
      largestLoss: largestLoss === Infinity ? 0 : largestLoss,
      largestLossTrade,
      bestDay,
      bestDayPnL: maxDayPnL === -Infinity ? 0 : maxDayPnL,
      bestType,
      bestTypePnL: maxTypePnL === -Infinity ? 0 : maxTypePnL,
      worstType,
      worstTypePnL: minTypePnL === Infinity ? 0 : minTypePnL,
      todaySummaryText,
      dayChartData,
      typeChartData,
      isConsistent: winRate >= 50 && netOverall > 0,
    };
  }, [trades]);

  if (!insights) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <Sparkles className="mx-auto h-12 w-12 text-indigo-400 mb-3" />
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
          Personal Trading Intelligence
        </h3>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
          Add and complete a few trades to generate automated statistical insights, win/loss patterns, best trading types, and fee breakdowns.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Daily Narrative Summary */}
      {insights.todaySummaryText && (
        <div className="rounded-2xl border border-indigo-200 bg-gradient-to-r from-indigo-50 to-purple-50 p-5 dark:border-indigo-900/60 dark:from-indigo-950/40 dark:to-purple-950/20 shadow-xs">
          <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300 text-xs font-bold uppercase tracking-wider mb-1">
            <Sparkles className="h-4 w-4" />
            Today's Verified Record Summary
          </div>
          <p className="text-sm font-medium text-slate-800 dark:text-slate-200 leading-relaxed">
            "{insights.todaySummaryText}"
          </p>
        </div>
      )}

      {/* Answer Key Questions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Consistency */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <span className="text-xs font-semibold uppercase text-slate-400">Consistency Status</span>
          <div className="mt-2 flex items-center gap-2">
            {insights.isConsistent ? (
              <CheckCircle2 className="h-6 w-6 text-emerald-500 shrink-0" />
            ) : (
              <AlertOctagon className="h-6 w-6 text-amber-500 shrink-0" />
            )}
            <span className="text-lg font-bold text-slate-800 dark:text-slate-100">
              {insights.isConsistent ? 'Consistent & Profitable' : 'Needs Optimization'}
            </span>
          </div>
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            Win Rate: <strong className="text-slate-700 dark:text-slate-300">{insights.winRate.toFixed(1)}%</strong> | Net: {formatINR(insights.netOverall)}
          </p>
        </div>

        {/* Best Trade Type */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <span className="text-xs font-semibold uppercase text-slate-400">Top Performing Segment</span>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
              {insights.bestType}
            </span>
            <TrendingUp className="h-5 w-5 text-emerald-500" />
          </div>
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            Generated net profit of <strong>{formatINR(insights.bestTypePnL)}</strong>
          </p>
        </div>

        {/* Worst Trade Type */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <span className="text-xs font-semibold uppercase text-slate-400">Most Unprofitable Segment</span>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-lg font-bold text-rose-600 dark:text-rose-400">
              {insights.worstType}
            </span>
            <TrendingDown className="h-5 w-5 text-rose-500" />
          </div>
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            Net outcome: <strong>{formatINR(insights.worstTypePnL)}</strong>
          </p>
        </div>

        {/* Best Day of Week */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <span className="text-xs font-semibold uppercase text-slate-400">Best Day to Trade</span>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
              {insights.bestDay}
            </span>
            <Calendar className="h-5 w-5 text-indigo-500" />
          </div>
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            Highest cumulative gains: <strong>{formatINR(insights.bestDayPnL)}</strong>
          </p>
        </div>
      </div>

      {/* Deep Dive Metrics List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Detailed Q&A Insight Table */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <h4 className="text-base font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
            <Activity className="h-5 w-5 text-indigo-500" />
            Key Question Analysis
          </h4>

          <div className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
            <div className="py-3 flex items-center justify-between">
              <span className="text-slate-600 dark:text-slate-400">What is my average profit per winning trade?</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                {formatINR(insights.avgProfit)}
              </span>
            </div>

            <div className="py-3 flex items-center justify-between">
              <span className="text-slate-600 dark:text-slate-400">What is my average loss per losing trade?</span>
              <span className="font-bold text-rose-600 dark:text-rose-400">
                {formatINR(insights.avgLoss)}
              </span>
            </div>

            <div className="py-3 flex items-center justify-between">
              <span className="text-slate-600 dark:text-slate-400">Profit Factor (Gains / Losses ratio):</span>
              <span className="font-bold text-slate-900 dark:text-slate-100">
                {insights.profitFactor.toFixed(2)}x
              </span>
            </div>

            <div className="py-3 flex items-center justify-between">
              <span className="text-slate-600 dark:text-slate-400">Total brokerage & tax charges paid:</span>
              <span className="font-bold text-amber-600 dark:text-amber-400">
                {formatINR(insights.totalCharges)}
              </span>
            </div>

            <div className="py-3 flex items-center justify-between">
              <span className="text-slate-600 dark:text-slate-400">What is my largest single profit?</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                +{formatINR(insights.largestProfit)} ({(insights.largestProfitTrade as any)?.symbol || '-'})
              </span>
            </div>

            <div className="py-3 flex items-center justify-between">
              <span className="text-slate-600 dark:text-slate-400">What is my largest single loss?</span>
              <span className="font-bold text-rose-600 dark:text-rose-400">
                -{formatINR(insights.largestLoss)} ({(insights.largestLossTrade as any)?.symbol || '-'})
              </span>
            </div>

            <div className="py-3 flex items-center justify-between">
              <span className="text-slate-600 dark:text-slate-400">Overall Capital P&L Trajectory:</span>
              <span className={`font-black ${insights.netOverall >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                {insights.netOverall >= 0 ? '+' : ''}{formatINR(insights.netOverall)}
              </span>
            </div>
          </div>
        </div>

        {/* Right: By Day of Week Bar Chart */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between">
          <div>
            <h4 className="text-base font-bold text-slate-800 dark:text-slate-100 mb-1">
              P&L by Day of Week
            </h4>
            <p className="text-xs text-slate-400 mb-4">Cumulative performance per trading session</p>

            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={insights.dayChartData}>
                  <XAxis dataKey="day" stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={(val) => `₹${val}`} />
                  <Tooltip
                    formatter={(val: any) => [formatINR(Number(val)), 'Net P&L']}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  />
                  <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
                    {insights.dayChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.pnl >= 0 ? '#10b981' : '#f43f5e'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="mt-4 rounded-xl bg-slate-50 p-3 text-xs text-slate-600 dark:bg-slate-800/60 dark:text-slate-400">
            Tip: If losses concentrate on specific days (like expiry days), consider reducing sizing or taking breaks.
          </div>
        </div>
      </div>
    </div>
  );
};
