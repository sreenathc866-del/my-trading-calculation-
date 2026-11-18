import React, { useState } from 'react';
import type { Trade } from '../types/trading';
import { formatINR } from '../utils/calculations';
import { Radio, RefreshCw, CheckCircle2, Clock, AlertCircle } from 'lucide-react';

interface MarketPriceManagerProps {
  openTrades: Trade[];
  onUpdatePrices: (updates: { id: string; currentMarketPrice: number }[]) => void;
}

export const MarketPriceManager: React.FC<MarketPriceManagerProps> = ({
  openTrades,
  onUpdatePrices,
}) => {
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
      currentMarketPrice:
        manualPrices[t.id] !== undefined
          ? manualPrices[t.id]
          : (t.currentMarketPrice || t.buyPrice),
    }));
    onUpdatePrices(updates);
    setLastUpdated(new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' }));
  };

  const handleSimulateApiFetch = async () => {
    setIsLoading(true);
    setTimeout(() => {
      const updates = openTrades.map((t) => {
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
    }, 600);
  };

  if (openTrades.length === 0) {
    return (
      <div className="rounded-xl border border-zinc-200 bg-white p-8 dark:border-zinc-800 dark:bg-[#111726] text-center">
        <Radio className="mx-auto h-7 w-7 text-zinc-400 mb-2" />
        <h4 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
          No Active Open Positions
        </h4>
        <p className="text-xs text-zinc-400 mt-1 max-w-md mx-auto">
          When you hold open delivery or swing positions, you can monitor and calibrate real-time Current Market Prices (CMP) here to maintain accurate unrealized P&L.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-[#111726] space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-100 pb-3 dark:border-zinc-800">
        <div>
          <div className="flex items-center gap-2">
            <Radio className="h-4 w-4 text-emerald-500 animate-pulse" />
            <h4 className="text-sm font-bold uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
              Live CMP Calibration Matrix
            </h4>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Calibrate current market quote for active open holdings without altering realized trades
          </p>
        </div>

        <div className="flex items-center gap-2">
          {lastUpdated && (
            <span className="flex items-center gap-1 text-[11px] font-mono-num text-zinc-400 mr-2">
              <Clock className="h-3 w-3" /> Updated: {lastUpdated}
            </span>
          )}

          <button
            onClick={handleSimulateApiFetch}
            disabled={isLoading}
            className="flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Simulate Market Feed</span>
          </button>

          <button
            onClick={saveManualPrices}
            className="rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-1.5 text-xs font-semibold shadow-xs cursor-pointer"
          >
            Commit CMP Values
          </button>
        </div>
      </div>

      {/* Grid of Open Stocks for Fast Price Entry */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {openTrades.map((t) => {
          const cmp =
            manualPrices[t.id] !== undefined
              ? manualPrices[t.id]
              : (t.currentMarketPrice || t.buyPrice);
          const diff = cmp - t.buyPrice;
          const diffPct = (diff / t.buyPrice) * 100;
          const unrealized = (cmp - t.buyPrice) * t.quantity - (t.brokerage + t.taxesAndCharges);

          return (
            <div
              key={t.id}
              className="rounded-xl border border-zinc-200 bg-zinc-50 p-3.5 dark:border-zinc-800 dark:bg-zinc-900/50"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                    {t.symbol}
                  </div>
                  <div className="text-[10px] text-zinc-400 truncate max-w-[150px]">
                    {t.assetName}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] uppercase font-semibold text-zinc-400">
                    Qty: <span className="font-mono-num text-zinc-700 dark:text-zinc-300">{t.quantity}</span>
                  </div>
                  <div className="font-mono-num text-[11px] text-zinc-500">
                    Entry: {formatINR(t.buyPrice)}
                  </div>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between gap-3 border-t border-zinc-200/60 pt-2.5 dark:border-zinc-800">
                <div className="flex-1">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-0.5">
                    Live CMP (₹)
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={cmp}
                    onChange={(e) => handleManualPriceChange(t.id, Number(e.target.value))}
                    className="w-full rounded-md border border-zinc-300 bg-white px-2.5 py-1 text-xs font-mono-num font-bold text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                  />
                </div>

                <div className="text-right shrink-0">
                  <div className="text-[10px] uppercase font-bold text-zinc-400">
                    Unrealized P&L
                  </div>
                  <div
                    className={`font-mono-num text-xs font-bold ${
                      unrealized >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    {unrealized >= 0 ? '+' : ''}
                    {formatINR(unrealized)}
                  </div>
                  <div
                    className={`font-mono-num text-[10px] font-semibold ${
                      diffPct >= 0 ? 'text-emerald-500' : 'text-rose-500'
                    }`}
                  >
                    {diffPct >= 0 ? '+' : ''}
                    {diffPct.toFixed(2)}%
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
