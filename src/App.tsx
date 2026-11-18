import React, { useState, useEffect } from 'react';
import type { Trade, CapitalTransaction } from './types/trading';
import {
  getAllTrades,
  saveTrade,
  deleteTrade,
  getAllCapitalTransactions,
  saveCapitalTransaction,
  deleteCapitalTransaction,
  bulkInsertTrades,
  bulkInsertCapital,
} from './services/storageService';
import {
  calculateDashboardSummary,
  calculateTradeMetrics,
  formatINR,
  formatPercent,
} from './utils/calculations';
import { TradeEntryModal } from './components/TradeEntryModal';
import { BackupExportModal } from './components/BackupExportModal';
import { CapitalManager } from './components/CapitalManager';
import { PeriodicAnalysis } from './components/PeriodicAnalysis';
import { TradingInsights } from './components/TradingInsights';
import { MarketPriceManager } from './components/MarketPriceManager';
import { TradeLedger } from './components/TradeLedger';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Plus,
  Database,
  Sun,
  Moon,
  BarChart3,
  BookOpen,
  PieChart,
  Radio,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Layers,
  Activity,
  ShieldCheck,
  Building2,
  Percent,
} from 'lucide-react';

export function App() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [capital, setCapital] = useState<CapitalTransaction[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'trades' | 'analysis' | 'insights' | 'capital' | 'market'>('dashboard');

  // Modals
  const [isTradeModalOpen, setIsTradeModalOpen] = useState<boolean>(false);
  const [tradeToEdit, setTradeToEdit] = useState<Trade | null>(null);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState<boolean>(false);

  // Dark mode
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('theme') !== 'light'; // Default to sleek terminal dark
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  // Load initial data from IndexedDB
  const loadData = async () => {
    setIsLoading(true);
    try {
      const storedTrades = await getAllTrades();
      const storedCapital = await getAllCapitalTransactions();

      if (storedTrades.length === 0 && storedCapital.length === 0) {
        const todayStr = new Date().toISOString().slice(0, 10);
        const sampleCapital: CapitalTransaction = {
          id: 'cap_initial',
          date: todayStr,
          type: 'Initial',
          amount: 250000,
          platform: 'Groww',
          notes: 'Primary trading allocation',
          createdAt: Date.now(),
        };

        const sampleTrades: Trade[] = [
          {
            id: 'tr_1',
            date: todayStr,
            assetName: 'Tata Motors',
            symbol: 'TATAMOTORS',
            platform: 'Groww',
            tradeType: 'Delivery',
            buyPrice: 950,
            sellPrice: 1045,
            quantity: 50,
            brokerage: 20,
            taxesAndCharges: 18,
            status: 'Closed',
            notes: 'Breakout above monthly pivot level with surge in volume',
            createdAt: Date.now() - 3600000,
            updatedAt: Date.now(),
          },
          {
            id: 'tr_2',
            date: todayStr,
            assetName: 'Reliance Industries',
            symbol: 'RELIANCE',
            platform: 'Zerodha',
            tradeType: 'Intraday',
            buyPrice: 2820,
            sellPrice: 2790,
            quantity: 20,
            brokerage: 40,
            taxesAndCharges: 12,
            status: 'Closed',
            notes: 'Intraday pullback stop loss hit near VWAP',
            createdAt: Date.now() - 7200000,
            updatedAt: Date.now(),
          },
          {
            id: 'tr_3',
            date: todayStr,
            assetName: 'Infosys',
            symbol: 'INFY',
            platform: 'Groww',
            tradeType: 'Delivery',
            buyPrice: 1860,
            sellPrice: 0,
            currentMarketPrice: 1915,
            quantity: 35,
            brokerage: 20,
            taxesAndCharges: 15,
            status: 'Open',
            notes: 'Swing trade target 1980, trailing stop 1845',
            createdAt: Date.now() - 10000000,
            updatedAt: Date.now(),
          },
        ];

        await bulkInsertCapital([sampleCapital]);
        await bulkInsertTrades(sampleTrades);
        setCapital([sampleCapital]);
        setTrades(sampleTrades);
      } else {
        setTrades(storedTrades);
        setCapital(storedCapital);
      }
    } catch (e) {
      console.error('Failed to load from IndexedDB', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveTrade = async (trade: Trade) => {
    await saveTrade(trade);
    await loadData();
  };

  const handleDeleteTrade = async (id: string) => {
    await deleteTrade(id);
    await loadData();
  };

  const handleEditTrade = (trade: Trade) => {
    setTradeToEdit(trade);
    setIsTradeModalOpen(true);
  };

  const handleOpenAddTrade = () => {
    setTradeToEdit(null);
    setIsTradeModalOpen(true);
  };

  const handleAddCapital = async (tx: CapitalTransaction) => {
    await saveCapitalTransaction(tx);
    await loadData();
  };

  const handleDeleteCapital = async (id: string) => {
    await deleteCapitalTransaction(id);
    await loadData();
  };

  const handleUpdateMarketPrices = async (updates: { id: string; currentMarketPrice: number }[]) => {
    for (const item of updates) {
      const target = trades.find((t) => t.id === item.id);
      if (target) {
        await saveTrade({
          ...target,
          currentMarketPrice: item.currentMarketPrice,
          updatedAt: Date.now(),
        });
      }
    }
    await loadData();
  };

  const summary = calculateDashboardSummary(trades, capital);
  const openTrades = trades.filter((t) => t.status === 'Open');
  const netPnLTotal = summary.netRealizedPnL + summary.currentUnrealizedPnL;

  return (
    <div className="min-h-screen bg-[#f8fafc] text-zinc-900 transition-colors dark:bg-[#0b0f17] dark:text-zinc-100 flex flex-col">
      {/* Top Professional Ticker / Status Strip */}
      <div className="border-b border-zinc-200/80 bg-zinc-100/90 px-4 py-1.5 text-[11px] font-medium text-zinc-600 dark:border-zinc-800/80 dark:bg-[#0e1420] dark:text-zinc-400">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-4 overflow-x-auto whitespace-nowrap">
            <span className="flex items-center gap-1.5 font-semibold text-zinc-800 dark:text-zinc-300">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              TERMINAL LIVE
            </span>
            <span className="text-zinc-300 dark:text-zinc-700">|</span>
            <span className="text-zinc-500 dark:text-zinc-400">
              Total Capital:{' '}
              <span className="font-mono-num font-semibold text-zinc-900 dark:text-zinc-200">
                {formatINR(summary.totalTradingCapital)}
              </span>
            </span>
            <span className="text-zinc-300 dark:text-zinc-700">|</span>
            <span className="text-zinc-500 dark:text-zinc-400">
              Cash Float:{' '}
              <span className="font-mono-num font-semibold text-zinc-900 dark:text-zinc-200">
                {formatINR(summary.availableCash)}
              </span>
            </span>
            <span className="text-zinc-300 dark:text-zinc-700">|</span>
            <span className="text-zinc-500 dark:text-zinc-400">
              Active Positions:{' '}
              <span className="font-mono-num font-semibold text-amber-500 dark:text-amber-400">
                {openTrades.length}
              </span>
            </span>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <span className="flex items-center gap-1 text-[10px] uppercase tracking-wider font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              <ShieldCheck className="h-3 w-3" /> Encrypted Local DB
            </span>
          </div>
        </div>
      </div>

      {/* Main Top Header */}
      <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/95 backdrop-blur-md dark:border-zinc-800 dark:bg-[#0f1726]/95">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-950 text-emerald-400 border border-zinc-800 shadow-sm dark:bg-zinc-900">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-black tracking-tight uppercase text-zinc-900 dark:text-white">
                  Tradelytics
                </span>
                <span className="rounded bg-zinc-200 px-1.5 py-0.5 text-[9px] font-bold tracking-wider uppercase text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                  Terminal 2.0
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleOpenAddTrade}
              className="flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
              <span>Record Trade</span>
            </button>

            <button
              onClick={() => setIsBackupModalOpen(true)}
              className="flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800/80 transition-colors cursor-pointer"
            >
              <Database className="h-3.5 w-3.5 text-zinc-500" />
              <span className="hidden sm:inline">Backup & Export</span>
            </button>

            <button
              onClick={() => setDarkMode(!darkMode)}
              className="rounded-lg border border-zinc-200 bg-white p-1.5 text-zinc-600 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 cursor-pointer"
              title="Toggle Theme"
            >
              {darkMode ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-zinc-600" />}
            </button>
          </div>
        </div>

        {/* Dense Financial Terminal Navigation Tabs */}
        <div className="border-t border-zinc-200 dark:border-zinc-800/80">
          <div className="mx-auto flex max-w-7xl space-x-1 px-4 sm:px-6 lg:px-8 overflow-x-auto">
            {[
              { id: 'dashboard', label: 'Command Center', icon: BarChart3 },
              { id: 'trades', label: `Trades Ledger (${trades.length})`, icon: BookOpen },
              { id: 'analysis', label: 'Periodic Analysis', icon: PieChart },
              { id: 'insights', label: 'Edge & Performance Insights', icon: Sparkles },
              { id: 'capital', label: 'Capital Ledger', icon: Wallet },
              { id: 'market', label: `Live CMP Matrix (${openTrades.length})`, icon: Radio },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 border-b-2 px-3 py-2.5 text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                    isActive
                      ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400 bg-emerald-500/5'
                      : 'border-transparent text-zinc-600 hover:border-zinc-300 hover:text-zinc-900 dark:text-zinc-400 dark:hover:border-zinc-700 dark:hover:text-zinc-200'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8">
        {/* ---------------- 1. COMMAND CENTER (DASHBOARD) ---------------- */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Primary Quantitative Metric Strip */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {/* Portfolio Net Worth */}
              <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-[#111726]">
                <div className="text-[10px] font-bold tracking-wider uppercase text-zinc-400 dark:text-zinc-500">
                  Portfolio Value
                </div>
                <div className="font-mono-num mt-1.5 text-xl font-bold tracking-tight text-zinc-950 dark:text-white">
                  {formatINR(summary.currentPortfolioValue)}
                </div>
                <div className="mt-1 flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400">
                  <span>Invested:</span>
                  <span className="font-mono-num font-medium">{formatINR(summary.totalInvestment)}</span>
                </div>
              </div>

              {/* Total Net PnL */}
              <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-[#111726]">
                <div className="text-[10px] font-bold tracking-wider uppercase text-zinc-400 dark:text-zinc-500">
                  Cumulative P&L
                </div>
                <div
                  className={`font-mono-num mt-1.5 text-xl font-bold tracking-tight ${
                    netPnLTotal >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                  }`}
                >
                  {netPnLTotal >= 0 ? '+' : ''}
                  {formatINR(netPnLTotal)}
                </div>
                <div className="mt-1 flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400">
                  <span>Return:</span>
                  <span
                    className={`font-mono-num font-semibold ${
                      summary.overallPnLPercentage >= 0 ? 'text-emerald-500' : 'text-rose-500'
                    }`}
                  >
                    {formatPercent(summary.overallPnLPercentage)}
                  </span>
                </div>
              </div>

              {/* Today's PnL */}
              <div
                className={`rounded-xl border p-4 ${
                  summary.todayPnL >= 0
                    ? 'border-emerald-200/80 bg-emerald-50/40 dark:border-emerald-900/40 dark:bg-emerald-950/20'
                    : 'border-rose-200/80 bg-rose-50/40 dark:border-rose-900/40 dark:bg-rose-950/20'
                }`}
              >
                <div className="flex items-center justify-between text-[10px] font-bold tracking-wider uppercase text-zinc-500 dark:text-zinc-400">
                  <span>Today's Realized</span>
                  {summary.todayPnL >= 0 ? (
                    <ArrowUpRight className="h-3.5 w-3.5 text-emerald-500" />
                  ) : (
                    <ArrowDownRight className="h-3.5 w-3.5 text-rose-500" />
                  )}
                </div>
                <div
                  className={`font-mono-num mt-1.5 text-xl font-bold tracking-tight ${
                    summary.todayPnL >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                  }`}
                >
                  {summary.todayPnL >= 0 ? '+' : ''}
                  {formatINR(summary.todayPnL)}
                </div>
                <div className="mt-1 flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400">
                  <span>Day Return:</span>
                  <span className="font-mono-num font-medium">{formatPercent(summary.todayReturnPct)}</span>
                </div>
              </div>

              {/* Unrealized P&L */}
              <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-[#111726]">
                <div className="flex items-center justify-between text-[10px] font-bold tracking-wider uppercase text-zinc-400 dark:text-zinc-500">
                  <span>Open Holdings</span>
                  <span className="font-mono-num font-semibold text-amber-500">{openTrades.length} POS</span>
                </div>
                <div
                  className={`font-mono-num mt-1.5 text-xl font-bold tracking-tight ${
                    summary.currentUnrealizedPnL >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                  }`}
                >
                  {summary.currentUnrealizedPnL >= 0 ? '+' : ''}
                  {formatINR(summary.currentUnrealizedPnL)}
                </div>
                <div className="mt-1 flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400">
                  <span>Est. Unrealized</span>
                  <span className="text-[10px] uppercase font-semibold text-zinc-400">Live</span>
                </div>
              </div>

              {/* Win Rate */}
              <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-[#111726]">
                <div className="text-[10px] font-bold tracking-wider uppercase text-zinc-400 dark:text-zinc-500">
                  Win Rate Ratio
                </div>
                <div className="font-mono-num mt-1.5 text-xl font-bold tracking-tight text-blue-600 dark:text-blue-400">
                  {summary.winRate.toFixed(1)}%
                </div>
                <div className="mt-1 flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400">
                  <span>Score:</span>
                  <span className="font-mono-num font-medium">
                    {summary.winningTradesCount}W / {summary.losingTradesCount}L
                  </span>
                </div>
              </div>

              {/* Capital Under Management */}
              <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-[#111726]">
                <div className="text-[10px] font-bold tracking-wider uppercase text-zinc-400 dark:text-zinc-500">
                  Trading Capital
                </div>
                <div className="font-mono-num mt-1.5 text-xl font-bold tracking-tight text-zinc-950 dark:text-zinc-100">
                  {formatINR(summary.totalTradingCapital)}
                </div>
                <div className="mt-1 flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400">
                  <span>Available:</span>
                  <span className="font-mono-num font-medium text-emerald-600 dark:text-emerald-400">{formatINR(summary.availableCash)}</span>
                </div>
              </div>
            </div>

            {/* Performance High-level Balance Card */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Realized Gains Breakdown */}
              <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-[#111726]">
                <div className="flex items-center justify-between border-b border-zinc-100 pb-3 dark:border-zinc-800/80">
                  <span className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                    Realized P&L Statistics
                  </span>
                  <span className="text-[11px] font-medium text-zinc-400">
                    {summary.closedTradesCount} Closed Positions
                  </span>
                </div>

                <div className="mt-4 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-500 dark:text-zinc-400">Total Realized Profits</span>
                    <span className="font-mono-num font-semibold text-emerald-600 dark:text-emerald-400">
                      +{formatINR(summary.totalRealizedProfit)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-500 dark:text-zinc-400">Total Realized Losses</span>
                    <span className="font-mono-num font-semibold text-rose-600 dark:text-rose-400">
                      -{formatINR(summary.totalRealizedLoss)}
                    </span>
                  </div>
                  <div className="border-t border-zinc-100 pt-2.5 flex items-center justify-between text-xs font-semibold dark:border-zinc-800">
                    <span className="text-zinc-700 dark:text-zinc-300">Net Realized Balance</span>
                    <span
                      className={`font-mono-num ${
                        summary.netRealizedPnL >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {summary.netRealizedPnL >= 0 ? '+' : ''}
                      {formatINR(summary.netRealizedPnL)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Timeframe Horizons */}
              <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-[#111726]">
                <div className="flex items-center justify-between border-b border-zinc-100 pb-3 dark:border-zinc-800/80">
                  <span className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                    Horizon Velocity
                  </span>
                  <span className="text-[11px] font-medium text-zinc-400">Calendar P&L</span>
                </div>

                <div className="mt-4 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-500 dark:text-zinc-400">This Week (Mon–Sun)</span>
                    <span
                      className={`font-mono-num font-semibold ${
                        summary.thisWeekPnL >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {summary.thisWeekPnL >= 0 ? '+' : ''}
                      {formatINR(summary.thisWeekPnL)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-500 dark:text-zinc-400">This Month's Realized</span>
                    <span
                      className={`font-mono-num font-semibold ${
                        summary.thisMonthPnL >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {summary.thisMonthPnL >= 0 ? '+' : ''}
                      {formatINR(summary.thisMonthPnL)}
                    </span>
                  </div>
                  <div className="border-t border-zinc-100 pt-2.5 flex items-center justify-between text-xs font-semibold dark:border-zinc-800">
                    <span className="text-zinc-700 dark:text-zinc-300">Overall Win Rate</span>
                    <span className="font-mono-num text-blue-600 dark:text-blue-400">
                      {summary.winRate.toFixed(1)}% ({summary.winningTradesCount}/{summary.closedTradesCount})
                    </span>
                  </div>
                </div>
              </div>

              {/* Capital Inflow & Liquidity */}
              <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-[#111726]">
                <div className="flex items-center justify-between border-b border-zinc-100 pb-3 dark:border-zinc-800/80">
                  <span className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                    Capital Ledger Snapshot
                  </span>
                  <button
                    onClick={() => setActiveTab('capital')}
                    className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                  >
                    Manage →
                  </button>
                </div>

                <div className="mt-4 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-500 dark:text-zinc-400">Total Capital Injected</span>
                    <span className="font-mono-num font-medium text-zinc-900 dark:text-zinc-200">
                      {formatINR(summary.totalDeposited)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-500 dark:text-zinc-400">Total Funds Withdrawn</span>
                    <span className="font-mono-num font-medium text-zinc-900 dark:text-zinc-200">
                      {formatINR(summary.totalWithdrawn)}
                    </span>
                  </div>
                  <div className="border-t border-zinc-100 pt-2.5 flex items-center justify-between text-xs font-semibold dark:border-zinc-800">
                    <span className="text-zinc-700 dark:text-zinc-300">Available Liquid Cash</span>
                    <span className="font-mono-num text-emerald-600 dark:text-emerald-400">
                      {formatINR(summary.availableCash)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Open Position CMP Update Bar if open trades exist */}
            {openTrades.length > 0 && (
              <div className="rounded-xl border border-amber-300/40 bg-amber-500/5 px-4 py-3 dark:border-amber-500/20 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                  <span className="text-xs font-medium text-zinc-800 dark:text-zinc-200">
                    <strong className="font-semibold text-amber-600 dark:text-amber-400">{openTrades.length} Open Positions</strong> currently active in portfolio. Unrealized P&L is estimated at{' '}
                    <span className={`font-mono-num font-bold ${summary.currentUnrealizedPnL >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                      {summary.currentUnrealizedPnL >= 0 ? '+' : ''}{formatINR(summary.currentUnrealizedPnL)}
                    </span>.
                  </span>
                </div>
                <button
                  onClick={() => setActiveTab('market')}
                  className="rounded-lg bg-amber-600 hover:bg-amber-500 text-white px-3 py-1 text-xs font-semibold shadow-xs cursor-pointer"
                >
                  Configure CMP Prices
                </button>
              </div>
            )}

            {/* Recent Trades Data Grid */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-800 dark:text-zinc-200">
                    Recent Execution Ledger
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Showing latest 5 trades recorded across brokerages
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('trades')}
                  className="text-xs font-semibold text-emerald-600 hover:text-emerald-500 dark:text-emerald-400 cursor-pointer"
                >
                  View All {trades.length} Records →
                </button>
              </div>
              <TradeLedger
                trades={trades.slice(0, 5)}
                onEdit={handleEditTrade}
                onDelete={handleDeleteTrade}
              />
            </div>
          </div>
        )}

        {/* ---------------- 2. TRADES LEDGER TAB ---------------- */}
        {activeTab === 'trades' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-white">
                  Quantitative Trade Ledger
                </h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Comprehensive audit trail of executions, charges, slippage, and net P&L.
                </p>
              </div>
              <button
                onClick={handleOpenAddTrade}
                className="flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-1.5 text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
                Record Trade
              </button>
            </div>

            <TradeLedger
              trades={trades}
              onEdit={handleEditTrade}
              onDelete={handleDeleteTrade}
            />
          </div>
        )}

        {/* ---------------- 3. PERIODIC ANALYSIS TAB ---------------- */}
        {activeTab === 'analysis' && (
          <PeriodicAnalysis trades={trades} onEditTrade={handleEditTrade} />
        )}

        {/* ---------------- 4. TRADING INSIGHTS TAB ---------------- */}
        {activeTab === 'insights' && (
          <TradingInsights trades={trades} />
        )}

        {/* ---------------- 5. CAPITAL MANAGEMENT TAB ---------------- */}
        {activeTab === 'capital' && (
          <CapitalManager
            transactions={capital}
            availableCash={summary.availableCash}
            totalTradingCapital={summary.totalTradingCapital}
            totalDeposited={summary.totalDeposited}
            totalWithdrawn={summary.totalWithdrawn}
            currentInvestment={summary.totalInvestment}
            currentPortfolioValue={summary.currentPortfolioValue}
            onAddTransaction={handleAddCapital}
            onDeleteTransaction={handleDeleteCapital}
          />
        )}

        {/* ---------------- 6. MARKET PRICE TAB ---------------- */}
        {activeTab === 'market' && (
          <MarketPriceManager
            openTrades={openTrades}
            onUpdatePrices={handleUpdateMarketPrices}
          />
        )}
      </main>

      {/* Modals */}
      <TradeEntryModal
        isOpen={isTradeModalOpen}
        onClose={() => setIsTradeModalOpen(false)}
        onSave={handleSaveTrade}
        initialTrade={tradeToEdit}
      />

      <BackupExportModal
        isOpen={isBackupModalOpen}
        onClose={() => setIsBackupModalOpen(false)}
        trades={trades}
        capital={capital}
        onDataChanged={loadData}
      />
    </div>
  );
}

export default App;
