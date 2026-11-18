import React, { useState, useMemo } from 'react';
import type { Trade } from '../types/trading';
import { calculateTradeMetrics, formatINR, formatPercent, getLocalDateString } from '../utils/calculations';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Award,
  AlertTriangle,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  CartesianGrid,
} from 'recharts';

interface PeriodicAnalysisProps {
  trades: Trade[];
  onEditTrade: (trade: Trade) => void;
}

export const PeriodicAnalysis: React.FC<PeriodicAnalysisProps> = ({ trades, onEditTrade }) => {
  const [activeTab, setActiveTab] = useState<'daily' | 'weekly' | 'monthly'>('daily');

  // Daily State
  const [selectedDate, setSelectedDate] = useState<string>(
    getLocalDateString(new Date())
  );

  // Weekly State (selected week reference date)
  const [weekRefDate, setWeekRefDate] = useState<Date>(new Date());

  // Monthly State
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1); // 1-12

  // ----------------------------------------------------
  // 1. DAILY ANALYSIS
  // ----------------------------------------------------
  const dailyMetrics = useMemo(() => {
    const dayTrades = trades.filter((t) => t.date === selectedDate);
    const completedTrades = dayTrades.filter(
      (t) => t.status === 'Closed' || t.status === 'Partially Sold'
    );

    let totalInvested = 0;
    let winningTrades = 0;
    let losingTrades = 0;
    let totalProfit = 0;
    let totalLoss = 0;
    let totalCharges = 0;
    let netPnL = 0;

    let bestTrade: { symbol: string; pnl: number } | null = null;
    let worstTrade: { symbol: string; pnl: number } | null = null;

    dayTrades.forEach((t) => {
      const m = calculateTradeMetrics(t);
      totalInvested += m.totalPurchaseAmount;
      totalCharges += m.totalCharges;

      if (t.status === 'Closed' || t.status === 'Partially Sold') {
        netPnL += m.netPnL;
        if (m.netPnL > 0) {
          winningTrades++;
          totalProfit += m.netPnL;
        } else if (m.netPnL < 0) {
          losingTrades++;
          totalLoss += Math.abs(m.netPnL);
        }

        if (!bestTrade || m.netPnL > bestTrade.pnl) {
          bestTrade = { symbol: t.symbol, pnl: m.netPnL };
        }
        if (!worstTrade || m.netPnL < worstTrade.pnl) {
          worstTrade = { symbol: t.symbol, pnl: m.netPnL };
        }
      }
    });

    const winRate = completedTrades.length > 0 ? (winningTrades / completedTrades.length) * 100 : 0;
    const dailyReturnPct = totalInvested > 0 ? (netPnL / totalInvested) * 100 : 0;

    return {
      dayTrades,
      completedTradesCount: completedTrades.length,
      totalInvested,
      winningTrades,
      losingTrades,
      totalProfit,
      totalLoss,
      netPnL,
      totalCharges,
      winRate,
      dailyReturnPct,
      bestTrade,
      worstTrade,
    };
  }, [trades, selectedDate]);

  // ----------------------------------------------------
  // 2. WEEKLY ANALYSIS (Monday to Sunday)
  // ----------------------------------------------------
  const weeklyMetrics = useMemo(() => {
    // Current week bounds
    const d = new Date(weekRefDate);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d.setDate(diff));
    monday.setHours(0, 0, 0, 0);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    // Previous week bounds for comparison
    const prevMonday = new Date(monday);
    prevMonday.setDate(monday.getDate() - 7);
    const prevSunday = new Date(sunday);
    prevSunday.setDate(sunday.getDate() - 7);

    // Days map for chart: Mon, Tue, Wed, Thu, Fri, Sat, Sun
    const daysArr: { dateStr: string; label: string; pnl: number }[] = [];
    for (let i = 0; i < 7; i++) {
      const cur = new Date(monday);
      cur.setDate(monday.getDate() + i);
      const str = getLocalDateString(cur);
      const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      daysArr.push({ dateStr: str, label: `${labels[i]} (${cur.getDate()})`, pnl: 0 });
    }

    let totalProfit = 0;
    let totalLoss = 0;
    let netPnL = 0;
    let totalCharges = 0;
    let winCount = 0;
    let lossCount = 0;
    let bestTrade: { symbol: string; pnl: number } | null = null;
    let worstTrade: { symbol: string; pnl: number } | null = null;
    let thisWeekTrades: Trade[] = [];

    // Prev week pnl
    let prevWeekNetPnL = 0;

    trades.forEach((t) => {
      const tDate = new Date(t.date + 'T00:00:00');
      const m = calculateTradeMetrics(t);

      // This week
      if (tDate >= monday && tDate <= sunday) {
        thisWeekTrades.push(t);
        totalCharges += m.totalCharges;

        if (t.status === 'Closed' || t.status === 'Partially Sold') {
          netPnL += m.netPnL;

          // Chart day match
          const dayItem = daysArr.find((item) => item.dateStr === t.date);
          if (dayItem) {
            dayItem.pnl += m.netPnL;
          }

          if (m.netPnL > 0) {
            winCount++;
            totalProfit += m.netPnL;
          } else if (m.netPnL < 0) {
            lossCount++;
            totalLoss += Math.abs(m.netPnL);
          }

          if (!bestTrade || m.netPnL > bestTrade.pnl) {
            bestTrade = { symbol: t.symbol, pnl: m.netPnL };
          }
          if (!worstTrade || m.netPnL < worstTrade.pnl) {
            worstTrade = { symbol: t.symbol, pnl: m.netPnL };
          }
        }
      }

      // Prev week
      if (tDate >= prevMonday && tDate <= prevSunday) {
        if (t.status === 'Closed' || t.status === 'Partially Sold') {
          prevWeekNetPnL += m.netPnL;
        }
      }
    });

    const diffVsPrev = netPnL - prevWeekNetPnL;

    return {
      monday,
      sunday,
      totalProfit,
      totalLoss,
      netPnL,
      totalCharges,
      winCount,
      lossCount,
      bestTrade,
      worstTrade,
      chartData: daysArr,
      prevWeekNetPnL,
      diffVsPrev,
      thisWeekTrades,
    };
  }, [trades, weekRefDate]);

  // ----------------------------------------------------
  // 3. MONTHLY ANALYSIS
  // ----------------------------------------------------
  const monthlyMetrics = useMemo(() => {
    const monthStart = new Date(selectedYear, selectedMonth - 1, 1, 0, 0, 0, 0);
    const monthEnd = new Date(selectedYear, selectedMonth, 0, 23, 59, 59, 999);

    // Prev month
    const prevMonthStart = new Date(selectedYear, selectedMonth - 2, 1, 0, 0, 0, 0);
    const prevMonthEnd = new Date(selectedYear, selectedMonth - 1, 0, 23, 59, 59, 999);

    let totalProfit = 0;
    let totalLoss = 0;
    let netPnL = 0;
    let totalCharges = 0;
    let totalCapitalDeployed = 0;
    let winCount = 0;
    let lossCount = 0;

    const dayPnlMap: Record<string, number> = {};
    let prevMonthNetPnL = 0;

    trades.forEach((t) => {
      const tDate = new Date(t.date + 'T00:00:00');
      const m = calculateTradeMetrics(t);

      if (tDate >= monthStart && tDate <= monthEnd) {
        totalCapitalDeployed += m.totalPurchaseAmount;
        totalCharges += m.totalCharges;

        if (t.status === 'Closed' || t.status === 'Partially Sold') {
          netPnL += m.netPnL;
          dayPnlMap[t.date] = (dayPnlMap[t.date] || 0) + m.netPnL;

          if (m.netPnL > 0) {
            winCount++;
            totalProfit += m.netPnL;
          } else if (m.netPnL < 0) {
            lossCount++;
            totalLoss += Math.abs(m.netPnL);
          }
        }
      }

      if (tDate >= prevMonthStart && tDate <= prevMonthEnd) {
        if (t.status === 'Closed' || t.status === 'Partially Sold') {
          prevMonthNetPnL += m.netPnL;
        }
      }
    });

    const totalClosed = winCount + lossCount;
    const winRate = totalClosed > 0 ? (winCount / totalClosed) * 100 : 0;
    const avgWin = winCount > 0 ? totalProfit / winCount : 0;
    const avgLoss = lossCount > 0 ? totalLoss / lossCount : 0;
    const monthlyReturnPct = totalCapitalDeployed > 0 ? (netPnL / totalCapitalDeployed) * 100 : 0;

    // Best and Worst trading days
    let bestDay: { date: string; pnl: number } | null = null;
    let worstDay: { date: string; pnl: number } | null = null;

    Object.entries(dayPnlMap).forEach(([dateStr, pnl]) => {
      if (!bestDay || pnl > bestDay.pnl) {
        bestDay = { date: dateStr, pnl };
      }
      if (!worstDay || pnl < worstDay.pnl) {
        worstDay = { date: dateStr, pnl };
      }
    });

    // Daily breakdown for monthly chart
    const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
    const monthlyDailyChart = [];
    for (let day = 1; day <= daysInMonth; day++) {
      const dStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      monthlyDailyChart.push({
        day: day.toString(),
        pnl: Math.round(dayPnlMap[dStr] || 0),
      });
    }

    const diffVsPrevMonth = netPnL - prevMonthNetPnL;

    return {
      totalProfit,
      totalLoss,
      netPnL,
      totalCharges,
      totalCapitalDeployed,
      winRate,
      avgWin,
      avgLoss,
      bestDay,
      worstDay,
      monthlyReturnPct,
      monthlyDailyChart,
      prevMonthNetPnL,
      diffVsPrevMonth,
      totalClosed,
    };
  }, [trades, selectedYear, selectedMonth]);

  return (
    <div className="space-y-6">
      {/* Tab Switcher */}
      <div className="flex border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab('daily')}
          className={`px-6 py-3 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
            activeTab === 'daily'
              ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          Daily Analysis
        </button>
        <button
          onClick={() => setActiveTab('weekly')}
          className={`px-6 py-3 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
            activeTab === 'weekly'
              ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          Weekly Performance (Mon - Sun)
        </button>
        <button
          onClick={() => setActiveTab('monthly')}
          className={`px-6 py-3 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
            activeTab === 'monthly'
              ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          Monthly Performance
        </button>
      </div>

      {/* ----------------- DAILY TAB ----------------- */}
      {activeTab === 'daily' && (
        <div className="space-y-6">
          {/* Date Selector Header */}
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-indigo-500" />
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Select Analysis Date:
              </span>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-800 focus:border-indigo-500 focus:outline-hidden dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>
            <button
              onClick={() => setSelectedDate(getLocalDateString(new Date()))}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
            >
              Reset to Today
            </button>
          </div>

          {/* Daily Metric Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
              <span className="text-xs text-slate-400 block font-medium">TOTAL INVESTED</span>
              <span className="text-lg font-bold text-slate-800 dark:text-slate-100 mt-1 block">
                {formatINR(dailyMetrics.totalInvested)}
              </span>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
              <span className="text-xs text-slate-400 block font-medium">TRADES COMPLETED</span>
              <span className="text-lg font-bold text-slate-800 dark:text-slate-100 mt-1 block">
                {dailyMetrics.completedTradesCount} <span className="text-xs font-normal text-slate-400">({dailyMetrics.dayTrades.length} total)</span>
              </span>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
              <span className="text-xs text-slate-400 block font-medium">WINS / LOSSES</span>
              <span className="text-lg font-bold text-slate-800 dark:text-slate-100 mt-1 block">
                <span className="text-emerald-500">{dailyMetrics.winningTrades}W</span> - <span className="text-rose-500">{dailyMetrics.losingTrades}L</span>
              </span>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
              <span className="text-xs text-slate-400 block font-medium">CHARGES & TAXES</span>
              <span className="text-lg font-bold text-slate-800 dark:text-slate-100 mt-1 block">
                {formatINR(dailyMetrics.totalCharges)}
              </span>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
              <span className="text-xs text-slate-400 block font-medium">WIN PERCENTAGE</span>
              <span className="text-lg font-bold text-slate-800 dark:text-slate-100 mt-1 block">
                {dailyMetrics.winRate.toFixed(1)}%
              </span>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
              <span className="text-xs text-slate-400 block font-medium">NET DAILY P&L</span>
              <span className={`text-lg font-bold mt-1 block ${
                dailyMetrics.netPnL >= 0 ? 'text-emerald-500' : 'text-rose-500'
              }`}>
                {dailyMetrics.netPnL >= 0 ? '+' : ''}{formatINR(dailyMetrics.netPnL)}
              </span>
            </div>
          </div>

          {/* Best / Worst on this day */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-center justify-between rounded-2xl border border-emerald-100 bg-emerald-50/40 p-4 dark:border-emerald-950/60 dark:bg-emerald-950/20">
              <div className="flex items-center gap-3">
                <Award className="h-6 w-6 text-emerald-500" />
                <div>
                  <span className="text-xs font-semibold uppercase text-emerald-700 dark:text-emerald-400">Best Trade of the Day</span>
                  <div className="text-base font-bold text-slate-800 dark:text-slate-100">
                    {dailyMetrics.bestTrade ? (dailyMetrics.bestTrade as any).symbol : 'None'}
                  </div>
                </div>
              </div>
              <span className="text-base font-bold text-emerald-600 dark:text-emerald-400">
                {dailyMetrics.bestTrade ? `+${formatINR((dailyMetrics.bestTrade as any).pnl)}` : '-'}
              </span>
            </div>

            <div className="flex items-center justify-between rounded-2xl border border-rose-100 bg-rose-50/40 p-4 dark:border-rose-950/60 dark:bg-rose-950/20">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-6 w-6 text-rose-500" />
                <div>
                  <span className="text-xs font-semibold uppercase text-rose-700 dark:text-rose-400">Worst Trade of the Day</span>
                  <div className="text-base font-bold text-slate-800 dark:text-slate-100">
                    {dailyMetrics.worstTrade ? (dailyMetrics.worstTrade as any).symbol : 'None'}
                  </div>
                </div>
              </div>
              <span className="text-base font-bold text-rose-600 dark:text-rose-400">
                {dailyMetrics.worstTrade ? formatINR((dailyMetrics.worstTrade as any).pnl) : '-'}
              </span>
            </div>
          </div>

          {/* Trades table on that day */}
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 font-semibold text-sm text-slate-800 dark:text-slate-200">
              Trades on {selectedDate} ({dailyMetrics.dayTrades.length})
            </div>
            {dailyMetrics.dayTrades.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-sm">
                No trade entries recorded for this date.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
                    <tr>
                      <th className="px-4 py-3">Symbol</th>
                      <th className="px-4 py-3">Type</th>
                      <th className="px-4 py-3">Platform</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Buy / Sell</th>
                      <th className="px-4 py-3">Qty</th>
                      <th className="px-4 py-3">Charges</th>
                      <th className="px-4 py-3">Net P&L</th>
                      <th className="px-4 py-3">Return</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {dailyMetrics.dayTrades.map((t) => {
                      const m = calculateTradeMetrics(t);
                      return (
                        <tr
                          key={t.id}
                          onClick={() => onEditTrade(t)}
                          className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 cursor-pointer"
                        >
                          <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-100">
                            {t.symbol}
                          </td>
                          <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{t.tradeType}</td>
                          <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{t.platform}</td>
                          <td className="px-4 py-3">
                            <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium dark:bg-slate-800">
                              {t.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs">
                            {formatINR(t.buyPrice)} / {t.sellPrice ? formatINR(t.sellPrice) : '-'}
                          </td>
                          <td className="px-4 py-3">{t.quantity}</td>
                          <td className="px-4 py-3 text-xs text-slate-500">{formatINR(m.totalCharges)}</td>
                          <td className={`px-4 py-3 font-bold ${
                            t.status === 'Open'
                              ? m.unrealizedPnL >= 0 ? 'text-emerald-500' : 'text-rose-500'
                              : m.netPnL >= 0 ? 'text-emerald-500' : 'text-rose-500'
                          }`}>
                            {t.status === 'Open' ? formatINR(m.unrealizedPnL) : formatINR(m.netPnL)}
                          </td>
                          <td className="px-4 py-3 text-xs font-semibold">
                            {formatPercent(m.returnPercentage)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ----------------- WEEKLY TAB ----------------- */}
      {activeTab === 'weekly' && (
        <div className="space-y-6">
          {/* Week navigation */}
          <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  const d = new Date(weekRefDate);
                  d.setDate(d.getDate() - 7);
                  setWeekRefDate(d);
                }}
                className="rounded-xl border border-slate-200 p-2 hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <div className="text-sm font-bold text-slate-800 dark:text-slate-100">
                Week: {weeklyMetrics.monday.toDateString()} — {weeklyMetrics.sunday.toDateString()}
              </div>
              <button
                onClick={() => {
                  const d = new Date(weekRefDate);
                  d.setDate(d.getDate() + 7);
                  setWeekRefDate(d);
                }}
                className="rounded-xl border border-slate-200 p-2 hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            <button
              onClick={() => setWeekRefDate(new Date())}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
            >
              Current Week
            </button>
          </div>

          {/* Weekly Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
              <span className="text-xs text-slate-400 block font-medium">TOTAL WEEKLY PROFIT</span>
              <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-1 block">
                +{formatINR(weeklyMetrics.totalProfit)}
              </span>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
              <span className="text-xs text-slate-400 block font-medium">TOTAL WEEKLY LOSS</span>
              <span className="text-lg font-bold text-rose-600 dark:text-rose-400 mt-1 block">
                -{formatINR(weeklyMetrics.totalLoss)}
              </span>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
              <span className="text-xs text-slate-400 block font-medium">NET WEEKLY P&L</span>
              <span className={`text-xl font-black mt-1 block ${
                weeklyMetrics.netPnL >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
              }`}>
                {weeklyMetrics.netPnL >= 0 ? '+' : ''}{formatINR(weeklyMetrics.netPnL)}
              </span>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
              <span className="text-xs text-slate-400 block font-medium">WINS / LOSSES</span>
              <span className="text-lg font-bold text-slate-800 dark:text-slate-100 mt-1 block">
                {weeklyMetrics.winCount}W / {weeklyMetrics.lossCount}L
              </span>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
              <span className="text-xs text-slate-400 block font-medium">VS PREVIOUS WEEK</span>
              <span className={`text-sm font-bold mt-1 block ${
                weeklyMetrics.diffVsPrev >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
              }`}>
                {weeklyMetrics.diffVsPrev >= 0 ? '▲ +' : '▼ -'}{formatINR(Math.abs(weeklyMetrics.diffVsPrev))}
              </span>
              <span className="text-[10px] text-slate-400 block">Prev: {formatINR(weeklyMetrics.prevWeekNetPnL)}</span>
            </div>
          </div>

          {/* Daily Profit/Loss Chart for the week */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-4">
              Daily P&L Breakdown (Monday to Sunday)
            </h4>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyMetrics.chartData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="label" stroke="#94a3b8" fontSize={12} />
                  <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={(val) => `₹${val}`} />
                  <Tooltip
                    formatter={(val: any) => [formatINR(Number(val)), 'Net P&L']}
                    contentStyle={{ borderRadius: '12px' }}
                  />
                  <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
                    {weeklyMetrics.chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.pnl >= 0 ? '#10b981' : '#f43f5e'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* ----------------- MONTHLY TAB ----------------- */}
      {activeTab === 'monthly' && (
        <div className="space-y-6">
          {/* Month & Year Selectors */}
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-indigo-500" />
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Select Month:</span>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              >
                {[
                  'January', 'February', 'March', 'April', 'May', 'June',
                  'July', 'August', 'September', 'October', 'November', 'December',
                ].map((name, idx) => (
                  <option key={idx} value={idx + 1}>{name}</option>
                ))}
              </select>

              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              >
                {[2024, 2025, 2026, 2027].map((yr) => (
                  <option key={yr} value={yr}>{yr}</option>
                ))}
              </select>
            </div>

            <div className="text-xs text-slate-400">
              Comparison vs previous month: {weeklyMetrics.diffVsPrev >= 0 ? 'Positive' : 'Negative'}
            </div>
          </div>

          {/* Monthly Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
              <span className="text-xs text-slate-400 block font-medium">MONTHLY NET P&L</span>
              <span className={`text-xl font-black mt-1 block ${
                monthlyMetrics.netPnL >= 0 ? 'text-emerald-500' : 'text-rose-500'
              }`}>
                {monthlyMetrics.netPnL >= 0 ? '+' : ''}{formatINR(monthlyMetrics.netPnL)}
              </span>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
              <span className="text-xs text-slate-400 block font-medium">CAPITAL DEPLOYED</span>
              <span className="text-base font-bold text-slate-800 dark:text-slate-100 mt-1 block">
                {formatINR(monthlyMetrics.totalCapitalDeployed)}
              </span>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
              <span className="text-xs text-slate-400 block font-medium">WIN PERCENTAGE</span>
              <span className="text-base font-bold text-slate-800 dark:text-slate-100 mt-1 block">
                {monthlyMetrics.winRate.toFixed(1)}%
              </span>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
              <span className="text-xs text-slate-400 block font-medium">AVG WINNING TRADE</span>
              <span className="text-base font-bold text-emerald-500 mt-1 block">
                {formatINR(monthlyMetrics.avgWin)}
              </span>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
              <span className="text-xs text-slate-400 block font-medium">AVG LOSING TRADE</span>
              <span className="text-base font-bold text-rose-500 mt-1 block">
                {formatINR(monthlyMetrics.avgLoss)}
              </span>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
              <span className="text-xs text-slate-400 block font-medium">VS PREV MONTH</span>
              <span className={`text-base font-bold mt-1 block ${
                monthlyMetrics.diffVsPrevMonth >= 0 ? 'text-emerald-500' : 'text-rose-500'
              }`}>
                {monthlyMetrics.diffVsPrevMonth >= 0 ? '+' : ''}{formatINR(monthlyMetrics.diffVsPrevMonth)}
              </span>
            </div>
          </div>

          {/* Monthly Daily Chart */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-4">
              Day-by-Day Performance in {selectedMonth}/{selectedYear}
            </h4>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyMetrics.monthlyDailyChart}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="day" stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={(val) => `₹${val}`} />
                  <Tooltip
                    formatter={(val: any) => [formatINR(Number(val)), 'Net P&L']}
                    contentStyle={{ borderRadius: '12px' }}
                  />
                  <Bar dataKey="pnl" radius={[3, 3, 0, 0]}>
                    {monthlyMetrics.monthlyDailyChart.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.pnl >= 0 ? '#10b981' : '#f43f5e'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
