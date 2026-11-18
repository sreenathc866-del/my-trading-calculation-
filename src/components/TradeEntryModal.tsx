import React, { useState, useEffect } from 'react';
import type { Trade, TradingPlatform, TradeType, TradeStatus } from '../types/trading';
import { calculateTradeMetrics, formatINR } from '../utils/calculations';
import { X } from 'lucide-react';

interface TradeEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (trade: Trade) => void;
  initialTrade?: Trade | null;
}

export const TradeEntryModal: React.FC<TradeEntryModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialTrade,
}) => {
  const [formData, setFormData] = useState<Partial<Trade>>({
    date: new Date().toISOString().slice(0, 10),
    assetName: '',
    symbol: '',
    platform: 'Groww',
    tradeType: 'Intraday',
    buyPrice: 0,
    sellPrice: 0,
    currentMarketPrice: 0,
    quantity: 1,
    brokerage: 20,
    taxesAndCharges: 5,
    status: 'Closed',
    notes: '',
  });

  useEffect(() => {
    if (initialTrade) {
      setFormData(initialTrade);
    } else {
      setFormData({
        date: new Date().toISOString().slice(0, 10),
        assetName: '',
        symbol: '',
        platform: 'Groww',
        tradeType: 'Intraday',
        buyPrice: 0,
        sellPrice: 0,
        currentMarketPrice: 0,
        quantity: 1,
        brokerage: 20,
        taxesAndCharges: 5,
        status: 'Closed',
        notes: '',
      });
    }
  }, [initialTrade, isOpen]);

  if (!isOpen) return null;

  const previewTrade: Trade = {
    id: formData.id || 'preview',
    date: formData.date || '',
    assetName: formData.assetName || '',
    symbol: formData.symbol || '',
    platform: (formData.platform as TradingPlatform) || 'Groww',
    tradeType: (formData.tradeType as TradeType) || 'Intraday',
    buyPrice: Number(formData.buyPrice) || 0,
    sellPrice: Number(formData.sellPrice) || 0,
    currentMarketPrice: Number(formData.currentMarketPrice) || 0,
    quantity: Number(formData.quantity) || 0,
    brokerage: Number(formData.brokerage) || 0,
    taxesAndCharges: Number(formData.taxesAndCharges) || 0,
    status: (formData.status as TradeStatus) || 'Closed',
    notes: formData.notes || '',
    createdAt: formData.createdAt || Date.now(),
    updatedAt: Date.now(),
  };

  const metrics = calculateTradeMetrics(previewTrade);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.symbol || !formData.date || !formData.buyPrice || !formData.quantity) {
      alert('Please fill all mandatory trade attributes (Symbol, Date, Buy Price, Quantity).');
      return;
    }

    const tradeToSave: Trade = {
      id: initialTrade ? initialTrade.id : 'tr_' + Date.now(),
      date: formData.date,
      assetName: formData.assetName || formData.symbol.toUpperCase(),
      symbol: formData.symbol.toUpperCase().trim(),
      platform: formData.platform as TradingPlatform,
      tradeType: formData.tradeType as TradeType,
      buyPrice: Number(formData.buyPrice),
      sellPrice: Number(formData.sellPrice || 0),
      currentMarketPrice: Number(formData.currentMarketPrice || formData.buyPrice),
      quantity: Number(formData.quantity),
      brokerage: Number(formData.brokerage || 0),
      taxesAndCharges: Number(formData.taxesAndCharges || 0),
      status: formData.status as TradeStatus,
      notes: formData.notes || '',
      createdAt: initialTrade ? initialTrade.createdAt : Date.now(),
      updatedAt: Date.now(),
    };

    onSave(tradeToSave);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-2xl rounded-xl border border-zinc-200 bg-white shadow-xl dark:border-zinc-800 dark:bg-[#111726]">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-3.5 dark:border-zinc-800">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-900 dark:text-white">
              {initialTrade ? 'Modify Trade Record' : 'Record Trade Execution'}
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Precise entry calculation with brokerage & regulatory friction
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Symbol */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1">
                Trading Symbol *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. RELIANCE, NIFTY24DEC"
                value={formData.symbol}
                onChange={(e) => setFormData({ ...formData, symbol: e.target.value.toUpperCase() })}
                className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs text-zinc-900 font-mono-num font-semibold focus:border-zinc-400 focus:bg-white dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
              />
            </div>

            {/* Asset / Company Name */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1">
                Instrument Description
              </label>
              <input
                type="text"
                placeholder="e.g. Reliance Industries Ltd"
                value={formData.assetName}
                onChange={(e) => setFormData({ ...formData, assetName: e.target.value })}
                className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs text-zinc-900 focus:border-zinc-400 focus:bg-white dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
              />
            </div>

            {/* Date */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1">
                Execution Date *
              </label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs text-zinc-900 font-mono-num focus:border-zinc-400 focus:bg-white dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
              />
            </div>

            {/* Platform */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1">
                Trading Platform
              </label>
              <select
                value={formData.platform}
                onChange={(e) => setFormData({ ...formData, platform: e.target.value as TradingPlatform })}
                className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs text-zinc-900 font-medium dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
              >
                <option value="Groww">Groww</option>
                <option value="Zerodha">Zerodha</option>
                <option value="AngelOne">Angel One</option>
                <option value="Upstox">Upstox</option>
                <option value="Dhan">Dhan</option>
                <option value="Other">Other Broker</option>
              </select>
            </div>

            {/* Trade Type */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1">
                Order Type
              </label>
              <select
                value={formData.tradeType}
                onChange={(e) => setFormData({ ...formData, tradeType: e.target.value as TradeType })}
                className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs text-zinc-900 font-medium dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
              >
                <option value="Intraday">Intraday (MIS)</option>
                <option value="Delivery">Delivery / Swing (CNC)</option>
                <option value="Futures">Futures (NRML)</option>
                <option value="Options">Options</option>
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1">
                Position Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as TradeStatus })}
                className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs text-zinc-900 font-medium dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
              >
                <option value="Closed">Closed Position</option>
                <option value="Open">Open (Holding / Unsold)</option>
                <option value="Partially Sold">Partially Sold</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          {/* Pricing Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 border-t border-zinc-100 pt-3 dark:border-zinc-800/80">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1">
                Quantity *
              </label>
              <input
                type="number"
                min="1"
                required
                value={formData.quantity || ''}
                onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs text-zinc-900 font-mono-num font-semibold dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1">
                Buy Price (₹) *
              </label>
              <input
                type="number"
                step="any"
                required
                value={formData.buyPrice || ''}
                onChange={(e) => setFormData({ ...formData, buyPrice: Number(e.target.value) })}
                className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs text-zinc-900 font-mono-num font-semibold dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
              />
            </div>

            {formData.status === 'Open' ? (
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-1">
                  Current Market (₹)
                </label>
                <input
                  type="number"
                  step="any"
                  value={formData.currentMarketPrice || ''}
                  onChange={(e) => setFormData({ ...formData, currentMarketPrice: Number(e.target.value) })}
                  className="w-full rounded-lg border border-amber-300 bg-amber-500/5 px-3 py-1.5 text-xs text-zinc-900 font-mono-num font-semibold dark:border-amber-500/30 dark:text-amber-300"
                />
              </div>
            ) : (
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1">
                  Sell Price (₹)
                </label>
                <input
                  type="number"
                  step="any"
                  value={formData.sellPrice || ''}
                  onChange={(e) => setFormData({ ...formData, sellPrice: Number(e.target.value) })}
                  className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs text-zinc-900 font-mono-num font-semibold dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
                />
              </div>
            )}

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1">
                Brokerage (₹)
              </label>
              <input
                type="number"
                step="any"
                value={formData.brokerage !== undefined ? formData.brokerage : 20}
                onChange={(e) => setFormData({ ...formData, brokerage: Number(e.target.value) })}
                className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs text-zinc-900 font-mono-num dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1">
              Rationale / Strategy Notes
            </label>
            <input
              type="text"
              placeholder="e.g. 5-min EMA crossover, trailing stop 2% below breakout bar"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs text-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
            />
          </div>

          {/* Real-time Math Preview Ribbon */}
          <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-900/50">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div>
                <span className="text-[10px] uppercase font-bold text-zinc-400">Total Purchase:</span>
                <div className="font-mono-num font-semibold text-zinc-800 dark:text-zinc-200">
                  {formatINR(metrics.totalPurchaseAmount)}
                </div>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-zinc-400">Total Charges:</span>
                <div className="font-mono-num font-semibold text-zinc-800 dark:text-zinc-200">
                  {formatINR(metrics.totalCharges)}
                </div>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-zinc-400">
                  {formData.status === 'Open' ? 'Unrealized P&L:' : 'Net Realized P&L:'}
                </span>
                <div
                  className={`font-mono-num font-bold ${
                    (formData.status === 'Open' ? metrics.unrealizedPnL : metrics.netPnL) >= 0
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-rose-600 dark:text-rose-400'
                  }`}
                >
                  {formatINR(formData.status === 'Open' ? metrics.unrealizedPnL : metrics.netPnL)}
                </div>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-zinc-400">Return %:</span>
                <div
                  className={`font-mono-num font-bold ${
                    metrics.returnPercentage >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                  }`}
                >
                  {metrics.returnPercentage.toFixed(2)}%
                </div>
              </div>
            </div>
          </div>

          {/* Action Footer */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-3 py-1.5 text-xs font-semibold text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-1.5 text-xs font-semibold shadow-xs cursor-pointer"
            >
              {initialTrade ? 'Save Changes' : 'Record Trade'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
