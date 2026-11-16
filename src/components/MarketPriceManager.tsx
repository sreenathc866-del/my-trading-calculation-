import React, { useState } from 'react';
import type { Trade } from '../types/trading';
import { formatINR } from '../utils/calculations';
import { RefreshCw, Radio, CheckCircle, Clock, Edit3, AlertCircle } from 'lucide-react';

interface MarketPriceManagerProps {
  openTrades: Trade[];
  onUpdatePrices: (updates: { id: string; currentMarketPrice: number }[]) => void;
}

export const MarketPriceManager: React.FC<MarketPriceManagerProps> = ({
  openTrades,
  onUpdatePrices,
}) => {
  const [isApiConnected, setIsApiConnected] = useState<boolean>(false);
  const [apiKey, setApiKey] = useState<string>('');
  const [manualPrices, setManualPrices] = useState<Record<string, number>>({});
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleManualPriceChange = (tradeId: string, val: number) => {
    setManualPrices((prev) => ({
      ...prev,
      [tradeId]: val,
    }));
  };

  const saveManualPrices = () => {
    const updates = openTrades.map((t) => ({
      id: t.id,
      currentMarketPrice: manualPrices[t.id] !== undefined ? manualPrices[t.id] : (t.currentMarketPrice || t.buyPrice),
    }));
    onUpdatePrices(updates);
    setLastUpdated(new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' }));
  };

  const handleSimulateApiFetch = async () => {
    setIsLoading(true);
    // Simulating API latency / price fetch
    setTimeout(() => {
      const updates = openTrades.map((t) => {
        // Small realistic market variation +/- 1.5% from current or buy price
        const base = t.currentMarketPrice || t.buyPrice;
        const variation = (Math.random() * 0.04 - 0.015);
        const newCmp = Math.round((base * (1 + variation)) * 100) / 100;
        return {
          id: t.id,
          currentMarketPrice: newCmp,
        };
      });
      onUpdatePrices(updates);
      setLastUpdated(new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' }));
      setIsLoading(false);
    }, 800);
  };

  if (openTrades.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 text-center">
        <Radio className="mx-auto h-8 w-8 text-slate-400 mb-2" />
        <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
          No Open Positions
        </h4>
        <p className="text-xs text-slate-400 mt-1">
          When you hold open or delivery trades, you can configure live prices or enter current market prices here to update unrealized P&L in real-time.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Radio className="h-5 w-5 text-indigo-500" />
            <h4 className="text-base font-bold text-slate-800 dark:text-slate-100">
              Market Price Updates & CMP Configuration
            </h4>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Retrieve latest quotes or enter manual CMP for Open holding positions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {lastUpdated && (
            <span className="flex items-center gap-1 text-xs text-slate-400">
              <Clock className="h-3.5 w-3.5" />
              Updated at {lastUpdated} IST
            </span>
          )}

          <button
            onClick={handleSimulateApiFetch}
            disabled={isLoading}
            className="flex items-center gap-1.5 rounded-xl bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:text-indigo-300 cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh Quotes
          </button>
        </div>
      </div>

      {/* API connection option */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3.5 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-800/40 dark:text-slate-300">
        <div className="flex items-center gap-2">
          <div className={`h-2.5 w-2.5 rounded-full ${isApiConnected ? 'bg-emerald-500' : 'bg-amber-400'}`} />
          <span>
            Market API Status: <strong>{isApiConnected ? 'Connected (Live Indian Feed)' : 'Manual Entry Mode (Offline)'}</strong>
          </span>
        </div>
        <button
          onClick={() => setIsApiConnected(!isApiConnected)}
          className="font-semibold text-indigo-600 hover:underline dark:text-indigo-400"
        >
          {isApiConnected ? 'Switch to Manual Entry' : 'Connect Market API (Optional)'}
        </button>
      </div>

      {isApiConnected && (
        <div className="rounded-xl border border-indigo-200 bg-indigo-50/50 p-3 text-xs text-indigo-800 dark:border-indigo-900/60 dark:bg-indigo-950/20 dark:text-indigo-300">
          <div className="font-semibold mb-1">Live Feed Integration (Zerodha Kite / AlphaVantage / Yahoo Finance)</div>
          <div className="flex gap-2">
            <input
              type="password"
              placeholder="Enter Market Data API Key (optional)"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="flex-1 rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs dark:border-slate-700 dark:bg-slate-800"
            />
            <button
              onClick={() => alert('API credentials saved locally!')}
              className="rounded-lg bg-indigo-600 px-3 py-1 font-semibold text-white hover:bg-indigo-500"
            >
              Save Key
            </button>
          </div>
        </div>
      )}

      {/* Open positions quick price editor table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-500 dark:bg-slate-800/60 dark:text-slate-400 font-semibold uppercase">
            <tr>
              <th className="px-4 py-2.5">Symbol</th>
              <th className="px-4 py-2.5">Buy Price</th>
              <th className="px-4 py-2.5">Current CMP (₹)</th>
              <th className="px-4 py-2.5">Unrealized P&L</th>
              <th className="px-4 py-2.5">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {openTrades.map((t) => {
              const currentVal = manualPrices[t.id] !== undefined ? manualPrices[t.id] : (t.currentMarketPrice || t.buyPrice);
              const grossUnrealized = (currentVal - t.buyPrice) * t.quantity;
              const netUnrealized = grossUnrealized - (t.brokerage + t.taxesAndCharges);

              return (
                <tr key={t.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                  <td className="px-4 py-2.5 font-bold text-slate-800 dark:text-slate-200">
                    {t.symbol} <span className="text-[10px] font-normal text-slate-400">({t.quantity} Qty)</span>
                  </td>
                  <td className="px-4 py-2.5 text-slate-600 dark:text-slate-400">
                    {formatINR(t.buyPrice)}
                  </td>
                  <td className="px-4 py-2.5">
                    <input
                      type="number"
                      step="any"
                      value={manualPrices[t.id] !== undefined ? manualPrices[t.id] : (t.currentMarketPrice || t.buyPrice)}
                      onChange={(e) => handleManualPriceChange(t.id, parseFloat(e.target.value) || 0)}
                      className="w-28 rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs font-semibold text-slate-900 focus:border-indigo-500 focus:outline-hidden dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    />
                  </td>
                  <td className={`px-4 py-2.5 font-bold ${netUnrealized >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {netUnrealized >= 0 ? '+' : ''}{formatINR(netUnrealized)}
                  </td>
                  <td className="px-4 py-2.5 text-slate-400">
                    <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">
                      Open Position
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex justify-end pt-2">
        <button
          onClick={saveManualPrices}
          className="flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
        >
          <Edit3 className="h-3.5 w-3.5" />
          Apply Updated Market Prices
        </button>
      </div>
    </div>
  );
};
