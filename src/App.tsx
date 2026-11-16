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
  PlusCircle,
  Database,
  Sun,
  Moon,
  BarChart3,
  BookOpen,
  PieChart,
  DollarSign,
  Radio,
  ArrowUpRight,
  ArrowDownRight,
  Layers,
  Sparkles,
  ShieldCheck,
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
    return localStorage.getItem('theme') === 'dark';
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

      // Seed initial dummy sample data if totally fresh for instant experience
      if (storedTrades.length === 0 && storedCapital.length === 0) {
        const todayStr = new Date().toISOString().slice(0, 10);
        const sampleCapital: CapitalTransaction = {
          id: 'cap_initial',
          date: todayStr,
          type: 'Initial',
          amount: 150000,
          platform: 'Groww',
          notes: 'Initial trading deposit',
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
            notes: 'Breakout above monthly pivot level',
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
            notes: 'Intraday pullback stop triggered',
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
            currentMarketPrice: 1910,
            quantity: 25,
            brokerage: 20,
            taxesAndCharges: 15,
            status: 'Open',
            notes: 'Quarterly swing holding',
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

  // Handlers for Trades
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

  // Handlers for Capital
  const handleAddCapital = async (tx: CapitalTransaction) => {
    await saveCapitalTransaction(tx);
    await loadData();
  };

  const handleDeleteCapital = async (id: string) => {
    await deleteCapitalTransaction(id);
    await loadData();
  };

  // Handlers for Market Price Updates
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

  // Calculated Portfolio Summary
  const summary = calculateDashboardSummary(trades, capital);
  const openTrades = trades.filter((t) => t.status === 'Open');

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 transition-colors dark:bg-[#0f172a] dark:text-slate-100 pb-16">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur-md dark:border-slate-800/80 dark:bg-[#0f172a]/90">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-white shadow-md shadow-indigo-500/20">
              <TrendingUp className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-black tracking-tight text-slate-900 dark:text-white">
                  TRADELYTICS <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-400">PRO</span>
                </h1>
              </div>
              <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                Personal Trading & P&L Intelligence (100% Offline & Private)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={handleOpenAddTrade}
              className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs sm:text-sm font-semibold text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-500 transition-all cursor-pointer"
            >
              <PlusCircle className="h-4 w-4" />
              <span>Add Trade</span>
            </button>

            <button
              onClick={() => setIsBackupModalOpen(true)}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 transition-all cursor-pointer"
              title="Backup, Restore & Exports"
            >
              <Database className="h-4 w-4 text-indigo-500" />
              <span className="hidden sm:inline">Backup / Export</span>
            </button>

            <button
              onClick={() => setDarkMode(!darkMode)}
              className="rounded-xl border border-slate-200 bg-white p-2 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 cursor-pointer"
              title="Toggle Theme"
            >
              {darkMode ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-indigo-600" />}
            </button>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex overflow-x-auto space-x-1 sm:space-x-2 border-t border-slate-100 dark:border-slate-800/60 py-1.5">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
            { id: 'trades', label: `Trades (${trades.length})`, icon: BookOpen },
            { id: 'analysis', label: 'Periodic Analysis', icon: PieChart },
            { id: 'insights', label: 'Trading Insights', icon: Sparkles },
            { id: 'capital', label: 'Capital Management', icon: Wallet },
            { id: 'market', label: `Market Prices (${openTrades.length} Open)`, icon: Radio },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {/* ---------------- 1. DASHBOARD TAB ---------------- */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Primary KPI Grid: Section 1 Dashboard Requirement */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {/* Total Trading Capital */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Total Trading Capital
                </span>
                <div className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
                  {formatINR(summary.totalTradingCapital)}
                </div>
                <div className="mt-1 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <span>Available Cash:</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">{formatINR(summary.availableCash)}</span>
                </div>
              </div>

              {/* Current Portfolio Value */}
              <div className="rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-50/40 to-white p-5 shadow-xs dark:border-indigo-900/60 dark:from-slate-900 dark:to-indigo-950/20">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                    Current Portfolio Value
                  </span>
                  <Wallet className="h-4 w-4 text-indigo-500" />
                </div>
                <div className="mt-2 text-2xl font-black text-indigo-950 dark:text-indigo-200">
                  {formatINR(summary.currentPortfolioValue)}
                </div>
                <div className="mt-1 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <span>Total Investment:</span>
                  <span className="font-semibold">{formatINR(summary.totalInvestment)}</span>
                </div>
              </div>

              {/* Overall Profit/Loss Percentage */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Overall P&L %
                </span>
                <div className={`mt-2 text-2xl font-black ${
                  summary.overallPnLPercentage >= 0 ? 'text-emerald-500' : 'text-rose-500'
                }`}>
                  {formatPercent(summary.overallPnLPercentage)}
                </div>
                <div className="mt-1 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <span>Net Capital Gains:</span>
                  <span className={`font-semibold ${summary.netRealizedPnL + summary.currentUnrealizedPnL >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {formatINR(summary.netRealizedPnL + summary.currentUnrealizedPnL)}
                  </span>
                </div>
              </div>

              {/* Today's P&L */}
              <div className={`rounded-2xl border p-5 shadow-xs ${
                summary.todayPnL >= 0
                  ? 'border-emerald-200 bg-emerald-50/30 dark:border-emerald-950/60 dark:bg-emerald-950/20'
                  : 'border-rose-200 bg-rose-50/30 dark:border-rose-950/60 dark:bg-rose-950/20'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Today's Profit / Loss
                  </span>
                  {summary.todayPnL >= 0 ? (
                    <ArrowUpRight className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <ArrowDownRight className="h-4 w-4 text-rose-500" />
                  )}
                </div>
                <div className={`mt-2 text-2xl font-black ${
                  summary.todayPnL >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                }`}>
                  {summary.todayPnL >= 0 ? '+' : ''}{formatINR(summary.todayPnL)}
                </div>
                <p className="mt-1 text-xs text-slate-400">
                  Daily Return: {formatPercent(summary.todayReturnPct)}
                </p>
              </div>

              {/* This Week's P&L */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  This Week's P&L
                </span>
                <div className={`mt-2 text-2xl font-black ${
                  summary.thisWeekPnL >= 0 ? 'text-emerald-500' : 'text-rose-500'
                }`}>
                  {summary.thisWeekPnL >= 0 ? '+' : ''}{formatINR(summary.thisWeekPnL)}
                </div>
                <p className="mt-1 text-xs text-slate-400">Monday to Sunday</p>
              </div>

              {/* This Month's P&L */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  This Month's P&L
                </span>
                <div className={`mt-2 text-2xl font-black ${
                  summary.thisMonthPnL >= 0 ? 'text-emerald-500' : 'text-rose-500'
                }`}>
                  {summary.thisMonthPnL >= 0 ? '+' : ''}{formatINR(summary.thisMonthPnL)}
                </div>
                <p className="mt-1 text-xs text-slate-400">Current calendar month</p>
              </div>

              {/* Total Realized Profit */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Total Realized Profit
                </span>
                <div className="mt-2 text-2xl font-black text-emerald-500">
                  +{formatINR(summary.totalRealizedProfit)}
                </div>
                <p className="mt-1 text-xs text-slate-400">
                  Winning trades: {summary.winningTradesCount}
                </p>
              </div>

              {/* Total Realized Loss */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Total Realized Loss
                </span>
                <div className="mt-2 text-2xl font-black text-rose-500">
                  -{formatINR(summary.totalRealizedLoss)}
                </div>
                <p className="mt-1 text-xs text-slate-400">
                  Losing trades: {summary.losingTradesCount}
                </p>
              </div>

              {/* Current Unrealized P&L */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Unrealized P&L
                  </span>
                  <span className="text-[10px] font-semibold text-amber-500">OPEN TRADES</span>
                </div>
                <div className={`mt-2 text-2xl font-black ${
                  summary.currentUnrealizedPnL >= 0 ? 'text-emerald-500' : 'text-rose-500'
                }`}>
                  {summary.currentUnrealizedPnL >= 0 ? '+' : ''}{formatINR(summary.currentUnrealizedPnL)}
                </div>
                <p className="mt-1 text-xs text-slate-400">
                  Active in {openTrades.length} holding positions
                </p>
              </div>

              {/* Money Deposited */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Total Deposited
                </span>
                <div className="mt-2 text-2xl font-bold text-slate-800 dark:text-slate-100">
                  {formatINR(summary.totalDeposited)}
                </div>
                <p className="mt-1 text-xs text-slate-400">Total funds injected</p>
              </div>

              {/* Money Withdrawn */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Total Withdrawn
                </span>
                <div className="mt-2 text-2xl font-bold text-slate-800 dark:text-slate-100">
                  {formatINR(summary.totalWithdrawn)}
                </div>
                <p className="mt-1 text-xs text-slate-400">Funds withdrawn</p>
              </div>

              {/* Win Rate */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Win Rate %
                </span>
                <div className="mt-2 text-2xl font-black text-indigo-600 dark:text-indigo-400">
                  {summary.winRate.toFixed(1)}%
                </div>
                <p className="mt-1 text-xs text-slate-400">
                  {summary.winningTradesCount} wins out of {summary.closedTradesCount} closed
                </p>
              </div>
            </div>

            {/* Quick Actions / Active Holding Banner */}
            {openTrades.length > 0 && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50/40 p-4 dark:border-amber-900/60 dark:bg-amber-950/20 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Radio className="h-5 w-5 text-amber-500 animate-pulse" />
                  <div>
                    <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      You have {openTrades.length} active Open holding position{openTrades.length > 1 ? 's' : ''}
                    </span>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Unrealized P&L is tracked with current market prices without inflating realized profits.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab('market')}
                  className="rounded-xl bg-amber-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-amber-500 cursor-pointer"
                >
                  Update CMP Prices
                </button>
              </div>
            )}

            {/* Recent Trades Table Preview */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
                  Recent Trading Activity
                </h3>
                <button
                  onClick={() => setActiveTab('trades')}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 cursor-pointer"
                >
                  View All ({trades.length}) →
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
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  Trading Records Ledger
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Search, filter, edit, or delete any trade record. Calculations update instantly.
                </p>
              </div>
              <button
                onClick={handleOpenAddTrade}
                className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-500 cursor-pointer"
              >
                <PlusCircle className="h-4 w-4" />
                Add New Trade
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
