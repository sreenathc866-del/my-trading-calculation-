import React, { useState, useEffect } from 'react';
import type { Trade, TradingPlatform, TradeType, TradeStatus } from '../types/trading';
import { calculateTradeMetrics, formatINR } from '../utils/calculations';
import { PlusCircle, Save, X, Calculator, IndianRupee } from 'lucide-react';

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

  // Real-time preview calculation
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
    if (!formData.symbol || !formData.buyPrice || !formData.quantity) {
      alert('Please fill in Symbol, Buy Price, and Quantity');
      return;
    }

    const tradeToSave: Trade = {
      id: initialTrade ? initialTrade.id : 'tr_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      date: formData.date || new Date().toISOString().slice(0, 10),
      assetName: formData.assetName || formData.symbol.toUpperCase(),
      symbol: (formData.symbol || '').toUpperCase().trim(),
      platform: formData.platform as TradingPlatform,
      tradeType: formData.tradeType as TradeType,
      buyPrice: Number(formData.buyPrice),
      sellPrice: Number(formData.sellPrice) || 0,
      currentMarketPrice: Number(formData.currentMarketPrice) || undefined,
      quantity: Number(formData.quantity),
      brokerage: Number(formData.brokerage) || 0,
      taxesAndCharges: Number(formData.taxesAndCharges) || 0,
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
      <div className="relative w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800 my-8">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <PlusCircle className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">
              {initialTrade ? 'Edit Trade Record' : 'Record Daily Trade'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Date (IST)
              </label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-indigo-500 focus:outline-hidden dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Stock Symbol *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. RELIANCE, NIFTY24OCT..."
                value={formData.symbol}
                onChange={(e) => setFormData({ ...formData, symbol: e.target.value.toUpperCase() })}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 uppercase focus:border-indigo-500 focus:outline-hidden dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Asset Name
              </label>
              <input
                type="text"
                placeholder="e.g. Reliance Industries"
                value={formData.assetName}
                onChange={(e) => setFormData({ ...formData, assetName: e.target.value })}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-indigo-500 focus:outline-hidden dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Platform
              </label>
              <select
                value={formData.platform}
                onChange={(e) => setFormData({ ...formData, platform: e.target.value as TradingPlatform })}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-indigo-500 focus:outline-hidden dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              >
                <option value="Groww">Groww</option>
                <option value="Zerodha">Zerodha</option>
                <option value="AngelOne">Angel One</option>
                <option value="Upstox">Upstox</option>
                <option value="Dhan">Dhan</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Trading Type
              </label>
              <select
                value={formData.tradeType}
                onChange={(e) => setFormData({ ...formData, tradeType: e.target.value as TradeType })}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-indigo-500 focus:outline-hidden dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              >
                <option value="Intraday">Intraday</option>
                <option value="Delivery">Delivery (Equity)</option>
                <option value="F&O">F&O (Options/Futures)</option>
                <option value="ETF">ETF</option>
                <option value="IPO">IPO</option>
                <option value="Commodity">Commodity</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Trade Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as TradeStatus })}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-800 focus:border-indigo-500 focus:outline-hidden dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              >
                <option value="Closed">Closed (Completed)</option>
                <option value="Open">Open (Holding / Unrealized)</option>
                <option value="Partially Sold">Partially Sold</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Buy Price (₹) *
              </label>
              <input
                type="number"
                step="any"
                required
                min="0.01"
                placeholder="1000"
                value={formData.buyPrice || ''}
                onChange={(e) => setFormData({ ...formData, buyPrice: parseFloat(e.target.value) || 0 })}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-indigo-500 focus:outline-hidden dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>

            {formData.status === 'Open' ? (
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Current Market Price / CMP (₹)
                </label>
                <input
                  type="number"
                  step="any"
                  placeholder="Leave empty or set CMP"
                  value={formData.currentMarketPrice || ''}
                  onChange={(e) => setFormData({ ...formData, currentMarketPrice: parseFloat(e.target.value) || 0 })}
                  className="w-full rounded-xl border border-amber-300 bg-amber-50/40 px-3 py-2 text-sm text-slate-800 focus:border-amber-500 focus:outline-hidden dark:border-amber-700/60 dark:bg-amber-950/20 dark:text-slate-100"
                />
              </div>
            ) : (
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Sell Price (₹)
                </label>
                <input
                  type="number"
                  step="any"
                  placeholder="1100"
                  value={formData.sellPrice || ''}
                  onChange={(e) => setFormData({ ...formData, sellPrice: parseFloat(e.target.value) || 0 })}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-indigo-500 focus:outline-hidden dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Quantity *
              </label>
              <input
                type="number"
                step="any"
                required
                min="0.001"
                placeholder="10"
                value={formData.quantity || ''}
                onChange={(e) => setFormData({ ...formData, quantity: parseFloat(e.target.value) || 0 })}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-indigo-500 focus:outline-hidden dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Brokerage Charges (₹)
              </label>
              <input
                type="number"
                step="any"
                min="0"
                placeholder="20"
                value={formData.brokerage ?? 0}
                onChange={(e) => setFormData({ ...formData, brokerage: parseFloat(e.target.value) || 0 })}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-indigo-500 focus:outline-hidden dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Taxes & Other Charges (₹)
                <span className="text-[10px] text-slate-400 block font-normal">STT, GST, Stamp Duty, SEBI</span>
              </label>
              <input
                type="number"
                step="any"
                min="0"
                placeholder="10"
                value={formData.taxesAndCharges ?? 0}
                onChange={(e) => setFormData({ ...formData, taxesAndCharges: parseFloat(e.target.value) || 0 })}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-indigo-500 focus:outline-hidden dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
              Notes / Strategy / Learnings
            </label>
            <input
              type="text"
              placeholder="e.g. Breakout retest at 20 EMA, trailed stop loss..."
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-indigo-500 focus:outline-hidden dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
          </div>

          {/* Automatic Calculation Preview Box */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/60">
            <div className="flex items-center gap-2 mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              <Calculator className="h-4 w-4" />
              Live Trade Math Preview
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-2 gap-x-4 text-xs">
              <div>
                <span className="text-slate-500 dark:text-slate-400 block">Purchase Amount:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {formatINR(metrics.totalPurchaseAmount)}
                </span>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400 block">
                  {formData.status === 'Open' ? 'Current Valuation:' : 'Selling Amount:'}
                </span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {formData.status === 'Open'
                    ? formatINR((Number(formData.currentMarketPrice) || Number(formData.buyPrice)) * Number(formData.quantity))
                    : formatINR(metrics.totalSellingAmount)}
                </span>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400 block">Total Charges:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {formatINR(metrics.totalCharges)}
                </span>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400 block">
                  {formData.status === 'Open' ? 'Gross Unrealized:' : 'Gross P&L:'}
                </span>
                <span className={`font-semibold ${
                  (formData.status === 'Open' ? metrics.unrealizedPnL + metrics.totalCharges : metrics.grossPnL) >= 0
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-rose-600 dark:text-rose-400'
                }`}>
                  {formatINR(formData.status === 'Open' ? metrics.unrealizedPnL + metrics.totalCharges : metrics.grossPnL)}
                </span>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400 block">
                  {formData.status === 'Open' ? 'Net Unrealized P&L:' : 'Net Realized P&L:'}
                </span>
                <span className={`font-bold text-sm ${
                  (formData.status === 'Open' ? metrics.unrealizedPnL : metrics.netPnL) >= 0
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-rose-600 dark:text-rose-400'
                }`}>
                  {formatINR(formData.status === 'Open' ? metrics.unrealizedPnL : metrics.netPnL)}
                </span>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400 block">Return %:</span>
                <span className={`font-bold text-sm ${
                  metrics.returnPercentage >= 0
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-rose-600 dark:text-rose-400'
                }`}>
                  {metrics.returnPercentage > 0 ? '+' : ''}
                  {metrics.returnPercentage.toFixed(2)}%
                </span>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow-md hover:bg-indigo-500 transition-colors"
            >
              <Save className="h-4 w-4" />
              {initialTrade ? 'Update Trade' : 'Add Trade'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
