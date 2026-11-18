import React, { useState } from 'react';
import type { Trade } from '../types/trading';
import { calculateTradeMetrics, formatINR, formatPercent } from '../utils/calculations';
import { Search, Filter, Edit2, Trash2, ArrowUpDown, ChevronDown, CheckCircle2, Clock, ArrowUpRight, ArrowDownRight } from 'lucide-react';

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
    <div className="space-y-3">
      {/* Search and Filters Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 rounded-xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-[#111726]">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-400" />
          <input
            type="text"
            placeholder="Search symbol (e.g. RELIANCE, INFY), script or notes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-zinc-200 bg-zinc-50 pl-8.5 pr-3 py-1.5 text-xs text-zinc-900 placeholder-zinc-400 focus:border-zinc-400 focus:bg-white dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder-zinc-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-medium text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
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
            className="rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-medium text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
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
            className="rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-medium text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
          >
            <option value="All">All Types</option>
            <option value="Intraday">Intraday</option>
            <option value="Delivery">Delivery / Swing</option>
            <option value="Futures">Futures</option>
            <option value="Options">Options</option>
          </select>

          {/* Sorting */}
          <div className="flex items-center gap-1 border-l border-zinc-200 pl-2 dark:border-zinc-800">
            <button
              onClick={() => {
                if (sortField === 'date') setSortAsc(!sortAsc);
                else {
                  setSortField('date');
                  setSortAsc(false);
                }
              }}
              className={`rounded-lg px-2 py-1 text-xs font-medium cursor-pointer ${
                sortField === 'date'
                  ? 'bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-white'
                  : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400'
              }`}
            >
              Date {sortField === 'date' && (sortAsc ? '↑' : '↓')}
            </button>
            <button
              onClick={() => {
                if (sortField === 'pnl') setSortAsc(!sortAsc);
                else {
                  setSortField('pnl');
                  setSortAsc(false);
                }
              }}
              className={`rounded-lg px-2 py-1 text-xs font-medium cursor-pointer ${
                sortField === 'pnl'
                  ? 'bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-white'
                  : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400'
              }`}
            >
              P&L {sortField === 'pnl' && (sortAsc ? '↑' : '↓')}
            </button>
          </div>
        </div>
      </div>

      {/* Trades Table */}
      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-xs dark:border-zinc-800 dark:bg-[#111726]">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50 text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-400">
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Instrument</th>
                <th className="py-2.5 px-3">Type / Platform</th>
                <th className="py-2.5 px-3 text-right">Qty</th>
                <th className="py-2.5 px-3 text-right">Entry</th>
                <th className="py-2.5 px-3 text-right">Exit / CMP</th>
                <th className="py-2.5 px-3 text-right">Invested</th>
                <th className="py-2.5 px-3 text-right">Charges</th>
                <th className="py-2.5 px-3 text-right">Net P&L</th>
                <th className="py-2.5 px-3 text-center">Status</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
              {sortedTrades.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-zinc-400">
                    No matching trades found in ledger.
                  </td>
                </tr>
              ) : (
                sortedTrades.map((trade) => {
                  const m = calculateTradeMetrics(trade);
                  const isOpen = trade.status === 'Open';
                  const pnl = isOpen ? m.unrealizedPnL : m.netPnL;
                  const isProfitable = pnl >= 0;

                  return (
                    <tr
                      key={trade.id}
                      className="hover:bg-zinc-50/80 transition-colors dark:hover:bg-zinc-900/40"
                    >
                      {/* Date */}
                      <td className="py-2.5 px-3 font-mono-num text-zinc-600 dark:text-zinc-400 whitespace-nowrap">
                        {trade.date}
                      </td>

                      {/* Instrument */}
                      <td className="py-2.5 px-3">
                        <div className="font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                          <span>{trade.symbol}</span>
                        </div>
                        <div className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate max-w-[130px]">
                          {trade.assetName}
                        </div>
                      </td>

                      {/* Type & Platform */}
                      <td className="py-2.5 px-3">
                        <div className="font-medium text-zinc-700 dark:text-zinc-300">
                          {trade.tradeType}
                        </div>
                        <div className="text-[10px] text-zinc-400 dark:text-zinc-500">
                          {trade.platform}
                        </div>
                      </td>

                      {/* Qty */}
                      <td className="py-2.5 px-3 text-right font-mono-num font-semibold text-zinc-800 dark:text-zinc-200">
                        {trade.quantity}
                      </td>

                      {/* Buy Price */}
                      <td className="py-2.5 px-3 text-right font-mono-num text-zinc-700 dark:text-zinc-300">
                        {formatINR(trade.buyPrice)}
                      </td>

                      {/* Exit / CMP */}
                      <td className="py-2.5 px-3 text-right font-mono-num">
                        {isOpen ? (
                          <span className="text-amber-500 font-medium">
                            {formatINR(trade.currentMarketPrice || trade.buyPrice)}
                          </span>
                        ) : (
                          <span className="text-zinc-700 dark:text-zinc-300">
                            {formatINR(trade.sellPrice)}
                          </span>
                        )}
                      </td>

                      {/* Total Invested */}
                      <td className="py-2.5 px-3 text-right font-mono-num text-zinc-600 dark:text-zinc-400">
                        {formatINR(m.totalPurchaseAmount)}
                      </td>

                      {/* Charges */}
                      <td className="py-2.5 px-3 text-right font-mono-num text-zinc-400 dark:text-zinc-500">
                        {formatINR(m.totalCharges)}
                      </td>

                      {/* Net PnL */}
                      <td className="py-2.5 px-3 text-right whitespace-nowrap">
                        <div
                          className={`font-mono-num font-bold ${
                            isProfitable ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                          }`}
                        >
                          {isProfitable ? '+' : ''}
                          {formatINR(pnl)}
                        </div>
                        <div
                          className={`font-mono-num text-[10px] font-semibold ${
                            m.returnPercentage >= 0 ? 'text-emerald-500' : 'text-rose-500'
                          }`}
                        >
                          {formatPercent(m.returnPercentage)}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${
                            trade.status === 'Closed'
                              ? 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'
                              : trade.status === 'Open'
                              ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400 border border-amber-300/40'
                              : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
                          }`}
                        >
                          {trade.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-2.5 px-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => onEdit(trade)}
                            className="rounded p-1 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 cursor-pointer"
                            title="Edit Trade"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm(`Delete trade record for ${trade.symbol}?`)) {
                                onDelete(trade.id);
                              }
                            }}
                            className="rounded p-1 text-zinc-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 dark:hover:text-rose-400 cursor-pointer"
                            title="Delete Trade"
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
