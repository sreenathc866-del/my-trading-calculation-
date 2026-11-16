import React, { useState } from 'react';
import type { Trade } from '../types/trading';
import { calculateTradeMetrics, formatINR, formatPercent } from '../utils/calculations';
import { Search, Filter, Edit2, Trash2, ArrowUpDown, ChevronDown, CheckCircle2, Clock } from 'lucide-react';

interface TradeLedgerProps {
  trades: Trade[];
  onEdit: (trade: Trade) => void;
  onDelete: (id: string) => void;
}

export const TradeLedger: React.FC<TradeLedgerProps> = ({ trades, onEdit, onDelete }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [platformFilter, setPlatformFilter] = useState<string>('All');
  const [typeFilter, setTypeFilter] = useState<string>('All');
  const [sortField, setSortField] = useState<'date' | 'pnl' | 'return'>('date');
  const [sortAsc, setSortAsc] = useState<boolean>(false);

  // Filter & Search
  const filteredTrades = trades.filter((t) => {
    const matchesSearch =
      t.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.assetName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.notes && t.notes.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === 'All' || t.status === statusFilter;
    const matchesPlatform = platformFilter === 'All' || t.platform === platformFilter;
    const matchesType = typeFilter === 'All' || t.tradeType === typeFilter;

    return matchesSearch && matchesStatus && matchesPlatform && matchesType;
  });

  // Sorting
  const sortedTrades = [...filteredTrades].sort((a, b) => {
    const mA = calculateTradeMetrics(a);
    const mB = calculateTradeMetrics(b);

    if (sortField === 'date') {
      const diff = new Date(b.date).getTime() - new Date(a.date).getTime();
      return sortAsc ? -diff : diff;
    } else if (sortField === 'pnl') {
      const pnlA = a.status === 'Open' ? mA.unrealizedPnL : mA.netPnL;
      const pnlB = b.status === 'Open' ? mB.unrealizedPnL : mB.netPnL;
      return sortAsc ? pnlA - pnlB : pnlB - pnlA;
    } else if (sortField === 'return') {
      return sortAsc ? mA.returnPercentage - mB.returnPercentage : mB.returnPercentage - mA.returnPercentage;
    }
    return 0;
  });

  return (
    <div className="space-y-4">
      {/* Search and Filters Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by Symbol (e.g. INFY), Name, or Notes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-hidden dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-100"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            <option value="All">All Statuses</option>
            <option value="Closed">Closed</option>
            <option value="Open">Open Positions</option>
            <option value="Partially Sold">Partially Sold</option>
            <option value="Cancelled">Cancelled</option>
          </select>

          {/* Platform Filter */}
          <select
            value={platformFilter}
            onChange={(e) => setPlatformFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            <option value="All">All Platforms</option>
            <option value="Groww">Groww</option>
            <option value="Zerodha">Zerodha</option>
            <option value="AngelOne">Angel One</option>
            <option value="Upstox">Upstox</option>
            <option value="Dhan">Dhan</option>
            <option value="Other">Other</option>
          </select>

          {/* Trade Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            <option value="All">All Types</option>
            <option value="Intraday">Intraday</option>
            <option value="Delivery">Delivery</option>
            <option value="F&O">F&O</option>
            <option value="ETF">ETF</option>
            <option value="IPO">IPO</option>
            <option value="Commodity">Commodity</option>
          </select>
        </div>
      </div>

      {/* Trades Ledger Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 font-semibold uppercase tracking-wider text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
              <tr>
                <th
                  onClick={() => {
                    if (sortField === 'date') setSortAsc(!sortAsc);
                    else { setSortField('date'); setSortAsc(false); }
                  }}
                  className="px-4 py-3 cursor-pointer hover:text-slate-900 dark:hover:text-slate-100"
                >
                  <div className="flex items-center gap-1">
                    Date
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th className="px-4 py-3">Symbol / Asset</th>
                <th className="px-4 py-3">Platform</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Buy Price</th>
                <th className="px-4 py-3">Sell / CMP</th>
                <th className="px-4 py-3">Qty</th>
                <th className="px-4 py-3">Total Invested</th>
                <th className="px-4 py-3">Charges</th>
                <th
                  onClick={() => {
                    if (sortField === 'pnl') setSortAsc(!sortAsc);
                    else { setSortField('pnl'); setSortAsc(false); }
                  }}
                  className="px-4 py-3 cursor-pointer hover:text-slate-900 dark:hover:text-slate-100"
                >
                  <div className="flex items-center gap-1">
                    Net P&L (₹)
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th
                  onClick={() => {
                    if (sortField === 'return') setSortAsc(!sortAsc);
                    else { setSortField('return'); setSortAsc(false); }
                  }}
                  className="px-4 py-3 cursor-pointer hover:text-slate-900 dark:hover:text-slate-100"
                >
                  <div className="flex items-center gap-1">
                    Return %
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {sortedTrades.length === 0 ? (
                <tr>
                  <td colSpan={13} className="px-4 py-8 text-center text-slate-400">
                    No trading records match your filters.
                  </td>
                </tr>
              ) : (
                sortedTrades.map((t) => {
                  const m = calculateTradeMetrics(t);
                  const isProfit = t.status === 'Open' ? m.unrealizedPnL >= 0 : m.netPnL >= 0;

                  return (
                    <tr
                      key={t.id}
                      className="hover:bg-slate-50/70 transition-colors dark:hover:bg-slate-800/40"
                    >
                      <td className="px-4 py-3 font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">
                        {t.date}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-900 dark:text-slate-100">
                          {t.symbol}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate max-w-[120px]">
                          {t.assetName || t.symbol}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                        {t.platform}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                          {t.tradeType}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            t.status === 'Closed'
                              ? 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                              : t.status === 'Open'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                              : 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                          }`}
                        >
                          {t.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-700 dark:text-slate-300">
                        {formatINR(t.buyPrice)}
                      </td>
                      <td className="px-4 py-3 text-slate-700 dark:text-slate-300">
                        {t.status === 'Open' ? (
                          <span className="font-semibold text-amber-600 dark:text-amber-400">
                            {formatINR(t.currentMarketPrice || t.buyPrice)} (CMP)
                          </span>
                        ) : (
                          formatINR(t.sellPrice || 0)
                        )}
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-200">
                        {t.quantity}
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                        {formatINR(m.totalPurchaseAmount)}
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {formatINR(m.totalCharges)}
                      </td>
                      <td className={`px-4 py-3 font-bold whitespace-nowrap ${
                        isProfit ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                      }`}>
                        {t.status === 'Open' ? (
                          <span>{m.unrealizedPnL >= 0 ? '+' : ''}{formatINR(m.unrealizedPnL)} (Unrealized)</span>
                        ) : (
                          <span>{m.netPnL >= 0 ? '+' : ''}{formatINR(m.netPnL)}</span>
                        )}
                      </td>
                      <td className={`px-4 py-3 font-semibold whitespace-nowrap ${
                        m.returnPercentage >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                      }`}>
                        {formatPercent(m.returnPercentage)}
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => onEdit(t)}
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-950/40"
                            title="Edit trade"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm(`Delete trade for ${t.symbol}?`)) {
                                onDelete(t.id);
                              }
                            }}
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40"
                            title="Delete trade"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
